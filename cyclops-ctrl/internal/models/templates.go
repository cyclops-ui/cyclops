package models

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
	"helm.sh/helm/v3/pkg/chart"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

type Template struct {
	Name            string       `json:"name"`
	Manifest        string       `json:"manifest"`
	RootField       Field        `json:"root"`
	Created         string       `json:"created"`
	Edited          string       `json:"edited"`
	Modules         []dto.Module `json:"modules"`
	Version         string       `json:"version"`
	ResolvedVersion string       `json:"resolvedVersion"`
	IconURL         string       `json:"iconURL"`

	HelmChartMetadata *helm.Metadata `json:"helmChartMetadata"`
	RawSchema         []byte         `json:"rawSchema"`

	Files     []*chart.File `json:"files"`
	Templates []*chart.File `json:"templates"`
	CRDs      []*chart.File `json:"crds"`

	Dependencies []*Template `json:"dependencies"`
	Condition    string      `json:"condition"`
}

type Field struct {
	Name          string        `json:"name"`
	Description   string        `json:"description"`
	Type          string        `json:"type"`
	DisplayName   string        `json:"display_name"`
	ManifestKey   string        `json:"manifest_key"`
	Value         string        `json:"value"`
	Properties    []Field       `json:"properties"`
	Items         *Field        `json:"items"`
	Enum          []interface{} `json:"enum"`
	Suggestions   []interface{} `json:"x-suggestions"`
	Required      []string      `json:"required"`
	FileExtension string        `json:"fileExtension"`
	Immutable     bool          `json:"immutable"`

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
