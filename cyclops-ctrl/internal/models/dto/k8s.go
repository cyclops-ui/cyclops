package dto

import (
	v1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

type Resource struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Deleted   bool   `json:"deleted"`
}

func (r *Resource) GetGroupVersionKind() string {
	return r.Group + "/" + r.Version + ", Kind=" + r.Kind
}

func (r *Resource) GetGroup() string {
	return r.Group
}

func (r *Resource) GetVersion() string {
	return r.Version
}

func (r *Resource) GetKind() string {
	return r.Kind
}

func (r *Resource) GetName() string {
	return r.Name
}

func (r *Resource) GetNamespace() string {
	return r.Namespace
}

func (r *Resource) GetDeleted() bool {
	return r.Deleted
}

func (r *Resource) SetDeleted(deleted bool) {
	r.Deleted = deleted
}

type Deployment struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int    `json:"replicas"`
	Pods      []Pod  `json:"pods"`
	Status    string `json:"status"`
	Deleted   bool   `json:"deleted"`
}

type DaemonSet struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Pods      []Pod  `json:"pods"`
	Status    string `json:"status"`
	Deleted   bool   `json:"deleted"`
}

type ExternalIP struct {
	IP       string `json:"ip"`
	Hostname string `json:"hostname"`
}

type Service struct {
	Group       string           `json:"group"`
	Version     string           `json:"version"`
	Kind        string           `json:"kind"`
	Name        string           `json:"name"`
	Namespace   string           `json:"namespace"`
	Type        string           `json:"serviceType"`
	ExternalIPs []*ExternalIP    `json:"externalIPs"`
	Ports       []v1.ServicePort `json:"ports"`
	Deleted     bool             `json:"deleted"`
}

type ConfigMap struct {
	Group     string            `json:"group"`
	Version   string            `json:"version"`
	Kind      string            `json:"kind"`
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Data      map[string]string `json:"data"`
	Deleted   bool              `json:"deleted"`
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
	Group          string       `json:"group"`
	Version        string       `json:"version"`
	Kind           string       `json:"kind"`
	Name           string       `json:"name"`
	Namespace      string       `json:"namespace"`
	InitContainers []Container  `json:"initContainers"`
	Containers     []Container  `json:"containers"`
	Node           string       `json:"node"`
	PodPhase       string       `json:"podPhase"`
	Status         bool         `json:"status"`
	Started        *metav1.Time `json:"started"`
	Deleted        bool         `json:"deleted"`
}

type StatefulSet struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int    `json:"replicas"`
	Pods      []Pod  `json:"pods"`
	Status    string `json:"status"`
	Deleted   bool   `json:"deleted"`
}

type PersistentVolumeClaim struct {
	Group       string                          `json:"group"`
	Version     string                          `json:"version"`
	Kind        string                          `json:"kind"`
	Name        string                          `json:"name"`
	Namespace   string                          `json:"namespace"`
	AccessModes []v1.PersistentVolumeAccessMode `json:"accessmodes"`
	Size        string                          `json:"size"`
	Deleted     bool                            `json:"deleted"`
}

type PersistentVolume struct {
	Group                 string                           `json:"group"`
	Version               string                           `json:"version"`
	Kind                  string                           `json:"kind"`
	Name                  string                           `json:"name"`
	Namespace             string                           `json:"namespace"`
	AccessModes           []v1.PersistentVolumeAccessMode  `json:"accessmodes"`
	Capacity              string                           `json:"capacity"`
	PersistentVolumeClaim string                           `json:"persistentvolumeclaim"`
	StorageClass          string                           `json:"storageclass"`
	Status                v1.PersistentVolumeStatus        `json:"status"`
	ReclaimPolicy         v1.PersistentVolumeReclaimPolicy `json:"reclaimpolicy"`
	Deleted               bool                             `json:"deleted"`
}

type Secret struct {
	Group     string   `json:"group"`
	Version   string   `json:"version"`
	Kind      string   `json:"kind"`
	Name      string   `json:"name"`
	Namespace string   `json:"namespace"`
	Type      string   `json:"type"`
	DataKeys  []string `json:"dataKeys"`
	Deleted   bool     `json:"deleted"`
}

type StatusCronJob struct {
	LastScheduleTime   *metav1.Time `json:"lastScheduleTime"`
	LastSuccessfulTime *metav1.Time `json:"lastSuccessfulTime"`
}

type CronJob struct {
	Group     string        `json:"group"`
	Version   string        `json:"version"`
	Kind      string        `json:"kind"`
	Name      string        `json:"name"`
	Namespace string        `json:"namespace"`
	Pods      []Pod         `json:"pods"`
	Schedule  string        `json:"schedule"`
	Status    StatusCronJob `json:"status"`
	Suspend   bool          `json:"suspend"`
	Deleted   bool          `json:"deleted"`
}

type Job struct {
	Group          string `json:"group"`
	Version        string `json:"version"`
	Kind           string `json:"kind"`
	Name           string `json:"name"`
	Namespace      string `json:"namespace"`
	Pods           []Pod  `json:"pods"`
	CompletionTime string `json:"completionTime"`
	StartTime      string `json:"startTime"`
}

type NetworkPolicy struct {
	Group     string                     `json:"group"`
	Version   string                     `json:"version"`
	Kind      string                     `json:"kind"`
	Name      string                     `json:"name"`
	Namespace string                     `json:"namespace"`
	Pods      []Pod                      `json:"pods"`
	Ingress   []NetworkPolicyIngressRule `json:"ingress"`
	Egress    []NetworkPolicyEgressRule  `json:"egress"`
}

type NetworkPolicyIngressRule struct {
	Ports []NetworkPolicyPort `json:"ports"`
	From  []NetworkPolicyPeer `json:"from"`
}

type NetworkPolicyEgressRule struct {
	Ports []NetworkPolicyPort `json:"ports,"`
	To    []NetworkPolicyPeer `json:"to"`
}

type NetworkPolicyPort struct {
	Protocol string             `json:"protocol"`
	Port     intstr.IntOrString `json:"port"`
	EndPort  int32              `json:"endPort"`
}

type NetworkPolicyPeer struct {
	IPBlock *IPBlock `json:"ipBlock"`
}

type IPBlock struct {
	CIDR   string   `json:"cidr"`
	Except []string `json:"except"`
}

type Other struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Deleted   bool   `json:"deleted"`
}

type Role struct {
	Group     string              `json:"group"`
	Version   string              `json:"version"`
	Kind      string              `json:"kind"`
	Name      string              `json:"name"`
	Namespace string              `json:"namespace"`
	Status    string              `json:"status"`
	Deleted   bool                `json:"deleted"`
	Rules     []rbacv1.PolicyRule `json:"rules"`
}

type ClusterRole struct {
	Group     string              `json:"group"`
	Version   string              `json:"version"`
	Kind      string              `json:"kind"`
	Name      string              `json:"name"`
	Namespace string              `json:"namespace"`
	Deleted   bool                `json:"deleted"`
	Rules     []rbacv1.PolicyRule `json:"rules"`
}
