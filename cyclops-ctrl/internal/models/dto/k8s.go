package dto

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Resource interface {
	GetGroupVersionKind() string
	GetGroup() string
	GetVersion() string
	GetKind() string
	GetName() string
	GetNamespace() string
	GetDeleted() bool
	SetDeleted(bool)
}

type Deployment struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int    `json:"replicas"`
	Manifest  string `json:"manifest"`
	Pods      []Pod  `json:"pods"`
	Status    bool   `json:"status"`
	Deleted   bool   `json:"deleted"`
}

func (d *Deployment) GetGroupVersionKind() string {
	return d.Group + "/" + d.Version + ", Kind=" + d.Kind
}

func (d *Deployment) GetGroup() string {
	return d.Group
}

func (d *Deployment) GetVersion() string {
	return d.Version
}

func (d *Deployment) GetKind() string {
	return d.Kind
}

func (d *Deployment) GetName() string {
	return d.Name
}

func (d *Deployment) GetNamespace() string {
	return d.Namespace
}

func (d *Deployment) GetDeleted() bool {
	return d.Deleted
}

func (d *Deployment) SetDeleted(deleted bool) {
	d.Deleted = deleted
}

type Service struct {
	Group      string `json:"group"`
	Version    string `json:"version"`
	Kind       string `json:"kind"`
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Port       int    `json:"port"`
	TargetPort int    `json:"targetPort"`
	Manifest   string `json:"manifest"`
	Deleted    bool   `json:"deleted"`
}

func (s *Service) GetGroupVersionKind() string {
	return s.Group + "/" + s.Version + ", Kind=" + s.Kind
}

func (s *Service) GetGroup() string {
	return s.Group
}

func (s *Service) GetVersion() string {
	return s.Version
}

func (s *Service) GetKind() string {
	return s.Kind
}

func (s *Service) GetName() string {
	return s.Name
}

func (s *Service) GetNamespace() string {
	return s.Namespace
}

func (s *Service) GetDeleted() bool {
	return s.Deleted
}

func (s *Service) SetDeleted(deleted bool) {
	s.Deleted = deleted
}

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
