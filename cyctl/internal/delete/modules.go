package delete

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
)

// DeleteModules deletes a specified module from the Cyclops API.
func DeleteModules(clientset *client.CyclopsV1Alpha1Client, moduleName string) {
	err := clientset.Modules("cyclops").Delete(moduleName)
	if err != nil {
		fmt.Printf("Error deleting the module: %v\n", err)
		return
	}
	fmt.Printf("module '%v' deleted", moduleName)
}
