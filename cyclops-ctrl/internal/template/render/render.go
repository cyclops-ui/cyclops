package render

import (
	"sort"
	"strings"

	json "github.com/json-iterator/go"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/engine"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
)

type Renderer struct {
	k8sClient k8sclient.IKubernetesClient
}

func NewRenderer(kubernetesClient k8sclient.IKubernetesClient) *Renderer {
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
		Schema:    moduleTemplate.RawSchema,
		Files:     moduleTemplate.Files,
		Templates: moduleTemplate.Templates,
	}

	values := make(chartutil.Values)
	if err := json.Unmarshal(module.Spec.Values.Raw, &values); err != nil {
		return "", err
	}

	for _, dependency := range moduleTemplate.Dependencies {
		if !evaluateDependencyCondition(dependency.Condition, values) {
			continue
		}

		chart.AddDependency(&helmchart.Chart{
			Raw:       []*helmchart.File{},
			Metadata:  mapMetadata(dependency.HelmChartMetadata),
			Lock:      &helmchart.Lock{},
			Values:    map[string]interface{}{},
			Schema:    dependency.RawSchema,
			Files:     dependency.Files,
			Templates: dependency.Templates,
		})
	}

	top := make(chartutil.Values)
	top["Values"] = values
	top["Release"] = map[string]interface{}{
		"Name":      module.Name,
		"Namespace": mapTargetNamespace(module.Spec.TargetNamespace),
		"Service":   "Helm",
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

	// TODO fix dependency validation
	//if len(chart.Schema) != 0 {
	//	if err := chartutil.ValidateAgainstSchema(chart, values); err != nil {
	//		return "", err
	//	}
	//}

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

func evaluateDependencyCondition(condition string, values map[string]interface{}) bool {
	if len(condition) == 0 {
		return true
	}

	keys := strings.Split(condition, ".")
	var current interface{} = values

	for _, key := range keys {
		if m, ok := current.(map[string]interface{}); ok {
			if val, exists := m[key]; exists {
				current = val
			} else {
				return false
			}
		} else {
			return false
		}
	}

	if result, ok := current.(bool); ok {
		return result
	}

	return false
}

func mapTargetNamespace(namespace string) string {
	if len(namespace) == 0 {
		return "default"
	}

	return namespace
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
