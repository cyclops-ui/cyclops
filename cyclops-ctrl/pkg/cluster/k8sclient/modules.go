package k8sclient

import (
	"context"
	"regexp"
	"sort"
	"strings"

	"github.com/pkg/errors"

	appsv1 "k8s.io/api/apps/v1"
	batchv1 "k8s.io/api/batch/v1"
	apiv1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
	yaml2 "k8s.io/apimachinery/pkg/util/yaml"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

const (
	statusUnknown     = "unknown"
	statusHealthy     = "healthy"
	statusUnhealthy   = "unhealthy"
	statusProgressing = "progressing"
)

func (k *KubernetesClient) ListModules() ([]cyclopsv1alpha1.Module, error) {
	moduleList, err := k.moduleset.Modules(cyclopsNamespace).List(metav1.ListOptions{})

	return moduleList, err
}

func (k *KubernetesClient) CreateModule(module cyclopsv1alpha1.Module) error {
	_, err := k.moduleset.Modules(cyclopsNamespace).Create(&module)
	return err
}

func (k *KubernetesClient) UpdateModule(module *cyclopsv1alpha1.Module) error {
	_, err := k.moduleset.Modules(cyclopsNamespace).Update(module)
	return err
}

func (k *KubernetesClient) UpdateModuleStatus(module *cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error) {
	return k.moduleset.Modules(cyclopsNamespace).PatchStatus(module)
}

func (k *KubernetesClient) DeleteModule(name string) error {
	return k.moduleset.Modules(cyclopsNamespace).Delete(name)
}

func (k *KubernetesClient) GetModule(name string) (*cyclopsv1alpha1.Module, error) {
	return k.moduleset.Modules(cyclopsNamespace).Get(name)
}

func (k *KubernetesClient) GetResourcesForModule(name string) ([]dto.Resource, error) {
	out := make([]dto.Resource, 0, 0)

	managedGVRs, err := k.getManagedGVRs(name)
	if err != nil {
		return nil, err
	}

	other := make([]unstructured.Unstructured, 0)
	for _, gvr := range managedGVRs {
		rs, err := k.Dynamic.Resource(gvr).List(context.Background(), metav1.ListOptions{
			LabelSelector: "cyclops.module=" + name,
		})
		if err != nil {
			continue
		}

		for _, item := range rs.Items {
			other = append(other, item)
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

func (k *KubernetesClient) GetWorkloadsForModule(name string) ([]dto.Resource, error) {
	out := make([]dto.Resource, 0, 0)

	deployments, err := k.clientset.AppsV1().Deployments("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range deployments.Items {
		out = append(out, &dto.Other{
			Group:     "apps",
			Version:   "v1",
			Kind:      "Deployment",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	statefulset, err := k.clientset.AppsV1().StatefulSets("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range statefulset.Items {
		out = append(out, &dto.Other{
			Group:     "apps",
			Version:   "v1",
			Kind:      "StatefulSet",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	daemonsets, err := k.clientset.AppsV1().DaemonSets("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return nil, err
	}

	for _, item := range daemonsets.Items {
		out = append(out, &dto.Other{
			Group:     "apps",
			Version:   "v1",
			Kind:      "DaemonSet",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	return out, nil
}

func (k *KubernetesClient) getManagedGVRs(moduleName string) ([]schema.GroupVersionResource, error) {
	module, _ := k.GetModule(moduleName)

	if module != nil && len(module.Status.ManagedGVRs) != 0 {
		existing := make([]schema.GroupVersionResource, 0, len(module.Status.ManagedGVRs))
		for _, r := range module.Status.ManagedGVRs {
			existing = append(existing, schema.GroupVersionResource{
				Group:    r.Group,
				Version:  r.Version,
				Resource: r.Resource,
			})
		}

		return existing, nil
	}

	apiResources, err := k.clientset.Discovery().ServerPreferredResources()
	if err != nil {
		return nil, err
	}

	gvrs := make([]schema.GroupVersionResource, 0)
	for _, resource := range apiResources {
		gvk, err := schema.ParseGroupVersion(resource.GroupVersion)
		if err != nil {
			continue
		}

		for _, apiResource := range resource.APIResources {
			if gvk.Group == "discovery.k8s.io" && gvk.Version == "v1" && apiResource.Kind == "EndpointSlice" ||
				gvk.Group == "" && gvk.Version == "v1" && apiResource.Kind == "Endpoints" {
				continue
			}

			gvrs = append(gvrs, schema.GroupVersionResource{
				Group:    gvk.Group,
				Version:  gvk.Version,
				Resource: apiResource.Name,
			})
		}
	}

	return gvrs, nil
}

func (k *KubernetesClient) GetDeletedResources(
	resources []dto.Resource,
	manifest string,
	targetNamespace string,
) ([]dto.Resource, error) {
	resourcesFromTemplate := make(map[string][]dto.Resource, 0)

	ar, err := k.clusterApiResources()
	if err != nil {
		return nil, err
	}

	for _, s := range strings.Split(manifest, "\n---\n") {
		s := strings.TrimSpace(s)
		if len(s) == 0 {
			continue
		}

		var obj unstructured.Unstructured
		decoder := yaml2.NewYAMLOrJSONDecoder(strings.NewReader(s), len(s))
		if err := decoder.Decode(&obj); err != nil {
			return nil, err
		}

		if len(obj.UnstructuredContent()) == 0 {
			continue
		}

		objGVK := obj.GetObjectKind().GroupVersionKind().String()

		objNamespace := apiv1.NamespaceDefault
		if len(strings.TrimSpace(targetNamespace)) != 0 {
			objNamespace = strings.TrimSpace(targetNamespace)
		}

		if len(strings.TrimSpace(obj.GetNamespace())) != 0 {
			objNamespace = obj.GetNamespace()
		}

		namespaced, err := ar.isResourceNamespaced(obj.GroupVersionKind())
		if err != nil {
			return nil, err
		}

		if !namespaced {
			objNamespace = ""
		}

		resourcesFromTemplate[objGVK] = append(resourcesFromTemplate[objGVK], &dto.Other{
			Name:      obj.GetName(),
			Namespace: objNamespace,
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
		return statusUnknown, err
	}

	resourcesWithHealth += len(deployments.Items)
	for _, item := range deployments.Items {
		if isDeploymentProgressing(item.Status.Conditions) {
			return statusProgressing, nil
		}

		if item.Generation != item.Status.ObservedGeneration ||
			item.Status.Replicas != item.Status.UpdatedReplicas ||
			item.Status.UnavailableReplicas != 0 {
			return statusUnhealthy, nil
		}
	}

	statefulsets, err := k.clientset.AppsV1().StatefulSets("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUnknown, err
	}

	resourcesWithHealth += len(statefulsets.Items)
	for _, item := range statefulsets.Items {
		if isStatefulSetProgressing(item.Status, item.Spec.Replicas, item.Generation) {
			return statusProgressing, nil
		}

		if item.Generation != item.Status.ObservedGeneration ||
			item.Status.Replicas != item.Status.UpdatedReplicas ||
			item.Status.Replicas != item.Status.AvailableReplicas {
			return statusUnhealthy, nil
		}
	}

	daemonsets, err := k.clientset.AppsV1().DaemonSets("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUnknown, err
	}

	resourcesWithHealth += len(daemonsets.Items)
	for _, item := range daemonsets.Items {
		if item.Generation != item.Status.ObservedGeneration ||
			item.Status.UpdatedNumberScheduled != item.Status.DesiredNumberScheduled ||
			item.Status.NumberUnavailable != 0 {
			return statusUnhealthy, nil
		}
	}

	pvcs, err := k.clientset.CoreV1().PersistentVolumeClaims("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUnknown, err
	}

	resourcesWithHealth += len(pvcs.Items)
	for _, item := range pvcs.Items {
		if item.Status.Phase != apiv1.ClaimBound {
			return statusUnhealthy, nil
		}
	}

	pods, err := k.clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{
		LabelSelector: "cyclops.module=" + name,
	})
	if err != nil {
		return statusUnknown, err
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

	if resourcesWithHealth == 0 {
		return statusUnknown, nil
	}

	return statusHealthy, nil
}

func (k *KubernetesClient) GVKtoAPIResourceName(gv schema.GroupVersion, kind string) (string, error) {
	apiResources, err := k.clientset.Discovery().ServerResourcesForGroupVersion(gv.String())
	if err != nil {
		return "", err
	}

	for _, resource := range apiResources.APIResources {
		if resource.Kind == kind && len(resource.Name) != 0 {
			return resource.Name, nil
		}
	}

	return "", errors.Errorf("could not find api-resource for groupVersion: %v and kind: %v", gv.String(), kind)
}

func (k *KubernetesClient) getResourceStatus(o unstructured.Unstructured) (string, error) {
	if isPod(o.GroupVersionKind().Group, o.GroupVersionKind().Version, o.GetKind()) {
		pod, err := k.clientset.CoreV1().Pods(o.GetNamespace()).Get(context.Background(), o.GetName(), metav1.GetOptions{})
		if err != nil {
			return statusUnknown, err
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
			return statusUnknown, err
		}

		return getDeploymentStatus(deployment), nil
	}

	if isStatefulSet(o.GroupVersionKind().Group, o.GroupVersionKind().Version, o.GetKind()) {
		statefulset, err := k.clientset.AppsV1().StatefulSets(o.GetNamespace()).Get(context.Background(), o.GetName(), metav1.GetOptions{})
		if err != nil {
			return statusUnknown, err
		}

		return getStatefulSetStatus(statefulset), nil
	}

	if isDaemonSet(o.GroupVersionKind().Group, o.GroupVersionKind().Version, o.GetKind()) {
		daemonset, err := k.clientset.AppsV1().DaemonSets(o.GetNamespace()).Get(context.Background(), o.GetName(), metav1.GetOptions{})
		if err != nil {
			return statusUnknown, err
		}

		return getDaemonSetStatus(daemonset), nil
	}

	if isPersistentVolumeClaims(o.GroupVersionKind().Group, o.GroupVersionKind().Version, o.GetKind()) {
		pvc, err := k.clientset.CoreV1().PersistentVolumeClaims(o.GetNamespace()).Get(context.Background(), o.GetName(), metav1.GetOptions{})
		if err != nil {
			return statusUnknown, err
		}

		if pvc.Status.Phase == apiv1.ClaimBound {
			return statusHealthy, nil
		}

		return statusUnhealthy, nil
	}

	return statusUnknown, nil
}

func (k *KubernetesClient) getPods(deployment appsv1.Deployment) ([]dto.Pod, error) {
	pods, err := k.clientset.CoreV1().Pods(deployment.Namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(deployment.Spec.Selector.MatchLabels).String(),
	})
	if err != nil {
		return nil, err
	}

	rs, singleRS := deploymentAvailableReplicaSet(deployment.Status.Conditions)

	out := make([]dto.Pod, 0, len(pods.Items))
	for _, item := range pods.Items {
		containers := make([]dto.Container, 0, len(item.Spec.Containers))

		if singleRS && len(rs) > 0 && !isPodOwner(item, rs) {
			continue
		}

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

func (k *KubernetesClient) getPodsForDaemonSet(daemonSet appsv1.DaemonSet) ([]dto.Pod, error) {
	pods, err := k.clientset.CoreV1().Pods(daemonSet.Namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(daemonSet.Spec.Selector.MatchLabels).String(),
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

func (k *KubernetesClient) getPodsForCronJob(cronJob batchv1.CronJob) ([]dto.Pod, error) {
	jobTemplateLabels := cronJob.Spec.JobTemplate.Spec.Template.Labels
	jobLabelSelector := labels.SelectorFromSet(jobTemplateLabels).String()

	jobs, err := k.clientset.BatchV1().Jobs(cronJob.Namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: jobLabelSelector,
	})
	if err != nil {
		return nil, err
	}

	out := make([]dto.Pod, 0)

	for _, job := range jobs.Items {
		podTemplateLabels := job.Spec.Template.Labels
		podLabelSelector := labels.SelectorFromSet(podTemplateLabels).String()

		pods, err := k.clientset.CoreV1().Pods(cronJob.Namespace).List(context.Background(), metav1.ListOptions{
			LabelSelector: podLabelSelector,
		})

		if err != nil {
			return nil, err
		}

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
	}

	return out, nil

}

func (k *KubernetesClient) getPodsForJob(job batchv1.Job) ([]dto.Pod, error) {
	pods, err := k.clientset.CoreV1().Pods(job.Namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(job.Spec.Selector.MatchLabels).String(),
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

func (k *KubernetesClient) getPodsForNetworkPolicy(policy networkingv1.NetworkPolicy) ([]dto.Pod, error) {
	pods, err := k.clientset.CoreV1().Pods(policy.Namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(policy.Spec.PodSelector.MatchLabels).String(),
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
			Running: status.State.Terminated.ExitCode == 0,
		}
	}

	return dto.ContainerStatus{
		Status:  "running",
		Running: true,
	}
}

func getDeploymentStatus(deployment *appsv1.Deployment) string {
	if isDeploymentProgressing(deployment.Status.Conditions) {
		return statusProgressing
	}

	if deployment.Generation == deployment.Status.ObservedGeneration &&
		deployment.Status.Replicas == deployment.Status.UpdatedReplicas &&
		deployment.Status.UnavailableReplicas == 0 {
		return statusHealthy
	}

	return statusUnhealthy
}

func getStatefulSetStatus(statefulset *appsv1.StatefulSet) string {
	if statefulset.Generation == statefulset.Status.ObservedGeneration &&
		statefulset.Status.Replicas == statefulset.Status.UpdatedReplicas &&
		statefulset.Status.Replicas == statefulset.Status.AvailableReplicas {
		return statusHealthy
	}

	if isStatefulSetProgressing(statefulset.Status, statefulset.Spec.Replicas, statefulset.Generation) {
		return statusProgressing
	}

	return statusUnhealthy
}

func getDaemonSetStatus(daemonset *appsv1.DaemonSet) string {
	if daemonset.Generation == daemonset.Status.ObservedGeneration &&
		daemonset.Status.UpdatedNumberScheduled == daemonset.Status.DesiredNumberScheduled &&
		daemonset.Status.NumberUnavailable == 0 {
		return statusHealthy
	}

	return statusUnhealthy
}

func getPodStatus(containers []dto.Container) bool {
	for _, container := range containers {
		if !container.Status.Running {
			return false
		}
	}

	return true
}

func deploymentAvailableReplicaSet(conditions []appsv1.DeploymentCondition) (string, bool) {
	replicaSetNamePattern := regexp.MustCompile(`ReplicaSet "(.+?)" has successfully progressed`)

	for _, condition := range conditions {
		if condition.Type == appsv1.DeploymentProgressing {
			match := replicaSetNamePattern.FindStringSubmatch(condition.Message)
			if len(match) > 1 {
				return match[1], true
			}
		}
	}

	return "", false
}

func isPodOwner(pod apiv1.Pod, rsName string) bool {
	for _, reference := range pod.OwnerReferences {
		if reference.APIVersion == "apps/v1" &&
			reference.Kind == "ReplicaSet" &&
			reference.Name == rsName {
			return true
		}
	}

	return false
}

func isDeploymentProgressing(conditions []appsv1.DeploymentCondition) bool {
	progressingReason := ""
	availableReason := ""

	for _, condition := range conditions {
		if condition.Type == appsv1.DeploymentProgressing {
			if condition.Status == "False" {
				return false
			}

			progressingReason = condition.Reason
		}

		if condition.Type == appsv1.DeploymentAvailable {
			availableReason = condition.Reason
		}
	}

	return availableReason == "MinimumReplicasAvailable" &&
		(progressingReason == "NewReplicaSetCreated" ||
			progressingReason == "FoundNewReplicaSet" ||
			progressingReason == "ReplicaSetUpdated")
}

func isStatefulSetProgressing(status appsv1.StatefulSetStatus, desiredReplicas *int32, generation int64) bool {
	if status.ObservedGeneration == 0 || generation > status.ObservedGeneration {
		return true
	}

	if status.CurrentRevision != status.UpdateRevision {
		return true
	}

	if desiredReplicas == nil {
		return false
	}

	return status.ReadyReplicas < *desiredReplicas || status.UpdatedReplicas < *desiredReplicas
}
