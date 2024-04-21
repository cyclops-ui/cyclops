/*
Copyright 2023.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1alpha1

import (
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// ModuleSpec defines the desired state of Module
type ModuleSpec struct {
	// INSERT ADDITIONAL SPEC FIELDS - desired state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	TemplateRef TemplateRef          `json:"template"`
	Values      apiextensionsv1.JSON `json:"values"`
}

type ModuleValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type TemplateRef struct {
	URL     string `json:"repo"`
	Path    string `json:"path"`
	Version string `json:"version"`
}

type TemplateGitRef struct {
	Repo   string `json:"repo"`
	Path   string `json:"path"`
	Commit string `json:"commit"`
}

type ReconciliationStatusState string

const (
	Unknown   ReconciliationStatusState = "unknown"
	Succeeded ReconciliationStatusState = "succeeded"
	Failed    ReconciliationStatusState = "failed"
)

type ReconciliationStatus struct {
	// +kubebuilder:validation:Enum=unknown;succeeded;failed
	// +kubebuilder:default:=unknown
	Status ReconciliationStatusState `json:"status"`
	Reason string                    `json:"reason"`
}

// ModuleStatus defines the observed state of Module
type ModuleStatus struct {
	ReconciliationStatus ReconciliationStatus `json:"reconciliationStatus"`
}

type HistoryEntry struct {
	Generation  int64                `json:"generation"`
	TemplateRef TemplateRef          `json:"template"`
	Values      apiextensionsv1.JSON `json:"values"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status

// Module is the Schema for the modules API
type Module struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec    ModuleSpec     `json:"spec,omitempty"`
	Status  ModuleStatus   `json:"status,omitempty"`
	History []HistoryEntry `json:"history,omitempty"`
}

//+kubebuilder:object:root=true

// ModuleList contains a list of Module
type ModuleList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Module `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Module{}, &ModuleList{})
}
