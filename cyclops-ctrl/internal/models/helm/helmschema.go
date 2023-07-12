package helm

type Property struct {
	Type        string              `json:"type"`
	Description string              `json:"description"`
	Order       []string            `json:"order"`
	Properties  map[string]Property `json:"properties"`
	Items       *Property           `json:"items"`
}
