package mapper

import (
	"fmt"
	v1 "k8s.io/api/core/v1"
	"strings"

	json "github.com/json-iterator/go"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

func RequestToModule(req dto.Module) (cyclopsv1alpha1.Module, error) {
	data, err := json.Marshal(req.Values)
	if err != nil {
		return cyclopsv1alpha1.Module{}, err
	}

	annotations := make(map[string]string)
	if req.GitOpsWrite != nil && len(req.GitOpsWrite.Repo) != 0 {
		annotations[cyclopsv1alpha1.GitOpsWriteRepoAnnotation] = req.GitOpsWrite.Repo
		annotations[cyclopsv1alpha1.GitOpsWritePathAnnotation] = req.GitOpsWrite.Path
		annotations[cyclopsv1alpha1.GitOpsWriteRevisionAnnotation] = req.GitOpsWrite.Branch
	}

	return cyclopsv1alpha1.Module{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Module",
			APIVersion: "cyclops-ui.com/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Name,
			Annotations: annotations,
		},
		Spec: cyclopsv1alpha1.ModuleSpec{
			TargetNamespace: mapTargetNamespace(req.Namespace),
			TemplateRef:     DtoTemplateRefToK8s(req.Template),
			Values: apiextensionsv1.JSON{
				Raw: data,
			},
		},
		History: make([]cyclopsv1alpha1.HistoryEntry, 0),
	}, nil
}

func ModuleToDTO(module cyclopsv1alpha1.Module) (dto.Module, error) {
	return dto.Module{
		Name:                 module.Name,
		Namespace:            module.Namespace,
		TargetNamespace:      mapTargetNamespace(module.Spec.TargetNamespace),
		Version:              module.Spec.TemplateRef.Version,
		Template:             k8sTemplateRefToDTO(module.Spec.TemplateRef, module.Status.TemplateResolvedVersion),
		Values:               module.Spec.Values,
		IconURL:              module.Status.IconURL,
		GitOpsWrite:          mapGitOpsWrite(module),
		ReconciliationStatus: ReconciliationStatusToDTO(module.Status.ReconciliationStatus),
	}, nil
}

func ReconciliationStatusToDTO(status *cyclopsv1alpha1.ReconciliationStatus) dto.ReconciliationStatus {
	if status == nil {
		return dto.ReconciliationStatus{Status: dto.Unknown}
	}

	return dto.ReconciliationStatus{
		Status: dto.ReconciliationStatusState(status.Status),
		Reason: status.Reason,
		Errors: status.Errors,
	}
}

func ModuleListToDTO(modules []cyclopsv1alpha1.Module) []dto.Module {
	out := make([]dto.Module, 0, len(modules))

	for _, module := range modules {
		values := make(map[string]interface{})
		out = append(out, dto.Module{
			Name:            module.Name,
			Namespace:       module.Namespace,
			TargetNamespace: mapTargetNamespace(module.Spec.TargetNamespace),
			Version:         module.Spec.TemplateRef.Version,
			Template:        k8sTemplateRefToDTO(module.Spec.TemplateRef, module.Status.TemplateResolvedVersion),
			Values:          values,
			IconURL:         module.Status.IconURL,
		})
	}

	return out
}

func DtoTemplateRefToK8s(dto dto.Template) cyclopsv1alpha1.TemplateRef {
	return cyclopsv1alpha1.TemplateRef{
		URL:        dto.URL,
		Path:       dto.Path,
		Version:    dto.Version,
		SourceType: cyclopsv1alpha1.TemplateSourceType(dto.SourceType),
	}
}

func k8sTemplateRefToDTO(templateRef cyclopsv1alpha1.TemplateRef, templateResolvedVersion string) dto.Template {
	return dto.Template{
		URL:             templateRef.URL,
		Path:            templateRef.Path,
		Version:         templateRef.Version,
		ResolvedVersion: templateResolvedVersion,
		SourceType:      string(templateRef.SourceType),
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

func mapTargetNamespace(targetNamespace string) string {
	if len(strings.TrimSpace(targetNamespace)) == 0 {
		return v1.NamespaceDefault
	}

	return targetNamespace
}

func mapGitOpsWrite(module cyclopsv1alpha1.Module) *dto.GitOpsWrite {
	if repo, ok := module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRepoAnnotation]; !ok || len(repo) == 0 {
		return nil
	}

	return &dto.GitOpsWrite{
		Repo:   module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRepoAnnotation],
		Path:   module.GetAnnotations()[cyclopsv1alpha1.GitOpsWritePathAnnotation],
		Branch: module.GetAnnotations()[cyclopsv1alpha1.GitOpsWriteRevisionAnnotation],
	}
}
