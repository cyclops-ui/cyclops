package v1alpha1

import "k8s.io/apimachinery/pkg/runtime"

func DeepCopyValues(values []ModuleValue) []ModuleValue {
	out := make([]ModuleValue, 0, len(values))

	for _, value := range values {
		out = append(out, ModuleValue{
			Name:  value.Name,
			Value: value.Value,
		})
	}

	return out
}

// DeepCopyInto copies all properties of this object into another object of the
// same type that is provided as a pointer.
func (in *Module) DeepCopyInto(out *Module) {
	out.TypeMeta = in.TypeMeta
	out.ObjectMeta = in.ObjectMeta
	out.Spec = ModuleSpec{
		TemplateRef: TemplateRef{
			Name:    in.Spec.TemplateRef.Name,
			Version: in.Spec.TemplateRef.Version,
		},
		Values: DeepCopyValues(in.Spec.Values),
	}
}

// DeepCopyObject returns a generically typed copy of an object
func (in *Module) DeepCopyObject() runtime.Object {
	out := Module{}
	in.DeepCopyInto(&out)

	return &out
}

// DeepCopyObject returns a generically typed copy of an object
func (in *ModuleList) DeepCopyObject() runtime.Object {
	out := ModuleList{}
	out.TypeMeta = in.TypeMeta
	out.ListMeta = in.ListMeta

	if in.Items != nil {
		out.Items = make([]Module, len(in.Items))
		for i := range in.Items {
			in.Items[i].DeepCopyInto(&out.Items[i])
		}
	}

	return &out
}
