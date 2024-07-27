package update

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/spf13/cobra"
)

var (
	updateModuleExample = `# to update replicas for an existing module named test 
cyctl update module test --key="scaling.replicas" --value=3
	`
)

// updates the given module from cyclops API
// currently supports updating replica count for a module
func update(clientset *client.CyclopsV1Alpha1Client, moduleName string) {

}

var (
	updateModule = &cobra.Command{

		Use:     "module",
		Short:   "updates the module ",
		Long:    "updates the module ",
		Example: updateModuleExample,
		Args:    cobra.MinimumNArgs(1),
	}
)
