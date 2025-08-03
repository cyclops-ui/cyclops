package cmd

import (
	"encoding/json"
	"log"

	"github.com/go-logr/logr"
	"github.com/spf13/cobra"
	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/cli"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
	"github.com/cyclops-ui/cycops-cyctl/utility"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var (
	namespace string
	repo      string
	path      string
	version   string
	releases  []string

	migrateExample = `  # Migrate specific Helm releases to Cyclops Modules
  cyctl helm migrate --namespace myns --releases app1,app2,app3 --repo https://charts.bitnami.com/bitnami --path postgresql --version 12.5.6`
)

var migrateCmd = &cobra.Command{
	Use:     "migrate",
	Short:   "Migrate specific Helm releases to Cyclops Modules",
	Long:    "Migrate specified Helm releases to Cyclops Module CRs",
	Example: migrateExample,
	Run:     runMigrate,
}

func init() {
	migrateCmd.Flags().StringVarP(&namespace, "namespace", "n", "", "namespace containing the Helm releases")
	migrateCmd.Flags().StringSliceVarP(&releases, "releases", "r", []string{}, "comma-separated list of release names to migrate")
	migrateCmd.Flags().StringVar(&repo, "repo", "", "repository URL containing the template")
	migrateCmd.Flags().StringVar(&path, "path", "", "path to the template in the repository")
	migrateCmd.Flags().StringVar(&version, "version", "", "version of the template")

	migrateCmd.MarkFlagRequired("namespace")
	migrateCmd.MarkFlagRequired("releases")
	migrateCmd.MarkFlagRequired("repo")
	migrateCmd.MarkFlagRequired("path")
	migrateCmd.MarkFlagRequired("version")

	helmCmd.AddCommand(migrateCmd)
}

func runMigrate(cmd *cobra.Command, args []string) {
	// 1. Validate template existence
	log.Printf("[1/3] Validating template %s/%s:%s …", repo, path, version)
	if err := utility.ValidateTemplate(repo, path, version); err != nil {
		log.Fatalf("Error validating template: %v", err)
	}
	log.Printf("✓ Template validated successfully")

	// 2. Setup clients
	log.Printf("[2/3] Setting up clients …")
	
	// Create Kubernetes client for Module operations
	k8sClient, err := k8sclient.New("cyclops", namespace, "", logr.Discard())
	if err != nil {
		log.Fatalf("Error creating Kubernetes client: %v", err)
	}
	
	// Create Helm action configuration
	settings := cli.New()
	settings.SetNamespace(namespace)
	
	actionConfig := new(action.Configuration)
	if err := actionConfig.Init(settings.RESTClientGetter(), namespace, "", log.Printf); err != nil {
		log.Fatalf("Error creating Helm action config: %v", err)
	}
	
	log.Printf("✓ Clients ready")

	// 3. Migrate each specified release
	log.Printf("[3/3] Migrating %d releases …", len(releases))
	
	successCount := 0
	for i, releaseName := range releases {
		log.Printf("→ [%d/%d] Migrating release %q", i+1, len(releases), releaseName)

		// Step 1: Validate release exists and get its values
		getValues := action.NewGetValues(actionConfig)
		getValues.AllValues = true
		
		values, err := getValues.Run(releaseName)
		if err != nil {
			log.Printf("  • [ERROR] failed to get values for release %q: %v", releaseName, err)
			continue
		}
		
		// Step 2: Marshal values to JSON
		rawJSON, err := json.Marshal(values)
		if err != nil {
			log.Printf("  • [ERROR] failed to marshal values for %q: %v", releaseName, err)
			continue
		}

		// Step 3: Create Module CR
		module := v1alpha1.Module{
			TypeMeta: metav1.TypeMeta{
				Kind:       "Module",
				APIVersion: "cyclops-ui.com/v1alpha1",
			},
			ObjectMeta: metav1.ObjectMeta{
				Name:      releaseName,
				Namespace: "cyclops",
			},
			Spec: v1alpha1.ModuleSpec{
				TargetNamespace: namespace,
				TemplateRef: v1alpha1.TemplateRef{
					URL:     repo,
					Path:    path,
					Version: version,
				},
				Values: apiextensionsv1.JSON{Raw: rawJSON},
			},
		}

		if err := k8sClient.CreateModule(module); err != nil {
			log.Printf("  • [ERROR] failed to create Module for %q: %v", releaseName, err)
			continue
		}

		// Step 4: Clean up Helm release secrets (makes release disappear from 'helm list')
		if err := k8sClient.DeleteReleaseSecret(releaseName, namespace); err != nil {
			log.Printf("  • [WARNING] Module created but failed to clean up Helm release secret for %q: %v", releaseName, err)
			log.Printf("    (Release will still appear in 'helm list' but Module is functional)")
		}
		
		successCount++
		log.Printf("  ✔ Successfully migrated %q → Module/%s", releaseName, releaseName)
	}

	log.Printf("Migration completed! %d/%d releases successfully migrated.", successCount, len(releases))
}
