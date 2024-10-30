package cmd

import (
	"github.com/cyclops-ui/cycops-cyctl/internal/update"
	"github.com/spf13/cobra"
)

var (
	updateExample = `# updates the given module 
cyctl update module <module-name> --value="<key>=<value>" --value="<key>=<value>"

# to update replicas and version for a module named test, with 3 replicas and version 1.27.1
cyctl update module test --value="scaling.replicas=3" --value="general.version=1.27.1"`
)

var (
	updateCMD = &cobra.Command{

		Use:     "update",
		Short:   "updates cyclops resources (currently supports only Modules)",
		Long:    "updates cyclops resources (currently supports only Modules)",
		Example: updateExample,
		Args:    cobra.NoArgs,
	}
)

func init() {
	RootCmd.AddCommand(updateCMD)
	updateCMD.AddCommand(update.UpdateModuleCMD)
	updateCMD.AddCommand(update.UpdateTemplateStoreCMD)
}
