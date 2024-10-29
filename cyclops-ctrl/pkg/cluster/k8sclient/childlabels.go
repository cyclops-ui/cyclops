package k8sclient

import (
	"bytes"
	"context"
	"text/template"

	"gopkg.in/yaml.v3"

	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

const (
	cyclopsNamespace = "cyclops"
)

type GroupVersionKind struct {
	Group   string `json:"group"`
	Version string `json:"version"`
	Kind    string `json:"kind"`
}

type ChildLabels map[GroupVersionKind]map[string]string

func (k *KubernetesClient) getChildLabel(
	group, version, kind string,
	obj *unstructured.Unstructured,
) (map[string]string, bool, error) {
	labels, exists := k.childLabels[GroupVersionKind{
		Group:   group,
		Version: version,
		Kind:    kind,
	}]

	if !exists {
		return nil, false, nil
	}

	matchLabels := make(map[string]string)
	for k, v := range labels {
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

	return matchLabels, exists, nil
}

func (k *KubernetesClient) loadResourceRelationsLabels() {
	configmap, err := k.clientset.CoreV1().ConfigMaps("cyclops").Get(context.Background(), "cyclops-ctrl", v1.GetOptions{})
	if err != nil {
		return
	}

	d, ok := configmap.Data["resource-relations"]
	if !ok {
		return
	}

	type resourceChildLabels struct {
		Group       string            `yaml:"group"`
		Version     string            `yaml:"version"`
		Kind        string            `yaml:"kind"`
		MatchLabels map[string]string `yaml:"matchLabels"`
	}

	type yamlConfig struct {
		ChildLabels []resourceChildLabels `yaml:"childLabels"`
	}

	var c *yamlConfig
	err = yaml.Unmarshal([]byte(d), &c)
	if err != nil {
		return
	}

	if c == nil {
		return
	}

	childLabels := make(map[GroupVersionKind]map[string]string)
	for _, label := range c.ChildLabels {
		childLabels[GroupVersionKind{
			Group:   label.Group,
			Version: label.Version,
			Kind:    label.Kind,
		}] = label.MatchLabels
	}

	k.childLabels = childLabels
}
