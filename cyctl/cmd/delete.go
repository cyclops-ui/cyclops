package cmd

import (
	"fmt"

	"github.com/cyclops-ui/cycops-cyctl/internal/delete"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var deleteCMD = &cobra.Command{
	Use:   "delete",
	Short: "This is the delete command",
	Long:  "This is the delete command",
	Args:  cobra.MinimumNArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		deleteCommand, resourceName := args[0], args[1:]
		switch deleteCommand {
		case "modules", "module":
			delete.DeleteModules(kubeconfig.Moduleset, resourceName)
		default:
			fmt.Println("Give the correct resource name")
		}
	},
}

func init() {
	RootCmd.AddCommand(deleteCMD)
}
