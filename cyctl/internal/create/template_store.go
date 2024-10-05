package create

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/manifoldco/promptui"
	"github.com/spf13/cobra"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/yaml"
)

var (
	createTemplateExample = `# Create template
cyctl create template NAME --repo='github.com/repo/a' --path='/path/to/charts'

# Create template sample command
cyctl create template NAME --repo='https://github.com/cyclops-ui/templates' --path='/path' --version='main'`
)

var (
	// path to charts
	path string

	// charts version
	version string
)

func createTemplate(clientset *client.CyclopsV1Alpha1Client, templateName, path, version, namespace, outputFormat string) {
	// Check wheter the flags --repo --path --version are defined
	if path == "" && version == "" && repo == "" {
		RepoPrompt := promptui.Prompt{
			Label: "Repo",
		}
		repoValue, err := RepoPrompt.Run()
		if err != nil {
			fmt.Printf("Prompt failed %v", err)
			return
		}
		repo = repoValue

		PathPrompt := promptui.Prompt{
			Label: "Path",
		}
		pathValue, err := PathPrompt.Run()
		if err != nil {
			fmt.Printf("Prompt failed %v", err)
			return
		}
		path = pathValue

		VersionPrompt := promptui.Prompt{
			Label: "Version",
		}
		versionValue, err := VersionPrompt.Run()
		if err != nil {
			fmt.Printf("Prompt failed %v", err)
			return
		}
		version = versionValue
	}

	// Define a new TemplateStore object
	newTemplate := v1alpha1.TemplateStore{
		TypeMeta: v1.TypeMeta{
			APIVersion: "cyclops-ui.com/v1alpha1",
			Kind:       "TemplateStore",
		},
		ObjectMeta: v1.ObjectMeta{
			Name:      templateName,
			Namespace: namespace,
		},
		Spec: v1alpha1.TemplateRef{
			URL:     repo,
			Path:    path,
			Version: version,
		},
	}

	if outputFormat == "yaml" {
		// Marshal the newTemplate object to JSON
		jsonOutput, err := json.Marshal(newTemplate)
		if err != nil {
			log.Fatalf("Error marshalling template to JSON: %v", err)
		}
		// Convert JSON to YAML
		yamlOutput, err := yaml.JSONToYAML(jsonOutput)
		if err != nil {
			log.Fatalf("Error converting template to YAML: %v", err)
		}
		fmt.Printf("---\n%s\n", yamlOutput)
	} else if outputFormat == "json" {
		output, err := json.MarshalIndent(newTemplate, "", "  ")
		if err != nil {
			log.Fatalf("Error converting template to JSON: %v", err)
		}
		fmt.Printf("%s\n", output)
	} else if outputFormat == "" {
		// Proceed with creation if no output format is specified
		template, err := clientset.TemplateStore(namespace).Create(&newTemplate)
		if err != nil {
			fmt.Printf("Error creating template: %v\n", err)
			return
		}
		fmt.Printf("%v created successfully.\n", template.Name)
	} else {
		log.Fatalf("Invalid output format: %s. Supported formats are 'yaml' and 'json'.", outputFormat)
	}
}

var (
	CreateTemplate = &cobra.Command{
		Use:     "template NAME --repo=repo --path=path --version=version",
		Short:   "Create template",
		Long:    "The create template command allows you to create templatestore from the Cyclops API.",
		Example: createTemplateExample,
		Args:    cobra.ExactArgs(1),
		Aliases: []string{"templates"},
		Run: func(cmd *cobra.Command, args []string) {
			createTemplate(kubeconfig.Moduleset, args[0], path, version, namespace, outputFormat)
		},
	}
)

func init() {
	CreateTemplate.Flags().StringVarP(&repo, "repo", "r", "", "Repository URL of the template")
	CreateTemplate.Flags().StringVarP(&path, "path", "p", "", "Path to the charts in the repository")
	CreateTemplate.Flags().StringVarP(&version, "version", "v", "", "Version of the template")
	CreateTemplate.Flags().StringVarP(&namespace, "namespace", "n", "cyclops", "Namespace where the template will be created")
	CreateTemplate.Flags().StringVarP(&outputFormat, "output", "o", "", "Output format (yaml|json)")
}
