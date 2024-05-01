package render

import (
	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	json "github.com/json-iterator/go"
	helmchart "helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/engine"
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

	versionInfo, err := r.k8sClient.VersionInfo()
	if err != nil {
		return "", err
	}

	top["Capabilities"] = Capabilities{
		KubeVersion: CapabilitiesKubeVersion{
			Version:    versionInfo.String(),
			GitVersion: versionInfo.GitVersion,
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
