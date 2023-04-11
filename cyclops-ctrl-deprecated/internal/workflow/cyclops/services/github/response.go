package github

type Response struct {
	Encoding string `json:"encoding"`
	Size     int    `json:"size"`
	Name     string `json:"name"`
	GitUrl   string `json:"git_url"`
	HTMLUrl  string `json:"html_url"`
	Content  string `json:"content"`
}
