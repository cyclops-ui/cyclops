package models

type DeployRequest struct {
	ChangeTitle string `json:"change_title"`

	AppName              string                `json:"app_name" binding:"required"`
	Replicas             int                   `json:"replicas" binding:"required"`
	ImageName            string                `json:"image_name" binding:"required"`
	Namespace            string                `json:"namespace" binding:"required"`
	Kind                 string                `json:"kind" binding:"required"`
	Labels               []Label               `json:"labels"`
	EnvironmentVariables []EnvironmentVariable `json:"environment_variables"`

	NeedsService    bool   `json:"needs_service"`
	ServiceName     string `json:"service_name"`
	ServiceLabel    string `json:"service_label"`
	Port            int    `json:"port"`
	Protocol        string `json:"protocol"`
	TargetPort      int    `json:"target_port"`
	ServiceSelector string `json:"service_selector"`
}

type Label struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

type EnvironmentVariable struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type DeployWithManifestRequest struct {
	AppName string `json:"app_name" binding:"required"`

	ChangeTitle string `json:"change_title"`

	Manifest         string `json:"manifest" binding:"required"`
	PreviousManifest string `json:"previous_manifest"`
}

type DeleteRequest struct {
	Name      string `json:"name" binding:"required"`
	Kind      string `json:"kind" binding:"required"`
	Namespace string `json:"namespace" binding:"required"`
}

type PreviewResponse struct {
	Manifest string `json:"manifest"`
}

type RescaleRequest struct {
	Name            string `json:"name"`
	Namespace       string `json:"namespace"`
	DesiredReplicas int32  `json:"desired_replicas"`
}

type ConfigurableRequest struct {
	Fields      map[string]interface{} `json:"fields"`
	Manifest    string                 `json:"manifest"`
	ChangeTitle string                 `json:"change_title"`
	ConfigName  string                 `json:"config_name"`
}
