package dto

type Hierarchy struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

type Node struct {
	ID    string    `json:"id"`
	Value NodeValue `json:"value"`
}

type NodeValue struct {
	Title string           `json:"title"`
	Items []NodeValueItems `json:"items"`
}

type NodeValueItems struct {
	Text  string `json:"text"`
	Value string `json:"value"`
	Icon  string `json:"icon"`
}

type Edge struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Value  string `json:"value"`
}
