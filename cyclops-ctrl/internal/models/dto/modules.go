package dto

type Module struct {
	Name      string                 `json:"name"`
	Namespace string                 `json:"namespace"`
	Template  Template               `json:"template"`
	Version   string                 `json:"version"`
	Values    map[string]interface{} `json:"values"`
}

type Template struct {
	Name    string         `json:"name"`
	Version string         `json:"version"`
	GitRef  TemplateGitRef `json:"git"`
}

type TemplateGitRef struct {
	Repo string `json:"repo"`
	Path string `json:"path"`
}

type TemplatesResponse struct {
	Current string `json:"current"`
	New     string `json:"new"`
}
