package k8sclient

import (
	"fmt"
	"github.com/pkg/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type apiResources struct {
	resourcesList []*metav1.APIResourceList
}

func (a apiResources) isResourceNamespaced(gvk schema.GroupVersionKind) (bool, error) {
	for _, resource := range a.resourcesList {
		gv, err := schema.ParseGroupVersion(resource.GroupVersion)
		if err != nil {
			return false, err
		}

		for _, apiResource := range resource.APIResources {
			if apiResource.Kind == gvk.Kind &&
				gv.Group == gvk.Group &&
				gv.Version == gvk.Version {
				return apiResource.Namespaced, nil
			}
		}
	}

	return false, errors.New(fmt.Sprintf("group version kind not found: %v", gvk.String()))
}
