package mapper

import (
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
)

func HelmSchemaToFields(schema helm.Schema) []models.Field {
	fields := make([]models.Field, 0, len(schema.Properties))

	for name, property := range schema.Properties {
		fields = append(fields, models.Field{
			Name:        name,
			Type:        mapHelmPropertyTypeToFieldType(property.Type),
			DisplayName: name,
			ManifestKey: name,
		})
	}

	return fields
}

func mapHelmPropertyTypeToFieldType(helmType string) string {
	switch helmType {
	case "string":
		return "string"
	case "integer":
		return "number"
	default:
		return "string"
	}
}
