package k8sclient

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
)

func (k *KubernetesClient) GetTemplateStore(name string) (*cyclopsv1alpha1.TemplateStore, error) {
	return k.moduleset.TemplateStore(k.moduleNamespace).Get(name)
}

func (k *KubernetesClient) ListTemplateStore() ([]cyclopsv1alpha1.TemplateStore, error) {
	return k.moduleset.TemplateStore(k.moduleNamespace).List(metav1.ListOptions{})
}

func (k *KubernetesClient) CreateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error {
	_, err := k.moduleset.TemplateStore(k.moduleNamespace).Create(ts)
	return err
}

func (k *KubernetesClient) UpdateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error {
	curr, err := k.moduleset.TemplateStore(k.moduleNamespace).Get(ts.Name)
	if err != nil {
		return err
	}

	ts.SetResourceVersion(curr.GetResourceVersion())

	_, err = k.moduleset.TemplateStore(k.moduleNamespace).Update(ts)
	return err
}

func (k *KubernetesClient) DeleteTemplateStore(name string) error {
	return k.moduleset.TemplateStore(k.moduleNamespace).Delete(name)
}
