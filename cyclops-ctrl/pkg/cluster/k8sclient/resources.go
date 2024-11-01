package k8sclient

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/pkg/errors"

	"gopkg.in/yaml.v2"

	apiv1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/version"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/tools/cache"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

func (k *KubernetesClient) VersionInfo() (*version.Info, error) {
	return k.discovery.ServerVersion()
}

func (k *KubernetesClient) RestartDeployment(name, namespace string) error {
	deployment, err := k.clientset.AppsV1().Deployments(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	if deployment.Spec.Template.ObjectMeta.Annotations == nil {
		deployment.Spec.Template.ObjectMeta.Annotations = make(map[string]string)
	}
	deployment.Spec.Template.ObjectMeta.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	_, err = k.clientset.AppsV1().Deployments(namespace).Update(context.Background(), deployment, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) RestartStatefulSet(name, namespace string) error {
	statefulset, err := k.clientset.AppsV1().StatefulSets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	if statefulset.Spec.Template.ObjectMeta.Annotations == nil {
		statefulset.Spec.Template.ObjectMeta.Annotations = make(map[string]string)
	}
	statefulset.Spec.Template.ObjectMeta.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	_, err = k.clientset.AppsV1().StatefulSets(namespace).Update(context.Background(), statefulset, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) RestartDaemonSet(name, namespace string) error {
	daemonset, err := k.clientset.AppsV1().DaemonSets(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	if daemonset.Spec.Template.ObjectMeta.Annotations == nil {
		daemonset.Spec.Template.ObjectMeta.Annotations = make(map[string]string)
	}
	daemonset.Spec.Template.ObjectMeta.Annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().Format(time.RFC3339)

	_, err = k.clientset.AppsV1().DaemonSets(namespace).Update(context.Background(), daemonset, metav1.UpdateOptions{})
	return err
}

func (k *KubernetesClient) GetManifest(group, version, kind, name, namespace string, includeManagedFields bool) (string, error) {
	apiResourceName, err := k.GVKtoAPIResourceName(schema.GroupVersion{Group: group, Version: version}, kind)
	if err != nil {
		return "", err
	}

	resource, err := k.Dynamic.Resource(schema.GroupVersionResource{
		Group:    group,
		Version:  version,
		Resource: apiResourceName,
	}).Namespace(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return "", err
	}

	if !includeManagedFields {
		resource.SetManagedFields(nil)
	}

	data, err := yaml.Marshal(resource.Object)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (k *KubernetesClient) Restart(group, version, kind, name, namespace string) error {
	switch {
	case isDeployment(group, version, kind):
		return k.RestartDeployment(name, namespace)
	case isDaemonSet(group, version, kind):
		return k.RestartDaemonSet(name, namespace)
	case isStatefulSet(group, version, kind):
		return k.RestartStatefulSet(name, namespace)
	}

	return errors.New(fmt.Sprintf("cannot restart: %v/%v %v %v/%v", group, version, kind, namespace, name))
}

func (k *KubernetesClient) GetResource(group, version, kind, name, namespace string) (any, error) {
	switch {
	case isDeployment(group, version, kind):
		return k.mapDeployment(group, version, kind, name, namespace)
	case isDaemonSet(group, version, kind):
		return k.mapDaemonSet(group, version, kind, name, namespace)
	case isService(group, version, kind):
		return k.mapService(group, version, kind, name, namespace)
	case isStatefulSet(group, version, kind):
		return k.mapStatefulSet(group, version, kind, name, namespace)
	case isPod(group, version, kind):
		return k.mapPod(group, version, kind, name, namespace)
	case isConfigMap(group, version, kind):
		return k.mapConfigMap(group, version, kind, name, namespace)
	case isPersistentVolume(group, version, kind):
		return k.mapPersistentVolumes(group, version, kind, name, namespace)
	case isPersistentVolumeClaims(group, version, kind):
		return k.mapPersistentVolumeClaims(group, version, kind, name, namespace)
	case isSecret(group, version, kind):
		return k.mapSecret(group, version, kind, name, namespace)
	case isCronJob(group, version, kind):
		return k.mapCronJob(group, version, kind, name, namespace)
	case isJob(group, version, kind):
		return k.mapJob(group, version, kind, name, namespace)
	case isRole(group, version, kind):
		return k.mapRole(group, version, kind, name, namespace)
	case isNetworkPolicy(group, version, kind):
		return k.mapNetworkPolicy(group, version, kind, name, namespace)
	case isClusterRole(group, version, kind):
		return k.mapClusterRole(group, version, kind, name)
	}

	return nil, nil
}

func (k *KubernetesClient) Delete(resource dto.Resource) error {
	apiResourceName, err := k.GVKtoAPIResourceName(
		schema.GroupVersion{
			Group:   resource.GetGroup(),
			Version: resource.GetVersion(),
		}, resource.GetKind())
	if err != nil {
		return err
	}

	gvr := schema.GroupVersionResource{
		Group:    resource.GetGroup(),
		Version:  resource.GetVersion(),
		Resource: apiResourceName,
	}

	return k.Dynamic.Resource(gvr).Namespace(resource.GetNamespace()).Delete(
		context.Background(),
		resource.GetName(),
		metav1.DeleteOptions{},
	)
}

func (k *KubernetesClient) CreateDynamic(
	resource v1alpha1.GroupVersionResource,
	obj *unstructured.Unstructured,
	targetNamespace string,
) error {
	gvr := schema.GroupVersionResource{
		Group:    resource.Group,
		Version:  resource.Version,
		Resource: resource.Resource,
	}

	objNamespace := apiv1.NamespaceDefault

	if len(strings.TrimSpace(targetNamespace)) != 0 {
		objNamespace = strings.TrimSpace(targetNamespace)
	}

	if len(strings.TrimSpace(obj.GetNamespace())) != 0 {
		objNamespace = obj.GetNamespace()
	}
	obj.SetNamespace(objNamespace)

	isNamespaced, err := k.isResourceNamespaced(obj.GroupVersionKind())
	if err != nil {
		return err
	}

	if !isNamespaced {
		return k.createDynamicNonNamespaced(gvr, obj)
	}

	return k.createDynamicNamespaced(gvr, objNamespace, obj)
}

func (k *KubernetesClient) createDynamicNamespaced(
	gvr schema.GroupVersionResource,
	namespace string,
	obj *unstructured.Unstructured,
) error {
	current, err := k.Dynamic.Resource(gvr).Namespace(namespace).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			_, err := k.Dynamic.Resource(gvr).Namespace(namespace).Create(
				context.Background(),
				obj,
				metav1.CreateOptions{},
			)

			return err
		}
		return err
	}

	if isJob(obj.GroupVersionKind().Group, obj.GroupVersionKind().Version, obj.GroupVersionKind().Kind) {
		if err := copyJobSelectors(current, obj); err != nil {
			return err
		}
	}

	if isPersistentVolumeClaims(obj.GroupVersionKind().Group, obj.GroupVersionKind().Version, obj.GroupVersionKind().Kind) {
		if err := mergePVCWithCurrent(current, obj); err != nil {
			return err
		}
	}

	obj.SetResourceVersion(current.GetResourceVersion())
	obj.SetAnnotations(mergeAnnotations(current.GetAnnotations(), obj.GetAnnotations()))
	obj.SetFinalizers(current.GetFinalizers())

	_, err = k.Dynamic.Resource(gvr).Namespace(namespace).Update(
		context.Background(),
		obj,
		metav1.UpdateOptions{},
	)

	return err
}

func (k *KubernetesClient) createDynamicNonNamespaced(
	gvr schema.GroupVersionResource,
	obj *unstructured.Unstructured,
) error {
	current, err := k.Dynamic.Resource(gvr).Get(context.TODO(), obj.GetName(), metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			_, err := k.Dynamic.Resource(gvr).Create(
				context.Background(),
				obj,
				metav1.CreateOptions{},
			)

			return err
		}
		return err
	}

	obj.SetResourceVersion(current.GetResourceVersion())
	obj.SetAnnotations(mergeAnnotations(current.GetAnnotations(), obj.GetAnnotations()))
	obj.SetFinalizers(current.GetFinalizers())

	_, err = k.Dynamic.Resource(gvr).Update(
		context.Background(),
		obj,
		metav1.UpdateOptions{},
	)

	return err
}

func (k *KubernetesClient) ApplyCRD(obj *unstructured.Unstructured) error {
	gvr := schema.GroupVersionResource{
		Group:    "apiextensions.k8s.io",
		Version:  "v1",
		Resource: "customresourcedefinitions",
	}

	_, err := k.Dynamic.Resource(gvr).Apply(
		context.Background(),
		obj.GetName(),
		obj,
		metav1.ApplyOptions{
			FieldManager: "cyclops-ctrl",
		},
	)

	return err
}

func copyJobSelectors(source, destination *unstructured.Unstructured) error {
	selectors, ok, err := unstructured.NestedMap(source.Object, "spec", "selector")
	if err != nil {
		return err
	}
	if !ok {
		return errors.New(fmt.Sprintf("job %v selectors not found", source.GetName()))
	}

	templateLabels, ok, err := unstructured.NestedMap(source.Object, "spec", "template", "metadata", "labels")
	if err != nil {
		return err
	}
	if !ok {
		return errors.New(fmt.Sprintf("job %v selectors not found", source.GetName()))
	}

	if err := unstructured.SetNestedMap(destination.Object, selectors, "spec", "selector"); err != nil {
		return err
	}

	return unstructured.SetNestedMap(destination.Object, templateLabels, "spec", "template", "metadata", "labels")
}

func mergePVCWithCurrent(current, obj *unstructured.Unstructured) error {
	requests, ok, err := unstructured.NestedMap(obj.Object, "spec", "resources", "requests")
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("PVC %v spec.resources.requests not found", obj.GetName())
	}

	for key, value := range current.Object {
		obj.Object[key] = value
	}

	return unstructured.SetNestedMap(current.Object, requests, "spec", "resources", "requests")
}

func mergeAnnotations(existing, new map[string]string) map[string]string {
	out := make(map[string]string)

	for k, v := range existing {
		out[k] = v
	}

	for k, v := range new {
		out[k] = v
	}

	return out
}

func (k *KubernetesClient) ListNodes() ([]apiv1.Node, error) {
	nodeList, err := k.clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	return nodeList.Items, err
}

func (k *KubernetesClient) GetNode(name string) (*apiv1.Node, error) {
	return k.clientset.CoreV1().Nodes().Get(context.TODO(), name, metav1.GetOptions{})
}

func (k *KubernetesClient) GetPodsForNode(nodeName string) ([]apiv1.Pod, error) {
	podList, err := k.clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{
		FieldSelector: "spec.nodeName=" + nodeName,
	})
	return podList.Items, err
}

