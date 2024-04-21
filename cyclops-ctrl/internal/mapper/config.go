package mapper

import "github.com/cyclops-ui/cycops/cycops-ctrl/internal/models"

func MapConfigDetails(in []models.Template) (out []models.Template) {
	for _, c := range in {
		out = append(out, models.Template{
			Name:    c.Name,
			Created: c.Created,
			Edited:  c.Edited,
		})
	}

	return
}
