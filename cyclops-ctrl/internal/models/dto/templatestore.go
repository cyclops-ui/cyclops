package dto

type TemplateStore struct {
	Name        string   `json:"name"`
	TemplateRef Template `json:"ref"`
}
