package v1alpha1

import (
	"context"
	"gitops/internal/cluster/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
)

type ConfigInterface interface {
	List(opts metav1.ListOptions) (*v1alpha1.ConfigList, error)
	Get(name string, options metav1.GetOptions) (*v1alpha1.Config, error)
	Create(config *v1alpha1.Config) (*v1alpha1.Config, error)
	Watch(opts metav1.ListOptions) (watch.Interface, error)
}

type configClient struct {
	restClient rest.Interface
	ns         string
}

func (c *configClient) List(opts metav1.ListOptions) (*v1alpha1.ConfigList, error) {
	result := v1alpha1.ConfigList{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("configs").
		Do(context.TODO()).
		Into(&result)

	return &result, err
}

func (c *configClient) Get(name string, opts metav1.GetOptions) (*v1alpha1.Config, error) {
	result := v1alpha1.Config{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("configs").
		Name(name).
		Do(context.TODO()).
		Into(&result)

	return &result, err
}

func (c *configClient) Create(config *v1alpha1.Config) (*v1alpha1.Config, error) {
	result := v1alpha1.Config{}
	err := c.restClient.
		Post().
		Namespace(c.ns).
		Resource("configs").
		Body(config).
		Do(context.TODO()).
		Into(&result)

	return &result, err
}

func (c *configClient) Watch(opts metav1.ListOptions) (watch.Interface, error) {
	opts.Watch = true
	return c.restClient.
		Get().
		Namespace(c.ns).
		Resource("configs").
		VersionedParams(&opts, scheme.ParameterCodec).
		Watch(context.TODO())
}