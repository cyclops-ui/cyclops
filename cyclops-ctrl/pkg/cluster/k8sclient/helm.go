package k8sclient

import (
	"context"
	"sort"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

func (k *KubernetesClient) GetResourcesForRelease(releaseName string) ([]*dto.Resource, error) {
	out := make([]*dto.Resource, 0, 0)

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
	listOptions := metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"app.kubernetes.io/instance":   releaseName,
			"app.kubernetes.io/managed-by": "Helm",
		}).String(),
	}

	for _, gvr := range managedGVRs {
		var rs *unstructured.UnstructuredList
		var err error
		if len(k.helmReleaseNamespace) > 0 {
			rs, err = k.Dynamic.Resource(gvr).Namespace(k.helmReleaseNamespace).List(context.Background(), listOptions)
		} else {
			rs, err = k.Dynamic.Resource(gvr).List(context.Background(), listOptions)
		}

		if err != nil {
			if apierrors.IsNotFound(err) {
				continue
			}

			k.logger.Info("failed to list resources", "gvr", gvr, "namespace", k.helmReleaseNamespace)
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

		out = append(out, &dto.Resource{
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

func (k *KubernetesClient) GetWorkloadsForRelease(releaseName string) ([]*dto.Resource, error) {
	out := make([]*dto.Resource, 0, 0)

	deployments, err := k.clientset.AppsV1().Deployments(k.helmReleaseNamespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"app.kubernetes.io/instance":   releaseName,
			"app.kubernetes.io/managed-by": "Helm",
		}).String(),
	})
	if err != nil {
		return nil, err
	}

	for _, item := range deployments.Items {
		out = append(out, &dto.Resource{
			Group:     "apps",
			Version:   "v1",
			Kind:      "Deployment",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	statefulset, err := k.clientset.AppsV1().StatefulSets(k.helmReleaseNamespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"app.kubernetes.io/instance":   releaseName,
			"app.kubernetes.io/managed-by": "Helm",
		}).String(),
	})
	if err != nil {
		return nil, err
	}

	for _, item := range statefulset.Items {
		out = append(out, &dto.Resource{
			Group:     "apps",
			Version:   "v1",
			Kind:      "StatefulSet",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	daemonsets, err := k.clientset.AppsV1().DaemonSets(k.helmReleaseNamespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"app.kubernetes.io/instance":   releaseName,
			"app.kubernetes.io/managed-by": "Helm",
		}).String(),
	})
	if err != nil {
		return nil, err
	}

	for _, item := range daemonsets.Items {
		out = append(out, &dto.Resource{
			Group:     "apps",
			Version:   "v1",
			Kind:      "DaemonSet",
			Name:      item.Name,
			Namespace: item.Namespace,
		})
	}

	return out, nil
}

func (k *KubernetesClient) DeleteReleaseSecret(releaseName, releaseNamespace string) error {
	secrets, err := k.clientset.CoreV1().Secrets(releaseNamespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(map[string]string{
			"name":  releaseName,
			"owner": "helm",
		}).String(),
		FieldSelector: "type=helm.sh/release.v1",
	})
	if err != nil {
		return err
	}

	for _, secret := range secrets.Items {
		if err := k.clientset.CoreV1().Secrets(releaseNamespace).Delete(context.Background(), secret.Name, metav1.DeleteOptions{}); err != nil {
			return err
		}
	}

	return nil
}
