package cmd

import (
	"github.com/cyclops-ui/cycops-cyctl/internal/get"
	"github.com/spf13/cobra"
)

var (
	getExample = `
	# List all modules in ps output format
	cyctl get modules 
 
	# List all templates available in template store in ps output format
	cyctl get templates
 
	# List all template auth rules available in ps format
	cyctl get templateauthrules`
)

var getCMD = &cobra.Command{
	Use:     "get",
	Short:   "Retrieve custom resources like modules, templates, and templateauthrules",
	Long:    "Retrieve custom resources like modules, templates, and templateauthrules",
	Example: getExample,
	// Run:     func(cmd *cobra.Command, args []string) {},
}

func init() {
	getCMD.AddCommand(get.ListModule)
	getCMD.AddCommand(get.ListTemplate)
	getCMD.AddCommand(get.ListTemplateAuthRules)

	RootCmd.AddCommand(getCMD)
}
