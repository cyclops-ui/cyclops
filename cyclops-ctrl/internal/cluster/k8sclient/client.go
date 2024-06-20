package k8sclient

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sort"
	"strings"

	"gopkg.in/yaml.v2"

	v12 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/autoscaling/v1"
	apiv1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/version"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

const (
	kubectl          = "kubectl"
	cyclopsNamespace = "cyclops"
)

type KubernetesClient struct {
	Dynamic dynamic.Interface

	clientset *kubernetes.Clientset

	discovery *discovery.DiscoveryClient

	moduleset *client.CyclopsV1Alpha1Client
}

func New() (*KubernetesClient, error) {
	return createLocalClient()
}

func createLocalClient() (*KubernetesClient, error) {
	config := ctrl.GetConfigOrDie()
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	moduleSet, err := client.NewForConfig(config)
	if err != nil {
		panic(err)
	}

	discovery := discovery.NewDiscoveryClientForConfigOrDie(config)

	dynamic, err := dynamic.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	return &KubernetesClient{
		Dynamic:   dynamic,
		discovery: discovery,
		clientset: clientset,
		moduleset: moduleSet,
	}, nil
}

func (k *KubernetesClient) VersionInfo() (*version.Info, error) {
	return k.discovery.ServerVersion()
}

func (k *KubernetesClient) GetDeployment(namespace, name string) (*v12.Deployment, error) {
	deploymentClient := k.clientset.AppsV1().Deployments(namespace)
	return deploymentClient.Get(context.TODO(), name, metav1.GetOptions{})
}

func (k *KubernetesClient) GetDeployments(namespace string) ([]v12.Deployment, error) {
	deploymentClient := k.clientset.AppsV1().Deployments(namespace)
	deploymentList, err := deploymentClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return deploymentList.Items, err
}

func (k *KubernetesClient) GetScale(namespace, name string) (*v1.Scale, error) {
	deploymentClient := k.clientset.AppsV1().Deployments(namespace)
	return deploymentClient.GetScale(context.TODO(), name, metav1.GetOptions{})
}

func (k *KubernetesClient) UpdateScale(namespace, name string, sc v1.Scale) error {
	deploymentClient := k.clientset.AppsV1().Deployments(namespace)
	_, err := deploymentClient.UpdateScale(context.TODO(), name, &sc, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) Deploy(deploymentSpec *v12.Deployment) error {
	namespace := deploymentSpec.Namespace
	if len(namespace) == 0 {
		namespace = apiv1.NamespaceDefault
	}
	deploymentClient := k.clientset.AppsV1().Deployments(namespace)

	_, err := deploymentClient.Get(context.TODO(), deploymentSpec.Name, metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			_, err := deploymentClient.Create(context.TODO(), deploymentSpec, metav1.CreateOptions{})
			return err
		} else {
			return err
		}
	} else {
		_, err := deploymentClient.Update(context.TODO(), deploymentSpec, metav1.UpdateOptions{})
		return err
	}
}

func (k *KubernetesClient) DeployService(service *apiv1.Service) error {
	namespace := service.Namespace
	if len(namespace) == 0 {
		namespace = apiv1.NamespaceDefault
	}
	serviceClient := k.clientset.CoreV1().Services(namespace)

	_, err := serviceClient.Get(context.TODO(), service.Name, metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			_, err := serviceClient.Create(context.TODO(), service, metav1.CreateOptions{})
			return err
		} else {
			return err
		}
	} else {
		_, err := serviceClient.Update(context.TODO(), service, metav1.UpdateOptions{})
		return err
	}
}

func (k *KubernetesClient) GetPods(namespace, name string) ([]apiv1.Pod, error) {
	podClient := k.clientset.CoreV1().Pods(namespace)
	podList, err := podClient.List(context.TODO(), metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%v", name),
	})

	if err != nil {
		return nil, err
	}

	return podList.Items, err
}

func (k *KubernetesClient) GetPodLogs(namespace, container, name string, numLogs *int64) ([]string, error) {
	podLogOptions := apiv1.PodLogOptions{
		Container:  container,
		TailLines:  numLogs,
		Timestamps: true,
	}
	podClient := k.clientset.CoreV1().Pods(namespace).GetLogs(name, &podLogOptions)
	stream, err := podClient.Stream(context.Background())
	if err != nil {
		return nil, err
	}

	defer func(stream io.ReadCloser) {
		err := stream.Close()
		if err != nil {
			return
		}
	}(stream)

	var logs []string
	scanner := bufio.NewScanner(stream)
	for scanner.Scan() {
		logs = append(logs, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return logs, nil
}

func (k *KubernetesClient) GetDeploymentLogs(namespace, container, deployment string, numLogs *int64) ([]string, error) {
	deploymentClient := k.clientset.AppsV1().Deployments(namespace)
	deploymentObj, err := deploymentClient.Get(context.Background(), deployment, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	pods, err := k.clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(deploymentObj.Spec.Selector.MatchLabels).String(),
	})
	if err != nil {
		return nil, err
	}

	var logs []string
	for _, pod := range pods.Items {
		podLogs, err := k.GetPodLogs(namespace, container, pod.Name, numLogs)
		if err != nil {
			return nil, err
		}
		logs = append(logs, podLogs...)
	}
	sort.Strings(logs)
	return logs, nil
}

func (k *KubernetesClient) GetStatefulSetsLogs(namespace, container, name string, numLogs *int64) ([]string, error) {
	statefulsetClient := k.clientset.AppsV1().StatefulSets(namespace)
	statefulsetObj, err := statefulsetClient.Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	pods, err := k.clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(statefulsetObj.Spec.Selector.MatchLabels).String(),
	})
	if err != nil {
		return nil, err
	}

	var logs []string
	for _, pod := range pods.Items {
		podLogs, err := k.GetPodLogs(namespace, container, pod.Name, numLogs)
		if err != nil {
			return nil, err
		}
		logs = append(logs, podLogs...)
	}
	sort.Strings(logs)
	return logs, nil
}

