package helm

type Metadata struct {
	Name         string            `json:"name,omitempty" yaml:"name,omitempty"`
	Home         string            `json:"home,omitempty" yaml:"home,omitempty"`
	Sources      []string          `json:"sources,omitempty" yaml:"sources,omitempty"`
	Version      string            `json:"version,omitempty" yaml:"version,omitempty"`
	Description  string            `json:"description,omitempty" yaml:"description,omitempty"`
	Keywords     []string          `json:"keywords,omitempty" yaml:"keywords,omitempty"`
	Maintainers  []*Maintainer     `json:"maintainers,omitempty" yaml:"maintainers,omitempty"`
	Icon         string            `json:"icon,omitempty" yaml:"icon,omitempty"`
	APIVersion   string            `json:"apiVersion,omitempty" yaml:"APIVersion,omitempty"`
	Condition    string            `json:"condition,omitempty" yaml:"condition,omitempty"`
	Tags         string            `json:"tags,omitempty" yaml:"tags,omitempty"`
	AppVersion   string            `json:"appVersion,omitempty" yaml:"appVersion,omitempty"`
	Deprecated   bool              `json:"deprecated,omitempty" yaml:"deprecated,omitempty"`
	Annotations  map[string]string `json:"annotations,omitempty" yaml:"annotations,omitempty"`
	KubeVersion  string            `json:"kubeVersion,omitempty" yaml:"kubeVersion,omitempty"`
	Dependencies []*Dependency     `json:"dependencies,omitempty" yaml:"dependencies,omitempty"`
	Type         string            `json:"type,omitempty" yaml:"type,omitempty"`
}

type Maintainer struct {
	Name  string `json:"name,omitempty" yaml:"name"`
	Email string `json:"email,omitempty" yaml:"email"`
	URL   string `json:"url,omitempty" yaml:"URL"`
}

type Dependency struct {
	Name         string        `json:"name" yaml:"name,omitempty"`
	Version      string        `json:"version,omitempty" yaml:"version,omitempty"`
	Repository   string        `json:"repository" yaml:"repository,omitempty"`
	Condition    string        `json:"condition,omitempty" yaml:"condition,omitempty"`
	Tags         []string      `json:"tags,omitempty" yaml:"tags,omitempty"`
	Enabled      bool          `json:"enabled,omitempty" yaml:"enabled,omitempty"`
	ImportValues []interface{} `json:"import-values,omitempty" yaml:"importValues,omitempty"`
	Alias        string        `json:"alias,omitempty" yaml:"alias,omitempty"`
}
