package dto

type Module struct {
	Name      string                 `json:"name"`
	Namespace string                 `json:"namespace"`
	Template  string                 `json:"template"`
	Version   string                 `json:"version"`
	Values    map[string]interface{} `json:"values"`
}

type TemplatesResponse struct {
	Current string `json:"current"`
	New     string `json:"new"`
}
