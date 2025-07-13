package cmd

import (
	"encoding/json"
	"log"

	"github.com/spf13/cobra"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	cyclopsclient "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/utility"

	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/clientcmd"
)

var (
	namespace string
	repo      string
	path      string
	version   string

	migrateExample = `  # Migrate all Helm releases in 'myns' to Cyclops Modules
  cyctl helm migrate --namespace myns --repo https://charts.bitnami.com/bitnami --path postgresql --version 12.5.6`
)

var migrateCmd = &cobra.Command{
	Use:     "migrate",
	Short:   "Migrate Helm releases to Cyclops Modules",
	Long:    "Batch‑migrate all Helm releases in a namespace to Cyclops Module CRs",
	Example: migrateExample,
	Run:     runMigrate,
}

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
	// 1. Validate template existence
	log.Printf("[1/4] Validating template %s/%s:%s …", repo, path, version)
	if err := utility.ValidateTemplate(repo, path, version); err != nil {
		log.Fatalf("Error validating template: %v", err)
	}
	log.Printf("✓ Template validated successfully")

	// 2. Build k8s config & Cyclops client
	log.Printf("[2/4] Loading Kubernetes config …")
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	configOverrides := &clientcmd.ConfigOverrides{}
	kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)
	cfg, err := kubeConfig.ClientConfig()
	if err != nil {
		log.Fatalf("Error loading kubeconfig: %v", err)
	}
	log.Printf("✓ Kubernetes config loaded")

	log.Printf("Creating Cyclops client …")
	cyclopsClient, err := cyclopsclient.NewForConfig(cfg)
	if err != nil {
		log.Fatalf("Error creating Cyclops client: %v", err)
	}
	log.Printf("✓ Cyclops client ready")

	// 3. List all Helm releases in the namespace
	log.Printf("[3/4] Listing Helm releases in namespace %q …", namespace)
	releases, err := utility.ListHelmReleases(namespace)
	if err != nil {
		log.Fatalf("Error listing Helm releases: %v", err)
	}
	if len(releases) == 0 {
		log.Printf("⚠ No Helm releases found in namespace %q", namespace)
		return
	}
	log.Printf("✓ Found %d release(s) in namespace %q", len(releases), namespace)

	// 4. For each release: fetch values → marshal → create Module
	log.Printf("[4/4] Migrating releases …")
	for _, relName := range releases {
		log.Printf("→ Starting migration for release %q", relName)

		// a) fetch values
		vals, err := utility.GetReleaseValues(relName, namespace)
		if err != nil {
			log.Printf("  • [ERROR] failed to get values for %q: %v", relName, err)
			continue
		}
		log.Printf("  • Retrieved values for %q", relName)

		// b) marshal into JSON
		rawJSON, err := json.Marshal(vals)
		if err != nil {
			log.Printf("  • [ERROR] failed to marshal values for %q: %v", relName, err)
			continue
		}
		log.Printf("  • Marshalled values for %q", relName)

		// c) build Module CR
		mod := &v1alpha1.Module{
			TypeMeta: metav1.TypeMeta{
				Kind:       "Module",
				APIVersion: "cyclops-ui.com/v1alpha1",
			},
			ObjectMeta: metav1.ObjectMeta{
				Name:      relName,
				Namespace: "cyclops", // could be a flag
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

		// d) submit to Cyclops API
		_, err = cyclopsClient.Modules("cyclops").Create(mod)
		if err != nil {
			log.Printf("  • [ERROR] failed to create Module for %q: %v", relName, err)
			continue
		}
		log.Printf("  ✔ Successfully migrated %q → Module/%s", relName, relName)
	}

	log.Printf("All done.")
}
