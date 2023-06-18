package k8s_client

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"gitops/internal/k8s/v1alpha1"
	v1alpha12 "gitops/internal/models/crd/v1alpha1"
	"gitops/internal/models/dto"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v2"
	v12 "k8s.io/api/apps/v1"
	"k8s.io/api/autoscaling/v1"
	apiv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

const (
	kubectl = "kubectl"
)

type KubernetesClient struct {
	clientset *kubernetes.Clientset

	discovery *discovery.DiscoveryClient
	dynamic   dynamic.Interface

	moduleset *v1alpha1.ExampleV1Alpha1Client
}

func New() (*KubernetesClient, error) {
	return createLocalClient()

	if err := godotenv.Load(".env"); err != nil {
		panic(err)
	}

	if os.Getenv("ENVIRONMENT") == "local" {
		return createLocalClient()
	}

	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return &KubernetesClient{
		clientset: clientset,
	}, nil
}

func createLocalClient() (*KubernetesClient, error) {
	var kubeconfig *string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	flag.Parse()

	config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
	if err != nil {
		return nil, err
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

	go Watch(moduleSet)

	return &KubernetesClient{
		discovery: discovery,
		dynamic:   dynamic,
		clientset: clientset,
		moduleset: moduleSet,
	}, nil
}

func Watch(moduleset *v1alpha1.ExampleV1Alpha1Client) {
	watch, err := moduleset.Modules("default").Watch(metav1.ListOptions{})
	if err != nil {
		panic(err)
	}

	ch := watch.ResultChan()
	for {
		select {
		case event := <-ch:
			if event.Type == "" {
				continue
			}
		}
	}
}

func (k *KubernetesClient) KubectlApply(manifest string) error {
	f, err := os.Create("./tmp/manifest.yaml")
	defer f.Close()
	if err != nil {
		return errors.New("error creating a file")
	}

	_, err = f.Write([]byte(manifest))
	if err != nil {
		return errors.New("error writing a file")
	}

	// TODO: error handling
	c := exec.Command(kubectl, "apply", "-f", "./tmp/manifest.yaml")
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err = c.Run(); err != nil {
		return err
	}

	return nil
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
	_, err := deploymentClient.Create(context.TODO(), deploymentSpec, metav1.CreateOptions{})
	return err
}

func (k *KubernetesClient) UpdateDeployment(deploymentSpec *v12.Deployment) error {
	deploymentClient := k.clientset.AppsV1().Deployments(apiv1.NamespaceDefault)
	_, err := deploymentClient.Update(context.TODO(), deploymentSpec, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) DeployService(service *apiv1.Service) error {
	deploymentClient := k.clientset.CoreV1().Services(apiv1.NamespaceDefault)
	_, err := deploymentClient.Create(context.TODO(), service, metav1.CreateOptions{})
	return err
}

func (k *KubernetesClient) UpdateService(service *apiv1.Service) error {
	deploymentClient := k.clientset.CoreV1().Services(apiv1.NamespaceDefault)
	_, err := deploymentClient.Update(context.TODO(), service, metav1.UpdateOptions{})
	return err
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

func (k *KubernetesClient) Delete(kind, name string) error {
	cmd := exec.Command(kubectl, "delete", kind, name)
	cmd.Stdout = os.Stdout
	return cmd.Run()
}

func (k *KubernetesClient) GetDeploymentsYaml(name string, namespace string) (*bytes.Buffer, error) {
	buff := new(bytes.Buffer)
	command := exec.Command(kubectl, "get", "deployments", name, "-n", namespace, "-o", "yaml")
	command.Stdout = buff
	command.Stderr = os.Stderr
	return buff, command.Run()
}

func (k *KubernetesClient) ListModules() ([]v1alpha12.Module, error) {
	moduleList, err := k.moduleset.Modules("default").List(metav1.ListOptions{})
	return moduleList, err
}

func (k *KubernetesClient) CreateModule(module v1alpha12.Module) error {
	_, err := k.moduleset.Modules("default").Create(&module)
	return err
}

func (k *KubernetesClient) UpdateModule(module v1alpha12.Module) error {
	if err := k.moduleset.Modules("default").Delete(module.Name); err != nil {
		return err
	}

	if module.Status.Conditions == nil {
		module.Status.Conditions = make([]metav1.Condition, 0)
	}

	module.Status.Conditions = append(module.Status.Conditions, metav1.Condition{
		Type:   "Availability",
		Status: "Available",
		LastTransitionTime: metav1.Time{
			time.Now(),
		},
		Reason:  "All good",
		Message: "good job",
	})

	_, err := k.moduleset.Modules("default").Create(&module)
	return err
}

func (k *KubernetesClient) DeleteModule(name string) error {
	return k.moduleset.Modules("default").Delete(name)
}

func (k *KubernetesClient) GetModule(name string) (*v1alpha12.Module, error) {
	return k.moduleset.Modules("default").Get(name)
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

		pods, err := k.getPods(item.Namespace, item.Name)
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
