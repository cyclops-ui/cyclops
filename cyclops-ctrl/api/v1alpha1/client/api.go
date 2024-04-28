package client

import (
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
)

type CyclopsV1Alpha1Client struct {
	restClient rest.Interface
}

func NewForConfig(c *rest.Config) (*CyclopsV1Alpha1Client, error) {
	config := *c
	config.ContentConfig.GroupVersion = &schema.GroupVersion{Group: GroupName, Version: GroupVersion}
	config.APIPath = "/apis"
	config.NegotiatedSerializer = scheme.Codecs.WithoutConversion()
	config.UserAgent = rest.DefaultKubernetesUserAgent()

	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return nil, err
	}

	return &CyclopsV1Alpha1Client{restClient: client}, nil
}

func (c *CyclopsV1Alpha1Client) Modules(namespace string) ModuleInterface {
	return &moduleClient{
		restClient: c.restClient,
		ns:         namespace,
	}
}

func (c *CyclopsV1Alpha1Client) TemplateAuthRules(namespace string) TemplateAuthInterface {
	return &templateAuthClient{
		restClient: c.restClient,
		ns:         namespace,
	}
}

func (c *CyclopsV1Alpha1Client) TemplateStore(namespace string) TemplateStoreInterface {
	return &templateStoreClient{
		restClient: c.restClient,
		ns:         namespace,
	}
}
