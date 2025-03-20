package k8sclient

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"text/template"

	"gopkg.in/yaml.v3"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const (
	cyclopsNamespace = "cyclops"
)

type GroupVersionKind struct {
	Group   string `json:"group"`
	Version string `json:"version"`
	Kind    string `json:"kind"`
}

type ResourceFetchRule struct {
	MatchLabels map[string]string
	ManagedGVRs []schema.GroupVersionResource
}

type ChildLabels map[GroupVersionKind]ResourceFetchRule

func (k *KubernetesClient) getChildLabel(
	group, version, kind string,
	obj *unstructured.Unstructured,
) (*ResourceFetchRule, bool, error) {
	labels, exists := k.childLabels[GroupVersionKind{
		Group:   group,
		Version: version,
		Kind:    kind,
	}]

	if !exists {
		return nil, false, nil
	}

	matchLabels := make(map[string]string)
	for k, v := range labels.MatchLabels {
		t, err := template.New("matchLabel").Parse(v)
		if err != nil {
			return nil, false, err
		}

		var o bytes.Buffer
		err = t.Execute(&o, obj.Object)
		if err != nil {
			return nil, false, err
		}

		matchLabels[k] = o.String()
	}

	return &ResourceFetchRule{
		MatchLabels: matchLabels,
		ManagedGVRs: labels.ManagedGVRs,
	}, exists, nil
}

func (k *KubernetesClient) loadResourceRelationsLabels() {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "/etc/config/config.yaml"
	}

	configFile, err := os.Open(configPath)
	if err != nil {
		return
	}
	defer configFile.Close()

	b, err := io.ReadAll(configFile)
	if err != nil {
		fmt.Println("error reading file", err)
		return
	}

	type gvr struct {
		Group    string `json:"group"`
		Version  string `json:"version"`
		Resource string `json:"resource"`
	}
	type resourceChildLabels struct {
		Group       string            `yaml:"group"`
		Version     string            `yaml:"version"`
		Kind        string            `yaml:"kind"`
		MatchLabels map[string]string `yaml:"matchLabels"`
		ManagedGVKs []gvr             `yaml:"managedGVKs"`
	}

	type yamlConfig struct {
		ChildLabels []resourceChildLabels `yaml:"childLabels"`
	}

	var c *yamlConfig
	err = yaml.Unmarshal(b, &c)
	if err != nil {
		return
	}

	if c == nil {
		return
	}

	childLabels := make(map[GroupVersionKind]ResourceFetchRule)
	for _, label := range c.ChildLabels {
		var convertedGVKs []schema.GroupVersionResource
		for _, gvk := range label.ManagedGVKs {
			convertedGVKs = append(convertedGVKs, schema.GroupVersionResource{
				Group:    gvk.Group,
				Version:  gvk.Version,
				Resource: gvk.Resource,
			})
		}

		childLabels[GroupVersionKind{
			Group:   label.Group,
			Version: label.Version,
			Kind:    label.Kind,
		}] = ResourceFetchRule{MatchLabels: label.MatchLabels, ManagedGVRs: convertedGVKs}
	}

	k.childLabels = childLabels
}
