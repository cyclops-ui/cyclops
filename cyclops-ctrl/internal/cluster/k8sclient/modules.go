package k8sclient

import (
	"context"
	"encoding/json"
	"strings"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
	template2 "github.com/cyclops-ui/cycops-ctrl/internal/template"
	"gopkg.in/yaml.v2"
	appsv1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/scheme"
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

	deployments, err := k.clientset.AppsV1().Deployments("default").List(context.Background(), metav1.ListOptions{
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

		pods, err := k.getPods(item.Namespace, item.Name)
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

	services, err := k.clientset.CoreV1().Services("default").List(context.Background(), metav1.ListOptions{
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
			Group:      "",
			Version:    "v1",
			Kind:       "Service",
			Name:       item.Name,
			Namespace:  item.Namespace,
			Port:       int(item.Spec.Ports[0].Port),
			TargetPort: item.Spec.Ports[0].TargetPort.IntValue(),
			Manifest:   manifest,
		})
	}

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

		obj, _, err := scheme.Codecs.UniversalDeserializer().Decode([]byte(s), nil, nil)
		if err != nil {
			return nil, err
		}

		objGVK := obj.GetObjectKind().GroupVersionKind().String()

		switch rs := obj.(type) {
		case *appsv1.Deployment:
			resourcesFromTemplate[objGVK] = append(resourcesFromTemplate[objGVK], &dto.Deployment{
				Name:      rs.GetName(),
				Namespace: rs.GetNamespace(),
			})
		case *v1.Service:
			resourcesFromTemplate[objGVK] = append(resourcesFromTemplate[objGVK], &dto.Service{
				Name:      rs.GetName(),
				Namespace: rs.GetNamespace(),
			})
		}
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

func (k *KubernetesClient) getPods(namespace, deployment string) ([]dto.Pod, error) {
	pods, err := k.clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: "app=" + deployment,
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
			Running: false,
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
