package mapper

import (
	"gitops/internal/workflow/cyclops/models"
)

func MapConfigDetails(in []models.AppConfiguration) (out []models.AppConfiguration) {
	for _, c := range in {
		out = append(out, models.AppConfiguration{
			Name:    c.Name,
			Created: c.Created,
			Edited:  c.Edited,
		})
	}

	return
}
