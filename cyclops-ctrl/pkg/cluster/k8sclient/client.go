package k8sclient

import (
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
)

const (
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
