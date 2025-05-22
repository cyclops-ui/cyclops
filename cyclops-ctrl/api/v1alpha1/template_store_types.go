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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

const IconURLAnnotation = "cyclops-ui.com/icon"

//+kubebuilder:object:root=true
//+kubebuilder:printcolumn:name="Age",type="date",JSONPath=".metadata.creationTimestamp"
//+kubebuilder:printcolumn:name="Type",type=string,JSONPath=`.spec.sourceType`
//+kubebuilder:printcolumn:name="Repository",type=string,JSONPath=`.spec.repo`
//+kubebuilder:printcolumn:name="Path",type=string,JSONPath=`.spec.path`
//+kubebuilder:printcolumn:name="Version",type=string,JSONPath=`.spec.version`

// TemplateStore holds reference to a template that can be offered as a starting point
type TemplateStore struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec TemplateRef `json:"spec,omitempty"`
}

//+kubebuilder:object:root=true

// TemplateStoreList contains a list of TemplateStore
type TemplateStoreList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []TemplateStore `json:"items"`
}
