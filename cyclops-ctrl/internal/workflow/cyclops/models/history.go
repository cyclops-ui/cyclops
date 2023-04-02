package models

type HistoryEntry struct {
	Date             string `json:"date"`
	ChangeTitle      string `json:"change_title"`
	AppliedManifest  string `json:"applied_manifest"`
	ReplacedManifest string `json:"replaced_manifest"`
	Success          bool   `json:"success"`
}
