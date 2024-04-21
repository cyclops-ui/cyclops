package client

import (
	"context"
	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/types"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/rest"
	"time"
)

type TemplateStoreInterface interface {
	List(opts metav1.ListOptions) ([]cyclopsv1alpha1.TemplateStore, error)
	Get(name string) (*cyclopsv1alpha1.TemplateStore, error)
	Create(*cyclopsv1alpha1.TemplateStore) (*cyclopsv1alpha1.TemplateStore, error)
	Update(*cyclopsv1alpha1.TemplateStore) (*cyclopsv1alpha1.TemplateStore, error)
	Watch(opts metav1.ListOptions) (watch.Interface, error)
	Delete(name string) error
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

func (c *templateStoreClient) Create(project *cyclopsv1alpha1.TemplateStore) (*cyclopsv1alpha1.TemplateStore, error) {
	result := cyclopsv1alpha1.TemplateStore{}
	err := c.restClient.
		Post().
		Namespace(c.ns).
		Resource("templatestores").
		Body(project).
		Do(context.Background()).
		Into(&result)

	return &result, err
}

func (c *templateStoreClient) Update(templateStore *cyclopsv1alpha1.TemplateStore) (project *cyclopsv1alpha1.TemplateStore, err error) {
	result := &cyclopsv1alpha1.TemplateStore{}
	err = c.restClient.Put().
		Namespace(c.ns).
		Resource("templatestores").
		Name(templateStore.Name).
		Body(templateStore).
		Do(context.TODO()).
		Into(result)
	return
}

func (c *templateStoreClient) Watch(opts metav1.ListOptions) (watch.Interface, error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	opts.Watch = true
	return c.restClient.Get().
		Namespace(c.ns).
		Resource("templatestores").
		Timeout(timeout).
		Watch(context.Background())
}

func (c *templateStoreClient) Delete(name string) error {
	return c.restClient.
		Delete().
		Namespace(c.ns).
		Resource("templatestores").
		Name(name).
		Do(context.Background()).
		Error()
}