func (k *KubernetesClient) GetManifest(group, version, kind, name, namespace string) (string, error) {
	apiResourceName, err := k.GVKtoAPIResourceName(schema.GroupVersion{Group: group, Version: version}, kind)
	if err != nil {
		return "", err
	}

	resource, err := k.Dynamic.Resource(schema.GroupVersionResource{
		Group:    group,
		Version:  version,
		Resource: apiResourceName,
	}).Namespace(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return "", err
	}

	data, err := yaml.Marshal(resource.Object)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (k *KubernetesClient) GetResource(group, version, kind, name, namespace string) (any, error) {
	switch {
	case isDeployment(group, version, kind):
		return k.mapDeployment(group, version, kind, name, namespace)
	case isDaemonSet(group, version, kind):
		return k.mapDaemonSet(group, version, kind, name, namespace)
	case isService(group, version, kind):
		return k.mapService(group, version, kind, name, namespace)
	case isStatefulSet(group, version, kind):
		return k.mapStatefulSet(group, version, kind, name, namespace)
	case isPod(group, version, kind):
		return k.mapPod(group, version, kind, name, namespace)
	case isConfigMap(group, version, kind):
		return k.mapConfigMap(group, version, kind, name, namespace)
	case isPersistentVolumeClaims(group, version, kind):
		return k.mapPersistentVolumeClaims(group, version, kind, name, namespace)
	case isSecret(group, version, kind):
		return k.mapSecret(group, version, kind, name, namespace)
	case isCronJob(group, version, kind):
		return k.mapCronJob(group, version, kind, name, namespace)
	case isJob(group, version, kind):
		return k.mapJob(group, version, kind, name, namespace)
	}

	return nil, nil
}

func (k *KubernetesClient) GetAllNamespacePods() ([]apiv1.Pod, error) {
	podClient := k.clientset.CoreV1().Pods(apiv1.NamespaceDefault)
	podList, err := podClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return podList.Items, nil
}

func (k *KubernetesClient) GetNamespaces() ([]apiv1.Namespace, error) {
	namespaceClient := k.clientset.CoreV1().Namespaces()
	namespaces, err := namespaceClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	return namespaces.Items, err
}

func (k *KubernetesClient) GetDeploymentsYaml(name string, namespace string) (*bytes.Buffer, error) {
	buff := new(bytes.Buffer)
	command := exec.Command(kubectl, "get", "deployments", name, "-n", namespace, "-o", "yaml")
	command.Stdout = buff
	command.Stderr = os.Stderr
	return buff, command.Run()
}

func (k *KubernetesClient) Delete(resource dto.Resource) error {
	apiResourceName, err := k.GVKtoAPIResourceName(
		schema.GroupVersion{
			Group:   resource.GetGroup(),
			Version: resource.GetVersion(),
		}, resource.GetKind())
	if err != nil {
		return err
	}

	gvr := schema.GroupVersionResource{
		Group:    resource.GetGroup(),
		Version:  resource.GetVersion(),
		Resource: apiResourceName,
	}

	return k.Dynamic.Resource(gvr).Namespace(resource.GetNamespace()).Delete(
		context.Background(),
		resource.GetName(),
		metav1.DeleteOptions{},
	)
}

func (k *KubernetesClient) CreateDynamic(obj *unstructured.Unstructured) error {
	resourceName, err := k.GVKtoAPIResourceName(obj.GroupVersionKind().GroupVersion(), obj.GroupVersionKind().Kind)
	if err != nil {
		return err
	}

	gvr := schema.GroupVersionResource{
		Group:    obj.GroupVersionKind().Group,
		Version:  obj.GroupVersionKind().Version,
		Resource: resourceName,
	}

	objNamespace := obj.GetNamespace()
	if len(strings.TrimSpace(objNamespace)) == 0 {
		objNamespace = apiv1.NamespaceDefault
	}

	isNamespaced, err := k.isResourceNamespaced(obj.GroupVersionKind())
	if err != nil {
		return err
	}

	if !isNamespaced {
		return k.createDynamicNonNamespaced(gvr, obj)
	}

	return k.createDynamicNamespaced(gvr, objNamespace, obj)
}

func (k *KubernetesClient) createDynamicNamespaced(
	gvr schema.GroupVersionResource,
	namespace string,
	obj *unstructured.Unstructured,
) error {
	current, err := k.Dynamic.Resource(gvr).Namespace(namespace).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			_, err := k.Dynamic.Resource(gvr).Namespace(namespace).Create(
				context.Background(),
				obj,
				metav1.CreateOptions{},
			)

			return err
		}
		return err
	}

	if isJob(obj.GroupVersionKind().Group, obj.GroupVersionKind().Version, obj.GroupVersionKind().Kind) {
		if err := copyJobSelectors(current, obj); err != nil {
			return err
		}
	}

	_, err = k.Dynamic.Resource(gvr).Namespace(namespace).Update(
		context.Background(),
		obj,
		metav1.UpdateOptions{},
	)

	return err
}

