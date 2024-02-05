package template

import (
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	json "github.com/json-iterator/go"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/registry"
)

type Repo struct {
	cache templateCache
}

type templateCache interface {
	Get(repo, path, version string) (*models.Template, bool)
	Set(repo, path, version string, template *models.Template)
}

func NewRepo(tc templateCache) *Repo {
	return &Repo{
		cache: tc,
	}
}

func (r Repo) GetTemplate(repo, path, version string) (*models.Template, error) {
	cached, ok := r.cache.Get(repo, path, version)
	if ok {
		return cached, nil
	}

	// region load OCI chart
	if registry.IsOCI(repo) {
		template, err := r.LoadOCIHelmChart(repo, path, version)
		if err != nil {
			return nil, err
		}

		r.cache.Set(repo, path, version, template)
		return template, nil
	}
	// endregion

	// region load from Helm repo
	isHelmRepo, err := IsHelmRepo(repo)
	if err != nil {
		return nil, err
	}

	if isHelmRepo {
		return r.LoadHelmChart(repo, path, version)
	}
	// endregion

	template, err := r.LoadTemplate(repo, path, version)
	if err != nil {
		return nil, err
	}

	r.cache.Set(repo, path, version, template)
	return template, nil
}

func (r Repo) GetTemplateInitialValues(repo, path, version string) ([]byte, error) {
	// region load OCI chart
	if registry.IsOCI(repo) {
		initial, err := r.LoadOCIHelmChartInitialValues(repo, path, version)
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
		initial, err := r.LoadHelmChartInitialValues(repo, path, version)
		if err != nil {
			return nil, err
		}

		return json.Marshal(initial)
	}
	// endregion

	// fallback to cloning from git
	initial, err := r.LoadInitialTemplateValues(repo, path, version)
	if err != nil {
		return nil, err
	}

	return json.Marshal(initial)
}

func (r Repo) loadDependencies(metadata helmchart.Metadata) ([]*models.Template, error) {
	deps := make([]*models.Template, 0)
	for _, dependency := range metadata.Dependencies {
		dep, err := r.GetTemplate(dependency.Repository, dependency.Name, dependency.Version)
		if err != nil {
			return nil, err
		}

		deps = append(deps, dep)
	}

	return deps, nil
}

func (r Repo) loadDependenciesInitialValues(metadata helmchart.Metadata) (map[interface{}]interface{}, error) {
	initialValues := make(map[interface{}]interface{})
	for _, dependency := range metadata.Dependencies {
		depInitialValues, err := r.GetTemplateInitialValues(dependency.Repository, dependency.Name, dependency.Version)
		if err != nil {
			return nil, err
		}

		initialValues[dependency.Name] = depInitialValues
	}

	return initialValues, nil
}
