package delete

import (
	"fmt"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
)

// DeleteTemplateAuthRule deletes a specified template auth rule from the TemplateAuthRule Custom Resource.
func DeleteTemplateAuthRule(clientset *client.CyclopsV1Alpha1Client, templateAuthRuleNames []string) {
	if len(templateAuthRuleNames) == 0 {
		fmt.Println("Error: template name cannot be empty")
		return
	}

	for _, templateauthruleName := range templateAuthRuleNames {
		err := clientset.TemplateAuthRules("cyclops").Delete(templateauthruleName)
		if err != nil {
			fmt.Printf("Error from server (NotFound): %v\n", err)
		} else {
			fmt.Printf("TemplateAuthRule '%v' deleted successfully.\n", templateauthruleName)
		}
	}
}
