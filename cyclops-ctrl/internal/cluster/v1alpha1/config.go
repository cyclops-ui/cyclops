package v1alpha1

import "k8s.io/apimachinery/pkg/runtime"

// DeepCopyInto copies all properties of this object into another object of the
// same type that is provided as a pointer.
func (in *Config) DeepCopyInto(out *Config) {
	out.TypeMeta = in.TypeMeta
	out.ObjectMeta = in.ObjectMeta

	fields := make([]Field, 0, len(in.Spec.Fields))
	for _, field := range in.Spec.Fields {
		fields = append(fields, Field{
			Name:         field.Name,
			Type:         field.DisplayName,
			DisplayName:  field.DisplayName,
			ManifestKey:  field.ManifestKey,
			InitialValue: field.InitialValue,
			Value:        field.Value,
		})
	}

	out.Spec = ConfigSpec{
		Name:     in.Spec.Name,
		Template: in.Spec.Template,
		Fields:   fields,
		Created:  in.Spec.Created,
		Edited:   in.Spec.Edited,
	}
}

// DeepCopyObject returns a generically typed copy of an object
func (in *Config) DeepCopyObject() runtime.Object {
	out := Config{}
	in.DeepCopyInto(&out)

	return &out
}

// DeepCopyObject returns a generically typed copy of an object
func (in *ConfigList) DeepCopyObject() runtime.Object {
	out := ConfigList{}
	out.TypeMeta = in.TypeMeta
	out.ListMeta = in.ListMeta

	if in.Items != nil {
		out.Items = make([]Config, len(in.Items))
		for i := range in.Items {
			in.Items[i].DeepCopyInto(&out.Items[i])
		}
	}

	return &out
}
