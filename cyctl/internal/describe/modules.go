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
	describeModuleExample = ` 
	# Describe a single module
	cyctl describe modules module1
 
	# Describe multiple modules
	cyctl describe modules module1 module2 module3`
)

// describeModules describe specified module from the Cyclops API.
func describeModules(clientset *client.CyclopsV1Alpha1Client, moduleNames []string) {
	if len(moduleNames) == 0 {
		modules, err := clientset.Modules("cyclops").List(v1.ListOptions{})
		if err != nil {
			fmt.Printf("Error fetching modules: %v\n", err)
			return
		}
		for _, module := range modules {
			moduleNames = append(moduleNames, module.Name)
		}
	}

	for _, moduleName := range moduleNames {
		module, err := clientset.Modules("cyclops").Get(moduleName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
		} else {
			// Describe the module
			s := utility.Describe(func(d *utility.Describer) {
				d.DescribeModuleMetaData(*module)

				d.Printf("\nCreation:\t%s\n", module.CreationTimestamp)

				d.Println()
				d.Printf("\nStatus:\t%s\n", module.Status.ReconciliationStatus.Status)

				d.Println()
				d.Printf("Template:\t\n")
				d.Printf(" Repository:\t%s\n", module.Spec.TemplateRef.URL)
				d.Printf(" Relative Path:\t%s\n", module.Spec.TemplateRef.Path)
				d.Printf(" Branch:\t%s\n", module.Spec.TemplateRef.Version)

				d.Println()
				if len(module.Spec.Values.Raw) > 0 {
					yamlData, err := utility.JsonToYAMLDescriber(module.Spec.Values.Raw)
					if err != nil {
						d.Printf("Values:\n%s\n", module.Spec.Values.Raw)
					} else {
						d.Printf("Values:\n%s\n", yamlData)
					}
				} else {
					d.Printf("Values:\n<none>\n")
				}
			})

			fmt.Printf("\n\n%s", s)
			fmt.Println("-------------------------------")

		}
	}
}

var (
	DescribeModule = &cobra.Command{
		Use:     "modules [module_name]",
		Short:   "Describe one or more modules",
		Long:    "The describe modules command allows you to remove one or more modules from the Cyclops API.",
		Example: describeModuleExample,
		Aliases: []string{"module"},
		Args:    cobra.MinimumNArgs(0),
		Run: func(cmd *cobra.Command, args []string) {
			describeModules(kubeconfig.Moduleset, args)
		},
	}
)
