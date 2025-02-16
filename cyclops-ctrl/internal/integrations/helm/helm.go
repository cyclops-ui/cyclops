package helm

import (
	"fmt"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
	"io"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"log"
	"sort"
	"strings"

	"github.com/pkg/errors"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/registry"
	"helm.sh/helm/v3/pkg/release"
)

type ReleaseClient struct {
	namespace string
	k8sClient k8sclient.IKubernetesClient
}

func NewReleaseClient(namespace string, k8sClient k8sclient.IKubernetesClient) *ReleaseClient {
	return &ReleaseClient{
		namespace: strings.TrimSpace(namespace),
		k8sClient: k8sClient,
	}
}

func noopLogger(format string, v ...interface{}) {}

func (r *ReleaseClient) ListReleases() ([]*release.Release, error) {
	settings := cli.New()

	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(settings.RESTClientGetter(), r.namespace, "", log.Printf); err != nil {
		return nil, err
	}

	client := action.NewList(actionConfig)

	return client.Run()
}

func (r *ReleaseClient) GetRelease(namespace, name string) (*release.Release, error) {
	if len(r.namespace) > 0 && namespace != r.namespace {
		return nil, errors.New(fmt.Sprintf("invalid namespace provided: %v", namespace))
	}

	settings := cli.New()
	settings.SetNamespace(namespace)

	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(settings.RESTClientGetter(), namespace, "", log.Printf); err != nil {
		return nil, err
	}

	client := action.NewGet(actionConfig)

	return client.Run(name)
}

func (r *ReleaseClient) UninstallRelease(namespace, name string) error {
	if len(r.namespace) > 0 && namespace != r.namespace {
		return errors.New(fmt.Sprintf("invalid namespace provided: %v", namespace))
	}

	settings := cli.New()
	settings.SetNamespace(namespace)

	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(settings.RESTClientGetter(), namespace, "", log.Printf); err != nil {
		return err
	}

	client := action.NewUninstall(actionConfig)

	_, err := client.Run(name)
	return err
}

func (r *ReleaseClient) UpgradeRelease(
	namespace string,
	name string,
	values map[string]interface{},
	current *release.Release,
) error {
	if len(r.namespace) > 0 && namespace != r.namespace {
		return errors.New(fmt.Sprintf("invalid namespace provided: %v", namespace))
	}

	settings := cli.New()
	settings.SetNamespace(namespace)

	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(settings.RESTClientGetter(), namespace, "", log.Printf); err != nil {
		return err
	}

	client := action.NewUpgrade(actionConfig)
	client.Namespace = namespace

	registryClient, err := registry.NewClient(registry.ClientOptWriter(io.Discard))
	if err != nil {
		return err
	}

	client.SetRegistryClient(registryClient)

	for _, dependency := range current.Chart.Metadata.Dependencies {
		fp, err := client.LocateChart(dependency.Repository+"/"+dependency.Name, cli.New())
		if err != nil {
			return errors.Wrap(err, "failed to locate dependency chart")
		}

		chart, err := loader.Load(fp)
		if err != nil {
			return errors.Wrap(err, "failed to locate dependency chart")
		}

		current.Chart.AddDependency(chart)
	}

	_, err = client.Run(name, current.Chart, values)
	return err
}

func (r *ReleaseClient) ListResources(namespace string, name string) ([]dto.Resource, error) {
	if len(r.namespace) > 0 && namespace != r.namespace {
		return nil, errors.New(fmt.Sprintf("invalid namespace provided: %v", namespace))
	}

	settings := cli.New()
	settings.SetNamespace(namespace)

	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(settings.RESTClientGetter(), namespace, "", noopLogger); err != nil {
		return nil, err
	}

	client := action.NewStatus(actionConfig)
	client.ShowResources = true

	releaseStatus, err := client.Run(name)
	if err != nil {
		return nil, err
	}

	if releaseStatus.Info == nil {
		return nil, errors.New("empty release info resources")
	}

	out := make([]dto.Resource, 0, 0)
	for gv, objs := range releaseStatus.Info.Resources {
		if strings.HasSuffix(gv, "(related)") {
			continue
		}

		for _, obj := range objs {
			u, err := runtime.DefaultUnstructuredConverter.ToUnstructured(obj)
			if err != nil {
				return nil, err
			}

			res, err := r.k8sClient.MapUnstructuredResource(unstructured.Unstructured{Object: u})
			if err != nil {
				return nil, err
			}

			out = append(out, res)
		}
	}

	sort.Slice(out, func(i, j int) bool {
		if out[i].GetGroupVersionKind() != out[j].GetGroupVersionKind() {
			return out[i].GetGroupVersionKind() < out[j].GetGroupVersionKind()
		}

		return out[i].GetName() < out[j].GetName()
	})

	return out, nil
}

func (r *ReleaseClient) ListWorkloadsForRelease(namespace, name string) ([]dto.Resource, error) {
	resources, err := r.ListResources(namespace, name)
	if err != nil {
		return nil, err
	}

	workloads := make([]dto.Resource, 0, 0)
	for _, resource := range resources {
		if resource.GetGroup() == "apps" &&
			resource.GetVersion() == "v1" &&
			(resource.GetKind() == "Deployment" || resource.GetKind() == "DaemonSet" || resource.GetKind() == "StatefulSet") {
			workloads = append(workloads, resource)
		}
	}

	return workloads, nil
}
