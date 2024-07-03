package cmd

import (
	"github.com/cyclops-ui/cycops-cyctl/internal/create"
	"github.com/spf13/cobra"
)

var (
	createExample = `# Create one or more modules
cyctl create module NAME -f values.yaml --repo='github.com/repo/a' --path='/path/to/charts' --version='main' 

# Create one or more templates
cyctl create template NAME --repo='github.com/repo/a' --path='/path/to/charts' --version='main'

# Create one or more templateauthrules.
cyctl create templateauthrule NAME --repo='https://github.com/cyclops-ui/templates' --username='name:john' --password='name:random'`
)

var createCMD = &cobra.Command{
	Use:     "create",
	Short:   "Create custom resources like modules, templates, and templateauthrules",
	Long:    "Create custom resources like modules, templates, and templateauthrules",
	Example: createExample,
	Args:    cobra.MinimumNArgs(1),
}

func init() {
	createCMD.AddCommand(create.CreateModule)
	createCMD.AddCommand(create.CreateTemplate)
	createCMD.AddCommand(create.CreateTemplateAuthRule)

	RootCmd.AddCommand(createCMD)
}
