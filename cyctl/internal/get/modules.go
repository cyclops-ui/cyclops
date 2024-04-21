package get

import (
	"fmt"
	"strings"
	"time"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/ryanuber/columnize"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func ListModules(clientset *client.CyclopsV1Alpha1Client) {
	modules, err := clientset.Modules("cyclops").List(metav1.ListOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			fmt.Println("No modules found.")
			return
		}
		fmt.Printf("Error listing modules: %v\n", err)
		return
	}

	longestName := 0
	for _, module := range modules {
		if len(module.Name) > longestName {
			longestName = len(module.Name)
		}
	}

	moduleOutput := []string{"NAME" + strings.Repeat(" ", longestName-4) + " | AGE"}
	for _, module := range modules {
		age := time.Since(module.CreationTimestamp.Time).Round(time.Second)
		moduleOutput = append(moduleOutput, fmt.Sprintf("%s"+strings.Repeat(" ", longestName-len(module.Name))+" | %s", module.Name, age.String()))
	}

	moduleResult := columnize.SimpleFormat(moduleOutput)
	fmt.Println(moduleResult)

}
