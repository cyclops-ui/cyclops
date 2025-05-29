package template

import (
	"encoding/json"
	"fmt"
	"log"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
)

func (r Repo) GetTemplateCRDs(name string) (*models.Template, error) {
	crd, err := r.k8sClient.GetCRD(name)
	if err != nil {
		return nil, err
	}

	if crd.Spec.Versions[0].Schema == nil || crd.Spec.Versions[0].Schema.OpenAPIV3Schema == nil {
		log.Fatalf("CRD %s does not have an OpenAPI schema", name)
	}

	specSchema, exists := crd.Spec.Versions[0].Schema.OpenAPIV3Schema.Properties["spec"]
	if !exists {
		log.Fatalf("CRD %s does not have a spec definition in its schema", name)
	}

	schemaBytes, err := json.Marshal(specSchema)
	if err != nil {
		return nil, err
	}

	var schema helm.Property
	if err := json.Unmarshal(schemaBytes, &schema); err != nil {
		return &models.Template{}, err
	}

	template := &models.Template{
		Name:      name,
		RootField: mapper.HelmSchemaToFields("", schema, schema.Definitions, []*models.Template{}),
	}

	return template, err
}

func (r Repo) LoadInitialTemplateValuesCRD(name string) (map[string]interface{}, error) {
	crd, err := r.k8sClient.GetCRD(name)
	if err != nil {
		return nil, fmt.Errorf("failed to get CRD %s: %v", name, err)
	}

	if crd.Spec.Versions[0].Schema == nil || crd.Spec.Versions[0].Schema.OpenAPIV3Schema == nil {
		return nil, fmt.Errorf("CRD %s does not have an OpenAPI schema", name)
	}

	specSchema, exists := crd.Spec.Versions[0].Schema.OpenAPIV3Schema.Properties["spec"]
	if !exists {
		return nil, fmt.Errorf("CRD %s does not have a spec definition", name)
	}

	return generateDefaults(specSchema), nil
}

func generateDefaults(schema apiextensionsv1.JSONSchemaProps) map[string]interface{} {
	result := make(map[string]interface{})

	for key, prop := range schema.Properties {
		if prop.Default != nil {
			result[key] = prop.Default
			continue
		}

		switch prop.Type {
		case "string":
			result[key] = ""
		case "integer":
			result[key] = 0
		case "number":
			result[key] = 0.0
		case "boolean":
			result[key] = false
		case "array":
			result[key] = []interface{}{}
		case "object":
			result[key] = generateDefaults(prop)
		default:
			result[key] = nil
		}
	}

	return result
}
