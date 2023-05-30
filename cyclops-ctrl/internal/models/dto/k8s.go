package dto

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Container struct {
	Name   string            `json:"name"`
	Image  string            `json:"image"`
	Env    map[string]string `json:"env"`
	Status ContainerStatus   `json:"status"`
}

type ContainerStatus struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Running bool   `json:"running"`
}

type Pod struct {
	Name       string       `json:"name"`
	Containers []Container  `json:"containers"`
	Node       string       `json:"node"`
	PodPhase   string       `json:"podPhase"`
	Started    *metav1.Time `json:"started"`
}

type Deployment struct {
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int    `json:"replicas"`
	Manifest  string `json:"manifest"`
	Pods      []Pod  `json:"pods"`
	Status    bool   `json:"status"`
}

type Service struct {
	Kind       string `json:"kind"`
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Port       int    `json:"port"`
	TargetPort int    `json:"targetPort"`
	Manifest   string `json:"manifest"`
}
