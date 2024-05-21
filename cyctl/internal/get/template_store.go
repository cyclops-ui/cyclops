package get

import (
	"fmt"
	"strings"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func ListTemplateStore(clientset *client.CyclopsV1Alpha1Client) {
	templates, err := clientset.TemplateStore("cyclops").List(metav1.ListOptions{})
	if err != nil {
		fmt.Printf("Error listing templates: %v\n", err)
		return
	}

	if len(templates) == 0 {
		fmt.Println("No templatestore found.")
		return
	}

	longestName := 20 // minimum column width
	for _, template := range templates {
		if len(template.Name) > longestName {
			longestName = len(template.Name)
		}
	}

	headerSpacing := max(0, longestName-4)
	fmt.Println("NAME" + strings.Repeat(" ", headerSpacing) + " AGE")
	for _, template := range templates {
		age := time.Since(template.CreationTimestamp.Time).Round(time.Second)
		nameSpacing := max(0, longestName-len(template.Name))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s\n", template.Name, age.String())
	}
}
