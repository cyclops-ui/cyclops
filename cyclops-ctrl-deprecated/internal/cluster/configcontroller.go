package cluster

import (
	clientset "gitops/internal/cluster/clientset/v1alpha1"
	"gitops/internal/cluster/v1alpha1"
	"gitops/internal/models"
	apiv1 "k8s.io/api/core/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/clientcmd"
)

type ConfigRepo struct {
	configClientset *clientset.ExampleV1Alpha1Client
}

func NewConfigRepo() (*ConfigRepo, error) {
	kubeconfig := "/Users/petarc/.kube/config"

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, err
	}

	clientset, err := clientset.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return &ConfigRepo{
		configClientset: clientset,
	}, nil
}

func (c *ConfigRepo) GetConfig(name string) (*models.ConfigSpec, error) {
	cyclopsConfig, err := c.configClientset.Configs(apiv1.NamespaceDefault).Get(name, v1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return toModelConfig(cyclopsConfig), err
}

func (c *ConfigRepo) PutConfig(config models.ConfigSpec) error {
	_, err := c.configClientset.Configs(apiv1.NamespaceDefault).Create(toK8sConfig(config))
	return err
}

func (c *ConfigRepo) ListConfigs() ([]*models.ConfigSpec, error) {
	configs, err := c.configClientset.Configs(apiv1.NamespaceDefault).List(v1.ListOptions{})
	if err != nil {
		return nil, err
	}

	configModels := make([]*models.ConfigSpec, 0, len(configs.Items))
	for _, c := range configs.Items {
		configModels = append(configModels, toModelConfig(&c))
	}

	return configModels, nil
}

func mapFields(fields []v1alpha1.Field) []models.Field {
	out := make([]models.Field, 0, len(fields))

	for _, field := range fields {
		out = append(out, models.Field{
			Name:         field.Name,
			Type:         field.Type,
			DisplayName:  field.DisplayName,
			ManifestKey:  field.ManifestKey,
			InitialValue: field.ManifestKey,
			Value:        field.Value,
		})
	}

	return out
}

func toModelConfig(config *v1alpha1.Config) *models.ConfigSpec {
	return &models.ConfigSpec{
		Name:     config.Name,
		Template: config.Spec.Template,
		Fields:   mapFields(config.Spec.Fields),
		Created:  config.Spec.Created,
		Edited:   config.Spec.Edited,
	}
}

func toK8sConfig(config models.ConfigSpec) *v1alpha1.Config {
	return &v1alpha1.Config{
		TypeMeta: v1.TypeMeta{},
		ObjectMeta: v1.ObjectMeta{
			Name: config.Name,
		},
		Spec: v1alpha1.ConfigSpec{
			Name:     config.Name,
			Template: config.Template,
			Fields:   mapToK8sFields(config.Fields),
			Created:  config.Created,
			Edited:   config.Edited,
		},
	}
}

func mapToK8sFields(fields []models.Field) []v1alpha1.Field {
	out := make([]v1alpha1.Field, 0, len(fields))

	for _, field := range fields {
		out = append(out, v1alpha1.Field{
			Name:         field.Name,
			Type:         field.Type,
			DisplayName:  field.DisplayName,
			ManifestKey:  field.ManifestKey,
			InitialValue: field.ManifestKey,
			Value:        field.Value,
		})
	}

	return out
}