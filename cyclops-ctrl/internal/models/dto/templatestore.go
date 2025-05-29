package dto

type TemplateStore struct {
	Name               string       `json:"name" binding:"required"`
	IconURL            string       `json:"iconURL"`
	TemplateRef        Template     `json:"ref"`
	EnforceGitOpsWrite *GitOpsWrite `json:"enforceGitOpsWrite,omitempty"`
}
