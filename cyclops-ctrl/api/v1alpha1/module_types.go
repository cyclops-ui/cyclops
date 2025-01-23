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
	// +kubebuilder:validation:Optional
	TargetNamespace string               `json:"targetNamespace"`
	TemplateRef     TemplateRef          `json:"template"`
	Values          apiextensionsv1.JSON `json:"values"`
}

type ModuleValue struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type TemplateSourceType string

const (
	TemplateSourceTypeGit  TemplateSourceType = "git"
	TemplateSourceTypeHelm TemplateSourceType = "helm"
	TemplateSourceTypeOCI  TemplateSourceType = "oci"
)

type TemplateRef struct {
	URL     string `json:"repo"`
	Path    string `json:"path"`
	Version string `json:"version"`

	// +kubebuilder:validation:Enum=git;helm;oci
	// +kubebuilder:validation:Optional
	SourceType TemplateSourceType `json:"sourceType,omitempty"`
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
	// +kubebuilder:validation:Optional
	// +kubebuilder:validation:Enum=unknown;succeeded;failed
	// +kubebuilder:default:=unknown
	Status ReconciliationStatusState `json:"status,omitempty"`
	// +kubebuilder:validation:Optional
	Reason string `json:"reason,omitempty"`
	// +kubebuilder:validation:Optional
	Errors     []string `json:"errors"`
	// +kubebuilder:validation:Optional
	FinishedAt string   `json:"finishedAt,omitempty"`
}

type GroupVersionResource struct {
	Group    string `json:"group"`
	Version  string `json:"version"`
	Resource string `json:"resource"`
}

// ModuleStatus defines the observed state of Module
type ModuleStatus struct {
	ReconciliationStatus    ReconciliationStatus `json:"reconciliationStatus"`
	TemplateResolvedVersion string               `json:"templateResolvedVersion"`
	// +kubebuilder:validation:Optional
	ManagedGVRs []GroupVersionResource `json:"managedGVRs"`
	// +kubebuilder:validation:Optional
	IconURL string `json:"iconURL"`
}

type HistoryTemplateRef struct {
	URL     string `json:"repo"`
	Path    string `json:"path"`
	Version string `json:"version"`

	// +kubebuilder:validation:Enum=git;helm;oci
	// +kubebuilder:validation:Optional
	SourceType TemplateSourceType `json:"sourceType,omitempty"`
}

type HistoryEntry struct {
	Generation  int64                `json:"generation"`
	TemplateRef HistoryTemplateRef   `json:"template"`
	Values      apiextensionsv1.JSON `json:"values"`
	// +kubebuilder:validation:Optional
	FinishedAt  string               `json:"finishedAt,omitempty"`
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