func (k *KubernetesClient) ListNamespaces() ([]string, error) {
	namespaceList, err := k.clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	namespaces := make([]string, 0, len(namespaceList.Items))
	for _, item := range namespaceList.Items {
		namespaces = append(namespaces, item.Name)
	}

	return namespaces, nil
}

func (k *KubernetesClient) isResourceNamespaced(gvk schema.GroupVersionKind) (bool, error) {
	resourcesList, err := k.discovery.ServerPreferredResources()
	if err != nil {
		return false, err
	}

	for _, resource := range resourcesList {
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

func (k *KubernetesClient) clusterApiResources() (*apiResources, error) {
	resourcesList, err := k.discovery.ServerPreferredResources()
	if err != nil {
		return nil, err
	}

	return &apiResources{resourcesList: resourcesList}, nil
}

func isDeployment(group, version, kind string) bool {
	return group == "apps" && version == "v1" && kind == "Deployment"
}

func isDaemonSet(group, version, kind string) bool {
	return group == "apps" && version == "v1" && kind == "DaemonSet"
}

func isStatefulSet(group, version, kind string) bool {
	return group == "apps" && version == "v1" && kind == "StatefulSet"
}

func isPod(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Pod"
}

func isJob(group, version, kind string) bool {
	return group == "batch" && version == "v1" && kind == "Job"
}

func isService(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Service"
}

func isConfigMap(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "ConfigMap"
}

func isPersistentVolumeClaims(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "PersistentVolumeClaim"
}

func isPersistentVolume(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "PersistentVolume"
}

func isSecret(group, version, kind string) bool {
	return group == "" && version == "v1" && kind == "Secret"
}

func isCronJob(group, version, kind string) bool {
	return group == "batch" && version == "v1" && kind == "CronJob"
}

func isRole(group, version, kind string) bool {
	return group == "rbac.authorization.k8s.io" && version == "v1" && kind == "Role"
}

func isNetworkPolicy(group, version, kind string) bool {
	return group == "networking.k8s.io" && version == "v1" && kind == "NetworkPolicy"
}

func isClusterRole(group, version, kind string) bool {
	return group == "rbac.authorization.k8s.io" && version == "v1" && kind == "ClusterRole"
}

func IsWorkload(group, version, kind string) bool {
	return isDeployment(group, version, kind) ||
		isStatefulSet(group, version, kind) ||
		isDaemonSet(group, version, kind)
}

func (k *KubernetesClient) WatchResource(group, version, resource, name, namespace string) (watch.Interface, error) {
	gvr := schema.GroupVersionResource{
		Group:    group,
		Version:  version,
		Resource: resource,
	}

	return k.Dynamic.Resource(gvr).Namespace(namespace).Watch(context.Background(), metav1.ListOptions{
		FieldSelector: "metadata.name=" + name,
	})
}

type ResourceWatchSpec struct {
	GVR       schema.GroupVersionResource
	Namespace string
	Name      string
}

func (k *KubernetesClient) WatchKubernetesResources(gvrs []ResourceWatchSpec, stopCh chan struct{}) (chan *unstructured.Unstructured, error) {
	if len(gvrs) == 0 {
		return nil, errors.New("no gvrs to watch")
	}

	eventChan := make(chan *unstructured.Unstructured, 1)

	startWatch := func(spec ResourceWatchSpec) {
		go func() {
			resourceClient := k.Dynamic.Resource(spec.GVR).Namespace(spec.Namespace)

			informer := cache.NewSharedInformer(
				&cache.ListWatch{
					ListFunc: func(options metav1.ListOptions) (runtime.Object, error) {
						options.FieldSelector = "metadata.name=" + spec.Name
						return resourceClient.List(context.TODO(), options)
					},
					WatchFunc: func(options metav1.ListOptions) (watch.Interface, error) {
						options.FieldSelector = "metadata.name=" + spec.Name
						return resourceClient.Watch(context.TODO(), options)
					},
				},
				&unstructured.Unstructured{},
				0,
			)

			informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
				AddFunc: func(obj interface{}) {
					eventChan <- obj.(*unstructured.Unstructured)
				},
				UpdateFunc: func(oldObj, newObj interface{}) {
					eventChan <- newObj.(*unstructured.Unstructured)
				},
				DeleteFunc: func(obj interface{}) {
					eventChan <- obj.(*unstructured.Unstructured)
				},
			})

			informer.Run(stopCh)
		}()
	}

	for _, gvr := range gvrs {
		startWatch(gvr)
	}

	return eventChan, nil
}
