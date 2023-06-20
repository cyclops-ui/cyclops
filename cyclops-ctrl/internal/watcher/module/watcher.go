package module

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/watch"

	"github.com/cyclops-ui/cycops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cycops-ctrl/internal/storage/templates"
)

type Watcher struct {
	templates        *templates.Storage
	kubernetesClient *k8sclient.KubernetesClient

	watch <-chan watch.Event
}

func NewWatcher(k8sClient *k8sclient.KubernetesClient, templates *templates.Storage) (Watcher, error) {
	watch, err := k8sClient.Dynamic.Resource(schema.GroupVersionResource{
		Group:    "cyclops.com",
		Version:  "v1alpha1",
		Resource: "modules",
	}).Watch(context.Background(), metav1.ListOptions{})
	if err != nil {
		return Watcher{}, nil
	}

	return Watcher{
		kubernetesClient: k8sClient,
		templates:        templates,
		watch:            watch.ResultChan(),
	}, nil
}

func (w Watcher) Start() {
	for {
		select {
		case m := <-w.watch:
			module, _ := m.Object.(*unstructured.Unstructured)
			//if !ok {
			//	fmt.Println("Could not cast object into module")
			//	continue
			//}

			fmt.Println(fmt.Sprintf("got event %s for module %s", m.Type, module.GetName()))

			switch m.Type {
			case watch.Added:
				if err := w.moduleToResources(module.GetName()); err != nil {
					fmt.Println("error on add", module.GetName())
					fmt.Println(err)
				}
			case watch.Modified:
				if err := w.moduleToResources(module.GetName()); err != nil {
					fmt.Println("error on modify", module.GetName())
					fmt.Println(err)
				}
			case watch.Deleted:
				resources, err := w.kubernetesClient.GetResourcesForModule(module.GetName())
				if err != nil {
					fmt.Println("error for delete on get module resources", module.GetName())
					fmt.Println(err)
					continue
				}

				for _, resource := range resources {
					w.kubernetesClient.Delete(resource)
				}

				if err := w.kubernetesClient.DeleteModule(module.GetName()); err != nil {
					fmt.Println("error for delete", module.GetName())
					fmt.Println(err)
				}
			}
		}
	}
}

func (w Watcher) moduleToResources(name string) error {
	module, err := w.kubernetesClient.GetModule(name)
	if err != nil {
		return err
	}

	template, err := w.templates.GetConfig(module.Spec.TemplateRef)
	if err != nil {
		return err
	}

	if err := generateResources(w.kubernetesClient, *module, template); err != nil {
		return err
	}

	return nil
}
