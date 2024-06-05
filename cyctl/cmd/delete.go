package cmd

import (
	"github.com/cyclops-ui/cycops-cyctl/internal/delete"
	"github.com/spf13/cobra"
)

var (
	deleteExample = `
	# Delete one or more modules
	cyctl delete modules [module_name] 
 
	# Delete one or more templates
	cyctl delete templates [template_name] 
 
	# Delete one or more templateauthrules.
	cyctl delete templateauthrules [templateauthrules_name]`
)

var deleteCMD = &cobra.Command{
	Use:     "delete",
	Short:   "Delete custom resources like modules, templates, and templateauthrules",
	Long:    "Delete custom resources like modules, templates, and templateauthrules",
	Example: deleteExample,
	Args:    cobra.MinimumNArgs(1),
}

func init() {
	deleteCMD.AddCommand(delete.DeleteModule)
	deleteCMD.AddCommand(delete.DeleteTemplate)
	deleteCMD.AddCommand(delete.DeleteTemplateAuthRule)

	RootCmd.AddCommand(deleteCMD)
}
