package dto

import (
	v1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
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
	Pods      []Pod  `json:"pods"`
	Status    string `json:"status"`
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

func (d *DaemonSet) GetGroupVersionKind() string {
	return d.Group + "/" + d.Version + ", Kind=" + d.Kind
}

func (d *DaemonSet) GetGroup() string {
	return d.Group
}

func (d *DaemonSet) GetVersion() string {
	return d.Version
}

func (d *DaemonSet) GetKind() string {
	return d.Kind
}

func (d *DaemonSet) GetName() string {
	return d.Name
}

func (d *DaemonSet) GetNamespace() string {
	return d.Namespace
}

func (d *DaemonSet) GetDeleted() bool {
	return d.Deleted
}

func (d *DaemonSet) SetDeleted(deleted bool) {
	d.Deleted = deleted
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

type ConfigMap struct {
	Group     string            `json:"group"`
	Version   string            `json:"version"`
	Kind      string            `json:"kind"`
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Data      map[string]string `json:"data"`
	Deleted   bool              `json:"deleted"`
}

func (c *ConfigMap) GetGroupVersionKind() string {
	return c.Group + "/" + c.Version + ", Kind=" + c.Kind
}

func (c *ConfigMap) GetGroup() string {
	return c.Group
}

func (c *ConfigMap) GetVersion() string {
	return c.Version
}

func (c *ConfigMap) GetKind() string {
	return c.Kind
}

func (c *ConfigMap) GetName() string {
	return c.Name
}

func (c *ConfigMap) GetNamespace() string {
	return c.Namespace
}

func (c *ConfigMap) GetDeleted() bool {
	return c.Deleted
}

func (c *ConfigMap) SetDeleted(deleted bool) {
	c.Deleted = deleted
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

func (p *Pod) GetGroupVersionKind() string {
	return p.Group + "/" + p.Version + ", Kind=" + p.Kind
}

func (p *Pod) GetGroup() string {
	return p.Group
}

func (p *Pod) GetVersion() string {
	return p.Version
}

func (p *Pod) GetKind() string {
	return p.Kind
}

func (p *Pod) GetName() string {
	return p.Name
}

func (p *Pod) GetNamespace() string {
	return p.Namespace
}

func (p *Pod) GetDeleted() bool {
	return p.Deleted
}

func (p *Pod) SetDeleted(deleted bool) {
	p.Deleted = deleted
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

func (s *StatefulSet) GetGroupVersionKind() string {
	return s.Group + "/" + s.Version + ", Kind=" + s.Kind
}

func (s *StatefulSet) GetGroup() string {
	return s.Group
}

func (s *StatefulSet) GetVersion() string {
	return s.Version
}

func (s *StatefulSet) GetKind() string {
	return s.Kind
}

func (s *StatefulSet) GetName() string {
	return s.Name
}

func (s *StatefulSet) GetNamespace() string {
	return s.Namespace
}

func (s *StatefulSet) GetDeleted() bool {
	return s.Deleted
}

func (s *StatefulSet) SetDeleted(deleted bool) {
	s.Deleted = deleted
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

func (p *PersistentVolumeClaim) GetGroupVersionKind() string {
	return p.Group + "/" + p.Version + ", Kind=" + p.Kind
}

func (p *PersistentVolumeClaim) GetGroup() string {
	return p.Group
}

func (p *PersistentVolumeClaim) GetVersion() string {
	return p.Version
}

func (p *PersistentVolumeClaim) GetKind() string {
	return p.Kind
}

func (p *PersistentVolumeClaim) GetName() string {
	return p.Name
}

func (p *PersistentVolumeClaim) GetNamespace() string {
	return p.Namespace
}

func (p *PersistentVolumeClaim) GetDeleted() bool {
	return p.Deleted
}

func (p *PersistentVolumeClaim) SetDeleted(deleted bool) {
	p.Deleted = deleted
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

func (p *PersistentVolume) GetGroupVersionKind() string {
	return p.Group + "/" + p.Version + ", Kind=" + p.Kind
}

func (p *PersistentVolume) GetGroup() string {
	return p.Group
}

func (p *PersistentVolume) GetVersion() string {
	return p.Version
}

func (p *PersistentVolume) GetKind() string {
	return p.Kind
}

func (p *PersistentVolume) GetName() string {
	return p.Name
}

func (p *PersistentVolume) GetNamespace() string {
	return p.Namespace
}

func (p *PersistentVolume) GetDeleted() bool {
	return p.Deleted
}

func (p *PersistentVolume) GetCapacity() string {
	return p.Capacity
}

func (p *PersistentVolume) GetPersistentVolumeClaim() string {
	return p.PersistentVolumeClaim
}

func (p *PersistentVolume) GetStorageClass() string {
	return p.StorageClass
}

func (p *PersistentVolume) GetStatus() v1.PersistentVolumeStatus {
	return p.Status
}

func (p *PersistentVolume) SetDeleted(deleted bool) {
	p.Deleted = deleted
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

func (s *Secret) GetGroupVersionKind() string {
	return s.Group + "/" + s.Version + ", Kind=" + s.Kind
}

func (s *Secret) GetGroup() string {
	return s.Group
}

func (s *Secret) GetVersion() string {
	return s.Version
}

func (s *Secret) GetKind() string {
	return s.Kind
}

func (s *Secret) GetName() string {
	return s.Name
}

func (s *Secret) GetNamespace() string {
	return s.Namespace
}

func (s *Secret) GetType() string {
	return s.Type
}

func (s *Secret) GetDataKeys() []string {
	return s.DataKeys
}

func (s *Secret) GetDeleted() bool {
	return s.Deleted
}

func (s *Secret) SetDeleted(deleted bool) {
	s.Deleted = deleted
}

type StatusCronJob struct {
	LastScheduleTime   *metav1.Time `json:"lastScheduleTime"`
	LastSuccessfulTime *metav1.Time `json:"lastSuccessfulTime"`
}

func (s *StatusCronJob) GetLastScheduleTime() string {
	if s.LastScheduleTime != nil {
		return s.LastScheduleTime.String()
	}
	return ""
}

func (s *StatusCronJob) GetLastSuccessfulTime() string {
	if s.LastSuccessfulTime != nil {
		return s.LastSuccessfulTime.String()
	}
	return ""
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

func (c *CronJob) GetGroupVersionKind() string {
	return c.Group + "/" + c.Version + ", Kind=" + c.Kind
}

func (c *CronJob) GetGroup() string {
	return c.Group
}

func (c *CronJob) GetVersion() string {
	return c.Version
}

func (c *CronJob) GetKind() string {
	return c.Kind
}

func (c *CronJob) GetName() string {
	return c.Name
}

func (c *CronJob) GetNamespace() string {
	return c.Namespace
}

func (c *CronJob) GetDeleted() bool {
	return c.Deleted
}

func (c *CronJob) SetDeleted(deleted bool) {
	c.Deleted = deleted
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

func (c *Job) GetGroupVersionKind() string {
	return c.Group + "/" + c.Version + ", Kind=" + c.Kind
}

func (c *Job) GetGroup() string {
	return c.Group
}

func (c *Job) GetVersion() string {
	return c.Version
}

func (c *Job) GetKind() string {
	return c.Kind
}

func (c *Job) GetName() string {
	return c.Name
}

func (c *Job) GetNamespace() string {
	return c.Namespace
}

func (c *Job) GetCompletionTime() string {
	return c.CompletionTime
}

func (c *Job) GetStartTime() string {
	return c.StartTime
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

func (n *NetworkPolicy) GetGroupVersionKind() string {
	return n.Group + "/" + n.Version + ", Kind=" + n.Kind
}

func (n *NetworkPolicy) GetGroup() string {
	return n.Group
}

func (n *NetworkPolicy) GetVersion() string {
	return n.Version
}

func (n *NetworkPolicy) GetKind() string {
	return n.Kind
}

func (n *NetworkPolicy) GetName() string {
	return n.Name
}

func (n *NetworkPolicy) GetNamespace() string {
	return n.Namespace
}

func (n *NetworkPolicy) GetIngress() []NetworkPolicyIngressRule {
	return n.Ingress
}

func (n *NetworkPolicy) GetEgress() []NetworkPolicyEgressRule {
	return n.Egress
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

func (s *Other) GetGroupVersionKind() string {
	return s.Group + "/" + s.Version + ", Kind=" + s.Kind
}

func (s *Other) GetGroup() string {
	return s.Group
}

func (s *Other) GetVersion() string {
	return s.Version
}

func (s *Other) GetKind() string {
	return s.Kind
}

func (s *Other) GetName() string {
	return s.Name
}

func (s *Other) GetNamespace() string {
	return s.Namespace
}

func (s *Other) GetDeleted() bool {
	return s.Deleted
}

func (s *Other) SetDeleted(deleted bool) {
	s.Deleted = deleted
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

func (s *Role) GetGroupVersionKind() string {
	return s.Group + "/" + s.Version + ", Kind=" + s.Kind
}

func (s *Role) GetGroup() string {
	return s.Group
}

func (s *Role) GetVersion() string {
	return s.Version
}

func (s *Role) GetKind() string {
	return s.Kind
}

func (s *Role) GetName() string {
	return s.Name
}

func (s *Role) GetNamespace() string {
	return s.Namespace
}

func (s *Role) GetDeleted() bool {
	return s.Deleted
}

func (s *Role) SetDeleted(deleted bool) {
	s.Deleted = deleted
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

func (s *ClusterRole) GetGroupVersionKind() string {
	return s.Group + "/" + s.Version + ", Kind=" + s.Kind
}

func (s *ClusterRole) GetGroup() string {
	return s.Group
}

func (s *ClusterRole) GetVersion() string {
	return s.Version
}

func (s *ClusterRole) GetKind() string {
	return s.Kind
}

func (s *ClusterRole) GetName() string {
	return s.Name
}

func (s *ClusterRole) GetNamespace() string {
	return s.Namespace
}

func (s *ClusterRole) GetDeleted() bool {
	return s.Deleted
}

func (s *ClusterRole) SetDeleted(deleted bool) {
	s.Deleted = deleted
}
