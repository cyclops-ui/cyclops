package k8sclient

import (
	"bytes"
	"text/template"

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
