package k8sclient

import (
	"context"

	apiv1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/version"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
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

type IKubernetesClient interface {
	GetStreamedPodLogs(ctx context.Context, namespace, container, name string, logCount *int64, logChan chan<- string) error
	GetPodLogs(namespace, container, name string, numLogs *int64) ([]string, error)
	GetDeploymentLogs(namespace, container, deployment string, numLogs *int64) ([]string, error)
	GetStatefulSetsLogs(namespace, container, name string, numLogs *int64) ([]string, error)
	ListModules() ([]cyclopsv1alpha1.Module, error)
	CreateModule(module cyclopsv1alpha1.Module) error
	UpdateModule(module *cyclopsv1alpha1.Module) error
	UpdateModuleStatus(module *cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error)
	DeleteModule(name string) error
	GetModule(name string) (*cyclopsv1alpha1.Module, error)
	GetResourcesForModule(name string) ([]dto.Resource, error)
	GetWorkloadsForModule(name string) ([]dto.Resource, error)
	GetDeletedResources([]dto.Resource, string, string) ([]dto.Resource, error)
	GetModuleResourcesHealth(name string) (string, error)
	GVKtoAPIResourceName(gv schema.GroupVersion, kind string) (string, error)
	VersionInfo() (*version.Info, error)
	RestartDeployment(name, namespace string) error
	RestartStatefulSet(name, namespace string) error
	RestartDaemonSet(name, namespace string) error
	GetManifest(group, version, kind, name, namespace string, includeManagedFields bool) (string, error)
	Restart(group, version, kind, name, namespace string) error
	GetResource(group, version, kind, name, namespace string) (any, error)
	Delete(resource dto.Resource) error
	CreateDynamic(cyclopsv1alpha1.GroupVersionResource, *unstructured.Unstructured, string) error
	ApplyCRD(obj *unstructured.Unstructured) error
	ListNodes() ([]apiv1.Node, error)
	GetNode(name string) (*apiv1.Node, error)
	GetPodsForNode(nodeName string) ([]apiv1.Pod, error)
	ListNamespaces() ([]string, error)
	WatchResource(group, version, resource, name, namespace string) (watch.Interface, error)
	WatchKubernetesResources(gvrs []ResourceWatchSpec, stopCh chan struct{}) (chan *unstructured.Unstructured, error)
	ListTemplateAuthRules() ([]cyclopsv1alpha1.TemplateAuthRule, error)
	GetTemplateAuthRuleSecret(name, key string) (string, error)
	ListTemplateStore() ([]cyclopsv1alpha1.TemplateStore, error)
	CreateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error
	UpdateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error
	DeleteTemplateStore(name string) error
	GetResourcesForRelease(release string) ([]dto.Resource, error)
	GetWorkloadsForRelease(name string) ([]dto.Resource, error)
}
