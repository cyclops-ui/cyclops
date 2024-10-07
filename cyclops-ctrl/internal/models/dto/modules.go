package dto

type Module struct {
	Name                 string               `json:"name"`
	Namespace            string               `json:"namespace"`
	TargetNamespace      string               `json:"targetNamespace"`
	Template             Template             `json:"template"`
	Version              string               `json:"version"`
	Values               interface{}          `json:"values"`
	Status               string               `json:"status"`
	IconURL              string               `json:"iconURL"`
	ReconciliationStatus ReconciliationStatus `json:"reconciliationStatus"`
}

type ReconciliationStatusState string

const (
	Unknown   ReconciliationStatusState = "unknown"
	Succeeded ReconciliationStatusState = "succeeded"
	Failed    ReconciliationStatusState = "failed"
)

// ReconciliationStatus represents the status of the reconciliation process.
type ReconciliationStatus struct {
	Status ReconciliationStatusState `json:"status,omitempty"`
	Reason string                    `json:"reason,omitempty"`
	Errors []string                  `json:"errors,omitempty"`
}

type Template struct {
	URL             string `json:"repo" binding:"required"`
	Path            string `json:"path" binding:"required"`
	Version         string `json:"version"`
	ResolvedVersion string `json:"resolvedVersion"`
	SourceType      string `json:"sourceType"`
}

type TemplatesResponse struct {
	Current string `json:"current"`
	New     string `json:"new"`
}

type DeleteResource struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

func (d *DeleteResource) GetGroupVersionKind() string {
	return d.Group + "/" + d.Version + ", Kind=" + d.Kind
}

func (d *DeleteResource) GetGroup() string {
	return d.Group
}

func (d *DeleteResource) GetVersion() string {
	return d.Version
}

func (d *DeleteResource) GetKind() string {
	return d.Kind
}

func (d *DeleteResource) GetName() string {
	return d.Name
}

func (d *DeleteResource) GetNamespace() string {
	return d.Namespace
}

func (d *DeleteResource) GetDeleted() bool {
	return false
}

func (d *DeleteResource) SetDeleted(_ bool) {}

type KeyValue struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}
