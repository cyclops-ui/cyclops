package mapper

import (
	"sort"

	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
)

func HelmSchemaToFields(schema helm.Schema) []models.Field {
	fields := make([]models.Field, 0, len(schema.Properties))

	for name, property := range schema.Properties {
		fields = append(fields, models.Field{
			Name:        name,
			Description: property.Description,
			Type:        mapHelmPropertyTypeToFieldType(property.Type),
			DisplayName: name,
			ManifestKey: name,
		})
	}

	return sortFields(fields, schema.Order)
}

func sortFields(fields []models.Field, order []string) []models.Field {
	ordersMap := make(map[string]int)

	for i, s := range order {
		ordersMap[s] = i
	}

	sort.Slice(fields, func(i, j int) bool {
		return ordersMap[fields[i].Name] < ordersMap[fields[j].Name]
	})

	return fields
}

func mapHelmPropertyTypeToFieldType(helmType string) string {
	switch helmType {
	case "string":
		return "string"
	case "integer":
		return "number"
	case "boolean":
		return "boolean"
	default:
		return "string"
	}
}
