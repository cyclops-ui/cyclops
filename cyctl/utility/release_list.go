// utility/release_list.go
package utility

import (
	"fmt"
	"os"

	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/cli"
	"k8s.io/cli-runtime/pkg/genericclioptions"
)

// ListHelmReleases returns all release names in the given namespace
func ListHelmReleases(namespace string) ([]string, error) {
	settings := cli.New()
	settings.SetNamespace(namespace)

	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(
		genericclioptions.NewConfigFlags(false),
		namespace,
		os.Getenv("HELM_DRIVER"),
	); err != nil {
		return nil, fmt.Errorf("failed to initialize helm action config: %w", err)
	}

	listAction := action.NewList(actionConfig)
	// Removed assignment to listAction.Namespace as it is not defined in *action.List
	listAction.AllNamespaces = false
	listAction.Limit = 0

	releases, err := listAction.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to list Helm releases: %w", err)
	}

	var names []string
	for _, rel := range releases {
		names = append(names, rel.Name)
	}

	return names, nil
}
