package helm

type Schema struct {
	Title      string              `json:"title"`
	Properties map[string]Property `json:"properties"`
	Order      []string            `json:"order"`
}

type Property struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}
