//go:build !ignore_autogenerated

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

// Code generated by controller-gen. DO NOT EDIT.

package v1alpha1

import (
	runtime "k8s.io/apimachinery/pkg/runtime"
)

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *GitOpsWriteDestination) DeepCopyInto(out *GitOpsWriteDestination) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new GitOpsWriteDestination.
func (in *GitOpsWriteDestination) DeepCopy() *GitOpsWriteDestination {
	if in == nil {
		return nil
	}
	out := new(GitOpsWriteDestination)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *GroupVersionResource) DeepCopyInto(out *GroupVersionResource) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new GroupVersionResource.
func (in *GroupVersionResource) DeepCopy() *GroupVersionResource {
	if in == nil {
		return nil
	}
	out := new(GroupVersionResource)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HistoryEntry) DeepCopyInto(out *HistoryEntry) {
	*out = *in
	out.TemplateRef = in.TemplateRef
	in.Values.DeepCopyInto(&out.Values)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HistoryEntry.
func (in *HistoryEntry) DeepCopy() *HistoryEntry {
	if in == nil {
		return nil
	}
	out := new(HistoryEntry)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *HistoryTemplateRef) DeepCopyInto(out *HistoryTemplateRef) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new HistoryTemplateRef.
func (in *HistoryTemplateRef) DeepCopy() *HistoryTemplateRef {
	if in == nil {
		return nil
	}
	out := new(HistoryTemplateRef)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *Module) DeepCopyInto(out *Module) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
	in.Status.DeepCopyInto(&out.Status)
	if in.History != nil {
		in, out := &in.History, &out.History
		*out = make([]HistoryEntry, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new Module.
func (in *Module) DeepCopy() *Module {
	if in == nil {
		return nil
	}
	out := new(Module)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *Module) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ModuleList) DeepCopyInto(out *ModuleList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]Module, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ModuleList.
func (in *ModuleList) DeepCopy() *ModuleList {
	if in == nil {
		return nil
	}
	out := new(ModuleList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *ModuleList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ModuleSpec) DeepCopyInto(out *ModuleSpec) {
	*out = *in
	in.TemplateRef.DeepCopyInto(&out.TemplateRef)
	in.Values.DeepCopyInto(&out.Values)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ModuleSpec.
func (in *ModuleSpec) DeepCopy() *ModuleSpec {
	if in == nil {
		return nil
	}
	out := new(ModuleSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ModuleStatus) DeepCopyInto(out *ModuleStatus) {
	*out = *in
	if in.ReconciliationStatus != nil {
		in, out := &in.ReconciliationStatus, &out.ReconciliationStatus
		*out = new(ReconciliationStatus)
		(*in).DeepCopyInto(*out)
	}
	if in.ManagedGVRs != nil {
		in, out := &in.ManagedGVRs, &out.ManagedGVRs
		*out = make([]GroupVersionResource, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ModuleStatus.
func (in *ModuleStatus) DeepCopy() *ModuleStatus {
	if in == nil {
		return nil
	}
	out := new(ModuleStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ModuleValue) DeepCopyInto(out *ModuleValue) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ModuleValue.
func (in *ModuleValue) DeepCopy() *ModuleValue {
	if in == nil {
		return nil
	}
	out := new(ModuleValue)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *ReconciliationStatus) DeepCopyInto(out *ReconciliationStatus) {
	*out = *in
	if in.Errors != nil {
		in, out := &in.Errors, &out.Errors
		*out = make([]string, len(*in))
		copy(*out, *in)
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new ReconciliationStatus.
func (in *ReconciliationStatus) DeepCopy() *ReconciliationStatus {
	if in == nil {
		return nil
	}
	out := new(ReconciliationStatus)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateAuthRule) DeepCopyInto(out *TemplateAuthRule) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateAuthRule.
func (in *TemplateAuthRule) DeepCopy() *TemplateAuthRule {
	if in == nil {
		return nil
	}
	out := new(TemplateAuthRule)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *TemplateAuthRule) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateAuthRuleList) DeepCopyInto(out *TemplateAuthRuleList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]TemplateAuthRule, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateAuthRuleList.
func (in *TemplateAuthRuleList) DeepCopy() *TemplateAuthRuleList {
	if in == nil {
		return nil
	}
	out := new(TemplateAuthRuleList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *TemplateAuthRuleList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateAuthRuleSpec) DeepCopyInto(out *TemplateAuthRuleSpec) {
	*out = *in
	in.Username.DeepCopyInto(&out.Username)
	in.Password.DeepCopyInto(&out.Password)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateAuthRuleSpec.
func (in *TemplateAuthRuleSpec) DeepCopy() *TemplateAuthRuleSpec {
	if in == nil {
		return nil
	}
	out := new(TemplateAuthRuleSpec)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateGitRef) DeepCopyInto(out *TemplateGitRef) {
	*out = *in
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateGitRef.
func (in *TemplateGitRef) DeepCopy() *TemplateGitRef {
	if in == nil {
		return nil
	}
	out := new(TemplateGitRef)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateRef) DeepCopyInto(out *TemplateRef) {
	*out = *in
	if in.EnforceGitOpsWrite != nil {
		in, out := &in.EnforceGitOpsWrite, &out.EnforceGitOpsWrite
		*out = new(GitOpsWriteDestination)
		**out = **in
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateRef.
func (in *TemplateRef) DeepCopy() *TemplateRef {
	if in == nil {
		return nil
	}
	out := new(TemplateRef)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateStore) DeepCopyInto(out *TemplateStore) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	in.Spec.DeepCopyInto(&out.Spec)
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateStore.
func (in *TemplateStore) DeepCopy() *TemplateStore {
	if in == nil {
		return nil
	}
	out := new(TemplateStore)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *TemplateStore) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// DeepCopyInto is an autogenerated deepcopy function, copying the receiver, writing into out. in must be non-nil.
func (in *TemplateStoreList) DeepCopyInto(out *TemplateStoreList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]TemplateStore, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

// DeepCopy is an autogenerated deepcopy function, copying the receiver, creating a new TemplateStoreList.
func (in *TemplateStoreList) DeepCopy() *TemplateStoreList {
	if in == nil {
		return nil
	}
	out := new(TemplateStoreList)
	in.DeepCopyInto(out)
	return out
}

// DeepCopyObject is an autogenerated deepcopy function, copying the receiver, creating a new runtime.Object.
func (in *TemplateStoreList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}
