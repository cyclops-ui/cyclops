package k8sclient

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"

	appsv1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
	yaml2 "k8s.io/apimachinery/pkg/util/yaml"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
	template2 "github.com/cyclops-ui/cycops-ctrl/internal/template"
)

const (
	statusUndefined = "undefined"
	statusHealthy   = "healthy"
	statusUnhealthy = "unhealthy"
)

func (k *KubernetesClient) ListModules() ([]cyclopsv1alpha1.Module, error) {
	moduleList, err := k.moduleset.Modules(cyclopsNamespace).List(metav1.ListOptions{})
	return moduleList, err
}

func (k *KubernetesClient) CreateModule(module cyclopsv1alpha1.Module) error {
	_, err := k.moduleset.Modules(cyclopsNamespace).Create(&module)
	return err
}

func (k *KubernetesClient) UpdateModule(module cyclopsv1alpha1.Module) error {
	m, err := k.moduleset.Modules(cyclopsNamespace).Update(&module)

	b, err := json.Marshal(m)
	fmt.Println(err)
	fmt.Println(string(b))

	return err
}

func (k *KubernetesClient) DeleteModule(name string) error {
	return k.moduleset.Modules(cyclopsNamespace).Delete(name)
}

func (k *KubernetesClient) GetModule(name string) (*cyclopsv1alpha1.Module, error) {
	return k.moduleset.Modules(cyclopsNamespace).Get(name)
}

func (k *KubernetesClient) GetResourcesForModule(name string) ([]dto.Resource, error) {
	out := make([]dto.Resource, 0, 0)

	apiResources, err := k.clientset.Discovery().ServerPreferredResources()
	if err != nil {
		fmt.Printf("Error getting API resources: %s\n", err)
		os.Exit(1)
	}

	other := make([]unstructured.Unstructured, 0)

	for _, resource := range apiResources {
		gvk, err := schema.ParseGroupVersion(resource.GroupVersion)
		if err != nil {
			continue
		}

		for _, apiResource := range resource.APIResources {
			if gvk.Group == "discovery.k8s.io" && gvk.Version == "v1" && apiResource.Kind == "EndpointSlice" {
				continue
			}

			rs, err := k.Dynamic.Resource(schema.GroupVersionResource{
				Group:    gvk.Group,
				Version:  gvk.Version,
				Resource: strings.ToLower(apiResource.Kind) + "s",
			}).List(context.Background(), metav1.ListOptions{
				LabelSelector: "cyclops.module=" + name,
			})
			if err != nil {
				continue
			}

			for _, item := range rs.Items {
				other = append(other, item)
			}
		}
	}

	for _, o := range other {
		status, err := k.getResourceStatus(o)
		if err != nil {
			return nil, err
		}

		out = append(out, &dto.Other{
			Group:     o.GroupVersionKind().Group,
			Version:   o.GroupVersionKind().Version,
			Kind:      o.GroupVersionKind().Kind,
			Name:      o.GetName(),
			Namespace: o.GetNamespace(),
			Status:    status,
			Deleted:   false,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		if out[i].GetGroupVersionKind() != out[j].GetGroupVersionKind() {
			return out[i].GetGroupVersionKind() < out[j].GetGroupVersionKind()
		}

		return out[i].GetName() < out[j].GetName()
	})

	return out, nil
}

func (k *KubernetesClient) GetDeletedResources(
	resources []dto.Resource,
	module cyclopsv1alpha1.Module,
	template *models.Template,
) ([]dto.Resource, error) {
	manifest, err := template2.HelmTemplate(module, template)
	if err != nil {
		return nil, err
	}

	resourcesFromTemplate := make(map[string][]dto.Resource, 0)

	for _, s := range strings.Split(manifest, "---") {
		s := strings.TrimSpace(s)
		if len(s) == 0 {
			continue
		}

		var obj unstructured.Unstructured

		decoder := yaml2.NewYAMLOrJSONDecoder(strings.NewReader(s), len(s))
		if err := decoder.Decode(&obj); err != nil {
			panic(err)
		}

		objGVK := obj.GetObjectKind().GroupVersionKind().String()
		resourcesFromTemplate[objGVK] = append(resourcesFromTemplate[objGVK], &dto.Service{
			Name:      obj.GetName(),
			Namespace: obj.GetNamespace(),
		})
	}

	out := make([]dto.Resource, 0, len(resources))
	for _, resource := range resources {
		gvk := resource.GetGroupVersionKind()

		if _, ok := resourcesFromTemplate[gvk]; !ok {
			resource.SetDeleted(true)
			out = append(out, resource)
			continue
		}

		found := false
		for _, rs := range resourcesFromTemplate[gvk] {
			if resource.GetName() == rs.GetName() && (resource.GetNamespace() == rs.GetNamespace() || rs.GetNamespace() == "") {
				found = true
				break
			}
		}

		if found == false {
			resource.SetDeleted(true)
		}

		out = append(out, resource)
	}

	return out, nil
}

func (k *KubernetesClient) GetModuleResourcesHealth(name string) (string, error) {
	resourcesWithHealth := 0

	deployments, err := k.clientset.AppsV1().Deployments("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUndefined, err
	}

	resourcesWithHealth += len(deployments.Items)
	for _, item := range deployments.Items {
		if item.Generation != item.Status.ObservedGeneration ||
			*item.Spec.Replicas != item.Status.UpdatedReplicas {
			return statusUnhealthy, nil
		}
	}

	pods, err := k.clientset.CoreV1().Pods("default").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUndefined, err
	}

	resourcesWithHealth += len(pods.Items)
	for _, item := range pods.Items {
		for _, cnt := range item.Spec.Containers {
			var status apiv1.ContainerStatus
			for _, c := range item.Status.ContainerStatuses {
				if c.Name == cnt.Name {
					status = c
					break
				}
			}

			if !containerStatus(status).Running {
				return statusUnhealthy, nil
			}
		}
	}

	statefulsets, err := k.clientset.AppsV1().StatefulSets("default").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUndefined, err
	}

	resourcesWithHealth += len(statefulsets.Items)
	for _, item := range statefulsets.Items {
		if item.Generation != item.Status.ObservedGeneration ||
			*item.Spec.Replicas != item.Status.UpdatedReplicas {
			return statusUnhealthy, nil
		}
	}

	if resourcesWithHealth == 0 {
		return statusUndefined, nil
	}

	return statusHealthy, nil
}