func (k *KubernetesClient) createDynamicNonNamespaced(
	gvr schema.GroupVersionResource,
	obj *unstructured.Unstructured,
) error {
	_, err := k.Dynamic.Resource(gvr).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			_, err := k.Dynamic.Resource(gvr).Create(
				context.Background(),
				obj,
				metav1.CreateOptions{},
			)

			return err
		}
		return err
	}

	_, err = k.Dynamic.Resource(gvr).Update(
		context.Background(),
		obj,
		metav1.UpdateOptions{},
	)

	return err
}

func copyJobSelectors(source, destination *unstructured.Unstructured) error {
	selectors, ok, err := unstructured.NestedMap(source.Object, "spec", "selector")
	if err != nil {
		return err
	}
	if !ok {
		return errors.New(fmt.Sprintf("job %v selectors not found", source.GetName()))
	}

	templateLabels, ok, err := unstructured.NestedMap(source.Object, "spec", "template", "metadata", "labels")
	if err != nil {
		return err
	}
	if !ok {
		return errors.New(fmt.Sprintf("job %v selectors not found", source.GetName()))
	}

	if err := unstructured.SetNestedMap(destination.Object, selectors, "spec", "selector"); err != nil {
		return err
	}

	return unstructured.SetNestedMap(destination.Object, templateLabels, "spec", "template", "metadata", "labels")
}

func (k *KubernetesClient) ListNodes() ([]apiv1.Node, error) {
	nodeList, err := k.clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	return nodeList.Items, err
}

func (k *KubernetesClient) GetNode(name string) (*apiv1.Node, error) {
	return k.clientset.CoreV1().Nodes().Get(context.TODO(), name, metav1.GetOptions{})
}

func (k *KubernetesClient) GetPodsForNode(nodeName string) ([]apiv1.Pod, error) {
	podList, err := k.clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{
		FieldSelector: "spec.nodeName=" + nodeName,
	})
	return podList.Items, err
}

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
		Status:    getDeploymentStatus(pods),
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
		Status:    getDaemonSetStatus(pods),
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
		Status:    getDeploymentStatus(pods),
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

	return &dto.Service{
		Group:     group,
		Version:   version,
		Kind:      kind,
		Name:      name,
		Namespace: namespace,
		Ports:     service.Spec.Ports,
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

	return &dto.Job{
		Group:          group,
		Version:        version,
		Kind:           kind,
		Name:           job.Name,
		Namespace:      job.Namespace,
		CompletionTime: job.Status.CompletionTime.String(),
		StartTime:      job.Status.StartTime.String(),
		Pods:           pods,
	}, nil
}

func (k *KubernetesClient) isResourceNamespaced(gvk schema.GroupVersionKind) (bool, error) {
	resourcesList, err := k.discovery.ServerPreferredResources()
	if err != nil {
		return false, err
	}

	for _, resource := range resourcesList {
		gv, err := schema.ParseGroupVersion(resource.GroupVersion)
		if err != nil {
			return false, err
		}

		for _, apiResource := range resource.APIResources {
			if apiResource.Kind == gvk.Kind &&
				gv.Group == gvk.Group &&
				gv.Version == gvk.Version {
				return apiResource.Namespaced, nil
			}
		}
	}

	return false, errors.New(fmt.Sprintf("group version kind not found: %v", gvk.String()))
}

func isDeployment(group, version, kind string) bool {
	return group == "apps" && version == "v1" && kind == "Deployment"
}

func isDaemonSet(group, version, kind string) bool {
	return group == "apps" && version == "v1" && kind == "DaemonSet"
}

func isStatefulSet(group, version, kind string) bool {
	return group == "apps" && version == "v1" && kind == "StatefulSet"
}

func isPod(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Pod"
}

func isJob(group, version, kind string) bool {
	return group == "batch" && version == "v1" && kind == "Job"
}

func isService(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Service"
}

func isConfigMap(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "ConfigMap"
}

func isPersistentVolumeClaims(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "PersistentVolumeClaim"
}

func isSecret(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Secret"
}

func isCronJob(group, version, kind string) bool {
	return group == "batch" && version == "v1" && kind == "CronJob"
}
