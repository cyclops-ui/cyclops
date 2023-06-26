package k8sclient

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"

	v12 "k8s.io/api/apps/v1"
	"k8s.io/api/autoscaling/v1"
	apiv1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	ctrl "sigs.k8s.io/controller-runtime"

	"github.com/cyclops-ui/cycops-ctrl/internal/cluster/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
)

const (
	kubectl          = "kubectl"
	cyclopsNamespace = "cyclops"
)

type KubernetesClient struct {
	Dynamic dynamic.Interface

	clientset *kubernetes.Clientset

	discovery *discovery.DiscoveryClient

	moduleset *v1alpha1.ExampleV1Alpha1Client
}

func New() (*KubernetesClient, error) {
	return createLocalClient()
}

func createLocalClient() (*KubernetesClient, error) {
	kubeconfigEnv := os.Getenv("LOCAL_DEV")
	var config *rest.Config
	var err error

	if len(kubeconfigEnv) != 0 {
		//var kubeconfig *string
		//if home := homedir.HomeDir(); home != "" {
		//	kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
		//} else {
		//	kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
		//}
		//flag.Parse()
		//
		//fmt.Println("loading local config")
		//
		//config, err = clientcmd.BuildConfigFromFlags("", *kubeconfig)
		//if err != nil {
		//	return nil, err
		//}

		config = ctrl.GetConfigOrDie()

	} else {
		fmt.Println("loading in cluster config")
		config, err = rest.InClusterConfig()
		if err != nil {
			return nil, err
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	moduleSet, err := v1alpha1.NewForConfig(config)
	if err != nil {
		panic(err)
	}

	discovery := discovery.NewDiscoveryClientForConfigOrDie(config)

	dynamic, err := dynamic.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	//clientset.CoreV1().Services("").Watch()

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
	deploymentClient := k.clientset.AppsV1().Deployments(apiv1.NamespaceDefault)

	_, err := deploymentClient.Get(context.TODO(), deploymentSpec.Name, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
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
	serviceClient := k.clientset.CoreV1().Services(apiv1.NamespaceDefault)

	_, err := serviceClient.Get(context.TODO(), service.Name, metav1.GetOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
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

func (k *KubernetesClient) GetPodLogs(namespace, container, name string) ([]string, error) {
	count := int64(100)
	podLogOptions := apiv1.PodLogOptions{
		Container: container,
		TailLines: &count,
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

	return k.Dynamic.Resource(gvr).Namespace("default").Delete(
		context.Background(),
		resource.GetName(),
		metav1.DeleteOptions{},
	)
}
