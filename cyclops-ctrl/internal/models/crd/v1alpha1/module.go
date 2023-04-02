package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type ModuleValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type TemplateRef struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type ModuleSpec struct {
	TemplateRef TemplateRef   `json:"template"`
	Values      []ModuleValue `json:"values"`
}

type Module struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec ModuleSpec `json:"spec"`
}

type ModuleList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Module `json:"items"`
}
