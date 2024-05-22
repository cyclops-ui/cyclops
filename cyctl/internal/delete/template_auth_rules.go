package delete

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var (
	deleteTemplateAuthRuleExample = ` 
	# Delete a single module
	cyctl delete modules module1
 
	# Delete multiple modules
	cyctl delete modules module1 module2 module3`
)

// DeleteTemplateAuthRule deletes a specified template auth rule from the TemplateAuthRule Custom Resource.
func deleteTemplateAuthRule(clientset *client.CyclopsV1Alpha1Client, templateAuthRuleNames []string) {
	if len(templateAuthRuleNames) == 0 {
		fmt.Println("Error: template name cannot be empty")
		return
	}

	for _, templateauthruleName := range templateAuthRuleNames {
		err := clientset.TemplateAuthRules("cyclops").Delete(templateauthruleName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
		} else {
			fmt.Printf("TemplateAuthRule '%v' deleted successfully.\n", templateauthruleName)
		}
	}
}

var (
	DeleteTemplateAuthRule = &cobra.Command{
		Use:     "templateauthrules [templateauthrules_name]",
		Short:   "Delete one or more templateauthrules",
		Long:    "The delete templateauthrules command allows you to remove one or more templateauthrules from the Cyclops API.",
		Example: deleteTemplateAuthRuleExample,
		Args:    cobra.MinimumNArgs(1),
		Aliases: []string{"templateauthrule"},
		Run: func(cmd *cobra.Command, args []string) {
			deleteTemplateAuthRule(kubeconfig.Moduleset, args)
		},
	}
)
