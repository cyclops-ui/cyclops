package mapper

import (
	"sort"
	"strings"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
)

func HelmSchemaToFields(name string, schema helm.Property, defs map[string]helm.Property, dependencies []*models.Template) models.Field {
	if schema.Type == "array" {
		return models.Field{
			Name:        name,
			Description: schema.Description,
			Type:        mapHelmPropertyTypeToFieldType(schema),
			DisplayName: mapTitle(name, schema.Title),
			Items:       arrayItem(schema.Items, defs),
			Immutable:   schema.Immutable,
		}
	}

	uniqueFieldNames := make(map[string]struct{})
	fields := make([]models.Field, 0, len(schema.Properties))
	for propertyName, property := range schema.Properties {
		uniqueFieldNames[propertyName] = struct{}{}

		if property.HasRef() {
			key := strings.TrimPrefix(property.Reference, "#/$defs/")

			fields = append(fields, HelmSchemaToFields(
				propertyName,
				resolveJSONSchemaRef(defs, strings.Split(key, "/")),
				defs,
				nil,
			))
			continue
		}

		fields = append(fields, HelmSchemaToFields(propertyName, property, defs, nil))
	}

	fields = sortFields(fields, schema.Order)

	for _, dependency := range dependencies {
		// if the dependency schema is already present in the root schema, skip using schema from dependency
		if _, ok := uniqueFieldNames[dependency.Name]; ok {
			continue
		}

		if dependency.RootField.Type != "object" {
			continue
		}

		fields = append(fields, models.Field{
			Name:             dependency.Name,
			Description:      dependency.RootField.Description,
			Type:             dependency.RootField.Type,
			DisplayName:      mapTitle(dependency.Name, dependency.RootField.DisplayName),
			ManifestKey:      dependency.RootField.ManifestKey,
			Value:            dependency.RootField.Value,
			Properties:       dependency.RootField.Properties,
			Items:            dependency.RootField.Items,
			Enum:             dependency.RootField.Enum,
			Suggestions:      dependency.RootField.Suggestions,
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
			Immutable:        dependency.RootField.Immutable,
		})
	}

	return models.Field{
		Name:             name,
		Description:      schema.Description,
		Type:             mapHelmPropertyTypeToFieldType(schema),
		DisplayName:      mapTitle(name, schema.Title),
		ManifestKey:      name,
		Properties:       fields,
		Enum:             schema.Enum,
		Suggestions:      schema.Suggestions,
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
		Immutable:        schema.Immutable,
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
		if len(property.Properties) > 0 {
			return "object"
		}

		if property.Items != nil {
			return "array"
		}

		return string(property.Type)
	}
}

func arrayItem(item *helm.Property, defs map[string]helm.Property) *models.Field {
	if item == nil {
		return nil
	}

	if len(item.Type) == 0 {
		return &models.Field{
			Type: "string",
		}
	}

	field := HelmSchemaToFields("", *item, defs, nil)
	return &field
}

func arrayRequired(item *helm.Property) []string {
	if item == nil {
		return nil
	}

	return item.Required
}

func mapTitle(name, displayName string) string {
	if len(displayName) != 0 {
		return displayName
	}

	return name
}

func resolveJSONSchemaRef(defs map[string]helm.Property, ref []string) helm.Property {
	if len(ref) == 0 {
		return helm.Property{}
	}

	def, ok := defs[ref[0]]
	if !ok {
		return helm.Property{}
	}

	if len(ref) == 1 {
		return def
	}

	return resolveJSONSchemaRef(def.Properties, ref[1:])
}
