package template

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
	"helm.sh/helm/v3/pkg/chart"
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/engine"

	cyclopsv1alpha1 "github.com/cyclops-ui/cycops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cycops-ctrl/internal/models"
)

// TemplateModule
//
// Deprecated: use HelmTemplate
//func TemplateModule(module v1alpha1.Module, moduleTemplate models.Template) (string, error) {
//	tmpl, err := template.New("manifest").Parse(moduleTemplate.Manifest)
//	if err != nil {
//		return "", err
//	}
//
//	values := make(map[string]interface{}, 0)
//
//	for _, value := range module.Spec.Values {
//		values[value.Name] = value.Value
//	}
//
//	type TemplateStruct struct {
//		Fields map[string]interface{}
//	}
//
//	var buff bytes.Buffer
//	if err = tmpl.Execute(&buff, TemplateStruct{Fields: values}); err != nil {
//		return "", err
//	}
//
//	return buff.String(), nil
//}

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

	fields := flatten(moduleTemplate)

	values := make(chartutil.Values)
	for _, value := range module.Spec.Values {
		switch fields[value.Name].Type {
		case "boolean":
			asBool, _ := strconv.ParseBool(value.Value)
			values = setObjectValue(strings.Split(value.Name, "."), asBool, values)
		case "string":
			values = setObjectValue(strings.Split(value.Name, "."), value.Value, values)
		case "number":
			values = setObjectValue(strings.Split(value.Name, "."), value.Value, values)
		case "array":
			var asArray []map[string]interface{}
			if err := json.Unmarshal([]byte(value.Value), &asArray); err != nil {
				return "", err
			}

			for i, arrayValue := range asArray {
				for k, v := range arrayValue {
					//values = setObjectValue(strings.Split(k, "."), v, values)
					values = setObjectValue(strings.Split(strings.Join([]string{value.Name, fmt.Sprint(i), k}, "."), "."), v, values)
				}
			}
		case "map":
			var keyValues []dto.KeyValue
			if err := json.Unmarshal([]byte(value.Value), &keyValues); err != nil {
				return "", err
			}

			asMap := make(map[string]string)
			for _, kv := range keyValues {
				asMap[kv.Key] = kv.Value
			}

			values = setObjectValue(strings.Split(value.Name, "."), asMap, values)
		}
	}

	top := make(chartutil.Values)
	top["Values"] = values
	top["Release"] = map[string]interface{}{
		"Name":      "",
		"Namespace": "",
	}

	data, err := json.Marshal(values)
	fmt.Println(string(data))

	out, err := engine.Render(chart, top)
	if err != nil {
		fmt.Println("prije")
		fmt.Println(string(data))
		//fmt.Println(moduleTemplate.Manifest)
		return "", err
	}

	return out["all.yaml"], err
}

func flatten(template models.Template) map[string]models.Field {
	fields := make(map[string]models.Field)

	for _, field := range template.Fields {
		for _, child := range flattenField(field) {
			fields[child.Name] = child
		}
	}

	return fields
}

func flattenField(field models.Field) []models.Field {
	if len(field.Properties) == 0 {
		return []models.Field{field}
	}

	children := make([]models.Field, 0)
	for _, child := range field.Properties {
		children = append(children, flattenField(child)...)
	}

	out := make([]models.Field, 0)
	for _, child := range children {
		child.Name = strings.Join([]string{field.Name, child.Name}, ".")
		out = append(out, child)
	}

	return out
}

func setObjectValue(keyParts []string, value interface{}, values chartutil.Values) chartutil.Values {
	if len(keyParts) == 1 {
		//if keyParts[0] == "chains" {
		//	fmt.Println("mi smo keyevi", keyParts)
		//	return values
		//}
		values[keyParts[0]] = value
		return values
	}

	if _, ok := values[keyParts[0]]; !ok {
		values[keyParts[0]] = setObjectValue(keyParts[1:], value, make(chartutil.Values))
	} else {
		values[keyParts[0]] = setObjectValue(keyParts[1:], value, values[keyParts[0]].(chartutil.Values))
	}

	return values
}
