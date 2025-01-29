package main

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
	"gopkg.in/yaml.v3"
	"io"
	"os"
)

type ControllerConfig struct {
	ChildLabels k8sclient.ChildLabels `json:"childLabels"`
}

func getConfig() ControllerConfig {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "/etc/config/config.yaml"
	}

	configFile, err := os.Open(configPath)
	if err != nil {
		setupLog.Error(err, "Failed to open controller config", "configPath", configPath)
		return ControllerConfig{}
	}
	defer configFile.Close()

	b, err := io.ReadAll(configFile)
	if err != nil {
		setupLog.Error(err, "Failed to read controller config", "configPath", configPath)
		return ControllerConfig{}
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
	err = yaml.Unmarshal(b, &c)
	if err != nil {
		setupLog.Error(err, "Failed to YAML unmarshal controller config", "configPath", configPath)
		return ControllerConfig{}
	}

	if c == nil {
		return ControllerConfig{}
	}

	childLabels := make(map[k8sclient.GroupVersionKind]map[string]string)
	for _, label := range c.ChildLabels {
		childLabels[k8sclient.GroupVersionKind{
			Group:   label.Group,
			Version: label.Version,
			Kind:    label.Kind,
		}] = label.MatchLabels
	}

	return ControllerConfig{
		ChildLabels: childLabels,
	}
}
