package k8sclient

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"gopkg.in/yaml.v2"
	"io"
	v12 "k8s.io/api/apps/v1"
	"k8s.io/api/autoscaling/v1"
	apiv1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"os"
	"os/exec"
	ctrl "sigs.k8s.io/controller-runtime"
	"strings"

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
		Container: container,
		TailLines: numLogs,
	}
	podClient := k.clientset.CoreV1().Pods(namespace).GetLogs(name, &podLogOptions)
	stream, err := podClient.Stream(context.Background())
	if err != nil {
		return nil, err
	}

	defer func(stream io.ReadCloser) {
		err := stream.Close()
		if err != nil {

		}
	}(stream)

	var logs []string
	for {
		buf := make([]byte, 2000)
		numBytes, err := stream.Read(buf)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		if numBytes == 0 {
			continue
		}
		logs = append(logs, string(buf[:numBytes]))
	}

	return logs, nil
}

func (k *KubernetesClient) GetManifest(group, version, kind, name, namespace string) (string, error) {
	resource, err := k.Dynamic.Resource(schema.GroupVersionResource{
		Group:    group,
		Version:  version,
		Resource: strings.ToLower(kind) + "s",
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
	case isService(group, version, kind):
		return k.mapService(group, version, kind, name, namespace)
	case isStatefulSet(group, version, kind):
		return k.mapStatefulSet(group, version, kind, name, namespace)
	case isPod(group, version, kind):
		return k.mapPod(group, version, kind, name, namespace)
	case isConfigMap(group, version, kind):
		return k.mapConfigMap(group, version, kind, name, namespace)
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
	gvr := schema.GroupVersionResource{
		Group:    resource.GetGroup(),
		Version:  resource.GetVersion(),
		Resource: strings.ToLower(resource.GetKind()) + "s",
	}

	return k.Dynamic.Resource(gvr).Namespace(resource.GetNamespace()).Delete(
		context.Background(),
		resource.GetName(),
		metav1.DeleteOptions{},
	)
}

func (k *KubernetesClient) CreateDynamic(obj *unstructured.Unstructured) error {
	gvr := schema.GroupVersionResource{
		Group:    obj.GroupVersionKind().Group,
		Version:  obj.GroupVersionKind().Version,
		Resource: strings.ToLower(obj.GroupVersionKind().Kind) + "s",
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
	_, err := k.Dynamic.Resource(gvr).Namespace(namespace).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
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

func isStatefulSet(group, version, kind string) bool {
	return group == "apps" && version == "v1" && kind == "StatefulSet"
}

func isPod(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Pod"
}

func isService(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Service"
}

func isConfigMap(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "ConfigMap"
}
