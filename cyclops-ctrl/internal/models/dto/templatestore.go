package dto

type TemplateStore struct {
	Name        string   `json:"name" binding:"required"`
	TemplateRef Template `json:"ref"`
}
