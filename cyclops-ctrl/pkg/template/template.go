package template

import (
	"fmt"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/auth"

	"github.com/pkg/errors"

	"github.com/dgraph-io/ristretto"
	"helm.sh/helm/v3/pkg/registry"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
)

type ITemplateRepo interface {
	GetTemplate(
		repo string,
		path string,
		version string,
		resolvedVersion string,
		CRDName string,
		source cyclopsv1alpha1.TemplateSourceType,
	) (*models.Template, error)
	GetTemplateInitialValues(
		repo string,
		path string,
		version string,
		CRDName string,
		source cyclopsv1alpha1.TemplateSourceType,
	) (map[string]interface{}, error)
	ReturnCache() *ristretto.Cache
}

type Repo struct {
	credResolver auth.TemplatesResolver
	cache        templateCache
	k8sClient    *k8sclient.KubernetesClient
}

type templateCache interface {
	GetTemplate(repo, path, version, sourceType string) (*models.Template, bool)
	SetTemplate(repo, path, version, sourceType string, template *models.Template)
	GetTemplateInitialValues(repo, path, version, sourceType string) (map[string]interface{}, bool)
	SetTemplateInitialValues(repo, path, version, sourceType string, values map[string]interface{})
	ReturnCache() *ristretto.Cache
}

func NewRepo(credResolver auth.TemplatesResolver, tc templateCache, k8sClient *k8sclient.KubernetesClient) ITemplateRepo {
	return &Repo{
		credResolver: credResolver,
		cache:        tc,
		k8sClient:    k8sClient,
	}
}

func (r Repo) GetTemplate(
	repo string,
	path string,
	version string,
	resolvedVersion string,
	CRDName string,
	source cyclopsv1alpha1.TemplateSourceType,
) (*models.Template, error) {
	var err error
	if len(source) == 0 {
		source, err = r.assumeTemplateSourceType(repo)
		if err != nil {
			return nil, err
		}
	}

	return r.getTemplate(repo, path, version, resolvedVersion, CRDName, source)
}

func (r Repo) getTemplate(
	repo string,
	path string,
	version string,
	resolvedVersion string,
	CRDName string,
	source cyclopsv1alpha1.TemplateSourceType,
) (*models.Template, error) {
	switch source {
	case cyclopsv1alpha1.TemplateSourceTypeOCI:
		return r.LoadOCIHelmChart(repo, path, version, resolvedVersion)
	case cyclopsv1alpha1.TemplateSourceTypeHelm:
		return r.LoadHelmChart(repo, path, version, resolvedVersion)
	case cyclopsv1alpha1.TemplateSourceTypeGit:
		return r.LoadTemplate(repo, path, version, resolvedVersion)
	case cyclopsv1alpha1.TemplateSourceTypeCRD:
		return r.GetTemplateCRDs(CRDName)
	default:
		return nil, errors.New(fmt.Sprintf("unsupported template source: %v", source))
	}
}

func (r Repo) GetTemplateInitialValues(
	repo string,
	path string,
	version string,
	CRDName string,
	source cyclopsv1alpha1.TemplateSourceType,
) (map[string]interface{}, error) {
	var err error
	if len(source) == 0 {
		source, err = r.assumeTemplateSourceType(repo)
		if err != nil {
			return nil, err
		}
	}

	return r.getTemplateInitialValues(repo, path, version, CRDName, source)
}

func (r Repo) getTemplateInitialValues(
	repo string,
	path string,
	version string,
	CRDName string,
	source cyclopsv1alpha1.TemplateSourceType,
) (map[string]interface{}, error) {
	switch source {
	case cyclopsv1alpha1.TemplateSourceTypeOCI:
		return r.LoadOCIHelmChartInitialValues(repo, path, version)
	case cyclopsv1alpha1.TemplateSourceTypeHelm:
		return r.LoadHelmChartInitialValues(repo, path, version)
	case cyclopsv1alpha1.TemplateSourceTypeGit:
		return r.LoadInitialTemplateValues(repo, path, version)
	case cyclopsv1alpha1.TemplateSourceTypeCRD:
		return r.LoadInitialTemplateValuesCRD(CRDName)
	default:
		return nil, errors.New(fmt.Sprintf("unsupported template source: %v", source))
	}
}

func (r Repo) loadDependencies(metadata *helm.Metadata) ([]*models.Template, error) {
	deps := make([]*models.Template, 0)
	for _, dependency := range metadata.Dependencies {
		if len(dependency.Repository) == 0 || len(dependency.Name) == 0 {
			continue
		}

		dep, err := r.GetTemplate(dependency.Repository, dependency.Name, dependency.Version, "", "", "")
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

		depInitialValues, err := r.GetTemplateInitialValues(dependency.Repository, dependency.Name, dependency.Version, "", "")
		if err != nil {
			return nil, err
		}

		initialValues[dependency.Name] = depInitialValues
	}

	return initialValues, nil
}

func (r Repo) assumeTemplateSourceType(repo string) (cyclopsv1alpha1.TemplateSourceType, error) {
	if registry.IsOCI(repo) {
		return cyclopsv1alpha1.TemplateSourceTypeOCI, nil
	}

	isHelmRepo, err := IsHelmRepo(repo)
	if err != nil {
		return "", err
	}

	if isHelmRepo {
		return cyclopsv1alpha1.TemplateSourceTypeHelm, nil
	}

	return cyclopsv1alpha1.TemplateSourceTypeGit, nil
}

func (r Repo) ReturnCache() *ristretto.Cache {
	return r.cache.ReturnCache()
}
