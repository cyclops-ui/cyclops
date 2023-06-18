package modulecontroller

import (
	"gitops/internal/workflow/cyclops/services/k8s_client"
	"strings"

	v1 "k8s.io/api/core/v1"
	v12 "k8s.io/apimachinery/pkg/apis/meta/v1"

	appsv1 "k8s.io/api/apps/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/scheme"

	"gitops/internal/models/crd/v1alpha1"
	"gitops/internal/workflow/cyclops/models"
	template2 "gitops/internal/workflow/cyclops/util/template"
)

func GenerateResources(kClient *k8s_client.KubernetesClient, module v1alpha1.Module, template models.AppConfiguration) error {
	out, err := template2.TemplateModule(module, template)
	if err != nil {
		return err
	}

	// TODO: work with unstructured.Unstructured
	objects := make([]runtime.Object, 0, 0)

	for _, s := range strings.Split(out, "---") {
		obj, _, err := scheme.Codecs.UniversalDeserializer().Decode([]byte(s), nil, nil)
		if err != nil {
			return err
		}

		objects = append(objects, obj)
	}

	for _, object := range objects {
		switch rs := object.(type) {
		case *appsv1.Deployment:
			labels := rs.GetLabels()
			if labels == nil {
				labels = make(map[string]string)
			}

			labels["cyclops.module"] = module.Name
			rs.SetLabels(labels)

			if err := kClient.Deploy(rs); err != nil {
				return err
			}
		case *v1.Service:
			labels := rs.GetLabels()
			if labels == nil {
				labels = make(map[string]string)
			}

			labels["cyclops.module"] = module.Name
			rs.SetLabels(labels)

			if err := kClient.DeployService(rs); err != nil {
				return err
			}
		}
	}

	return nil
}

func UpdateResources(kClient *k8s_client.KubernetesClient, module v1alpha1.Module, template models.AppConfiguration) error {
	out, err := template2.TemplateModule(module, template)
	if err != nil {
		return err
	}

	// TODO: work with unstructured.Unstructured
	objects := make([]runtime.Object, 0, 0)

	for _, s := range strings.Split(out, "---") {
		obj, _, err := scheme.Codecs.UniversalDeserializer().Decode([]byte(s), nil, nil)
		if err != nil {
			return err
		}

		objects = append(objects, obj)
	}

	for _, object := range objects {
		switch rs := object.(type) {
		case *appsv1.Deployment:
			labels := rs.GetLabels()
			if labels == nil {
				labels = make(map[string]string)
			}

			labels["cyclops.module"] = module.Name
			rs.SetLabels(labels)

			rs.SetOwnerReferences([]v12.OwnerReference{
				{
					APIVersion: "cyclops.com/v1alpha1",
					Kind:       "Module",
					Name:       module.Name,
					UID:        module.UID,
				},
			})

			if err := kClient.UpdateDeployment(rs); err != nil {
				return err
			}
		case *v1.Service:
			labels := rs.GetLabels()
			if labels == nil {
				labels = make(map[string]string)
			}

			labels["cyclops.module"] = module.Name
			rs.SetLabels(labels)

			if err := kClient.UpdateService(rs); err != nil {
				return err
			}
		}
	}

	return nil
}
