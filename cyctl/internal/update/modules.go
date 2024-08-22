package update

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	"github.com/spf13/cobra"
	apiextensionv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

var (
	updateModuleExample = `# updates module values; takes module name as an argument with flag --value
# to update replicas and version for a module named test
cyctl update module test --value="scaling.replicas=3" --value="general.version=1.27.1"
	`
)

// updates the given module from cyclops API
func updateModule(clientset *client.CyclopsV1Alpha1Client, moduleName string, values []string) {
	module, err := clientset.Modules("cyclops").Get(moduleName)
	if err != nil {
		fmt.Println("Failed to fetch module ", err)
		return
	}

	specValuesMap := make(map[string]interface{})
	err = json.Unmarshal(module.Spec.Values.Raw, &specValuesMap)
	if err != nil {
		fmt.Println("failed to decode json data:", err)
		return
	}

	for _, v := range values {
		keyValue := strings.Split(v, "=")
		if len(keyValue) != 2 {
			fmt.Println("invalid key value pair: ", v)
			return
		}
		key := keyValue[0]
		value := keyValue[1]

		err = unstructured.SetNestedField(specValuesMap, value, strings.Split(key, ".")...)
		if err != nil {
			fmt.Println(err)
			return
		}
	}

	updatedSpecValues, err := json.Marshal(specValuesMap)
	if err != nil {
		fmt.Println("failed to encode to json: ", err)
		return
	}

	module.Spec.Values = apiextensionv1.JSON{Raw: updatedSpecValues}
	module.TypeMeta = v1.TypeMeta{
		APIVersion: "cyclops-ui.com/v1alpha1",
		Kind:       "Module",
	}

	_, err = clientset.Modules("cyclops").Update(module)
	if err != nil {
		fmt.Println("failed to update module: ", err)
		return
	}

	fmt.Printf("successfully updated %v", moduleName)
}

var (
	UpdateModuleCMD = &cobra.Command{
		Use:     "module",
		Short:   "updates module values; takes module name as an argument with flag --value",
		Long:    "updates module values; takes module name as an argument with flag --value",
		Example: updateModuleExample,
		Args:    cobra.ExactArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			values, err := cmd.Flags().GetStringArray("value")
			if err != nil {
				fmt.Println("failed to get value of flag --value ")
				return
			}

			updateModule(kubeconfig.Moduleset, args[0], values)
		},
	}
)

func init() {
	UpdateModuleCMD.Flags().StringArrayP("value", "v", []string{}, "key value pair to update module")
	UpdateModuleCMD.MarkFlagRequired("value")
}
