package k8sclient

import (
	"context"
	apiv1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

func (k *KubernetesClient) mapDeployment(group, version, kind, name, namespace string) (*dto.Deployment, error) {
	deployment, err := k.clientset.AppsV1().Deployments(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	pods, err := k.getPods(*deployment)
	if err != nil {
		return nil, err
	}

	return &dto.Deployment{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      deployment.Name,
		Namespace: deployment.Namespace,
		Replicas:  int(*deployment.Spec.Replicas),
		Pods:      pods,
		Status:    getDeploymentStatus(deployment),
	}, nil
}

func (k *KubernetesClient) mapDaemonSet(group, version, kind, name, namespace string) (*dto.DaemonSet, error) {
	daemonSet, err := k.clientset.AppsV1().DaemonSets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	pods, err := k.getPodsForDaemonSet(*daemonSet)
	if err != nil {
		return nil, err
	}

	return &dto.DaemonSet{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      daemonSet.Name,
		Namespace: daemonSet.Namespace,
		Pods:      pods,
		Status:    getDaemonSetStatus(daemonSet),
	}, nil
}

func (k *KubernetesClient) mapStatefulSet(group, version, kind, name, namespace string) (*dto.StatefulSet, error) {
	statefulset, err := k.clientset.AppsV1().StatefulSets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	pods, err := k.getStatefulsetPods(*statefulset)
	if err != nil {
		return nil, err
	}

	return &dto.StatefulSet{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      name,
		Namespace: namespace,
		Replicas:  int(*statefulset.Spec.Replicas),
		Pods:      pods,
		Status:    getStatefulSetStatus(statefulset),
	}, nil
}

func (k *KubernetesClient) mapPod(group, version, kind, name, namespace string) (*dto.Pod, error) {
	item, err := k.clientset.CoreV1().Pods(namespace).Get(context.Background(), name, metav1.GetOptions{})
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

	return &dto.Pod{
		Group:          group,
		Version:        version,
		Kind:           kind,
		Name:           name,
		Namespace:      namespace,
		Containers:     containers,
		InitContainers: initContainers,
		Node:           item.Spec.NodeName,
		PodPhase:       string(item.Status.Phase),
		Status:         getPodStatus(containers),
		Started:        item.Status.StartTime,
		Deleted:        false,
	}, nil
}

func (k *KubernetesClient) mapService(group, version, kind, name, namespace string) (*dto.Service, error) {
	service, err := k.clientset.CoreV1().Services(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	externalIPs := make([]*dto.ExternalIP, 0)
	if service.Spec.Type == "LoadBalancer" {
		for _, ingress := range service.Status.LoadBalancer.Ingress {
			externalIPs = append(externalIPs, &dto.ExternalIP{
				IP:       ingress.IP,
				Hostname: ingress.Hostname,
			})
		}
	}

	for _, externalIP := range service.Spec.ExternalIPs {
		externalIPs = append(externalIPs, &dto.ExternalIP{
			IP: externalIP,
		})
	}

	return &dto.Service{
		Group:       group,
		Version:     version,
		Kind:        kind,
		Name:        name,
		Namespace:   namespace,
		Type:        string(service.Spec.Type),
		ExternalIPs: externalIPs,
		Ports:       service.Spec.Ports,
	}, nil
}

func (k *KubernetesClient) mapConfigMap(group, version, kind, name, namespace string) (*dto.ConfigMap, error) {
	configmap, err := k.clientset.CoreV1().ConfigMaps(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return &dto.ConfigMap{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      name,
		Namespace: namespace,
		Data:      configmap.Data,
	}, nil
}

func (k *KubernetesClient) mapPersistentVolumeClaims(group, version, kind, name, namespace string) (*dto.PersistentVolumeClaim, error) {
	persistentvolumeclaim, err := k.clientset.CoreV1().PersistentVolumeClaims(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	storage := ""
	if persistentvolumeclaim.Spec.Resources.Requests != nil && persistentvolumeclaim.Spec.Resources.Requests.Storage() != nil {
		storage = persistentvolumeclaim.Spec.Resources.Requests.Storage().String()
	}

	return &dto.PersistentVolumeClaim{
		Group:       group,
		Version:     version,
		Kind:        kind,
		Name:        name,
		Namespace:   namespace,
		AccessModes: persistentvolumeclaim.Spec.AccessModes,
		Size:        storage,
	}, nil
}

func (k *KubernetesClient) mapPersistentVolumes(group, version, kind, name, namespace string) (*dto.PersistentVolume, error) {
	persistentVolume, err := k.clientset.CoreV1().PersistentVolumes().Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	capacity := ""
	if persistentVolume.Spec.Capacity != nil && persistentVolume.Spec.Capacity.Storage() != nil {
		capacity = persistentVolume.Spec.Capacity.Storage().String()
	}

	claimRef := ""
	if persistentVolume.Spec.ClaimRef != nil && persistentVolume.Spec.ClaimRef.Name != "" {
		claimRef = persistentVolume.Spec.ClaimRef.Name
	}

	return &dto.PersistentVolume{
		Group:                 group,
		Version:               version,
		Kind:                  kind,
		Name:                  name,
		Namespace:             namespace,
		AccessModes:           persistentVolume.Spec.AccessModes,
		PersistentVolumeClaim: claimRef,
		Capacity:              capacity,
		ReclaimPolicy:         persistentVolume.Spec.PersistentVolumeReclaimPolicy,
		StorageClass:          persistentVolume.Spec.StorageClassName,
		Status:                persistentVolume.Status,
	}, nil
}

func (k *KubernetesClient) mapSecret(group, version, kind, name, namespace string) (*dto.Secret, error) {
	secret, err := k.clientset.CoreV1().Secrets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	dataKeys := make([]string, 0, len(secret.Data))
	for key := range secret.Data {
		dataKeys = append(dataKeys, key)
	}

	return &dto.Secret{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      name,
		Namespace: namespace,
		DataKeys:  dataKeys,
		Type:      string(secret.Type),
	}, nil
}

func (k *KubernetesClient) mapCronJob(group, version, kind, name, namespace string) (*dto.CronJob, error) {
	cronJob, err := k.clientset.BatchV1().CronJobs(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	pods, err := k.getPodsForCronJob(*cronJob)
	if err != nil {
		return nil, err
	}

	status := dto.StatusCronJob{
		LastScheduleTime:   cronJob.Status.LastScheduleTime,
		LastSuccessfulTime: cronJob.Status.LastSuccessfulTime,
	}

	return &dto.CronJob{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      cronJob.Name,
		Namespace: cronJob.Namespace,
		Schedule:  cronJob.Spec.Schedule,
		Status:    status,
		Pods:      pods,
	}, nil
}

func (k *KubernetesClient) mapJob(group, version, kind, name, namespace string) (*dto.Job, error) {
	job, err := k.clientset.BatchV1().Jobs(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	pods, err := k.getPodsForJob(*job)
	if err != nil {
		return nil, err
	}

	startTime := ""
	if job.Status.StartTime != nil {
		startTime = job.Status.StartTime.String()
	}

	completionTime := ""
	if job.Status.CompletionTime != nil {
		completionTime = job.Status.CompletionTime.String()
	}

	return &dto.Job{
		Group:          group,
		Version:        version,
		Kind:           kind,
		Name:           job.Name,
		Namespace:      job.Namespace,
		CompletionTime: completionTime,
		StartTime:      startTime,
		Pods:           pods,
	}, nil
}

func (k *KubernetesClient) mapNetworkPolicy(group, version, kind, name, namespace string) (*dto.NetworkPolicy, error) {
	networkPolicy, err := k.clientset.NetworkingV1().NetworkPolicies(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	pods, err := k.getPodsForNetworkPolicy(*networkPolicy)
	if err != nil {
		return nil, err
	}

	mappedPolicy := &dto.NetworkPolicy{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      networkPolicy.Name,
		Namespace: networkPolicy.Namespace,
		Pods:      pods,
		Ingress:   mapNetworkPolicyIngressRules(networkPolicy.Spec.Ingress),
		Egress:    mapNetworkPolicyEgressRules(networkPolicy.Spec.Egress),
	}

	return mappedPolicy, nil
}

func (k *KubernetesClient) mapRole(group, version, kind, name, namespace string) (*dto.Role, error) {
	role, err := k.clientset.RbacV1().Roles(namespace).Get(context.Background(), name, metav1.GetOptions{})

	if err != nil {
		return nil, err
	}

	return &dto.Role{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      role.Name,
		Namespace: namespace,
		Rules:     role.Rules,
	}, nil
}

func (k *KubernetesClient) mapClusterRole(group, version, kind, name string) (*dto.ClusterRole, error) {
	clusterRole, err := k.clientset.RbacV1().ClusterRoles().Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return &dto.ClusterRole{
		Group:   group,
		Version: version,
		Kind:    kind,
		Name:    clusterRole.Name,
		Rules:   clusterRole.Rules,
	}, nil
}

func mapNetworkPolicyIngressRules(rules []networkingv1.NetworkPolicyIngressRule) []dto.NetworkPolicyIngressRule {
	mapped := make([]dto.NetworkPolicyIngressRule, len(rules))
	for i, rule := range rules {
		mapped[i] = dto.NetworkPolicyIngressRule{
			Ports: mapNetworkPolicyPorts(rule.Ports),
			From:  mapNetworkPolicyPeers(rule.From),
		}
	}
	return mapped
}

func mapNetworkPolicyEgressRules(rules []networkingv1.NetworkPolicyEgressRule) []dto.NetworkPolicyEgressRule {
	mapped := make([]dto.NetworkPolicyEgressRule, len(rules))
	for i, rule := range rules {
		mapped[i] = dto.NetworkPolicyEgressRule{
			Ports: mapNetworkPolicyPorts(rule.Ports),
			To:    mapNetworkPolicyPeers(rule.To),
		}
	}
	return mapped
}

func mapNetworkPolicyPorts(ports []networkingv1.NetworkPolicyPort) []dto.NetworkPolicyPort {
	mapped := make([]dto.NetworkPolicyPort, len(ports))
	for i, port := range ports {
		protocol := ""
		if port.Protocol != nil {
			protocol = string(*port.Protocol)
		}

		portValue := intstr.IntOrString{}
		if port.Port != nil {
			portValue = *port.Port
		}

		var endPort int32
		if port.EndPort != nil {
			endPort = *port.EndPort
		}

		mapped[i] = dto.NetworkPolicyPort{
			Protocol: protocol,
			Port:     portValue,
			EndPort:  endPort,
		}
	}
	return mapped
}

func mapNetworkPolicyPeers(peers []networkingv1.NetworkPolicyPeer) []dto.NetworkPolicyPeer {
	mapped := make([]dto.NetworkPolicyPeer, len(peers))
	for i, peer := range peers {
		mapped[i] = dto.NetworkPolicyPeer{
			IPBlock: mapIPBlock(peer.IPBlock),
		}
	}
	return mapped
}

func mapIPBlock(block *networkingv1.IPBlock) *dto.IPBlock {
	if block == nil {
		return nil
	}
	return &dto.IPBlock{
		CIDR:   block.CIDR,
		Except: block.Except,
	}
}
