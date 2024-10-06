package get

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var (
	describeResourceExample = `# Get All Resources for module
cyctl get resources module1
`
)

func listResources(clientset *k8sclient.KubernetesClient, moduleNames []string) {

	if len(moduleNames) == 0 {
		fmt.Println("No module name in args")
		return
	}

	if len(moduleNames) > 1 {
		fmt.Println("Multiple modules in args. Please pass single module in args")
		return
	}

	resources, err := clientset.GetResourcesForModule(moduleNames[0])

	if err != nil {
		fmt.Printf("Error listing resources: %v\n", err)
		return
	}

	if len(resources) == 0 {
		fmt.Println("No resources found.")
		return
	}

	maxKindLen := len("KIND")
	maxNameLen := len("NAME")
	maxNamespaceLen := len("NAMESPACE")

	for _, resource := range resources {
		if len(resource.GetKind()) > maxKindLen {
			maxKindLen = len(resource.GetKind())
		}
		if len(resource.GetName()) > maxNameLen {
			maxNameLen = len(resource.GetName())
		}
		if len(resource.GetNamespace()) > maxNamespaceLen {
			maxNamespaceLen = len(resource.GetNamespace())
		}
	}
	maxKindLen = maxKindLen + 2
	maxNameLen = maxNameLen + 2
	maxNamespaceLen = maxNamespaceLen + 2

	// Step 2: Print the header with proper spacing
	header := fmt.Sprintf("%-*s %-*s %-*s\n",
		maxKindLen, "KIND",
		maxNamespaceLen, "NAMESPACE", maxNameLen, "NAME")
	fmt.Print(header)

	// Step 3: Print each resource with calculated spacing
	for _, resource := range resources {
		fmt.Printf("%-*s %-*s %-*s\n",
			maxKindLen, resource.GetKind(),
			maxNamespaceLen, resource.GetNamespace(), maxNameLen, resource.GetName(),
		)
	}

}

var (
	ListResources = &cobra.Command{
		Use:     "resources [module_name]",
		Short:   "Retrieve list of resources in ps format",
		Long:    "Retrieve list of resources in ps format",
		Example: describeResourceExample,
		Aliases: []string{"resources"},
		Args:    cobra.MinimumNArgs(0),
		Run: func(cmd *cobra.Command, args []string) {
			listResources(kubeconfig.K8sClient, args)
		},
	}
)
