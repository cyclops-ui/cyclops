package mapper

import (
	"fmt"

	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	json "github.com/json-iterator/go"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
)

func RequestToModule(req dto.Module) (cyclopsv1alpha1.Module, error) {
	//fields := fieldsMap(template.Fields)
	//
	//fmt.Println(fields["chains"])
	//
	//values := make([]cyclopsv1alpha1.ModuleValue, 0, len(req.Values))
	//for k, v := range req.Values {
	//	switch fields[k].Type {
	//	case "map":
	//		data, err := json.Marshal(v)
	//		if err != nil {
	//			return cyclopsv1alpha1.Module{}, err
	//		}
	//
	//		values = append(values, cyclopsv1alpha1.ModuleValue{
	//			Name:  k,
	//			Value: string(data),
	//		})
	//	case "array":
	//		data, err := json.Marshal(v)
	//		if err != nil {
	//			return cyclopsv1alpha1.Module{}, err
	//		}
	//
	//		values = append(values, cyclopsv1alpha1.ModuleValue{
	//			Name:  k,
	//			Value: string(data),
	//		})
	//	//case "array":
	//	//	arrayValues, ok := v.([]interface{})
	//	//	if !ok {
	//	//		fmt.Println(reflect.TypeOf(v))
	//	//		fmt.Println("could not cast into array", v)
	//	//		continue
	//	//	}
	//	//
	//	//	for i, arrayValue := range arrayValues {
	//	//		recValues, err := setValuesRecursive(arrayValue.(map[string]interface{}), fieldsMap(fields[k].Items.Properties))
	//	//		if err != nil {
	//	//			fmt.Println("could not get recursive values")
	//	//		}
	//	//
	//	//		for _, value := range recValues {
	//	//			values = append(values, cyclopsv1alpha1.ModuleValue{
	//	//				Name:  strings.Join([]string{k, fmt.Sprint(i), value.Name}, "."),
	//	//				Value: value.Value,
	//	//			})
	//	//		}
	//	//	}
	//
	//	default:
	//		values = append(values, cyclopsv1alpha1.ModuleValue{
	//			Name:  k,
	//			Value: fmt.Sprintf("%v", v),
	//		})
	//	}
	//}

	data, err := json.Marshal(req.Values)
	if err != nil {
		return cyclopsv1alpha1.Module{}, err
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
			Values: apiextensionsv1.JSON{
				Raw: data,
			},
		},
	}, nil
}

func ModuleToDTO(module cyclopsv1alpha1.Module) (dto.Module, error) {
	//fields := fieldsMap(template.Fields)
	//
	//values := make(map[string]interface{})
	//for _, value := range module.Spec.Values {
	//	switch fields[value.Name].Type {
	//	case "map":
	//		var keyValues []dto.KeyValue
	//		if err := json.Unmarshal([]byte(value.Value), &keyValues); err != nil {
	//			return dto.Module{}, err
	//		}
	//
	//		values[value.Name] = keyValues
	//	case "array":
	//		var keyValues []interface{}
	//		if err := json.Unmarshal([]byte(value.Value), &keyValues); err != nil {
	//			return dto.Module{}, err
	//		}
	//
	//		//if len(keyValues) == 0 {
	//		//	continue
	//		//}
	//		//
	//		//for i, keyValue := range keyValues {
	//		//	if reflect.TypeOf(keyValues[0]).Kind() == reflect.Map {
	//		//		keyType := reflect.TypeOf(keyValues[0]).Key()
	//		//		valueType := reflect.TypeOf(keyValues[0]).Elem()
	//		//
	//		//		if keyType.Kind() == reflect.String && valueType.Kind() == reflect.Interface {
	//		//			keyValueMap := keyValue.(map[string]interface{})
	//		//
	//		//			tmp := make(map[string]interface{})
	//		//			for k, v := range keyValueMap {
	//		//				tmp[strings.Join([]string{value.Name, fmt.Sprint(i), k}, ".")] = v
	//		//			}
	//		//
	//		//			keyValues[i] = tmp
	//		//		}
	//		//	}
	//		//}
	//
	//		values[value.Name] = keyValues
	//	default:
	//		values[value.Name] = value.Value
	//	}
	//
	//}

	return dto.Module{
		Name:      module.Name,
		Namespace: module.Namespace,
		Version:   module.Spec.TemplateRef.Version,
		Template:  k8sTemplateRefToDTO(module.Spec.TemplateRef),
		Values:    module.Spec.Values,
	}, nil
}

func ModuleListToDTO(modules []cyclopsv1alpha1.Module) []dto.Module {
	out := make([]dto.Module, 0, len(modules))

	for _, module := range modules {
		values := make(map[string]interface{})

		//for _, value := range module.Spec.Values {
		//	values[value.Name] = value.Value
		//}

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
			Repo:   dto.GitRef.Repo,
			Path:   dto.GitRef.Path,
			Commit: dto.GitRef.Commit,
		},
	}
}

func k8sTemplateRefToDTO(templateRef cyclopsv1alpha1.TemplateRef) dto.Template {
	return dto.Template{
		Name:    templateRef.Name,
		Version: templateRef.Version,
		GitRef: dto.TemplateGitRef{
			Repo:   templateRef.TemplateGitRef.Repo,
			Path:   templateRef.TemplateGitRef.Path,
			Commit: templateRef.TemplateGitRef.Commit,
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

func setValuesRecursive(moduleValues map[string]interface{}, fields map[string]models.Field) ([]cyclopsv1alpha1.ModuleValue, error) {
	values := make([]cyclopsv1alpha1.ModuleValue, 0)
	for k, v := range moduleValues {
		switch fields[k].Type {
		case "map":
			data, err := json.Marshal(v)
			if err != nil {
				return nil, err
			}

			values = append(values, cyclopsv1alpha1.ModuleValue{
				Name:  k,
				Value: string(data),
			})
		//case "array":
		//	//field := fields[k]
		//
		//	arrayValue, ok := v.([]interface{})
		//	if !ok {
		//		fmt.Println("could not cast into array", v)
		//	}
		//
		//	fmt.Println(arrayValue)
		//
		//	for i, value := range arrayValue {
		//		values = append(values, cyclopsv1alpha1.ModuleValue{
		//			Name:  strings.Join([]string{k}, "."),
		//			Value: "",
		//		})
		//	}

		default:
			values = append(values, cyclopsv1alpha1.ModuleValue{
				Name:  k,
				Value: fmt.Sprintf("%v", v),
			})
		}
	}

	return values, nil
}
