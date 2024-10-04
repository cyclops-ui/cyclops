package get

import (
	"fmt"
	"strings"

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

	headerSpacing := 20
	output := "KIND" + strings.Repeat(" ", 16) + " NAME" + strings.Repeat(" ", 16) + " NAMESPACE\n"
	fmt.Print(output)
	for _, resource := range resources {
		nameSpacing := max(0, headerSpacing-len(resource.GetKind()))
		namespaceSpacing := max(0, headerSpacing-len(resource.GetName()))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s"+strings.Repeat(" ", namespaceSpacing)+"%s\n",
			resource.GetKind(), resource.GetName(), resource.GetNamespace())
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
