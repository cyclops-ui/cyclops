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
	describeTemplateAuthRuleExample = ` 
	# Describe a single templateauthrule
	cyctl describe templateauthrule templateauthrule1
 
	# Describe multiple templateauthrule
	cyctl describe templateauthrule templateauthrule1 templateauthrule2 templateauthrule3`
)

// describeTemplateAuthRules describe a specified templateauthrules from the Cyclops API.
func describeTemplateAuthRules(clientset *client.CyclopsV1Alpha1Client, templateAuthNames []string) {
	if len(templateAuthNames) == 0 {
		templateauthrules, err := clientset.TemplateAuthRules("cyclops").List(v1.ListOptions{})
		if err != nil {
			fmt.Printf("Error fetching templateauthrules: %v\n", err)
			return
		}
		for _, templateAuth := range templateauthrules {
			templateAuthNames = append(templateAuthNames, templateAuth.Name)
		}
	}

	for _, templateAuthName := range templateAuthNames {
		templateAuth, err := clientset.TemplateAuthRules("cyclops").Get(templateAuthName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
			return
		}
		// Describe the templateAuthRule
		describe := utility.Describe(func(d *utility.Describer) {
			d.DescribeMetaData(templateAuth.ObjectMeta)

			d.Printf("Creation:\t%s\n", templateAuth.CreationTimestamp)

			d.Println()
			d.Printf("Repository:\t%s\n", templateAuth.Spec.Repo)

			d.Println()
			d.Printf("Credentails:\t\n")
			d.Printf("Username:\t%s\n", templateAuth.Spec.Username.Key)
			d.Printf("Password:\t%s\n", templateAuth.Spec.Password.Key)

			d.Println()
		})

		fmt.Printf("%s", describe)
		fmt.Println("-------------------------------")

	}
}

var (
	DescribeTemplateAuthRule = &cobra.Command{
		Use:     "templateauthrules [template_auth_rule_name]",
		Short:   "Describe one or more templateauthrule",
		Long:    "The describe templateauthrule command allows you to remove one or more modules from the Cyclops API.",
		Example: describeTemplateAuthRuleExample,
		Aliases: []string{"templateauthrule"},
		Args:    cobra.MinimumNArgs(0),
		Run: func(cmd *cobra.Command, args []string) {
			describeTemplateAuthRules(kubeconfig.Moduleset, args)
		},
	}
)
