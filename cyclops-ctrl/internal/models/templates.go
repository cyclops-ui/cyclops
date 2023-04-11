package models

import "github.com/cyclops-ui/cycops-ctrl/internal/models/dto"

type Template struct {
	Name     string       `json:"name"`
	Manifest string       `json:"manifest"`
	Fields   []Field      `json:"fields"`
	Created  string       `json:"created"`
	Edited   string       `json:"edited"`
	Modules  []dto.Module `json:"modules"`
	Version  string       `json:"version"`
}

type Field struct {
	Name         string `json:"name"`
	Type         string `json:"type"`
	DisplayName  string `json:"display_name"`
	ManifestKey  string `json:"manifest_key"`
	InitialValue string `json:"initial_value"`
	Value        string `json:"value"`
}
