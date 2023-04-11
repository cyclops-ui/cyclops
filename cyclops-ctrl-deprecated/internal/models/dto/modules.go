package dto

type CreateModuleRequest struct {
	Name     string                 `json:"name"`
	Template string                 `json:"template"`
	Values   map[string]interface{} `json:"values"`
}
