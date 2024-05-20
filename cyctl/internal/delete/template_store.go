package delete

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
)

// DeleteTemplates deletes a specified template from the TemplateStore Custom Resource.
func DeleteTemplates(clientset *client.CyclopsV1Alpha1Client, templateNames []string) {
	if len(templateNames) == 0 {
		fmt.Println("Error: template names cannot be empty")
		return
	}

	for _, templateName := range templateNames {
		err := clientset.TemplateStore("cyclops").Delete(templateName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
		} else {
			fmt.Printf("Template '%v' deleted successfully.\n", templateName)
		}
	}
}
