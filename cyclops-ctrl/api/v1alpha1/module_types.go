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

	GitOpsWriteRepoAnnotation     = "cyclops-ui.com/write-repo"
	GitOpsWritePathAnnotation     = "cyclops-ui.com/write-path"
	GitOpsWriteRevisionAnnotation = "cyclops-ui.com/write-revision"

	ModuleManagerLabel = "cyclops-ui.com/module-manager"

	AddonModuleLabel     = "cyclops-ui.com/addon"
	MCPServerModuleLabel = "cyclops-ui.com/mcp-server"

	ResourceFinalizer = "cyclops-ui.com/module-resources"
)

type GitOpsWriteDestination struct {
	Repo    string `json:"repo"`
	Path    string `json:"path"`
	Version string `json:"version"`
}

type TemplateRef struct {
	URL     string `json:"repo"`
	Path    string `json:"path"`
	Version string `json:"version"`

	// +kubebuilder:validation:Enum=git;helm;oci
	// +kubebuilder:validation:Optional
	SourceType TemplateSourceType `json:"sourceType,omitempty"`

	// +kubebuilder:validation:Optional
	EnforceGitOpsWrite *GitOpsWriteDestination `json:"enforceGitOpsWrite,omitempty"`
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
	Errors []string `json:"errors"`
}

type GroupVersionResource struct {
	Group    string `json:"group"`
	Version  string `json:"version"`
	Resource string `json:"resource"`
}

// ModuleStatus defines the observed state of Module
type ModuleStatus struct {
	ReconciliationStatus    *ReconciliationStatus `json:"reconciliationStatus,omitempty"`
	TemplateResolvedVersion string                `json:"templateResolvedVersion,omitempty"`
	// +kubebuilder:validation:Optional
	ManagedGVRs []GroupVersionResource `json:"managedGVRs,omitempty"`
	// +kubebuilder:validation:Optional
	IconURL string `json:"iconURL,omitempty"`
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
	Generation int64 `json:"generation"`

	// +kubebuilder:validation:Optional
	TargetNamespace string               `json:"targetNamespace"`
	TemplateRef     HistoryTemplateRef   `json:"template"`
	Values          apiextensionsv1.JSON `json:"values"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"
//+kubebuilder:printcolumn:name="Target Namespace",type=string,JSONPath=`.spec.targetNamespace`,priority=1
//+kubebuilder:printcolumn:name="Template",type=string,JSONPath=`.spec.template.repo`
//+kubebuilder:printcolumn:name="Template path",type=string,JSONPath=`.spec.template.path`,priority=1
//+kubebuilder:printcolumn:name="Template version",type=string,JSONPath=`.spec.template.version`,priority=1
//+kubebuilder:printcolumn:name="Template resolved version",type=string,JSONPath=`.status.templateResolvedVersion`,priority=1
//+kubebuilder:printcolumn:name="Reconciliation Status",type=string,JSONPath=`.status.reconciliationStatus.status`

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
