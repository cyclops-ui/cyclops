package create

import (
	"encoding/json"
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
	outputFormat string
)

// createModule allows you to create module Custom Resource.
func createModule(clientset *client.CyclopsV1Alpha1Client, moduleName, repo, path, version, namespace, valuesFile, templateName, outputFormat string) {

	values, err := os.ReadFile(valuesFile)
	if err != nil {
		log.Fatalf("Error reading values file: %v", err)
	}
	jsonValues, err := yaml.YAMLToJSON(values)
	if err != nil {
		log.Fatalf("Error converting values file to JSON: %v", err)
	}

	if templateName != "" && (repo == "" && path == "" && version == "") {
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

	if outputFormat == "yaml" {
		// Marshal the newModule object to JSON
		jsonOutput, err := json.Marshal(newModule)
		if err != nil {
			log.Fatalf("Error marshalling module to JSON: %v", err)
		}
		// Convert JSON to YAML
		yamlOutput, err := yaml.JSONToYAML(jsonOutput)
		if err != nil {
			log.Fatalf("Error converting module to YAML: %v", err)
		}
		fmt.Printf("---\n%s\n", yamlOutput)
	} else if outputFormat == "json" {
		output, err := json.MarshalIndent(newModule, "", "  ")
		if err != nil {
			log.Fatalf("Error converting module to JSON: %v", err)
		}
		fmt.Printf("%s\n", output)
	} else if outputFormat == "" {
		// Proceed with creation if no output format is specified
		module, err := clientset.Modules(namespace).Create(&newModule)
		if err != nil {
			fmt.Printf("Error creating module: %v\n", err)
			return
		}
		fmt.Printf("%v created successfully.\n", module.Name)
	} else {
		log.Fatalf("Invalid output format: %s. Supported formats are 'yaml' and 'json'.", outputFormat)
	}
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
			// Either templateName or (repo, path and version) must be provided, if one is provided the other must be empty
			if (templateName != "" && (repo != "" || path != "" || version != "")) || (templateName == "" && (repo == "" || path == "" || version == "")) {
				log.Fatalf("Error: Either template or (repo, path and version) must be provided.")
			}
			createModule(kubeconfig.Moduleset, args[0], repo, path, version, namespace, valuesFile, templateName, outputFormat)
		},
	}
)

func init() {
	CreateModule.Flags().StringVarP(&namespace, "namespace", "n", "cyclops", "Namespace where the module will be created")
	CreateModule.Flags().StringVarP(&repo, "repo", "r", "", "Repository URL for the module")
	CreateModule.Flags().StringVarP(&path, "path", "p", "", "Path to the module charts")
	CreateModule.Flags().StringVarP(&version, "version", "v", "", "Version of the module")
	CreateModule.Flags().StringVarP(&valuesFile, "file", "f", "", "Path to the values.yaml file")
	CreateModule.Flags().StringVarP(&templateName, "template", "t", "", "Name of the template to use for the module creation")
	CreateModule.Flags().StringVarP(&outputFormat, "output", "o", "", "Output format (yaml or json)")
	CreateModule.MarkFlagRequired("file")
}
