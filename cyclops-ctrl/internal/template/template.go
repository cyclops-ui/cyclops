package template

import (
	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	json "github.com/json-iterator/go"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/engine"
)

func HelmTemplate(module cyclopsv1alpha1.Module, moduleTemplate models.Template) (string, error) {
	chart := &chart.Chart{
		Raw:      []*chart.File{},
		Metadata: &chart.Metadata{},
		Lock:     &chart.Lock{},
		Values:   map[string]interface{}{},
		Schema:   []byte{},
		Files:    moduleTemplate.Files,
		Templates: []*chart.File{
			{
				Name: "all.yaml",
				Data: []byte(moduleTemplate.Manifest),
			},
		},
	}

	values := make(chartutil.Values)
	if err := json.Unmarshal(module.Spec.Values.Raw, &values); err != nil {
		return "", err
	}

	top := make(chartutil.Values)
	top["Values"] = values
	top["Release"] = map[string]interface{}{
		"Name":      "",
		"Namespace": "",
	}

	out, err := engine.Render(chart, top)
	if err != nil {
		//fmt.Println(moduleTemplate.Manifest)
		return "", err
	}

	return out["all.yaml"], err
}
