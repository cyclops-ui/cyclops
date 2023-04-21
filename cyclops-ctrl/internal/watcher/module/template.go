package module

import (
	"fmt"
	"github.com/cyclops-ui/cycops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/crd/v1alpha1"
	. "github.com/cyclops-ui/cycops-ctrl/internal/template"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/scheme"
	"strings"
)

func generateResources(kClient *k8sclient.KubernetesClient, module v1alpha1.Module, template models.Template) error {
	out, err := HelmTemplate(module, template)
	if err != nil {
		return err
	}

	fmt.Println(out)

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
