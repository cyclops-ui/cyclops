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
)

var (
	moduleExample = `
 # List specific module(s) in ps output format
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
    
    foundModule := false
	filteredModules := modules
	if len(moduleNames) > 0 {
		nameSet := make(map[string]struct{}, len(moduleNames))
		for _, name := range moduleNames {
			nameSet[name] = struct{}{}
		}
		filteredModules = []v1alpha1.Module{}
		for _, module := range modules {
			if _, found := nameSet[module.Name]; found {
				filteredModules = append(filteredModules, module)
                foundModule = true
			}
		}
        if !foundModule {
            fmt.Printf("no module found with name: %v \n", moduleNames)
        }
	}

	headerSpacing := max(0, longestName-4)
	fmt.Println("NAME" + strings.Repeat(" ", headerSpacing) + " AGE")
	for _, module := range filteredModules {
		age := time.Since(module.CreationTimestamp.Time).Round(time.Second)
		nameSpacing := max(0, longestName-len(module.Name))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s\n", module.Name, age.String())
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
