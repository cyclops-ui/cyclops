package v1alpha1

import (
	"context"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
)

type TemplateStoreInterface interface {
	List(opts metav1.ListOptions) ([]cyclopsv1alpha1.TemplateStore, error)
	Get(name string) (*cyclopsv1alpha1.TemplateStore, error)
}

type templateStoreClient struct {
	restClient rest.Interface
	ns         string
}

func (c *templateStoreClient) List(opts metav1.ListOptions) ([]cyclopsv1alpha1.TemplateStore, error) {
	result := cyclopsv1alpha1.TemplateStoreList{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("templatestores").
		Do(context.Background()).
		Into(&result)

	return result.Items, err
}

func (c *templateStoreClient) Get(name string) (*cyclopsv1alpha1.TemplateStore, error) {
	result := cyclopsv1alpha1.TemplateStore{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("templatestores").
		Name(name).
		Do(context.Background()).
		Into(&result)

	return &result, err
}
