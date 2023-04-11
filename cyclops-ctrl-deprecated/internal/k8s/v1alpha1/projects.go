package v1alpha1

import (
	"context"
	"gitops/internal/models/crd/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/rest"
)

type ModuleInterface interface {
	List(opts metav1.ListOptions) ([]v1alpha1.Module, error)
	Get(name string) (*v1alpha1.Module, error)
	Create(*v1alpha1.Module) (*v1alpha1.Module, error)
	Watch(opts metav1.ListOptions) (watch.Interface, error)
	Delete(name string) error
	// ...
}

type moduleClient struct {
	restClient rest.Interface
	ns         string
}

func (c *moduleClient) List(opts metav1.ListOptions) ([]v1alpha1.Module, error) {
	result := v1alpha1.ModuleList{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("modules").
		Do(context.Background()).
		Into(&result)

	return result.Items, err
}

func (c *moduleClient) Get(name string) (*v1alpha1.Module, error) {
	result := v1alpha1.Module{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("modules").
		Name(name).
		Do(context.Background()).
		Into(&result)

	return &result, err
}

func (c *moduleClient) Create(project *v1alpha1.Module) (*v1alpha1.Module, error) {
	result := v1alpha1.Module{}
	err := c.restClient.
		Post().
		Namespace(c.ns).
		Resource("modules").
		Body(project).
		Do(context.Background()).
		Into(&result)

	return &result, err
}

func (c *moduleClient) Watch(opts metav1.ListOptions) (watch.Interface, error) {
	opts.Watch = true
	return c.restClient.
		Get().
		Namespace(c.ns).
		Resource("modules").
		Watch(context.Background())
}

func (c *moduleClient) Delete(name string) error {
	return c.restClient.
		Delete().
		Namespace(c.ns).
		Resource("modules").
		Name(name).
		Do(context.Background()).
		Error()
}
