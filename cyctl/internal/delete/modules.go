package delete

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var (
	deleteModuleExample = ` 
	# Delete a single module
	cyctl delete modules module1
 
	# Delete multiple modules
	cyctl delete modules module1 module2 module3`
)

// DeleteModules deletes a specified module from the Cyclops API.
func deleteModules(clientset *client.CyclopsV1Alpha1Client, moduleNames []string) {
	if len(moduleNames) == 0 {
		fmt.Println("Error: module names cannot be empty")
		return
	}

	for _, moduleName := range moduleNames {
		err := clientset.Modules("cyclops").Delete(moduleName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
		} else {
			fmt.Printf("Module %v deleted successfully.\n", moduleName)
		}
	}
}

var (
	DeleteModule = &cobra.Command{
		Use:     "modules [module_name]",
		Short:   "Delete one or more modules",
		Long:    "The delete modules command allows you to remove one or more modules from the Cyclops API.",
		Example: deleteModuleExample,
		Aliases: []string{"module"},
		Args:    cobra.MinimumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			deleteModules(kubeconfig.Moduleset, args)
		},
	}
)
