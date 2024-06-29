package get

import (
	"fmt"
	"strings"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"os"
)

var (
	moduleExample = `# List specific module(s) in ps output format
cyctl get module MODULE_NAME 

# List all modules available in ps output format
cyctl get modules`
)

// listModules retrieves and displays a list of modules from the Cyclops API.
func listModules(clientset *client.CyclopsV1Alpha1Client, moduleNames []string) {
	modules, err := clientset.Modules("cyclops").List(metav1.ListOptions{})
	if err != nil {
		fmt.Printf("Error listing modules: %v\n", err)
		return
	}

	if len(modules) == 0 {
		fmt.Println("No modules found.")
		return
	}

	longestName := 20 // minimum column width
	for _, module := range modules {
		if len(module.Name) > longestName {
			longestName = len(module.Name)
		}
	}

	filteredModules := modules
	notFoundModules := make([]string, 0)

	if len(moduleNames) > 0 {
		nameSet := make(map[string]struct{}, len(moduleNames))
		for _, name := range moduleNames {
			nameSet[name] = struct{}{}
		}
		foundModules := make([]v1alpha1.Module, 0)

		for _, module := range modules {
			if _, found := nameSet[module.Name]; found {
				foundModules = append(foundModules, module)
				delete(nameSet, module.Name)
			}
		}
		for name := range nameSet {
			notFoundModules = append(notFoundModules, name)
		}
		if len(notFoundModules) > 0 {
			for _, name := range notFoundModules {
				fmt.Printf("no module found with name: %s\n", name)
			}
		}
		filteredModules = foundModules
	}

	headerSpacing := max(0, longestName-4)
	output := ""
	if len(filteredModules) > 0 {
		output += "NAME" + strings.Repeat(" ", headerSpacing) + " AGE\n"
	}

	fmt.Print(output)
	for _, module := range filteredModules {
		age := time.Since(module.CreationTimestamp.Time).Round(time.Second)
		nameSpacing := max(0, longestName-len(module.Name))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s\n", module.Name, age.String())
	}
	if len(notFoundModules) > 0 {
		os.Exit(1)
	}
}

var (
	ListModule = &cobra.Command{
		Use:     "modules [module_name]",
		Short:   "Retrieve list of modules in ps format",
		Long:    "Retrieve list of modules in ps format",
		Example: moduleExample,
		Args:    cobra.MinimumNArgs(0),
		Aliases: []string{"module"},
		Run: func(cmd *cobra.Command, args []string) {
			listModules(kubeconfig.Moduleset, args)
		},
	}
)
