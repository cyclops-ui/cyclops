package delete

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
)

var (
	deleteTemplateExample = `# Delete a single module
cyctl delete modules module1

# Delete multiple modules
cyctl delete modules module1 module2 module3`
)

// DeleteTemplates deletes a specified template from the TemplateStore Custom Resource.
func deleteTemplate(clientset *client.CyclopsV1Alpha1Client, templateNames []string) {
	if len(templateNames) == 0 {
		fmt.Println("Error: template names cannot be empty")
		return
	}

	for _, templateName := range templateNames {
		err := clientset.TemplateStore("cyclops").Delete(templateName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
		} else {
			fmt.Printf("Template %v deleted successfully.\n", templateName)
		}
	}
}

var (
	DeleteTemplate = &cobra.Command{
		Use:     "templates [template_name]",
		Short:   "Delete one or more templates",
		Long:    "The delete templates command allows you to remove one or more templates from the Cyclops API.",
		Example: deleteTemplateExample,
		Aliases: []string{"template"},
		Args:    cobra.MinimumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			deleteTemplate(kubeconfig.Moduleset, args)
		},
	}
)
