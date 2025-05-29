package k8sclient

import (
	"context"
	"fmt"

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/remotecommand"

	"github.com/go-logr/logr"
	apiv1 "k8s.io/api/core/v1"
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/version"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	ctrl "sigs.k8s.io/controller-runtime"

	apiextensionsclientset "k8s.io/apiextensions-apiserver/pkg/client/clientset/clientset"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

type KubernetesClient struct {
	config *rest.Config

	Dynamic             dynamic.Interface
	clientset           *kubernetes.Clientset
	discovery           *discovery.DiscoveryClient
	moduleset           *client.CyclopsV1Alpha1Client
	extensionsClientset *apiextensionsclientset.Clientset

	moduleNamespace       string
	helmReleaseNamespace  string
	moduleTargetNamespace string

	childLabels ChildLabels

	logger logr.Logger
}

type ClientConfig struct {
	KubeconfigPath string
	Context        string

	ModuleNamespace       string
	HelmReleaseNamespace  string
	ModuleTargetNamespace string
}

func NewWithConfig(config ClientConfig, logger logr.Logger) (*KubernetesClient, error) {
	var k8sConfig *rest.Config
	var err error

	if config.KubeconfigPath == "" {
		k8sConfig, err = rest.InClusterConfig()
		if err != nil {
			k8sConfig, err = ctrl.GetConfig()
			if err != nil {
				return nil, err
			}
		}
	} else {
		loadingRules := &clientcmd.ClientConfigLoadingRules{
			ExplicitPath: config.KubeconfigPath,
		}

		configOverrides := &clientcmd.ConfigOverrides{}
		if config.Context != "" {
			configOverrides.CurrentContext = config.Context
		}

		k8sConfig, err = clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
			loadingRules,
			configOverrides,
		).ClientConfig()
		if err != nil {
			return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(k8sConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create clientset: %w", err)
	}

	moduleSet, err := client.NewForConfig(k8sConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create module client: %w", err)
	}

	discovery, err := discovery.NewDiscoveryClientForConfig(k8sConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create discovery client: %w", err)
	}

	dynamic, err := dynamic.NewForConfig(k8sConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create dynamic client: %w", err)
	}

	extensionsClientset := apiextensionsclientset.NewForConfigOrDie(config)

	k := &KubernetesClient{
		Dynamic:               dynamic,
		discovery:             discovery,
		clientset:             clientset,
		moduleset:             moduleSet,
		extensionsClientset:   extensionsClientset,
		moduleNamespace:       config.ModuleNamespace,
		helmReleaseNamespace:  config.HelmReleaseNamespace,
		moduleTargetNamespace: config.ModuleTargetNamespace,
		logger:                logger,
	}

	k.loadResourceRelationsLabels()

	return k, nil
}

func New(
	moduleNamespace string,
	helmReleaseNamespace string,
	moduleTargetNamespace string,
	logger logr.Logger,
) (*KubernetesClient, error) {
	config := ClientConfig{
		ModuleNamespace:       moduleNamespace,
		HelmReleaseNamespace:  helmReleaseNamespace,
		ModuleTargetNamespace: moduleTargetNamespace,
	}
	return NewWithConfig(config, logger)
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
	GetResourcesForModule(name string) ([]*dto.Resource, error)
	MapUnstructuredResource(u unstructured.Unstructured) (*dto.Resource, error)
	GetWorkloadsForModule(name string) ([]*dto.Resource, error)
	GetDeletedResources([]*dto.Resource, string, string) ([]*dto.Resource, error)
	GetModuleResourcesHealth(name string) (string, error)
	GVKtoAPIResourceName(gv schema.GroupVersion, kind string) (string, error)
	VersionInfo() (*version.Info, error)
	RestartDeployment(name, namespace string) error
	RestartStatefulSet(name, namespace string) error
	RestartDaemonSet(name, namespace string) error
	GetManifest(group, version, kind, name, namespace string, includeManagedFields bool) (string, error)
	Restart(group, version, kind, name, namespace string) error
	GetResource(group, version, kind, name, namespace string) (any, error)
	Delete(resource *dto.Resource) error
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
	GetTemplateStore(name string) (*cyclopsv1alpha1.TemplateStore, error)
	CreateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error
	UpdateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error
	DeleteTemplateStore(name string) error
	GetResourcesForRelease(release string) ([]*dto.Resource, error)
	GetWorkloadsForRelease(name string) ([]*dto.Resource, error)
	ListCRDs() ([]v1.CustomResourceDefinition, error)
	GetCRD(name string) (*v1.CustomResourceDefinition, error)
	DeleteReleaseSecret(releaseName, releaseNamespace string) error
	CommandExecutor(namespace, podName, container string) (remotecommand.Executor, error)
}
