package models

type HelmRelease struct {
	Name           string                 `json:"name"`
	Namespace      string                 `json:"namespace"`
	Chart          string                 `json:"chart"`
	Version        string                 `json:"version"`
	Revision       string                 `json:"revision"`
	Values         map[string]interface{} `json:"values"`
	Sources        []*TemplateSource      `json:"sources"`
	ContainsSchema bool                   `json:"containsSchema"`
}

type TemplateSource struct {
	URL     string `json:"repo"`
	Path    string `json:"path"`
	Version string `json:"version"`
	Full    string `json:"full"`
}

type HelmReleaseSchema struct {
	RootField Field `json:"root"`
}
