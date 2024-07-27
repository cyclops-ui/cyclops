package cmd

import (
	"github.com/spf13/cobra"
)

var (
	updateExample = `# updates the given module 
cyctl update <module-name> --key=<key> --value=<value> 

#the below command shows how to update the number of replicas for a module,updates number of replicas to 3
cyctl update <module-name> test --key="scaling.replicas" --value=3`
)

var (
	updateCMD = &cobra.Command{

		Use:     "update",
		Short:   "updates the given module",
		Long:    "updates the given module",
		Example: updateExample,
		Args:    cobra.MinimumNArgs(1),
	}
)

func init() {

	RootCmd.AddCommand(updateCMD)
}
