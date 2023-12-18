package helm

type Index struct {
	Entries map[string][]IndexEntry `json:"entries" yaml:"entries"`
}

type IndexEntry struct {
	Version string   `json:"version" yaml:"version"`
	URLs    []string `json:"urls" yaml:"urls"`
}
