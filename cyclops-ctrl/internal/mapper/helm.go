package mapper

import (
	"sort"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
)

func HelmSchemaToFields(name string, schema helm.Property, dependencies []*models.Template) models.Field {
	if schema.Type == "array" {
		return models.Field{
			Name:        name,
			Description: schema.Description,
			Type:        mapHelmPropertyTypeToFieldType(schema),
			DisplayName: mapTitle(name, schema),
			Items:       arrayItem(schema.Items),
		}
	}

	fields := make([]models.Field, 0, len(schema.Properties))
	for propertyName, property := range schema.Properties {
		fields = append(fields, HelmSchemaToFields(propertyName, property, nil))
	}

	fields = sortFields(fields, schema.Order)

	for _, dependency := range dependencies {
		fields = append(fields, models.Field{
			Name:             dependency.Name,
			Description:      dependency.RootField.Description,
			Type:             dependency.RootField.Type,
			DisplayName:      dependency.RootField.DisplayName,
			ManifestKey:      dependency.RootField.ManifestKey,
			Value:            dependency.RootField.Value,
			Properties:       dependency.RootField.Properties,
			Items:            dependency.RootField.Items,
			Enum:             dependency.RootField.Enum,
			Required:         dependency.RootField.Required,
			FileExtension:    dependency.RootField.FileExtension,
			Minimum:          dependency.RootField.Minimum,
			Maximum:          dependency.RootField.Maximum,
			MultipleOf:       dependency.RootField.MultipleOf,
			ExclusiveMinimum: dependency.RootField.ExclusiveMinimum,
			ExclusiveMaximum: dependency.RootField.ExclusiveMaximum,
			MinLength:        dependency.RootField.MinLength,
			MaxLength:        dependency.RootField.MaxLength,
			Pattern:          dependency.RootField.Pattern,
		})
	}

	return models.Field{
		Name:             name,
		Description:      schema.Description,
		Type:             mapHelmPropertyTypeToFieldType(schema),
		DisplayName:      mapTitle(name, schema),
		ManifestKey:      name,
		Properties:       fields,
		Enum:             schema.Enum,
		Required:         schema.Required,
		FileExtension:    schema.FileExtension,
		Minimum:          schema.Minimum,
		Maximum:          schema.Maximum,
		ExclusiveMinimum: schema.ExclusiveMinimum,
		ExclusiveMaximum: schema.ExclusiveMaximum,
		MultipleOf:       schema.MultipleOf,
		MinLength:        schema.MinLength,
		MaxLength:        schema.MaxLength,
		Pattern:          schema.Pattern,
	}
}

func sortFields(fields []models.Field, order []string) []models.Field {
    // Create a map to store the custom order indices
    ordersMap := make(map[string]int)
    for i, name := range order {
        ordersMap[name] = i
    }

    // Separate fields with order and without order
    var orderedFields []models.Field
    var unorderedFields []models.Field

    for _, field := range fields {
        if _, ok := ordersMap[field.Name]; ok {
            orderedFields = append(orderedFields, field)
        } else {
            unorderedFields = append(unorderedFields, field)
        }
    }

    // Sort fields with order based on the order index
    sort.Slice(orderedFields, func(i, j int) bool {
        return ordersMap[orderedFields[i].Name] < ordersMap[orderedFields[j].Name]
    })

    // Sort fields without order alphabetically by name
    sort.Slice(unorderedFields, func(i, j int) bool {
        return unorderedFields[i].Name < unorderedFields[j].Name
    })

    // Combine the ordered and unordered fields
    sortedFields := append(orderedFields, unorderedFields...)

    return sortedFields
}



func mapHelmPropertyTypeToFieldType(property helm.Property) string {
	switch property.Type {
	case "string":
		return "string"
	case "integer":
		return "number"
	case "boolean":
		return "boolean"
	case "array":
		return "array"
	case "object":
		if len(property.Properties) == 0 {
			return "map"
		}

		return "object"
	default:
		return property.Type
	}
}

func arrayItem(item *helm.Property) *models.Field {
	if item == nil {
		return nil
	}

	field := HelmSchemaToFields("", *item, nil)
	return &field
}

func arrayRequired(item *helm.Property) []string {
	if item == nil {
		return nil
	}

	return item.Required
}

func mapTitle(name string, field helm.Property) string {
	if len(field.Title) != 0 {
		return field.Title
	}

	return name
}
