package mapper

import (
	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
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
