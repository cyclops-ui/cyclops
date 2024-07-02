package template

import (
	"helm.sh/helm/v3/pkg/registry"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/auth"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
)

type Repo struct {
	credResolver auth.TemplatesResolver
	cache        templateCache
}

type templateCache interface {
	GetTemplate(repo, path, version string) (*models.Template, bool)
	SetTemplate(repo, path, version string, template *models.Template)
	GetTemplateInitialValues(repo, path, version string) (map[string]interface{}, bool)
	SetTemplateInitialValues(repo, path, version string, values map[string]interface{})
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

func (r Repo) GetTemplateInitialValues(repo, path, version string) (map[string]interface{}, error) {
	// region load OCI chart
	if registry.IsOCI(repo) {
		initial, err := r.LoadOCIHelmChartInitialValues(repo, path, version)
		if err != nil {
			return nil, err
		}

		return initial, err
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

		return initial, err
	}
	// endregion

	// fallback to cloning from git
	initial, err := r.LoadInitialTemplateValues(repo, path, version)
	if err != nil {
		return nil, err
	}

	return initial, err
}

func (r Repo) loadDependencies(metadata *helm.Metadata) ([]*models.Template, error) {
	deps := make([]*models.Template, 0)
	for _, dependency := range metadata.Dependencies {
		if len(dependency.Repository) == 0 || len(dependency.Name) == 0 {
			continue
		}

		dep, err := r.GetTemplate(dependency.Repository, dependency.Name, dependency.Version)
		if err != nil {
			return nil, err
		}

		deps = append(deps, dep)
	}

	return deps, nil
}

func (r Repo) loadDependenciesInitialValues(metadata *helm.Metadata) (map[string]interface{}, error) {
	initialValues := make(map[string]interface{})
	for _, dependency := range metadata.Dependencies {
		if len(dependency.Repository) == 0 || len(dependency.Name) == 0 {
			continue
		}

		depInitialValues, err := r.GetTemplateInitialValues(dependency.Repository, dependency.Name, dependency.Version)
		if err != nil {
			return nil, err
		}

		initialValues[dependency.Name] = depInitialValues
	}

	return initialValues, nil
}