func (k *KubernetesClient) getResourceStatus(o unstructured.Unstructured) (string, error) {
	if isPod(o.GroupVersionKind().Group, o.GroupVersionKind().Version, o.GetKind()) {
		pod, err := k.clientset.CoreV1().Pods(o.GetNamespace()).Get(context.Background(), o.GetName(), metav1.GetOptions{})
		if err != nil {
			return statusUndefined, err
		}

		for _, cnt := range pod.Spec.Containers {
			var status apiv1.ContainerStatus
			for _, c := range pod.Status.ContainerStatuses {
				if c.Name == cnt.Name {
					status = c
					break
				}
			}

			if !containerStatus(status).Running {
				return statusUnhealthy, nil
			}
		}

		return statusHealthy, err
	}

	if isDeployment(o.GroupVersionKind().Group, o.GroupVersionKind().Version, o.GetKind()) {
		deployment, err := k.clientset.AppsV1().Deployments(o.GetNamespace()).Get(context.Background(), o.GetName(), metav1.GetOptions{})
		if err != nil {
			return statusUndefined, err
		}

		if deployment.Generation == deployment.Status.ObservedGeneration &&
			*deployment.Spec.Replicas == deployment.Status.UpdatedReplicas {
			return statusHealthy, nil
		}

		return statusUnhealthy, nil
	}

	if isStatefulSet(o.GroupVersionKind().Group, o.GroupVersionKind().Version, o.GetKind()) {
		statefulset, err := k.clientset.AppsV1().StatefulSets(o.GetNamespace()).Get(context.Background(), o.GetName(), metav1.GetOptions{})
		if err != nil {
			return statusUndefined, err
		}

		if statefulset.Generation == statefulset.Status.ObservedGeneration &&
			*statefulset.Spec.Replicas == statefulset.Status.UpdatedReplicas {
			return statusHealthy, nil
		}

		return statusUnhealthy, nil
	}

	return statusUndefined, nil
}

