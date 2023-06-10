package k8sclient

import (
	"context"
	"encoding/json"

	"gopkg.in/yaml.v2"
	apiv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/cyclops-ui/cycops-ctrl/internal/models/crd/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
)

func (k *KubernetesClient) ListModules() ([]v1alpha1.Module, error) {
	moduleList, err := k.moduleset.Modules(cyclopsNamespace).List(metav1.ListOptions{})
	return moduleList, err
}

func (k *KubernetesClient) CreateModule(module v1alpha1.Module) error {
	_, err := k.moduleset.Modules(cyclopsNamespace).Create(&module)
	return err
}

func (k *KubernetesClient) UpdateModule(module v1alpha1.Module) error {
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

func (k *KubernetesClient) GetModule(name string) (*v1alpha1.Module, error) {
	return k.moduleset.Modules(cyclopsNamespace).Get(name)
}

func (k *KubernetesClient) GetResourcesForModule(name string) ([]interface{}, error) {
	out := make([]interface{}, 0, 0)
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

		pods, err := k.getPods(apiv1.NamespaceDefault, item.Name)
		if err != nil {
			return nil, err
		}

		out = append(out, dto.Deployment{
			Kind:      "deployment",
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

		out = append(out, dto.Service{
			Kind:       "service",
			Name:       item.Name,
			Namespace:  item.Namespace,
			Port:       int(item.Spec.Ports[0].Port),
			TargetPort: item.Spec.Ports[0].TargetPort.IntValue(),
			Manifest:   manifest,
		})
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
