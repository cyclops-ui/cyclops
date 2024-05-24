package describe

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/cyclops-ui/cycops-cyctl/utility"
	"github.com/spf13/cobra"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	describeTemplateExample = ` 
	# Describe a single template
	cyctl describe templates template1
 
	# Describe multiple templates
	cyctl describe templates template1 template2 template3`
)

// describeTemplate descrbe a specified templatestore from the Cyclops API.
func describeTemplate(clientset *client.CyclopsV1Alpha1Client, templateNames []string) {
	if len(templateNames) == 0 {
		templates, err := clientset.TemplateStore("cyclops").List(v1.ListOptions{})
		if err != nil {
			fmt.Printf("Error fetching templateauthrules: %v\n", err)
			return
		}
		for _, template := range templates {
			templateNames = append(templateNames, template.Name)
		}
	}

	for _, templateName := range templateNames {
		template, err := clientset.TemplateStore("cyclops").Get(templateName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
			return
		}
		// Describe the template
		describe := utility.Describe(func(d *utility.Describer) {
			d.DescribeTemplateStoreMetaData(*template)

			d.Printf("Creation:\t%s\n", template.CreationTimestamp)

			d.Println()
			d.Printf("Repository:\t%s\n", template.Spec.URL)
			d.Printf("Branch:\t%s\n", template.Spec.Version)
			d.Printf("RelativePath:\t%s\n", template.Spec.Path)

		})

		fmt.Printf("%s", describe)
		fmt.Println("-------------------------------")

	}
}

var (
	DescribeTemplate = &cobra.Command{
		Use:     "template [template_auth_rule_name]",
		Short:   "Describe one or more templateauthrule",
		Long:    "The describe template command allows you to remove one or more modules from the Cyclops API.",
		Example: describeTemplateExample,
		Aliases: []string{"template"},
		Args:    cobra.MinimumNArgs(0),
		Run: func(cmd *cobra.Command, args []string) {
			describeTemplate(kubeconfig.Moduleset, args)
		},
	}
)