func (k *KubernetesClient) getPods(deployment appsv1.Deployment) ([]dto.Pod, error) {
	pods, err := k.clientset.CoreV1().Pods(deployment.Namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(deployment.Spec.Selector.MatchLabels).String(),
	})
	if err != nil {
		return nil, err
	}

	out := make([]dto.Pod, 0, len(pods.Items))
	for _, item := range pods.Items {
		containers := make([]dto.Container, 0, len(item.Spec.Containers))

		for _, cnt := range item.Spec.Containers {
			env := make(map[string]string)
			for _, envVar := range cnt.Env {
				env[envVar.Name] = envVar.Value
			}

			var status apiv1.ContainerStatus
			for _, c := range item.Status.ContainerStatuses {
				if c.Name == cnt.Name {
					status = c
					break
				}
			}

			containers = append(containers, dto.Container{
				Name:   cnt.Name,
				Image:  cnt.Image,
				Env:    env,
				Status: containerStatus(status),
			})
		}

		out = append(out, dto.Pod{
			Name:       item.Name,
			Containers: containers,
			Node:       item.Spec.NodeName,
			PodPhase:   string(item.Status.Phase),
			Started:    item.Status.StartTime,
		})
	}

	return out, nil
}

func (k *KubernetesClient) getStatefulsetPods(deployment appsv1.StatefulSet) ([]dto.Pod, error) {
	pods, err := k.clientset.CoreV1().Pods(deployment.Namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(deployment.Spec.Selector.MatchLabels).String(),
	})
	if err != nil {
		return nil, err
	}

	out := make([]dto.Pod, 0, len(pods.Items))
	for _, item := range pods.Items {
		containers := make([]dto.Container, 0, len(item.Spec.Containers))

		for _, cnt := range item.Spec.Containers {
			env := make(map[string]string)
			for _, envVar := range cnt.Env {
				env[envVar.Name] = envVar.Value
			}

			var status apiv1.ContainerStatus
			for _, c := range item.Status.ContainerStatuses {
				if c.Name == cnt.Name {
					status = c
					break
				}
			}

			containers = append(containers, dto.Container{
				Name:   cnt.Name,
				Image:  cnt.Image,
				Env:    env,
				Status: containerStatus(status),
			})
		}

		initContainers := make([]dto.Container, 0, len(item.Spec.Containers))
		for _, cnt := range item.Spec.InitContainers {
			env := make(map[string]string)
			for _, envVar := range cnt.Env {
				env[envVar.Name] = envVar.Value
			}

			var status apiv1.ContainerStatus
			for _, c := range item.Status.ContainerStatuses {
				if c.Name == cnt.Name {
					status = c
					break
				}
			}

			initContainers = append(initContainers, dto.Container{
				Name:   cnt.Name,
				Image:  cnt.Image,
				Env:    env,
				Status: containerStatus(status),
			})
		}

		out = append(out, dto.Pod{
			Name:           item.Name,
			Containers:     containers,
			InitContainers: initContainers,
			Node:           item.Spec.NodeName,
			PodPhase:       string(item.Status.Phase),
			Started:        item.Status.StartTime,
		})
	}

	return out, nil
}

func containerStatus(status apiv1.ContainerStatus) dto.ContainerStatus {
	if status.State.Waiting != nil {
		return dto.ContainerStatus{
			Status:  status.State.Waiting.Reason,
			Message: status.State.Waiting.Message,
			Running: false,
		}
	}

	if status.State.Terminated != nil {
		return dto.ContainerStatus{
			Status:  status.State.Terminated.Reason,
			Message: status.State.Terminated.Message,
			Running: status.State.Terminated.ExitCode == 0,
		}
	}

	return dto.ContainerStatus{
		Status:  "running",
		Running: true,
	}
}

func getDeploymentStatus(pods []dto.Pod) bool {
	for _, pod := range pods {
		for _, container := range pod.Containers {
			if !container.Status.Running {
				return false
			}
		}
	}

	return true
}

func getPodStatus(containers []dto.Container) bool {
	for _, container := range containers {
		if !container.Status.Running {
			return false
		}
	}

	return true
}
