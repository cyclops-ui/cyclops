package client

import (
	"context"
	"time"

	json "github.com/json-iterator/go"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/rest"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
)

type ModuleInterface interface {
	List(opts metav1.ListOptions) ([]cyclopsv1alpha1.Module, error)
	Get(name string) (*cyclopsv1alpha1.Module, error)
	Create(*cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error)
	Update(*cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error)
	Watch(opts metav1.ListOptions) (watch.Interface, error)
	Delete(name string) error
	PatchStatus(module *cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error)
}

type moduleClient struct {
	restClient rest.Interface
	ns         string
}

func (c *moduleClient) List(opts metav1.ListOptions) ([]cyclopsv1alpha1.Module, error) {
	result := cyclopsv1alpha1.ModuleList{}
	err := c.restClient.
		Get().
		Resource("modules").
		Do(context.Background()).
		Into(&result)

	return result.Items, err
}

func (c *moduleClient) Get(name string) (*cyclopsv1alpha1.Module, error) {
	result := cyclopsv1alpha1.Module{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("modules").
		Name(name).
		Do(context.Background()).
		Into(&result)

	return &result, err
}

func (c *moduleClient) Create(project *cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error) {
	result := cyclopsv1alpha1.Module{}

	err := c.restClient.
		Post().
		Namespace(c.ns).
		Resource("modules").
		Body(project).
		Do(context.Background()).
		Into(&result)

	return &result, err
}

func (c *moduleClient) Update(module *cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error) {
	result := &cyclopsv1alpha1.Module{}
	err := c.restClient.Put().
		Namespace(c.ns).
		Resource("modules").
		Name(module.Name).
		Body(module).
		Do(context.TODO()).
		Into(result)

	return result, err
}

func (c *moduleClient) Watch(opts metav1.ListOptions) (watch.Interface, error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	opts.Watch = true
	return c.restClient.Get().
		Namespace(c.ns).
		Resource("modules").
		Timeout(timeout).
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

func (c *moduleClient) PatchStatus(module *cyclopsv1alpha1.Module) (*cyclopsv1alpha1.Module, error) {
	result := &cyclopsv1alpha1.Module{}

	patchData := map[string]interface{}{
		"status": module.Status,
	}
	patchBytes, err := json.Marshal(patchData)
	if err != nil {
		return nil, err
	}

	err = c.restClient.Patch(types.MergePatchType).
		Namespace(c.ns).
		Resource("modules").
		Name(module.Name).
		SubResource("status").
		Body(patchBytes).
		Do(context.TODO()).
		Into(result)

	return result, err
}
