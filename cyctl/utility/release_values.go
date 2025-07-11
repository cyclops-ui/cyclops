package utility

import (
	"fmt"
	"os"

	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/cli"
	"k8s.io/cli-runtime/pkg/genericclioptions"
)

func GetReleaseValues(releaseName, namespace string) (map[string]interface{}, error) {
	settings := cli.New()

	// Required for Helm to know the Kubernetes context
	settings.SetNamespace(namespace)

	// Create Helm action configuration
	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(
		genericclioptions.NewConfigFlags(false),
		namespace,
		os.Getenv("HELM_DRIVER"), // usually "", fallback to secrets
	); err != nil {
		return nil, fmt.Errorf("failed to initialize helm action config: %w", err)
	}

	// Get values
	getValues := action.NewGetValues(actionConfig)
	getValues.AllValues = true

	values, err := getValues.Run(releaseName)
	if err != nil {
		return nil, fmt.Errorf("failed to get values for release %q in namespace %q: %w", releaseName, namespace, err)
	}

	return values, nil
}
