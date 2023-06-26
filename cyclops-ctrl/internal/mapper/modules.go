package mapper

import (
	"fmt"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
)

func RequestToModule(req dto.Module) cyclopsv1alpha1.Module {
	values := make([]cyclopsv1alpha1.ModuleValue, 0, len(req.Values))
	for k, v := range req.Values {
		values = append(values, cyclopsv1alpha1.ModuleValue{
			Name:  k,
			Value: fmt.Sprintf("%v", v),
		})
	}

	return cyclopsv1alpha1.Module{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Module",
			APIVersion: "cyclops-ui.com/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: req.Name,
		},
		Spec: cyclopsv1alpha1.ModuleSpec{
			TemplateRef: dtoTemplateRefToK8s(req.Template),
			Values:      values,
		},
	}
}

func ModuleToDTO(module cyclopsv1alpha1.Module) dto.Module {
	values := make(map[string]interface{})

	for _, value := range module.Spec.Values {
		values[value.Name] = value.Value
	}

	return dto.Module{
		Name:      module.Name,
		Namespace: module.Namespace,
		Version:   module.Spec.TemplateRef.Version,
		Template:  k8sTemplateRefToDTO(module.Spec.TemplateRef),
		Values:    values,
	}
}

func ModuleListToDTO(modules []cyclopsv1alpha1.Module) []dto.Module {
	out := make([]dto.Module, 0, len(modules))

	for _, module := range modules {
		out = append(out, ModuleToDTO(module))
	}

	return out
}

func dtoTemplateRefToK8s(dto dto.Template) cyclopsv1alpha1.TemplateRef {
	return cyclopsv1alpha1.TemplateRef{
		Name:    dto.Name,
		Version: dto.Version,
		TemplateGitRef: cyclopsv1alpha1.TemplateGitRef{
			Repo: dto.GitRef.Repo,
			Path: dto.GitRef.Path,
		},
	}
}

func k8sTemplateRefToDTO(templateRef cyclopsv1alpha1.TemplateRef) dto.Template {
	return dto.Template{
		Name:    templateRef.Name,
		Version: templateRef.Version,
		GitRef: dto.TemplateGitRef{
			Repo: templateRef.TemplateGitRef.Repo,
			Path: templateRef.TemplateGitRef.Path,
		},
	}
}
