package mapper

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/types"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TemplateStoreListToDTO(store []types.TemplateStore) []dto.TemplateStore {
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

func DTOToTemplateStore(store dto.TemplateStore) *types.TemplateStore {
	return &types.TemplateStore{
		TypeMeta: metav1.TypeMeta{
			Kind:       "TemplateStore",
			APIVersion: "cyclops-ui.com/v1alpha1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: store.Name,
		},
		Spec: types.TemplateRef{
			URL:     store.TemplateRef.URL,
			Path:    store.TemplateRef.Path,
			Version: store.TemplateRef.Version,
		},
	}
}
