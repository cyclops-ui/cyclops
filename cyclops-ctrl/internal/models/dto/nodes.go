package dto

type Node struct {
	Name             string `json:"name"`
	CPUPercentage    int64  `json:"CPUPercentage"`
	MemoryPercentage int64  `json:"memoryPercentage"`
}
