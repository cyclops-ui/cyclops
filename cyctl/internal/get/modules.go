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

	longestName := 0
	for _, module := range modules {
		if len(module.Name) > longestName {
			longestName = len(module.Name)
		}
	}

	fmt.Println("NAME" + strings.Repeat(" ", longestName-4) + " AGE")
	for _, module := range modules {
		age := time.Since(module.CreationTimestamp.Time).Round(time.Second)
		fmt.Printf("%s"+strings.Repeat(" ", longestName-len(module.Name))+" %s\n", module.Name, age.String())
	}
}
