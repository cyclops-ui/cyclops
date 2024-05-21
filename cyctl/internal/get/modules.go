package get

import (
	"fmt"
	"strings"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func ListModules(clientset *client.CyclopsV1Alpha1Client) {
	modules, err := clientset.Modules("cyclops").List(metav1.ListOptions{})
	if err != nil {
		fmt.Printf("Error listing modules: %v\n", err)
		return
	}

	if len(modules) == 0 {
		fmt.Println("No modules found.")
		return
	}

	longestName := 20 // minimum column width
	for _, module := range modules {
		if len(module.Name) > longestName {
			longestName = len(module.Name)
		}
	}

	headerSpacing := max(0, longestName-4)
	fmt.Println("NAME" + strings.Repeat(" ", headerSpacing) + " AGE")
	for _, module := range modules {
		age := time.Since(module.CreationTimestamp.Time).Round(time.Second)
		nameSpacing := max(0, longestName-len(module.Name))
		fmt.Printf("%s"+strings.Repeat(" ", nameSpacing)+" %s\n", module.Name, age.String())
	}
}
