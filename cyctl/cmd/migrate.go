package cmd

import (
	"fmt"
	"log"

	"github.com/cyclops-ui/cycops-cyctl/utility"
	"github.com/spf13/cobra"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/clientcmd"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
)

var (
	namespace string
	repo      string
	path      string
	version   string

	migrateExample = `  # Migrate Helm releases to Cyclops Modules
  cyctl helm migrate --namespace mynamespace --repo https://charts.bitnami.com/bitnami --path postgresql --version 12.5.6`

	migrateCmd = &cobra.Command{
		Use:     "migrate",
		Short:   "Migrate Helm releases to Cyclops Modules",
		Long:    "Migrate existing Helm releases to Cyclops Modules while retaining the release values",
		Example: migrateExample,
		Run:     runMigrate,
	}
)

func init() {
	migrateCmd.Flags().StringVarP(&namespace, "namespace", "n", "", "namespace containing the Helm releases to migrate")
	migrateCmd.Flags().StringVarP(&repo, "repo", "r", "", "repository URL containing the template")
	migrateCmd.Flags().StringVarP(&path, "path", "p", "", "path to the template in the repository")
	migrateCmd.Flags().StringVarP(&version, "version", "v", "", "version of the template")

	migrateCmd.MarkFlagRequired("namespace")
	migrateCmd.MarkFlagRequired("repo")
	migrateCmd.MarkFlagRequired("path")
	migrateCmd.MarkFlagRequired("version")

	helmCmd.AddCommand(migrateCmd)
}

func runMigrate(cmd *cobra.Command, args []string) {
	// Validate template exists
	if err := utility.ValidateTemplate(repo, path, version); err != nil {
		log.Fatalf("Error validating template: %v", err)
	}

	// Get kubeconfig
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	configOverrides := &clientcmd.ConfigOverrides{}
	kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)

	config, err := kubeConfig.ClientConfig()
	if err != nil {
		log.Fatalf("Error getting Kubernetes config: %v", err)
	}

	// Create Cyclops client
	cyclopsClient, err := client.NewForConfig(config)
	if err != nil {
		log.Fatalf("Error creating Cyclops client: %v", err)
	}

	// Get values from releases in namespace
	releases, err := utility.GetReleaseValues("", namespace)
	if err != nil {
		log.Fatalf("Error getting release values: %v", err)
	}

	if len(releases) == 0 {
		fmt.Printf("No Helm releases found in namespace %s\n", namespace)
		return
	}

	fmt.Printf("Found %d releases to migrate in namespace %s\n", len(releases), namespace)

	// Create Module for each release
	for releaseName, values := range releases {
		fmt.Printf("Migrating release %s...\n", releaseName)

		// Create Module CR
		module := &cyclopsv1alpha1.Module{
			TypeMeta: metav1.TypeMeta{
				Kind:       "Module",
				APIVersion: "cyclops-ui.com/v1alpha1",
			},
			ObjectMeta: metav1.ObjectMeta{
				Name:      releaseName,
				Namespace: "cyclops",
			},
			Spec: cyclopsv1alpha1.ModuleSpec{
				TargetNamespace: namespace,
				TemplateRef: cyclopsv1alpha1.TemplateRef{
					URL:     repo,
					Path:    path,
					Version: version,
					// Removed SourceType as it is not a valid field in TemplateRef
				},
				Values: apiextensionsv1.JSON{Raw: values.([]byte)}, // explicitly assert values to []byte
			},
		}

		// Create the Module
		_, err = cyclopsClient.Modules("cyclops").Create(module)
		if err != nil {
			log.Printf("Error creating module for release %s: %v\n", releaseName, err)
			continue
		}

		fmt.Printf("Successfully migrated release %s to module\n", releaseName)
	}
}
