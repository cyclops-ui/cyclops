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
		} else {
			// Describe the templateAuthRule
			s := utility.Describe(func(d *utility.Describer) {
				d.DescribeTemplateAuthMetaData(*templateAuth)

				d.Printf("\nCreation:\t%s\n", templateAuth.CreationTimestamp)

				d.Println()
				d.Printf("\nRepository:\t%s\n", templateAuth.Spec.Repo)

				d.Println()
				d.Printf("Credentails:\t\n")
				d.Printf("Username:\t%s\n", templateAuth.Spec.Username.Key)
				d.Printf("Password:\t%s\n", utility.EncodeBase64(templateAuth.Spec.Password.Key))

				d.Println()
			})

			fmt.Printf("%s", s)
			fmt.Println("-------------------------------")
		}
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
