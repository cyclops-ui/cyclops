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
	if len(templateAuthNames) > 0 {
		nameSet := make(map[string]struct{}, len(templateAuthNames))
		for _, name := range templateAuthNames {
			nameSet[name] = struct{}{}
		}
		filteredTemplatesAuthRules = []v1alpha1.TemplateAuthRule{}
		for _, template := range templates {
			if _, found := nameSet[template.Name]; found {
				filteredTemplatesAuthRules = append(filteredTemplatesAuthRules, template)
			}
		}
	}

	headerSpacing := max(0, longestName-4)
	fmt.Println("NAME" + strings.Repeat(" ", headerSpacing) + " AGE")
	for _, template := range filteredTemplatesAuthRules {
		age := time.Since(template.CreationTimestamp.Time).Round(time.Second)
		nameSpacing := max(0, longestName-len(template.Name))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s\n", template.Name, age.String())
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
