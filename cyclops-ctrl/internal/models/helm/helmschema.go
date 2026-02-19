package helm

import (
	"fmt"

	json "github.com/json-iterator/go"
)

// RawJSON captures any JSON value (object, boolean, string, etc.) without
// failing on type mismatches.
type RawJSON []byte

func (r *RawJSON) UnmarshalJSON(data []byte) error {
	if data == nil {
		return nil
	}
	*r = append((*r)[0:0], data...)
	return nil
}

func (r RawJSON) MarshalJSON() ([]byte, error) {
	if r == nil {
		return []byte("null"), nil
	}
	return r, nil
}

type Property struct {
	Title                string              `json:"title"`
	Type                 PropertyType        `json:"type"`
	Description          string              `json:"description"`
	Order                []string            `json:"order"`
	Properties           map[string]Property `json:"properties"`
	AdditionalProperties RawJSON             `json:"additionalProperties,omitempty"`
	Items                *Property           `json:"items"`
	Enum                 []interface{}       `json:"enum"`
	Suggestions          []interface{}       `json:"x-suggestions"`
	Required             []string            `json:"required"`
	FileExtension        string              `json:"fileExtension"`
	Reference            string              `json:"$ref"`
	Definitions          map[string]Property `json:"$defs"`
	Immutable            bool                `json:"immutable"`

	// number validation
	Minimum          *float64 `json:"minimum"`
	Maximum          *float64 `json:"maximum"`
	ExclusiveMinimum *bool    `json:"exclusiveMinimum"`
	ExclusiveMaximum *bool    `json:"exclusiveMaximum"`
	MultipleOf       *float64 `json:"multipleOf"`

	// string validation
	MinLength *int    `json:"minLength"`
	MaxLength *int    `json:"maxLength"`
	Pattern   *string `json:"pattern"`

	// schema compositions
	AnyOf []Property `json:"anyOf"`
}

// GetAdditionalProperties attempts to parse additionalProperties as a schema
// object. Returns nil when the value is absent, a boolean, or otherwise not a
// valid Property (e.g. additionalProperties: false).
func (p Property) GetAdditionalProperties() *Property {
	if len(p.AdditionalProperties) == 0 {
		return nil
	}
	var prop Property
	if err := json.Unmarshal(p.AdditionalProperties, &prop); err != nil {
		return nil
	}
	if len(prop.Type) == 0 && len(prop.Properties) == 0 {
		return nil
	}
	return &prop
}

type PropertyType string

func (t *PropertyType) UnmarshalJSON(data []byte) error {
	// Try to unmarshal as a single string
	var singleString string
	if err := json.Unmarshal(data, &singleString); err == nil {
		*t = PropertyType(singleString)
		return nil
	}

	// Try to unmarshal as a list of strings
	var stringList []string
	if err := json.Unmarshal(data, &stringList); err != nil {
		return fmt.Errorf("data is neither a single string nor a list of strings")
	}

	unique := make(map[string]struct{})
	for _, s := range stringList {
		unique[s] = struct{}{}
	}

	delete(unique, "null")

	if len(unique) == 1 {
		for s := range unique {
			*t = PropertyType(s)
			return nil
		}
	}

	delete(unique, "string")

	if len(unique) == 1 {
		for s := range unique {
			*t = PropertyType(s)
			return nil
		}
	}

	if _, ok := unique["object"]; ok {
		*t = "object"
		return nil
	}

	return fmt.Errorf("cant resolve %v", string(data))
}

func (p Property) HasRef() bool {
	return len(p.Reference) > 0
}
