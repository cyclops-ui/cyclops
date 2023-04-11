package v1alpha1

import (
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"

	"github.com/cyclops-ui/cycops-ctrl/internal/models/crd/v1alpha1"
)

type ExampleV1Alpha1Interface interface {
	Projects(namespace string) ModuleInterface
}

type ExampleV1Alpha1Client struct {
	restClient rest.Interface
}

func NewForConfig(c *rest.Config) (*ExampleV1Alpha1Client, error) {
	config := *c
	config.ContentConfig.GroupVersion = &schema.GroupVersion{Group: v1alpha1.GroupName, Version: v1alpha1.GroupVersion}
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return nil, err
	}

	return &ExampleV1Alpha1Client{restClient: client}, nil
}

func (c *ExampleV1Alpha1Client) Modules(namespace string) ModuleInterface {
	return &moduleClient{
		restClient: c.restClient,
		ns:         namespace,
	}
}
