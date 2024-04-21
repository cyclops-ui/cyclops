package mapper

import (
	cyclopsv1alpha1 "github.com/cyclops-ui/cycops/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops/cycops-ctrl/internal/models/dto"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TemplateStoreListToDTO(store []cyclopsv1alpha1.TemplateStore) []dto.TemplateStore {
	out := make([]dto.TemplateStore, 0, len(store))

	for _, templateStore := range store {
		out = append(out, dto.TemplateStore{
			Name: templateStore.Name,
			TemplateRef: dto.Template{
				URL:     templateStore.Spec.URL,
				Path:    templateStore.Spec.Path,
				Version: templateStore.Spec.Version,
			},
		})
	}

	return out
}

func DTOToTemplateStore(store dto.TemplateStore) *cyclopsv1alpha1.TemplateStore {
	return &cyclopsv1alpha1.TemplateStore{
		TypeMeta: metav1.TypeMeta{
			Kind:       "TemplateStore",
			APIVersion: "cyclops-ui.com/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: store.Name,
		},
		Spec: cyclopsv1alpha1.TemplateRef{
			URL:     store.TemplateRef.URL,
			Path:    store.TemplateRef.Path,
			Version: store.TemplateRef.Version,
		},
	}
}
