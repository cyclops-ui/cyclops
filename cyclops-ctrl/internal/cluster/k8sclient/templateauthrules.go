package k8sclient

import (
	"context"
	cyclopsv1alpha1 "github.com/cyclops-ui/cycops/cycops-ctrl/api/v1alpha1"
	"github.com/pkg/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (k *KubernetesClient) ListTemplateAuthRules() ([]cyclopsv1alpha1.TemplateAuthRule, error) {
	return k.moduleset.TemplateAuthRules(cyclopsNamespace).List(metav1.ListOptions{})
}

func (k *KubernetesClient) GetTemplateAuthRuleSecret(name, key string) (string, error) {
	secret, err := k.clientset.CoreV1().Secrets(cyclopsNamespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return "", err
	}

	secretValue, ok := secret.Data[key]
	if !ok {
		return "", errors.New("key not found")
	}

	return string(secretValue), err
}
