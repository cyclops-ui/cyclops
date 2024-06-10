package get

import (
	"fmt"
	"strings"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "os"
)

var (
	templateExample = `
 # List specific template(s) in ps output format
 cyctl get template TEMPLATE_NAME 
 
 # List all templates available in template store in ps output format
 cyctl get templates`
)

// listTemplate retrieves and displays a list of templatestore from the Cyclops API.
func listTemplate(clientset *client.CyclopsV1Alpha1Client, templateNames []string) {
	templates, err := clientset.TemplateStore("cyclops").List(metav1.ListOptions{})
	if err != nil {
		fmt.Printf("Error listing templates: %v\n", err)
		return
	}

	if len(templates) == 0 {
		fmt.Println("No templatestore found.")
		return
	}

	longestName := 20 // minimum column width
	for _, template := range templates {
		if len(template.Name) > longestName {
			longestName = len(template.Name)
		}
	}

	filteredTemplates := templates
	notFoundTemplates := make([]string, 0)
	
    if len(templateNames) > 0 {
		nameSet := make(map[string]struct{}, len(templateNames))
		for _, name := range templateNames {
			nameSet[name] = struct{}{}
		}

		foundTemplates := make([]v1alpha1.TemplateStore, 0)

		for _, template := range templates {
			if _, found := nameSet[template.Name]; found {
				foundTemplates = append(foundTemplates, template)
				delete(nameSet, template.Name)
			}
		}
		for name := range nameSet {
			notFoundTemplates = append(notFoundTemplates, name)
		}
		if len(notFoundTemplates) > 0 {
			for _, name := range notFoundTemplates {
				fmt.Printf("no templates found with name: %s\n", name)
			}
		}
		filteredTemplates = foundTemplates
	}

	headerSpacing := max(0, longestName-4)
	output := ""
	if len(filteredTemplates) > 0 {
		output += "NAME" + strings.Repeat(" ", headerSpacing) + " AGE\n"
	}

	fmt.Print(output)
	for _, template := range filteredTemplates {
		age := time.Since(template.CreationTimestamp.Time).Round(time.Second)
		nameSpacing := max(0, longestName-len(template.Name))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s\n", template.Name, age.String())
	}
    if len(notFoundTemplates) > 0 {
        os.Exit(1)
    }
}

var (
	ListTemplate = &cobra.Command{
		Use:     "templates [template_name]",
		Short:   "Retrieve list of templates in ps format",
		Long:    "Retrieve list of templates in ps format",
		Example: templateExample,
		Args:    cobra.MinimumNArgs(0),
		Aliases: []string{"template"},
		Run: func(cmd *cobra.Command, args []string) {
			listTemplate(kubeconfig.Moduleset, args)
		},
	}
)
