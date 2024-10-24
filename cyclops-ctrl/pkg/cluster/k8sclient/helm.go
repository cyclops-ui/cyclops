package k8sclient

import (
	"context"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sort"
)

func (k *KubernetesClient) GetResourcesForRelease(releaseName string) ([]dto.Resource, error) {
	out := make([]dto.Resource, 0, 0)

	managedGVRs := []schema.GroupVersionResource{
		{Group: "", Version: "v1", Resource: "configmaps"},
		{Group: "", Version: "v1", Resource: "secrets"},
		{Group: "", Version: "v1", Resource: "services"},
		{Group: "", Version: "v1", Resource: "serviceaccounts"},
		{Group: "", Version: "v1", Resource: "persistentvolumeclaims"},
		{Group: "", Version: "v1", Resource: "persistentvolumes"},
		{Group: "apps", Version: "v1", Resource: "deployments"},
		{Group: "apps", Version: "v1", Resource: "statefulsets"},
		{Group: "apps", Version: "v1", Resource: "daemonsets"},
		{Group: "batch", Version: "v1", Resource: "jobs"},
		{Group: "batch", Version: "v1", Resource: "cronjobs"},
		{Group: "policy", Version: "v1", Resource: "poddisruptionbudgets"},
		{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"},
		{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"},
		{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"},
		{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"},
		{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"},
		{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"},
	}

	other := make([]unstructured.Unstructured, 0)
	for _, gvr := range managedGVRs {
		rs, err := k.Dynamic.Resource(gvr).List(context.Background(), metav1.ListOptions{
			LabelSelector: labels.Set(map[string]string{
				"app.kubernetes.io/instance":   releaseName,
				"app.kubernetes.io/managed-by": "Helm",
			}).String(),
		})
		if err != nil {
			continue
		}

		for _, item := range rs.Items {
			other = append(other, item)
		}
	}

	for _, o := range other {
		status, err := k.getResourceStatus(o)
		if err != nil {
			return nil, err
		}

		out = append(out, &dto.Other{
			Group:     o.GroupVersionKind().Group,
			Version:   o.GroupVersionKind().Version,
			Kind:      o.GroupVersionKind().Kind,
			Name:      o.GetName(),
			Namespace: o.GetNamespace(),
			Status:    status,
			Deleted:   false,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		if out[i].GetGroupVersionKind() != out[j].GetGroupVersionKind() {
			return out[i].GetGroupVersionKind() < out[j].GetGroupVersionKind()
		}

		return out[i].GetName() < out[j].GetName()
	})

	return out, nil
}

func (k *KubernetesClient) GetWorkloadsForRelease(releaseName string) ([]dto.Resource, error) {
	out := make([]dto.Resource, 0, 0)

	deployments, err := k.clientset.AppsV1().Deployments("").List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"app.kubernetes.io/instance":   releaseName,
			"app.kubernetes.io/managed-by": "Helm",
		}).String(),
	})
	if err != nil {
		return nil, err
	}

	for _, item := range deployments.Items {
		out = append(out, &dto.Other{
			Group:     "apps",
			Version:   "v1",
			Kind:      "Deployment",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	statefulset, err := k.clientset.AppsV1().StatefulSets("").List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"app.kubernetes.io/instance":   releaseName,
			"app.kubernetes.io/managed-by": "Helm",
		}).String(),
	})
	if err != nil {
		return nil, err
	}

	for _, item := range statefulset.Items {
		out = append(out, &dto.Other{
			Group:     "apps",
			Version:   "v1",
			Kind:      "StatefulSet",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	daemonsets, err := k.clientset.AppsV1().DaemonSets("").List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"app.kubernetes.io/instance":   releaseName,
			"app.kubernetes.io/managed-by": "Helm",
		}).String(),
	})
	if err != nil {
		return nil, err
	}

	for _, item := range daemonsets.Items {
		out = append(out, &dto.Other{
			Group:     "apps",
			Version:   "v1",
			Kind:      "DaemonSet",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	return out, nil
}
