package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type ModuleValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type TemplateRef struct {
	Name           string         `json:"name"`
	Version        string         `json:"version"`
	TemplateGitRef TemplateGitRef `json:"git"`
}

type TemplateGitRef struct {
	Repo string `json:"repo"`
	Path string `json:"path"`
}

type ModuleSpec struct {
	TemplateRef TemplateRef   `json:"template"`
	Values      []ModuleValue `json:"values"`
}

type Resource struct {
	Group     string `json:"group,omitempty" protobuf:"bytes,1,opt,name=group"`
	Version   string `json:"version,omitempty" protobuf:"bytes,2,opt,name=version"`
	Kind      string `json:"kind,omitempty" protobuf:"bytes,3,opt,name=kind"`
	Namespace string `json:"namespace,omitempty" protobuf:"bytes,4,opt,name=namespace"`
	Name      string `json:"name,omitempty" protobuf:"bytes,5,opt,name=name"`
	Status    string `json:"status,omitempty" protobuf:"bytes,6,opt,name=status"`
	Health    string `json:"health,omitempty" protobuf:"bytes,7,opt,name=health"`
}

type ModuleStatus struct {
	Resources  []Resource         `json:"resources,omitempty"`
	Conditions []metav1.Condition `json:"conditions,omitempty" patchStrategy:"merge" patchMergeKey:"type" protobuf:"bytes,1,rep,name=conditions"`
}

type Module struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ModuleSpec   `json:"spec"`
	Status ModuleStatus `json:"status,omitempty"`
}

type ModuleList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Module `json:"items"`
}
