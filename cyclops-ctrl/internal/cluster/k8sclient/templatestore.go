package k8sclient

import (
	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (k *KubernetesClient) ListTemplateStore() ([]cyclopsv1alpha1.TemplateStore, error) {
	return k.moduleset.TemplateStore(cyclopsNamespace).List(metav1.ListOptions{})
}

func (k *KubernetesClient) CreateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error {
	_, err := k.moduleset.TemplateStore(cyclopsNamespace).Create(ts)
	return err
}

func (k *KubernetesClient) UpdateTemplateStore(ts *cyclopsv1alpha1.TemplateStore) error {
	curr, err := k.moduleset.TemplateStore(cyclopsNamespace).Get(ts.Name)
	if err != nil {
		return err
	}

	ts.SetResourceVersion(curr.GetResourceVersion())

	_, err = k.moduleset.TemplateStore(cyclopsNamespace).Update(ts)
	return err
}

func (k *KubernetesClient) DeleteTemplateStore(name string) error {
	return k.moduleset.TemplateStore(cyclopsNamespace).Delete(name)
}
