package create

import (
	"fmt"
	"log"
	"os"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/yaml"
)

var (
	createModuleExample = `
	# Create module with values from a file
	cyctl create module NAME -f values.yaml \
	--repo 'github.com/github/demo' \
	--path '/path/to/charts' \
	--version 'main'
	`
	valuesFile   string
	templateName string
)

// createModule allows you to create module Custom Resource.
func createModule(clientset *client.CyclopsV1Alpha1Client, moduleName, repo, path, version, namespace, valuesFile, tempName string) {

	values, err := os.ReadFile(valuesFile)
	if err != nil {
		log.Fatalf("Error reading values file: %v", err)
	}
	jsonValues, err := yaml.YAMLToJSON(values)
	if err != nil {
		log.Fatalf("Error converting values file to JSON: %v", err)
	}

	if tempName != "" && (repo == "" && path == "" && version == "") {
		temp, err := clientset.TemplateStore("cyclops").Get(templateName)
		if err != nil {
			fmt.Printf("Error from server (Template NotFound): %v\n", err)
			return
		}
		repo = temp.Spec.URL
		path = temp.Spec.Path
		version = temp.Spec.Version
	}

	// Define a new Module object
	newModule := v1alpha1.Module{
		TypeMeta: v1.TypeMeta{
			APIVersion: "cyclops-ui.com/v1alpha1",
			Kind:       "Module",
		},
		ObjectMeta: v1.ObjectMeta{
			Name:      moduleName,
			Namespace: namespace,
		},
		Spec: v1alpha1.ModuleSpec{
			TemplateRef: v1alpha1.TemplateRef{
				URL:     repo,
				Path:    path,
				Version: version,
			},
			Values: apiextensionsv1.JSON{Raw: jsonValues},
		},
	}

	module, err := clientset.Modules(namespace).Create(&newModule)
	if err != nil {
		fmt.Printf("Error creating template: %v\n", err)
		return
	}
	fmt.Printf("%v created successfully.\n", module.Name)
}

var (
	CreateModule = &cobra.Command{
		Use:     "module NAME -f values.yaml --repo=repo --path=path --version=version",
		Short:   "Create Modules",
		Long:    "The create module command allows you to create module from the Cyclops API.",
		Example: createModuleExample,
		Args:    cobra.ExactArgs(1),
		Aliases: []string{"modules"},
		Run: func(cmd *cobra.Command, args []string) {
			// Custom validation:
			// Either templateName or (repo and path) must be provided, if one is provided the other must be empty
			if (templateName != "" && (repo != "" || path != "")) || (templateName == "" && (repo == "" || path == "")) {
				log.Fatalf("Error: Either template or (repo and path) must be provided")
			}
			createModule(kubeconfig.Moduleset, args[0], repo, path, version, namespace, valuesFile, templateName)
		},
	}
)

func init() {
	CreateModule.Flags().StringVarP(&namespace, "namespace", "n", "cyclops", "Namespace where the module will be created")
	CreateModule.Flags().StringVarP(&repo, "repo", "r", "", "Repository URL for the module")
	CreateModule.Flags().StringVarP(&path, "path", "p", "", "Path to the module charts")
	CreateModule.Flags().StringVarP(&version, "version", "v", "", "Version of the module")
	CreateModule.Flags().StringVarP(&valuesFile, "file", "f", "", "Path to the values.yaml file")
	CreateModule.Flags().StringVarP(&templateName, "template", "t", "", "Path to the values.yaml file")
	CreateModule.MarkFlagRequired("file")
}
