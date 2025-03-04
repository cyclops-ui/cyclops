package mapper

import (
	v1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

func TemplateStoreListToDTO(store []v1alpha1.TemplateStore) []dto.TemplateStore {
	out := make([]dto.TemplateStore, 0, len(store))

	for _, templateStore := range store {
		iconURL := ""
		if templateStore.GetAnnotations() != nil {
			iconURL = templateStore.GetAnnotations()[v1alpha1.IconURLAnnotation]
		}

		out = append(out, dto.TemplateStore{
			Name:    templateStore.Name,
			IconURL: iconURL,
			TemplateRef: dto.Template{
				URL:        templateStore.Spec.URL,
				Path:       templateStore.Spec.Path,
				Version:    templateStore.Spec.Version,
				SourceType: string(templateStore.Spec.SourceType),
			},
		})
	}

	return out
}

func DTOToTemplateStore(store dto.TemplateStore, iconURL string) *v1alpha1.TemplateStore {
	return &v1alpha1.TemplateStore{
		TypeMeta: metav1.TypeMeta{
			Kind:       "TemplateStore",
			APIVersion: "cyclops-ui.com/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: store.Name,
			Annotations: map[string]string{
				v1alpha1.IconURLAnnotation: iconURL,
			},
		},
		Spec: v1alpha1.TemplateRef{
			URL:        store.TemplateRef.URL,
			Path:       store.TemplateRef.Path,
			Version:    store.TemplateRef.Version,
			SourceType: v1alpha1.TemplateSourceType(store.TemplateRef.SourceType),
		},
	}
}

func TemplateCRDListToDTO(crds []v1.CustomResourceDefinition) []dto.TemplateStore {
	out := make([]dto.TemplateStore, 0, len(crds))

	for _, crd := range crds {
		iconURL := ""
		if crd.GetAnnotations() != nil {
			iconURL = crd.GetAnnotations()[v1alpha1.IconURLAnnotation]
		}

		out = append(out, dto.TemplateStore{
			Name:    crd.Name,
			IconURL: iconURL,
			TemplateRef: dto.Template{
				CRDName:    crd.Name,
				SourceType: "crd",
			},
		})
	}

	return out
}

func DTOToTemplateCRD(store dto.TemplateStore, iconURL string) *v1alpha1.TemplateStore {
	return &v1alpha1.TemplateStore{
		TypeMeta: metav1.TypeMeta{
			Kind:       "TemplateStore",
			APIVersion: "cyclops-ui.com/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: store.Name,
			Annotations: map[string]string{
				v1alpha1.IconURLAnnotation: iconURL,
			},
		},
		Spec: v1alpha1.TemplateRef{
			URL:        store.TemplateRef.URL,
			Path:       store.TemplateRef.Path,
			Version:    store.TemplateRef.Version,
			SourceType: v1alpha1.TemplateSourceType(store.TemplateRef.SourceType),
		},
	}
}
