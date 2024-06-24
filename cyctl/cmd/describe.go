package cmd

import (
	"github.com/cyclops-ui/cycops-cyctl/internal/describe"
	"github.com/spf13/cobra"
)

var (
	describeExample = `# Describe one or more modules
cyctl describe modules [module_name] 

# Describe one or more templates
cyctl describe templates [template_name] 

# Describe one or more templateauthrules.
cyctl describe templateauthrules [templateauthrules_name]`
)

var describeCMD = &cobra.Command{
	Use:     "describe",
	Short:   "Describe custom resources like modules, templates, and templateauthrules",
	Long:    "Describe custom resources like modules, templates, and templateauthrules",
	Example: describeExample,
	Args:    cobra.MinimumNArgs(1),
}

func init() {
	describeCMD.AddCommand(describe.DescribeModule)
	describeCMD.AddCommand(describe.DescribeTemplateAuthRule)
	describeCMD.AddCommand(describe.DescribeTemplate)

	RootCmd.AddCommand(describeCMD)
}
