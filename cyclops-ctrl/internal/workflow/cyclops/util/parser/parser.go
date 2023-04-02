package parser

import (
	"gitops/internal/workflow/cyclops/models"
	"gopkg.in/yaml.v2"
	"regexp"
	"strconv"
	"strings"
)

// TODO handle errors
func ParseManifestByFields(manifest string, fields []models.Field) map[string]interface{} {
	var full, body interface{}
	if err := yaml.Unmarshal([]byte(manifest), &full); err != nil {
		panic(err)
	}
	full = convert(full)

	out := make(map[string]interface{})
	for _, field := range fields {
		body = full
		keys := strings.Split(field.ManifestKey, "/")

		for _, k := range keys {
			r, _ := regexp.Compile("(.*)\\[([0-9])+]")
			matches := r.FindStringSubmatch(k)
			if matches != nil {
				index, err := strconv.ParseInt(matches[2], 10, 32)
				if err != nil {
					panic(err)
				}

				body = body.(map[string]interface{})[matches[1]].([]interface{})[index]
				continue
			}

			if _, ok := body.(map[string]interface{}); !ok {
				if _, ok := body.(string); !ok {
					body = body.(int)
					continue
				}

				body = body.(string)
				continue
			}
			body = body.(map[string]interface{})[k]
		}
		out[field.Name] = body
	}

	return out
}

func GetDeployments(output string) []*models.DeploymentPreview {
	deployments := make([]*models.DeploymentPreview, 0)

	for _, line := range strings.Split(output, "\n")[1:] {
		parts := strings.Fields(line)
		if len(parts) != 9 {
			continue
		}

		replicas, err := strconv.ParseInt(parts[3], 10, 32)
		if err != nil {
			panic(err)
		}

		deployments = append(deployments, &models.DeploymentPreview{
			AppName:   parts[0],
			Replicas:  int(replicas),
			ImageName: parts[6],
			Kind:      "deployment",
			Healthy:   true,
			Manifest:  "",
		})
	}

	return deployments
}

func convert(i interface{}) interface{} {
	switch x := i.(type) {
	case map[interface{}]interface{}:
		m2 := map[string]interface{}{}
		for k, v := range x {
			m2[k.(string)] = convert(v)
		}
		return m2
	case []interface{}:
		for i, v := range x {
			x[i] = convert(v)
		}
	}
	return i
}

// adds config and fleet version
func setCyclopsMetaAnnotations(manifest string, cyclopsMeta map[string]string) (string, error) {
	var body interface{}
	if err := yaml.Unmarshal([]byte(manifest), &body); err != nil {
		return "", err
	}
	bodyAsMap := convert(body).(map[string]interface{})

	metadata := bodyAsMap["metadata"].(map[string]interface{})

	if _, ok := metadata["annotations"]; !ok {
		metadata["annotations"] = map[string]interface{}{}
	}

	annotations := metadata["annotations"].(map[string]interface{})

	for k, v := range cyclopsMeta {
		annotations[k] = v
	}

	data, err := yaml.Marshal(bodyAsMap)
	return string(data), err
}
