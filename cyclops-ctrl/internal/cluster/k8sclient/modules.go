package k8sclient

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
	template2 "github.com/cyclops-ui/cycops-ctrl/internal/template"
	"gopkg.in/yaml.v2"
	appsv1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	yaml2 "k8s.io/apimachinery/pkg/util/yaml"
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
	//if err := k.moduleset.Modules("default").Delete(module.Name); err != nil {
	//	return err
	//}
	//
	//if module.Status.Conditions == nil {
	//	module.Status.Conditions = make([]metav1.Condition, 0)
	//}
	//
	//module.Status.Conditions = append(module.Status.Conditions, metav1.Condition{
	//	Type:   "Availability",
	//	Status: "Available",
	//	LastTransitionTime: metav1.Time{
	//		time.Now(),
	//	},
	//	Reason:  "All good",
	//	Message: "good job",
	//})

	_, err := k.moduleset.Modules(cyclopsNamespace).Update(&module)
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

	deployments, err := k.clientset.AppsV1().Deployments("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range deployments.Items {
		manifest, err := getManifest(item, "Deployment", "apps/v1")
		if err != nil {
			return nil, err
		}

		pods, err := k.getPods(item)
		if err != nil {
			return nil, err
		}

		out = append(out, &dto.Deployment{
			Group:     "apps",
			Version:   "v1",
			Kind:      "Deployment",
			Name:      item.Name,
			Namespace: item.Namespace,
			Replicas:  int(*item.Spec.Replicas),
			Manifest:  manifest,
			Pods:      pods,
			Status:    getDeploymentStatus(pods),
		})
	}

	services, err := k.clientset.CoreV1().Services("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range services.Items {
		manifest, err := getManifest(item, "Service", "core/v1")
		if err != nil {
			return nil, err
		}

		out = append(out, &dto.Service{
			Group:     "",
			Version:   "v1",
			Kind:      "Service",
			Name:      item.Name,
			Namespace: item.Namespace,
			Ports:     item.Spec.Ports,
			Manifest:  manifest,
		})
	}

	configmaps, err := k.clientset.CoreV1().ConfigMaps("default").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range configmaps.Items {
		manifest, err := getManifest(item, "ConfigMap", "core/v1")
		if err != nil {
			return nil, err
		}

		out = append(out, &dto.ConfigMap{
			Group:     "",
			Version:   "v1",
			Kind:      "ConfigMap",
			Name:      item.Name,
			Namespace: item.Namespace,
			Data:      item.Data,
			Manifest:  manifest,
		})
	}

	pods, err := k.clientset.CoreV1().Pods("default").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range pods.Items {
		manifest, err := getManifest(item, "Pods", "v1")
		if err != nil {
			return nil, err
		}

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

		initContainers := make([]dto.Container, 0, len(item.Spec.InitContainers))
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

		out = append(out, &dto.Pod{
			Group:          "",
			Version:        "v1",
			Kind:           "Pod",
			Name:           item.Name,
			Namespace:      item.Namespace,
			Containers:     containers,
			InitContainers: initContainers,
			Node:           item.Spec.NodeName,
			PodPhase:       string(item.Status.Phase),
			Status:         getPodStatus(containers),
			Started:        item.Status.StartTime,
			Manifest:       manifest,
			Deleted:        false,
		})
	}

	statefulsets, err := k.clientset.AppsV1().StatefulSets("default").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range statefulsets.Items {
		manifest, err := getManifest(item, "StatefulSet", "apps/v1")
		if err != nil {
			return nil, err
		}

		pods, err := k.getStatefulsetPods(item)
		if err != nil {
			return nil, err
		}

		out = append(out, &dto.StatefulSet{
			Group:     "apps",
			Version:   "v1",
			Kind:      "StatefulSet",
			Name:      item.Name,
			Namespace: item.Namespace,
			Replicas:  int(*item.Spec.Replicas),
			Manifest:  manifest,
			Pods:      pods,
			Status:    getDeploymentStatus(pods),
		})
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].GetName() < out[j].GetName()
	})

	return out, nil
}

