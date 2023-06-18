package template

import (
	"bytes"
	"gitops/internal/models/crd/v1alpha1"
	"gitops/internal/workflow/cyclops/models"
	"io/ioutil"
	"log"
	"text/template"
)

func TemplateManifest(reqData models.DeployRequest) (string, error) {
	content, err := ioutil.ReadFile("templates/template.yaml")
	if err != nil {
		log.Fatal(err)
	}

	tmpl, err := template.New("manifest").Parse(string(content))
	if err != nil {
		return "", err
	}

	var buff bytes.Buffer
	if err = tmpl.Execute(&buff, reqData); err != nil {
		return "", err
	}

	return buff.String(), nil
}

func TemplateManifestNew(reqData models.ConfigurableRequest) (string, error) {
	tmpl, err := template.New("manifest").Parse(reqData.Manifest)
	if err != nil {
		return "", err
	}

	var buff bytes.Buffer
	if err = tmpl.Execute(&buff, reqData); err != nil {
		return "", err
	}

	return buff.String(), nil
}

func TemplateModule(module v1alpha1.Module, config models.AppConfiguration) (string, error) {
	tmpl, err := template.New("manifest").Parse(config.Manifest)
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
