package template

import (
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	json "github.com/json-iterator/go"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/registry"
)

func GetTemplate(repo, path, version string) (*models.Template, error) {
	// region load OCI chart
	if registry.IsOCI(repo) {
		return LoadOCIHelmChart(repo, path, version)
	}
	// endregion

	// region load from Helm repo
	isHelmRepo, err := IsHelmRepo(repo)
	if err != nil {
		return nil, err
	}

	if isHelmRepo {
		return LoadHelmChart(repo, path, version)
	}
	// endregion

	// fallback to cloning from git
	return LoadTemplate(repo, path, version)
}

func GetTemplateInitialValues(repo, path, version string) ([]byte, error) {
	// region load OCI chart
	if registry.IsOCI(repo) {
		initial, err := LoadOCIHelmChartInitialValues(repo, path, version)
		if err != nil {
			return nil, err
		}

		return json.Marshal(initial)
	}
	// endregion

	// region load from Helm repo
	isHelmRepo, err := IsHelmRepo(repo)
	if err != nil {
		return nil, err
	}

	if isHelmRepo {
		initial, err := LoadHelmChartInitialValues(repo, path, version)
		if err != nil {
			return nil, err
		}

		return json.Marshal(initial)
	}
	// endregion

	// fallback to cloning from git
	initial, err := LoadInitialTemplateValues(repo, path, version)
	if err != nil {
		return nil, err
	}

	return json.Marshal(initial)
}

func loadDependencies(metadata helmchart.Metadata) ([]*models.Template, error) {
	deps := make([]*models.Template, 0)
	for _, dependency := range metadata.Dependencies {
		dep, err := GetTemplate(dependency.Repository, dependency.Name, dependency.Version)
		if err != nil {
			return nil, err
		}

		deps = append(deps, dep)
	}

	return deps, nil
}

func loadDependenciesInitialValues(metadata helmchart.Metadata) (map[interface{}]interface{}, error) {
	initialValues := make(map[interface{}]interface{})
	for _, dependency := range metadata.Dependencies {
		depInitialValues, err := GetTemplateInitialValues(dependency.Repository, dependency.Name, dependency.Version)
		if err != nil {
			return nil, err
		}

		initialValues[dependency.Name] = depInitialValues
	}

	return initialValues, nil
}
