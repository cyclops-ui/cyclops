package helm

import (
	"fmt"
	"io"
	"log"
	"path"
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
}

func NewReleaseClient(namespace string) *ReleaseClient {
	return &ReleaseClient{
		namespace: strings.TrimSpace(namespace),
	}
}

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
		fmt.Println(dependency.Repository, dependency.Name, path.Join(dependency.Repository, dependency.Name))
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
