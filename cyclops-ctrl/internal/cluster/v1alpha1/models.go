package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type Config struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec ConfigSpec `json:"spec" yaml:"spec"`
}

type ConfigSpec struct {
	Name     string  `json:"name" yaml:"name"`
	Template string  `json:"template" yaml:"template"`
	Fields   []Field `json:"fields" yaml:"fields"`
	Created  string  `json:"created" yaml:"created"`
	Edited   string  `json:"edited" yaml:"edited"`
}

type Field struct {
	Name         string `json:"name" yaml:"name"`
	Type         string `json:"type" yaml:"type"`
	DisplayName  string `json:"display_name" yaml:"display_name"`
	ManifestKey  string `json:"manifest_key" yaml:"manifest_key"`
	InitialValue string `json:"initial_value" yaml:"initial_value"`
	Value        string `json:"value" yaml:"value"`
}

type ConfigList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`

	Items []Config `json:"items"`
}
