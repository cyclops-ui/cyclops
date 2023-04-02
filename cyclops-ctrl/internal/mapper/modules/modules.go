package modules

import (
	"fmt"
	"gitops/internal/models/crd/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type ModuleDTO struct {
	Name      string                 `json:"name"`
	Namespace string                 `json:"namespace"`
	Template  string                 `json:"template"`
	Version   string                 `json:"version"`
	Values    map[string]interface{} `json:"values"`
}

func RequestToModule(req ModuleDTO) v1alpha1.Module {
	values := make([]v1alpha1.ModuleValue, 0, len(req.Values))
	for k, v := range req.Values {
		values = append(values, v1alpha1.ModuleValue{
			Name:  k,
			Value: fmt.Sprintf("%v", v),
		})
	}

	return v1alpha1.Module{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Module",
			APIVersion: "cyclops.com/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name,
		},
		Spec: v1alpha1.ModuleSpec{
			TemplateRef: v1alpha1.TemplateRef{
				Name:    req.Template,
				Version: req.Version,
			},
			Values: values,
		},
	}
}

func ModuleToDTO(module v1alpha1.Module) ModuleDTO {
	values := make(map[string]interface{})

	for _, value := range module.Spec.Values {
		values[value.Name] = value.Value
	}

	return ModuleDTO{
		Name:      module.Name,
		Namespace: module.Namespace,
		Version:   module.Spec.TemplateRef.Version,
		Template:  module.Spec.TemplateRef.Name,
		Values:    values,
	}
}

func ModuleListToDTO(modules []v1alpha1.Module) []ModuleDTO {
	out := make([]ModuleDTO, 0, len(modules))

	for _, module := range modules {
		out = append(out, ModuleToDTO(module))
	}

	return out
}
