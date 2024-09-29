package k8sclient

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"

	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/tools/cache"

	"os"
	"os/exec"
	"sort"
	"strings"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"

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

func (k *KubernetesClient) GetStreamedPodLogs(ctx context.Context, namespace, container, name string, logCount *int64, logChan chan<- string) error {
	podLogOptions := apiv1.PodLogOptions{
		Container:  container,
		TailLines:  logCount,
		Timestamps: true,
		Follow:     true,
	}

	podClient := k.clientset.CoreV1().Pods(namespace).GetLogs(name, &podLogOptions)
	stream, err := podClient.Stream(ctx)
	if err != nil {
		return err
	}
	defer stream.Close()

	scanner := bufio.NewScanner(stream)

	for scanner.Scan() {
		logChan <- scanner.Text()
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	return nil
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

func (k *KubernetesClient) RestartDeployment(name, namespace string) error {
	deployment, err := k.clientset.AppsV1().Deployments(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	if deployment.Spec.Template.ObjectMeta.Annotations == nil {
		deployment.Spec.Template.ObjectMeta.Annotations = make(map[string]string)
	}
	deployment.Spec.Template.ObjectMeta.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	_, err = k.clientset.AppsV1().Deployments(namespace).Update(context.Background(), deployment, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) RestartStatefulSet(name, namespace string) error {
	statefulset, err := k.clientset.AppsV1().StatefulSets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	if statefulset.Spec.Template.ObjectMeta.Annotations == nil {
		statefulset.Spec.Template.ObjectMeta.Annotations = make(map[string]string)
	}
	statefulset.Spec.Template.ObjectMeta.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	_, err = k.clientset.AppsV1().StatefulSets(namespace).Update(context.Background(), statefulset, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) RestartDaemonSet(name, namespace string) error {
	daemonset, err := k.clientset.AppsV1().DaemonSets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	if daemonset.Spec.Template.ObjectMeta.Annotations == nil {
		daemonset.Spec.Template.ObjectMeta.Annotations = make(map[string]string)
	}
	daemonset.Spec.Template.ObjectMeta.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	_, err = k.clientset.AppsV1().DaemonSets(namespace).Update(context.Background(), daemonset, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) GetManifest(group, version, kind, name, namespace string, includeManagedFields bool) (string, error) {
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

	if !includeManagedFields {
		resource.SetManagedFields(nil)
	}

	data, err := yaml.Marshal(resource.Object)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (k *KubernetesClient) Restart(group, version, kind, name, namespace string) error {
	switch {
	case isDeployment(group, version, kind):
		return k.RestartDeployment(name, namespace)
	case isDaemonSet(group, version, kind):
		return k.RestartDaemonSet(name, namespace)
	case isStatefulSet(group, version, kind):
		return k.RestartStatefulSet(name, namespace)
	}

	return errors.New(fmt.Sprintf("cannot restart: %v/%v %v %v/%v", group, version, kind, namespace, name))
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
	case isPersistentVolume(group, version, kind):
		return k.mapPersistentVolumes(group, version, kind, name, namespace)
	case isPersistentVolumeClaims(group, version, kind):
		return k.mapPersistentVolumeClaims(group, version, kind, name, namespace)
	case isSecret(group, version, kind):
		return k.mapSecret(group, version, kind, name, namespace)
	case isCronJob(group, version, kind):
		return k.mapCronJob(group, version, kind, name, namespace)
	case isJob(group, version, kind):
		return k.mapJob(group, version, kind, name, namespace)
	case isRole(group, version, kind):
		return k.mapRole(group, version, kind, name, namespace)
	case isNetworkPolicy(group, version, kind):
		return k.mapNetworkPolicy(group, version, kind, name, namespace)
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

func (k *KubernetesClient) CreateDynamic(
	resource v1alpha1.GroupVersionResource,
	obj *unstructured.Unstructured,
	targetNamespace string,
) error {
	gvr := schema.GroupVersionResource{
		Group:    resource.Group,
		Version:  resource.Version,
		Resource: resource.Resource,
	}

	objNamespace := apiv1.NamespaceDefault

	if len(strings.TrimSpace(targetNamespace)) != 0 {
		objNamespace = strings.TrimSpace(targetNamespace)
	}

	if len(strings.TrimSpace(obj.GetNamespace())) != 0 {
		objNamespace = obj.GetNamespace()
	}
	obj.SetNamespace(objNamespace)

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

	if isPersistentVolumeClaims(obj.GroupVersionKind().Group, obj.GroupVersionKind().Version, obj.GroupVersionKind().Kind) {
		if err := mergePVCWithCurrent(current, obj); err != nil {
			return err
		}
	}

	obj.SetResourceVersion(current.GetResourceVersion())

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
	current, err := k.Dynamic.Resource(gvr).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
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

	obj.SetResourceVersion(current.GetResourceVersion())

	_, err = k.Dynamic.Resource(gvr).Update(
		context.Background(),
		obj,
		metav1.UpdateOptions{},
	)

	return err
}

func (k *KubernetesClient) ApplyCRD(obj *unstructured.Unstructured) error {
	gvr := schema.GroupVersionResource{
		Group:    "apiextensions.k8s.io",
		Version:  "v1",
		Resource: "customresourcedefinitions",
	}

	_, err := k.Dynamic.Resource(gvr).Apply(
		context.Background(),
		obj.GetName(),
		obj,
		metav1.ApplyOptions{
			FieldManager: "cyclops-ctrl",
		},
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

func mergePVCWithCurrent(current, obj *unstructured.Unstructured) error {
	requests, ok, err := unstructured.NestedMap(obj.Object, "spec", "resources", "requests")
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("PVC %v spec.resources.requests not found", obj.GetName())
	}

	for key, value := range current.Object {
		obj.Object[key] = value
	}

	return unstructured.SetNestedMap(current.Object, requests, "spec", "resources", "requests")
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

func (k *KubernetesClient) ListNamespaces() ([]string, error) {
	namespaceList, err := k.clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	namespaces := make([]string, 0, len(namespaceList.Items))
	for _, item := range namespaceList.Items {
		namespaces = append(namespaces, item.Name)
	}

	return namespaces, nil
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

func (k *KubernetesClient) clusterApiResources() (*apiResources, error) {
	resourcesList, err := k.discovery.ServerPreferredResources()
	if err != nil {
		return nil, err
	}

	return &apiResources{resourcesList: resourcesList}, nil
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

func isPersistentVolume(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "PersistentVolume"
}

func isSecret(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Secret"
}

func isCronJob(group, version, kind string) bool {
	return group == "batch" && version == "v1" && kind == "CronJob"
}

func isRole(group, version, kind string) bool {
	return group == "rbac.authorization.k8s.io" && version == "v1" && kind == "Role"
}

func isNetworkPolicy(group, version, kind string) bool {
	return group == "networking.k8s.io" && version == "v1" && kind == "NetworkPolicy"
}

func IsWorkload(group, version, kind string) bool {
	return isDeployment(group, version, kind) ||
		isStatefulSet(group, version, kind) ||
		isDaemonSet(group, version, kind)
}

func (k *KubernetesClient) WatchResource(group, version, resource, name, namespace string) (watch.Interface, error) {
	gvr := schema.GroupVersionResource{
		Group:    group,
		Version:  version,
		Resource: resource,
	}

	return k.Dynamic.Resource(gvr).Namespace(namespace).Watch(context.Background(), metav1.ListOptions{
		FieldSelector: "metadata.name=" + name,
	})
}

type ResourceWatchSpec struct {
	GVR       schema.GroupVersionResource
	Namespace string
	Name      string
}

func (k *KubernetesClient) WatchKubernetesResources(gvrs []ResourceWatchSpec, stopCh chan struct{}) (chan *unstructured.Unstructured, error) {
	if len(gvrs) == 0 {
		return nil, errors.New("no gvrs to watch")
	}

	eventChan := make(chan *unstructured.Unstructured, 1)

	startWatch := func(spec ResourceWatchSpec) {
		go func() {
			resourceClient := k.Dynamic.Resource(spec.GVR).Namespace(spec.Namespace)

			informer := cache.NewSharedInformer(
				&cache.ListWatch{
					ListFunc: func(options metav1.ListOptions) (runtime.Object, error) {
						options.FieldSelector = "metadata.name=" + spec.Name
						return resourceClient.List(context.TODO(), options)
					},
					WatchFunc: func(options metav1.ListOptions) (watch.Interface, error) {
						options.FieldSelector = "metadata.name=" + spec.Name
						return resourceClient.Watch(context.TODO(), options)
					},
				},
				&unstructured.Unstructured{},
				0,
			)

			informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
				AddFunc: func(obj interface{}) {
					eventChan <- obj.(*unstructured.Unstructured)
				},
				UpdateFunc: func(oldObj, newObj interface{}) {
					eventChan <- newObj.(*unstructured.Unstructured)
				},
				DeleteFunc: func(obj interface{}) {
					eventChan <- obj.(*unstructured.Unstructured)
				},
			})

			informer.Run(stopCh)
		}()
	}

	for _, gvr := range gvrs {
		startWatch(gvr)
	}

	return eventChan, nil
}
