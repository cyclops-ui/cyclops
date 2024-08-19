package render

import (
	"sort"
	"strings"

	json "github.com/json-iterator/go"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/engine"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
)

type Renderer struct {
	k8sClient *k8sclient.KubernetesClient
}

func NewRenderer(kubernetesClient *k8sclient.KubernetesClient) *Renderer {
	return &Renderer{
		k8sClient: kubernetesClient,
	}
}

func (r *Renderer) HelmTemplate(module cyclopsv1alpha1.Module, moduleTemplate *models.Template) (string, error) {
	if moduleTemplate == nil {
		return "", nil
	}

	chart := &helmchart.Chart{
		Raw:       []*helmchart.File{},
		Metadata:  mapMetadata(moduleTemplate.HelmChartMetadata),
		Lock:      &helmchart.Lock{},
		Values:    map[string]interface{}{},
		Schema:    []byte{},
		Files:     moduleTemplate.Files,
		Templates: moduleTemplate.Templates,
	}

	for _, dependency := range moduleTemplate.Dependencies {
		chart.AddDependency(&helmchart.Chart{
			Raw:       []*helmchart.File{},
			Metadata:  mapMetadata(dependency.HelmChartMetadata),
			Lock:      &helmchart.Lock{},
			Values:    map[string]interface{}{},
			Schema:    []byte{},
			Files:     dependency.Files,
			Templates: dependency.Templates,
		})
	}

	values := make(chartutil.Values)
	if err := json.Unmarshal(module.Spec.Values.Raw, &values); err != nil {
		return "", err
	}

	top := make(chartutil.Values)
	top["Values"] = values
	top["Release"] = map[string]interface{}{
		"Name":      module.Name,
		"Namespace": "default",
	}

	versionInfo, err := r.k8sClient.VersionInfo()
	if err != nil {
		return "", err
	}

	top["Capabilities"] = Capabilities{
		KubeVersion: CapabilitiesKubeVersion{
			Version:    versionInfo.String(),
			Minor:      versionInfo.Minor,
			Major:      versionInfo.Major,
			GitVersion: versionInfo.GitVersion,
		},
	}

	out, err := engine.Render(chart, top)
	if err != nil {
		return "", err
	}

	filenames := make([]string, 0, len(out))
	for filename := range out {
		filenames = append(filenames, filename)
	}

	sort.Strings(filenames)

	manifest := ""
	for _, filename := range filenames {
		renderedManifest := out[filename]

		if len(strings.TrimSpace(renderedManifest)) == 0 {
			continue
		}

		manifest += renderedManifest
		manifest += "\n---\n"
	}

	return manifest, err
}

func mapMetadata(metadata *helm.Metadata) *helmchart.Metadata {
	dependencies := make([]*helmchart.Dependency, 0, len(metadata.Dependencies))
	for _, dependency := range metadata.Dependencies {
		dependencies = append(dependencies, &helmchart.Dependency{
			Name:         dependency.Name,
			Version:      dependency.Version,
			Repository:   dependency.Repository,
			Condition:    dependency.Condition,
			Tags:         dependency.Tags,
			Enabled:      dependency.Enabled,
			ImportValues: dependency.ImportValues,
			Alias:        dependency.Alias,
		})
	}

	maintainers := make([]*helmchart.Maintainer, 0, len(metadata.Maintainers))
	for _, maintainer := range metadata.Maintainers {
		maintainers = append(maintainers, &helmchart.Maintainer{
			Name:  maintainer.Name,
			Email: maintainer.Email,
			URL:   maintainer.URL,
		})
	}

	return &helmchart.Metadata{
		Name:         metadata.Name,
		Home:         metadata.Home,
		Sources:      metadata.Sources,
		Version:      metadata.Version,
		Description:  metadata.Description,
		Keywords:     metadata.Keywords,
		Maintainers:  maintainers,
		Icon:         metadata.Icon,
		APIVersion:   metadata.APIVersion,
		Condition:    metadata.Condition,
		Tags:         metadata.Tags,
		AppVersion:   metadata.AppVersion,
		Deprecated:   metadata.Deprecated,
		Annotations:  metadata.Annotations,
		KubeVersion:  metadata.KubeVersion,
		Dependencies: dependencies,
		Type:         metadata.Type,
	}
}

type CapabilitiesKubeVersion struct {
	Version    string
	Minor      string
	Major      string
	GitVersion string
}

type Capabilities struct {
	APIVersions chartutil.VersionSet
	KubeVersion CapabilitiesKubeVersion
}
