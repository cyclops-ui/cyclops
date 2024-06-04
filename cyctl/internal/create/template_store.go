package create

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	createTemplateExample = ` 
 # Create template
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

// DeleteTemplateAuthRule deletes a specified template auth rule from the TemplateAuthRule Custom Resource.
func createTemplate(clientset *client.CyclopsV1Alpha1Client, templateName, path, version, namespace string) {
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

	template, err := clientset.TemplateStore(namespace).Create(&newTemplate)
	if err != nil {
		fmt.Printf("Error creating template: %v\n", err)
		return
	}
	fmt.Printf("%v created successfully.\n", template.Name)
}

var (
	CreateTemplate = &cobra.Command{
		Use:     "templates NAME --repo=repo --path=path --version=version",
		Short:   "Create template",
		Long:    "The create template command allows you to create templatestore from the Cyclops API.",
		Example: createTemplateExample,
		Args:    cobra.ExactArgs(1),
		Aliases: []string{"template"},
		Run: func(cmd *cobra.Command, args []string) {
			createTemplate(kubeconfig.Moduleset, args[0], path, version, namespace)
		},
	}
)

func init() {
	CreateTemplate.Flags().StringVarP(&repo, "repo", "r", "", "Repository URL of the template")
	CreateTemplate.Flags().StringVarP(&path, "path", "p", "", "Path to the charts in the repository")
	CreateTemplate.Flags().StringVarP(&version, "version", "v", "", "Version of the template")
	CreateTemplate.Flags().StringVarP(&namespace, "namespace", "n", "cyclops", "Namespace where the template will be created")
}
