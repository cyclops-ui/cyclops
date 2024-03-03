package v1alpha1

import (
	"context"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/rest"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
)

type TemplateAuthInterface interface {
	List(opts metav1.ListOptions) ([]cyclopsv1alpha1.TemplateAuthRule, error)
	Get(name string) (*cyclopsv1alpha1.TemplateAuthRule, error)
	Create(*cyclopsv1alpha1.TemplateAuthRule) (*cyclopsv1alpha1.TemplateAuthRule, error)
	Update(*cyclopsv1alpha1.TemplateAuthRule) (*cyclopsv1alpha1.TemplateAuthRule, error)
	Watch(opts metav1.ListOptions) (watch.Interface, error)
	Delete(name string) error
}

type templateAuthClient struct {
	restClient rest.Interface
	ns         string
}

func (c *templateAuthClient) List(opts metav1.ListOptions) ([]cyclopsv1alpha1.TemplateAuthRule, error) {
	result := cyclopsv1alpha1.TemplateAuthRuleList{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("templateauthrules").
		Do(context.Background()).
		Into(&result)

	return result.Items, err
}

func (c *templateAuthClient) Get(name string) (*cyclopsv1alpha1.TemplateAuthRule, error) {
	result := cyclopsv1alpha1.TemplateAuthRule{}
	err := c.restClient.
		Get().
		Namespace(c.ns).
		Resource("templateauthrules").
		Name(name).
		Do(context.Background()).
		Into(&result)

	return &result, err
}

func (c *templateAuthClient) Create(project *cyclopsv1alpha1.TemplateAuthRule) (*cyclopsv1alpha1.TemplateAuthRule, error) {
	result := cyclopsv1alpha1.TemplateAuthRule{}
	err := c.restClient.
		Post().
		Namespace(c.ns).
		Resource("templateauthrules").
		Body(project).
		Do(context.Background()).
		Into(&result)

	return &result, err
}

func (c *templateAuthClient) Update(ta *cyclopsv1alpha1.TemplateAuthRule) (project *cyclopsv1alpha1.TemplateAuthRule, err error) {
	result := &cyclopsv1alpha1.TemplateAuthRule{}
	err = c.restClient.Put().
		Namespace(c.ns).
		Resource("templateauthrules").
		Name(ta.Name).
		Body(ta).
		Do(context.TODO()).
		Into(result)
	return
}

func (c *templateAuthClient) Watch(opts metav1.ListOptions) (watch.Interface, error) {
	var timeout time.Duration
	if opts.TimeoutSeconds != nil {
		timeout = time.Duration(*opts.TimeoutSeconds) * time.Second
	}
	opts.Watch = true
	return c.restClient.Get().
		Namespace(c.ns).
		Resource("templateauthrules").
		Timeout(timeout).
		Watch(context.Background())
}

func (c *templateAuthClient) Delete(name string) error {
	return c.restClient.
		Delete().
		Namespace(c.ns).
		Resource("templateauthrules").
		Name(name).
		Do(context.Background()).
		Error()
}
