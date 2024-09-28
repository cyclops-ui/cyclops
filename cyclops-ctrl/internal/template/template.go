package template

import (
	"fmt"

	"github.com/pkg/errors"

	"github.com/dgraph-io/ristretto"
	"helm.sh/helm/v3/pkg/registry"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
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
	ReturnCache() *ristretto.Cache
}

func NewRepo(credResolver auth.TemplatesResolver, tc templateCache) *Repo {
	return &Repo{
		credResolver: credResolver,
		cache:        tc,
	}
}

func (r Repo) GetTemplate(
	repo string,
	path string,
	version string,
	resolvedVersion string,
	source cyclopsv1alpha1.TemplateSource,
) (*models.Template, error) {
	var err error

	if len(source) == 0 {
		source, err = r.assumeTemplateSource(repo)
		if err != nil {
			return nil, err
		}
	}

	return r.getTemplate(repo, path, version, resolvedVersion, source)
}

func (r Repo) getTemplate(
	repo string,
	path string,
	version string,
	resolvedVersion string,
	source cyclopsv1alpha1.TemplateSource,
) (*models.Template, error) {
	switch source {
	case cyclopsv1alpha1.TemplateSourceOCI:
		return r.LoadOCIHelmChart(repo, path, version, resolvedVersion)
	case cyclopsv1alpha1.TemplateSourceHelm:
		return r.LoadHelmChart(repo, path, version, resolvedVersion)
	case cyclopsv1alpha1.TemplateSourceGit:
		return r.LoadTemplate(repo, path, version, resolvedVersion)
	default:
		return nil, errors.New(fmt.Sprintf("unsupported template source: %v", source))
	}
}

func (r Repo) GetTemplateInitialValues(repo, path, version string) (map[string]interface{}, error) {
	// region load OCI chart
	if registry.IsOCI(repo) {
		return r.LoadOCIHelmChartInitialValues(repo, path, version)
	}
	// endregion

	// region load from Helm repo
	isHelmRepo, err := IsHelmRepo(repo)
	if err != nil {
		return nil, err
	}

	if isHelmRepo {
		return r.LoadHelmChartInitialValues(repo, path, version)
	}
	// endregion

	// fallback to cloning from git
	return r.LoadInitialTemplateValues(repo, path, version)
}

func (r Repo) loadDependencies(metadata *helm.Metadata) ([]*models.Template, error) {
	deps := make([]*models.Template, 0)
	for _, dependency := range metadata.Dependencies {
		if len(dependency.Repository) == 0 || len(dependency.Name) == 0 {
			continue
		}

		dep, err := r.GetTemplate(dependency.Repository, dependency.Name, dependency.Version, "", "")
		if err != nil {
			return nil, err
		}

		dep.Condition = dependency.Condition

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

func (r Repo) assumeTemplateSource(repo string) (cyclopsv1alpha1.TemplateSource, error) {
	if registry.IsOCI(repo) {
		return cyclopsv1alpha1.TemplateSourceOCI, nil
	}

	isHelmRepo, err := IsHelmRepo(repo)
	if err != nil {
		return "", err
	}

	if isHelmRepo {
		return cyclopsv1alpha1.TemplateSourceOCI, nil
	}

	return cyclopsv1alpha1.TemplateSourceGit, nil
}

func (r Repo) ReturnCache() *ristretto.Cache {
	return r.cache.ReturnCache()
}
