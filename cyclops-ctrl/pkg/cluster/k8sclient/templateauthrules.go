package k8sclient

import (
	"context"

	"github.com/pkg/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
)

func (k *KubernetesClient) ListTemplateAuthRules() ([]cyclopsv1alpha1.TemplateAuthRule, error) {
	return k.moduleset.TemplateAuthRules(k.moduleNamespace).List(metav1.ListOptions{})
}

func (k *KubernetesClient) GetTemplateAuthRuleSecret(name, key string) ([]byte, error) {
	secret, err := k.clientset.CoreV1().Secrets(k.moduleNamespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	secretValue, ok := secret.Data[key]
	if !ok {
		return nil, errors.New("key not found")
	}

	return secretValue, err
}
