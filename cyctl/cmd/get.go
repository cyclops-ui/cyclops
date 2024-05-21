package cmd

import (
	"fmt"

	"github.com/cyclops-ui/cycops-cyctl/internal/get"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var getCMD = &cobra.Command{
	Use:   "get",
	Short: "Retrieve custom resources like modules, templates, and templateauthrules",
	Long:  "getLong",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			fmt.Println(cmd.Long)
			_ = cmd.Usage()
			return
		}

		getCommand := args[0]
		switch getCommand {
		case "modules", "module":
			get.ListModules(kubeconfig.Moduleset)
		case "templates", "template":
			get.ListTemplateStore(kubeconfig.Moduleset)
		case "templateauthrules", "templateauthrule":
			get.ListTemplateAuthRules(kubeconfig.Moduleset)
		default:
			fmt.Println("Give the correct resource name")
		}
	},
}

func init() {
	RootCmd.AddCommand(getCMD)
}
