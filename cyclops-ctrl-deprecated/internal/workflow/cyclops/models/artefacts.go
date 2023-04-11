package models

type DeploymentPreview struct {
	AppName   string `json:"app_name"`
	Replicas  int    `json:"replicas"`
	Namespace string `json:"namespace"`
	ImageName string `json:"image_name"`
	Kind      string `json:"kind"`
	Healthy   bool   `json:"healthy"`
	Manifest  string `json:"manifest"`
}

type NamespaceResponse struct {
	Namespaces []*Namespace `json:"namespaces"`
}

type Namespace struct {
	Name string `json:"name"`
}

type Deployment struct {
	AppName              string                `json:"app_name"`
	Replicas             int                   `json:"replicas"`
	Namespace            string                `json:"namespace"`
	ImageName            string                `json:"image_name"`
	Kind                 string                `json:"kind"`
	Age                  string                `json:"age"`
	Restarts             int64                 `json:"restarts"`
	Healthy              bool                  `json:"healthy"`
	Labels               []Label               `json:"labels"`
	EnvironmentVariables []EnvironmentVariable `json:"environment_variables"`
	Pods                 []*Pod                `json:"pods"`
}

type Pod struct {
	Name         string  `json:"name"`
	NodeName     string  `json:"node_name"`
	Containers   string  `json:"containers"`
	Memory       int     `json:"memory"`
	CPU          int64   `json:"cpu"`
	Healthy      bool    `json:"healthy"`
	Status       string  `json:"status"`
	Age          string  `json:"age"`
	Labels       []Label `json:"labels"`
	CyclopsFleet string  `json:"cyclops_fleet"`
}

type DeploymentFields struct {
	CurrentVersion string                 `json:"current_version"`
	Configuration  AppConfiguration       `json:"configuration"`
	Fields         map[string]interface{} `json:"fields"`
}

type Cmd struct {
	Command string `json:"command"`
}
