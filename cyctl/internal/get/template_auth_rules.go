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
	templateAuthExample = `
 # List specific templateauthrule(s) in ps output format
 cyctl get templateauthrule TEMPLATE_AUTH_RULE_NAME 
 
 # List all templatesauthrule available in ps output format
 cyctl get templateauthrule`
)

// listTemplateAuthRules retrieves and displays a list of templateauthrules from the Cyclops API.
func listTemplateAuthRules(clientset *client.CyclopsV1Alpha1Client, templateAuthNames []string) {
	templates, err := clientset.TemplateAuthRules("cyclops").List(metav1.ListOptions{})
	if err != nil {
		fmt.Printf("Error listing templates: %v\n", err)
		return
	}

	if len(templates) == 0 {
		fmt.Println("No templatesauthrules found.")
		return
	}

	longestName := 20 // minimum column width
	for _, template := range templates {
		if len(template.Name) > longestName {
			longestName = len(template.Name)
		}
	}

	filteredTemplatesAuthRules := templates
	notFoundTemplatesAuthRules := make([]string, 0)
	
    if len(templateAuthNames) > 0 {
		nameSet := make(map[string]struct{}, len(templateAuthNames))
		for _, name := range templateAuthNames {
			nameSet[name] = struct{}{}
		}
		
        foundTemplatesAuthRules := make([]v1alpha1.TemplateAuthRule, 0)

		for _, template := range templates {
			if _, found := nameSet[template.Name]; found {
				foundTemplatesAuthRules = append(foundTemplatesAuthRules, template)
				delete(nameSet, template.Name)
			}
		}
		for name := range nameSet {
			notFoundTemplatesAuthRules = append(notFoundTemplatesAuthRules, name)
		}
		if len(notFoundTemplatesAuthRules) > 0 {
			for _, name := range notFoundTemplatesAuthRules {
				fmt.Printf("no template auth rules found with name: %s\n", name)
			}
		}
		filteredTemplatesAuthRules = foundTemplatesAuthRules
	}

	headerSpacing := max(0, longestName-4)
	output := ""
	if len(filteredTemplatesAuthRules) > 0 {
		output += "NAME" + strings.Repeat(" ", headerSpacing) + " AGE\n"
	}

	fmt.Print(output)
	for _, template := range filteredTemplatesAuthRules {
		age := time.Since(template.CreationTimestamp.Time).Round(time.Second)
		nameSpacing := max(0, longestName-len(template.Name))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s\n", template.Name, age.String())
	}
    if len(notFoundTemplatesAuthRules) > 0 {
        os.Exit(1)
    }
}

var (
	ListTemplateAuthRules = &cobra.Command{
		Use:     "templateauthrules [templateauthrule_name]",
		Short:   "Retrieve list of templateauthrule in ps format",
		Long:    "Retrieve list of templateauthrule in ps format",
		Example: templateAuthExample,
		Args:    cobra.MinimumNArgs(0),
		Aliases: []string{"templateauthrule"},
		Run: func(cmd *cobra.Command, args []string) {
			listTemplateAuthRules(kubeconfig.Moduleset, args)
		},
	}
)
