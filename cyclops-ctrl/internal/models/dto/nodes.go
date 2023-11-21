package dto

import apiv1 "k8s.io/api/core/v1"

type Node struct {
	Name string `json:"name"`

	Node *apiv1.Node `json:"node"`
	Pods []NodePod   `json:"pods"`

	AvailableResources NodeResources `json:"available"`
	RequestedResources NodeResources `json:"requested"`
}

type NodeResources struct {
	CPU      int64 `json:"cpu"`
	Memory   int64 `json:"memory"`
	PodCount int64 `json:"pod_count"`
}

type NodePod struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Health    bool   `json:"health"`
	CPU       int64  `json:"cpu"`
	Memory    int64  `json:"memory"`
}
