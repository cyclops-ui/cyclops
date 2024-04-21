package template

import (
	json "github.com/json-iterator/go"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/registry"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/auth"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
)

type Repo struct {
	credResolver auth.TemplatesResolver
	cache        templateCache
}

type templateCache interface {
	GetTemplate(repo, path, version string) (*models.Template, bool)
	SetTemplate(repo, path, version string, template *models.Template)
	GetTemplateInitialValues(repo, path, version string) (map[interface{}]interface{}, bool)
	SetTemplateInitialValues(repo, path, version string, values map[interface{}]interface{})
}

func NewRepo(credResolver auth.TemplatesResolver, tc templateCache) *Repo {
	return &Repo{
		credResolver: credResolver,
		cache:        tc,
	}
}

func (r Repo) GetTemplate(repo, path, version string) (*models.Template, error) {
	// region load OCI chart
	if registry.IsOCI(repo) {
		return r.LoadOCIHelmChart(repo, path, version)
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

	// fallback to cloning from git
	return r.LoadTemplate(repo, path, version)
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
		depInitialValuesData, err := r.GetTemplateInitialValues(dependency.Repository, dependency.Name, dependency.Version)
		if err != nil {
			return nil, err
		}

		var depInitialValues interface{}
		if err := json.Unmarshal(depInitialValuesData, &depInitialValues); err != nil {
			panic(err)
		}

		initialValues[dependency.Name] = depInitialValues
	}

	return initialValues, nil
}
