package cmd

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"time"
)

func reconcileModule(clientset *client.CyclopsV1Alpha1Client, moduleName string) {
	module, err := clientset.Modules("cyclops").Get(moduleName)
	if err != nil {
		fmt.Println("Failed to fetch the module ", err)
		return
	}
	annotations := module.GetAnnotations()
	if annotations == nil {
		annotations = make(map[string]string)
	}
	annotations["cyclops/reconciled-at"] = time.Now().Format(time.RFC3339)
	module.SetAnnotations(annotations)
	module.TypeMeta = v1.TypeMeta{
		APIVersion: "cyclops-ui.com/v1alpha1",
		Kind:       "Module",
	}

	_, err = clientset.Modules("cyclops").Update(module)
	if err != nil {
		fmt.Println("failed to update module: ", err)
		return
	}
	fmt.Printf("successfully triggered reconcilation for module: %v", moduleName)

}

var (
	reconcileExample = `# Reconcile a Module 
	cyctl reconcile <modulename>`
)

var reconcileCMD = &cobra.Command{
	Use:     "reconcile",
	Short:   "Trigger module reconciliation",
	Long:    "Trigger module reconciliation",
	Example: reconcileExample,
	Args:    cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		moduleName := args[0]
		reconcileModule(kubeconfig.Moduleset, moduleName)
	},
}

func init() {
	RootCmd.AddCommand(reconcileCMD)

}
