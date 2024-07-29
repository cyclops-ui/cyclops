package update

import (
	"encoding/json"
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	apiextensionv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

var (
	updateModuleExample = `# updates the module,takes [module-name] as an argument with flags --key and --value
# to update replicas for a module named test 
cyctl update module test --key="scaling.replicas" --value=3
	`
)

// updates the given module from cyclops API
func updateModule(clientset *client.CyclopsV1Alpha1Client, moduleName, key string, value interface{}) {

	if key == "" {
		fmt.Println("Error: key cannot be an empty string")
		return
	}

	module, err := clientset.Modules("cyclops").Get(moduleName)
	if err != nil {
		fmt.Println("Failed to fetch module ", err)
		return

	}
	SpecValuesMap := make(map[string]interface{})
	err = json.Unmarshal(module.Spec.Values.Raw, &SpecValuesMap)
	if err != nil {

		fmt.Println("failed to decode json data:", err)
		return

	}
	err = unstructured.SetNestedField(SpecValuesMap, value, key)
	if err != nil {

		fmt.Println(err)
		return
	}
	updatedSpecValues, err := json.Marshal(SpecValuesMap)
	if err != nil {
		fmt.Println("failed to encode to json: ", err)
		return
	}
	module.Spec.Values = apiextensionv1.JSON{Raw: updatedSpecValues}
	updatedModule, err := clientset.Modules("cyclops").Update(module)
	if err != nil {
		fmt.Println("failed to update module: ", err)
		return
	}
	fmt.Printf("successfully updated %v", updatedModule.Name)
}

var (
	UpdateModule = &cobra.Command{

		Use:     "module",
		Short:   "updates the module,takes module-name as an argument with flags --key and --value",
		Long:    "updates the module,takes module-name as an argument with flags --key and --value",
		Example: updateModuleExample,
		Args:    cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {

			key, err := cmd.Flags().GetString("key")
			if err != nil {
				fmt.Println("failed to get value of flag key: ", err)
			}
			value, err := cmd.Flags().GetString("value")
			if err != nil {
				fmt.Println("failed to get value of flag --value ")
			}

			updateModule(kubeconfig.Moduleset, args[0], key, value)
		},
	}
)

func init() {
	UpdateModule.Flags().StringP("key", "k", "", "the field to update")
	UpdateModule.Flags().StringP("value", "v", 0, "field value")
	UpdateModule.MarkFlagRequired("key")
	UpdateModule.MarkFlagRequired("value")
}
