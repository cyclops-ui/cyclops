package main

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
)

type ControllerConfig struct {
	ChildLabels k8sclient.ChildLabels `json:"childLabels"`
}
