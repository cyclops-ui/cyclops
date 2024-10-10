package update

import (
	"fmt"
	"log"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	updateTemplateStoreExample = `# updates template store

	# Update template sample command 
	cyctl update template NAME --repo='https://github.com/cyclops-ui/templates' --path='/path' --version='main' --icon='icon'`
)

var (
	repo    string
	path    string
	icon    string
	version string
)

// updates he given template from cyclops API
func updateTemplate(clientset *client.CyclopsV1Alpha1Client, templateName, path, version, repo, icon string) {
	// Fetch the existing template store
	template, err := clientset.TemplateStore("cyclops").Get(templateName)
	if err != nil {
		log.Fatal("Failed to fetch template store:", err.Error())
		return
	}

	// Update the template store fields if provided
	if repo != "" {
		template.Spec.URL = repo
	}
	if path != "" {
		template.Spec.Path = path
	}
	if version != "" {
		template.Spec.Version = version
	}
	if icon != "" {
		if template.ObjectMeta.Annotations == nil {
			template.ObjectMeta.Annotations = make(map[string]string)
		}
		template.ObjectMeta.Annotations["cyclops-ui.com/icon"] = icon
	}
	template.TypeMeta = v1.TypeMeta{
		APIVersion: "cyclops-ui.com/v1alpha1",
		Kind:       "TemplateStore",
	}

	// Update the template store in the cluster
	_, err = clientset.TemplateStore("cyclops").Update(template)
	if err != nil {
		fmt.Println("Failed to update template store ", err)
		return
	}

	fmt.Printf("successfully updated %v \n", templateName)

}

var (
	UpdateTemplateStoreCMD = &cobra.Command{
		Use:     "template",
		Short:   "updates template values; takes template name as argument and updates values provided by flags",
		Long:    "updates template values; takes template name as argument with flags --path=<path> --repo=<repo> --version=<version> --icon=<icon> ",
		Example: updateTemplateStoreExample,
		Aliases: []string{"templates"},
		Args:    cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			templateName := args[0]

			if repo == "" && path == "" && version == "" && icon == "" {
				log.Fatal("Error: At least on of --repo, --path, --version, or --icon must be provided.")
			}

			updateTemplate(kubeconfig.Moduleset, templateName, path, version, repo, icon)
		},
	}
)

func init() {
	UpdateTemplateStoreCMD.Flags().StringVar(&repo, "repo", "", "Repository URL of the template store")
	UpdateTemplateStoreCMD.Flags().StringVar(&path, "path", "", "Path to the charts in the repository")
	UpdateTemplateStoreCMD.Flags().StringVar(&version, "version", "", "Version of the template store")
	UpdateTemplateStoreCMD.Flags().StringVar(&icon, "icon", "", "Icon for the template store (stored in metadata.annotations.cyclops-ui.com/icon)")
}