func (k *KubernetesClient) GetDeletedResources(
	resources []dto.Resource,
	module cyclopsv1alpha1.Module,
	template models.Template,
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
	const (
		statusUndefined = "undefined"
		statusHealthy   = "healthy"
		statusUnhealthy = "unhealthy"
	)

	deployments, err := k.clientset.AppsV1().Deployments("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUndefined, err
	}

	resourcesWithHealth += len(deployments.Items)
	for _, item := range deployments.Items {
		pods, err := k.getPods(item)
		if err != nil {
			return statusUndefined, err
		}

		if !getDeploymentStatus(pods) {
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
		pods, err := k.getStatefulsetPods(item)
		if err != nil {
			return statusUndefined, err
		}

		if !getDeploymentStatus(pods) {
			return statusUnhealthy, nil
		}
	}

	if resourcesWithHealth == 0 {
		return statusUndefined, nil
	}

	return statusHealthy, nil
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

func getManifest(object interface{}, kind, apiVersion string) (string, error) {
	jsonBytes, err := json.Marshal(object)
	if err != nil {
		return "", err
	}

	tmp := make(map[string]interface{})

	err = json.Unmarshal(jsonBytes, &tmp)
	if err != nil {
		return "", err
	}

	tmp["apiVersion"] = apiVersion
	tmp["kind"] = kind

	manifest, err := yaml.Marshal(tmp)
	if err != nil {
		return "", err
	}

	return string(manifest), err
}

func (k *KubernetesClient) GetAllResourcesForModule(name string) (*dto.Hierarchy, error) {
	out := make([]unstructured.Unstructured, 0, 0)

	deployments, err := k.clientset.AppsV1().Deployments("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range deployments.Items {
		unstructuredDeployment, err := runtime.DefaultUnstructuredConverter.ToUnstructured(&item)
		if err != nil {
			fmt.Println("Error converting Deployment to unstructured:", err)
			continue
		}
		unstructuredDeployment["kind"] = "Deployment"
		unstructuredDeployment["apiVersion"] = "apps/v1"
		out = append(out, unstructured.Unstructured{Object: unstructuredDeployment})

		// region get replicasets
		replicasets, err := k.clientset.AppsV1().ReplicaSets(item.Namespace).List(context.Background(), metav1.ListOptions{
			LabelSelector: labels.Set(item.Spec.Selector.MatchLabels).String(),
		})
		if err != nil {
			fmt.Println("Error getting replicasets for deployment", item.Name)
			continue
		}

		for _, rs := range replicasets.Items {
			unstructuredReplicaset, err := runtime.DefaultUnstructuredConverter.ToUnstructured(&rs)
			if err != nil {
				fmt.Println("Error converting Deployment to unstructured:", err)
				continue
			}
			unstructuredReplicaset["kind"] = "ReplicaSet"
			unstructuredReplicaset["apiVersion"] = "apps/v1"
			out = append(out, unstructured.Unstructured{Object: unstructuredReplicaset})
		}
		// endregion

		// region get pods
		pods, err := k.clientset.CoreV1().Pods(item.Namespace).List(context.Background(), metav1.ListOptions{
			LabelSelector: labels.Set(item.Spec.Selector.MatchLabels).String(),
		})
		if err != nil {
			fmt.Println("Error getting pods for deployment", item.Name)
			continue
		}

		for _, pod := range pods.Items {
			unstructuredPod, err := runtime.DefaultUnstructuredConverter.ToUnstructured(&pod)
			if err != nil {
				fmt.Println("Error converting Deployment to unstructured:", err)
				continue
			}
			unstructuredPod["kind"] = "Pod"
			unstructuredPod["apiVersion"] = ""
			out = append(out, unstructured.Unstructured{Object: unstructuredPod})
		}
		// endregion
	}

	statefulsets, err := k.clientset.AppsV1().StatefulSets("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range statefulsets.Items {
		unstructuredStatefulset, err := runtime.DefaultUnstructuredConverter.ToUnstructured(&item)
		if err != nil {
			fmt.Println("Error converting Deployment to unstructured:", err)
			continue
		}
		unstructuredStatefulset["kind"] = "StatefulSet"
		unstructuredStatefulset["apiVersion"] = "apps/v1"
		out = append(out, unstructured.Unstructured{Object: unstructuredStatefulset})

		// region get pods
		pods, err := k.clientset.CoreV1().Pods(item.Namespace).List(context.Background(), metav1.ListOptions{
			LabelSelector: labels.Set(item.Spec.Selector.MatchLabels).String(),
		})
		if err != nil {
			fmt.Println("Error getting pods for statefulset", item.Name)
			continue
		}

		for _, pod := range pods.Items {
			unstructuredPod, err := runtime.DefaultUnstructuredConverter.ToUnstructured(&pod)
			if err != nil {
				fmt.Println("Error converting Deployment to unstructured:", err)
				continue
			}
			unstructuredPod["kind"] = "Pod"
			unstructuredPod["apiVersion"] = ""
			out = append(out, unstructured.Unstructured{Object: unstructuredPod})
		}
		// endregion
	}

	pods, err := k.clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range pods.Items {
		unstructuredPod, err := runtime.DefaultUnstructuredConverter.ToUnstructured(&item)
		if err != nil {
			fmt.Println("Error converting Deployment to unstructured:", err)
			continue
		}
		unstructuredPod["kind"] = "Pod"
		unstructuredPod["apiVersion"] = ""
		out = append(out, unstructured.Unstructured{Object: unstructuredPod})
	}

	services, err := k.clientset.CoreV1().Services("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range services.Items {
		unstructuredService, err := runtime.DefaultUnstructuredConverter.ToUnstructured(&item)
		if err != nil {
			fmt.Println("Error converting Deployment to unstructured:", err)
			continue
		}
		unstructuredService["kind"] = "Pod"
		unstructuredService["apiVersion"] = ""
		out = append(out, unstructured.Unstructured{Object: unstructuredService})
	}

	hierarchy := &dto.Hierarchy{
		Nodes: []dto.Node{
			{
				ID: "0",
				Value: dto.NodeValue{
					Title: fmt.Sprintf("Module %v", name),
					Items: []dto.NodeValueItems{
						{
							Text:  "Name",
							Value: name,
						},
					},
				},
			},
		},
		Edges: make([]dto.Edge, 0),
	}

	indexes := make(map[metav1.OwnerReference]int)
	for i, u := range out {
		indexes[unstructuredToOwnerReference(u)] = i + 1
		if u.GetLabels()["cyclops.module"] == name {
			hierarchy.Edges = append(hierarchy.Edges, dto.Edge{
				Source: "0",
				Target: strconv.Itoa(i + 1),
			})
		}
	}

	relationships := make(map[metav1.OwnerReference][]metav1.OwnerReference)
	for _, u := range out {
		self := unstructuredToOwnerReference(u)
		for _, reference := range u.GetOwnerReferences() {
			mapped := remapOwnerReference(reference)

			if _, ok := relationships[mapped]; !ok {
				relationships[mapped] = make([]metav1.OwnerReference, 0)
			}

			relationships[mapped] = append(relationships[mapped], self)
		}
	}

	for reference, i := range indexes {
		hierarchy.Nodes = append(hierarchy.Nodes, dto.Node{
			ID: strconv.Itoa(i),
			Value: dto.NodeValue{
				Title: reference.Name,
				Items: []dto.NodeValueItems{
					{
						Text: reference.Kind,
						//Value: reference.Kind,
						//Icon:  "https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/labeled/pod-128.png",
					},
				},
			},
		})
	}

	sort.Slice(hierarchy.Nodes, func(i, j int) bool {
		if hierarchy.Nodes[i].Value.Title != hierarchy.Nodes[j].Value.Title {
			return hierarchy.Nodes[i].Value.Title < hierarchy.Nodes[j].Value.Title
		}

		return hierarchy.Nodes[i].Value.Items[0].Text < hierarchy.Nodes[j].Value.Items[0].Text
	})

	for parent, children := range relationships {
		for _, child := range children {
			hierarchy.Edges = append(hierarchy.Edges, dto.Edge{
				Source: strconv.Itoa(indexes[parent]),
				Target: strconv.Itoa(indexes[child]),
			})
		}
	}

	return hierarchy, nil
}

func unstructuredToOwnerReference(u unstructured.Unstructured) metav1.OwnerReference {
	return metav1.OwnerReference{
		APIVersion: u.GetAPIVersion(),
		Kind:       u.GetKind(),
		Name:       u.GetName(),
		UID:        u.GetUID(),
	}
}

func remapOwnerReference(or metav1.OwnerReference) metav1.OwnerReference {
	return metav1.OwnerReference{
		APIVersion: or.APIVersion,
		Kind:       or.Kind,
		Name:       or.Name,
		UID:        or.UID,
	}
}
