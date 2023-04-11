package k8s_mapper

import (
	"gitops/internal/workflow/cyclops/models"
	v1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"
	"strings"
)

func MapImages(podSpec apiv1.PodSpec) string {
	images := make([]string, 0, len(podSpec.Containers))

	for _, container := range podSpec.Containers {
		images = append(images, container.Image)
	}

	return strings.Join(images, ",")
}

func MapNamespaces(namespacesList []apiv1.Namespace) []*models.Namespace {
	namespaces := make([]*models.Namespace, 0, len(namespacesList))

	for _, namespace := range namespacesList {
		namespaces = append(namespaces, &models.Namespace{
			Name: namespace.Name,
		})
	}

	return namespaces
}

func MapDeploymentPreview(deployment v1.Deployment) *models.DeploymentPreview {
	return &models.DeploymentPreview{
		AppName:   deployment.Name,
		Replicas:  int(*deployment.Spec.Replicas),
		ImageName: MapImages(deployment.Spec.Template.Spec),
		Namespace: deployment.Namespace,
		Kind:      deployment.Kind,
		Healthy:   deployment.Status.AvailableReplicas == deployment.Status.Replicas,
		Manifest:  "",
	}
}
