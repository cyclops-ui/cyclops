package mapper

import (
	"encoding/json"
	"fmt"

	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
)

func RequestToModule(req dto.Module, template models.Template) (cyclopsv1alpha1.Module, error) {
	fields := fieldsMap(template.Fields)

	values := make([]cyclopsv1alpha1.ModuleValue, 0, len(req.Values))
	for k, v := range req.Values {
		switch fields[k].Type {
		case "map":
			data, err := json.Marshal(v)
			if err != nil {
				return cyclopsv1alpha1.Module{}, err
			}

			values = append(values, cyclopsv1alpha1.ModuleValue{
				Name:  k,
				Value: string(data),
			})
		default:
			values = append(values, cyclopsv1alpha1.ModuleValue{
				Name:  k,
				Value: fmt.Sprintf("%v", v),
			})
		}
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
			TemplateRef: DtoTemplateRefToK8s(req.Template),
			Values:      values,
		},
	}, nil
}

func ModuleToDTO(module cyclopsv1alpha1.Module, template models.Template) (dto.Module, error) {
	fields := fieldsMap(template.Fields)

	values := make(map[string]interface{})
	for _, value := range module.Spec.Values {
		switch fields[value.Name].Type {
		case "map":
			var keyValues []dto.KeyValue
			if err := json.Unmarshal([]byte(value.Value), &keyValues); err != nil {
				return dto.Module{}, err
			}

			values[value.Name] = keyValues
		default:
			values[value.Name] = value.Value
		}

	}

	return dto.Module{
		Name:      module.Name,
		Namespace: module.Namespace,
		Version:   module.Spec.TemplateRef.Version,
		Template:  k8sTemplateRefToDTO(module.Spec.TemplateRef),
		Values:    values,
	}, nil
}

func ModuleListToDTO(modules []cyclopsv1alpha1.Module) []dto.Module {
	out := make([]dto.Module, 0, len(modules))

	for _, module := range modules {
		values := make(map[string]interface{})

		for _, value := range module.Spec.Values {
			values[value.Name] = value.Value
		}

		out = append(out, dto.Module{
			Name:      module.Name,
			Namespace: module.Namespace,
			Version:   module.Spec.TemplateRef.Version,
			Template:  k8sTemplateRefToDTO(module.Spec.TemplateRef),
			Values:    values,
		})
	}

	return out
}

func DtoTemplateRefToK8s(dto dto.Template) cyclopsv1alpha1.TemplateRef {
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

func fieldsMap(fields []models.Field) map[string]models.Field {
	out := make(map[string]models.Field)
	for _, field := range fields {
		out[field.Name] = field
	}

	return out
}
