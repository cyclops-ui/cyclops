package template

import (
	"bytes"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/engine"
	"text/template"

	"github.com/cyclops-ui/cycops-ctrl/internal/models"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/crd/v1alpha1"
)

// TemplateModule
//
// Deprecated: use HelmTemplate
func TemplateModule(module v1alpha1.Module, moduleTemplate models.Template) (string, error) {
	tmpl, err := template.New("manifest").Parse(moduleTemplate.Manifest)
	if err != nil {
		return "", err
	}

	values := make(map[string]interface{}, 0)

	for _, value := range module.Spec.Values {
		values[value.Name] = value.Value
	}

	type TemplateStruct struct {
		Fields map[string]interface{}
	}

	var buff bytes.Buffer
	if err = tmpl.Execute(&buff, TemplateStruct{Fields: values}); err != nil {
		return "", err
	}

	return buff.String(), nil
}

//func getHelmChart() {
//	// Define the chart repository URL
//	repoURL := "https://helm.github.io/examples"
//
//	chartRepo, err := repo.NewChartRepository(&repo.Entry{
//		Name: "helm-demo",
//		URL:  repoURL,
//	}, getter.All(&cli.EnvSettings{}))
//	if err != nil {
//		fmt.Printf("Failed to initialize chart repository: %s\n", err)
//		os.Exit(1)
//	}
//
//	fmt.Println(chartRepo)
//	fmt.Println(chartRepo.Config)
//
//	loader.
//
//}

func HelmTemplate(module v1alpha1.Module, moduleTemplate models.Template) (string, error) {
	//getHelmChart()

	chart := &chart.Chart{
		Raw:      []*chart.File{},
		Metadata: &chart.Metadata{},
		Lock:     &chart.Lock{},
		Values:   map[string]interface{}{},
		Schema:   []byte{},
		Files:    []*chart.File{},
		Templates: []*chart.File{
			{
				Name: "all.yaml",
				Data: []byte(moduleTemplate.Manifest),
			},
		},
	}

	values := make(chartutil.Values)
	for _, value := range module.Spec.Values {
		values[value.Name] = value.Value
	}

	top := make(chartutil.Values)
	top["Values"] = values

	out, err := engine.Render(chart, top)
	if err != nil {
		return "", err
	}

	return out["all.yaml"], err
}
