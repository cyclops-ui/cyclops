package delete

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
)

// DeleteModules deletes a specified module from the Cyclops API.
func DeleteModules(clientset *client.CyclopsV1Alpha1Client, moduleNames []string) {
	if len(moduleNames) == 0 {
		fmt.Println("Error: module names cannot be empty")
		return
	}

	for _, moduleName := range moduleNames {
		err := clientset.Modules("cyclops").Delete(moduleName)
		if err != nil {
			fmt.Printf("Error deleting the module '%v': %v\n", moduleName, err)
		} else {
			fmt.Printf("Module '%v' deleted successfully.\n", moduleName)
		}
	}
}
