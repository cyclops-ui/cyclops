package helm

type Property struct {
	Title         string              `json:"title"`
	Type          string              `json:"type"`
	Description   string              `json:"description"`
	Order         []string            `json:"order"`
	Properties    map[string]Property `json:"properties"`
	Items         *Property           `json:"items"`
	Enum          []string            `json:"enum"`
	Required      []string            `json:"required"`
	FileExtension string              `json:"fileExtension"`

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
}
