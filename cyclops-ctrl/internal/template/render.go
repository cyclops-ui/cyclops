package template

import (
	json "github.com/json-iterator/go"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/engine"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
)

func HelmTemplate(module cyclopsv1alpha1.Module, moduleTemplate *models.Template) (string, error) {
	if moduleTemplate == nil {
		return "", nil
	}

	chart := &helmchart.Chart{
		Raw:       []*helmchart.File{},
		Metadata:  &helmchart.Metadata{},
		Lock:      &helmchart.Lock{},
		Values:    map[string]interface{}{},
		Schema:    []byte{},
		Files:     moduleTemplate.Files,
		Templates: moduleTemplate.Templates,
	}

	for _, dependency := range moduleTemplate.Dependencies {
		chart.AddDependency(&helmchart.Chart{
			Raw: []*helmchart.File{},
			Metadata: &helmchart.Metadata{
				Name: dependency.Name,
			},
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
		"Namespace": "",
	}

	type CapabilitiesKubeVersion struct {
		Version    string
		GitVersion string
	}

	type Capabilities struct {
		APIVersions chartutil.VersionSet
		KubeVersion CapabilitiesKubeVersion
	}

	top["Capabilities"] = Capabilities{
		KubeVersion: CapabilitiesKubeVersion{
			Version:    "v1.29.0",
			GitVersion: "2.39.3",
		},
	}

	out, err := engine.Render(chart, top)
	if err != nil {
		return "", err
	}

	manifest := ""
	for _, rendererManifest := range out {
		manifest += rendererManifest
		manifest += "\n---\n"
	}

	return manifest, err
}
