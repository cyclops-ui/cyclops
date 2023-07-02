package mapper

import (
	"sort"

	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/helm"
)

func HelmSchemaToFields(schema helm.Property) []models.Field {
	fields := make([]models.Field, 0, len(schema.Properties))

	for name, property := range schema.Properties {
		fields = append(fields, models.Field{
			Name:        name,
			Description: property.Description,
			Type:        mapHelmPropertyTypeToFieldType(property),
			DisplayName: name,
			ManifestKey: name,
			Properties:  HelmSchemaToFields(property),
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

func mapHelmPropertyTypeToFieldType(property helm.Property) string {
	switch property.Type {
	case "string":
		return "string"
	case "integer":
		return "number"
	case "boolean":
		return "boolean"
	case "object":
		if len(property.Properties) == 0 {
			return "map"
		}

		return "object"
	default:
		return property.Type
	}
}
