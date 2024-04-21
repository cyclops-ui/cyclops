package get

import (
	"fmt"
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

	moduleOutput := []string{"NAME | AGE"}
	for _, module := range modules {
		age := time.Since(module.CreationTimestamp.Time).Round(time.Second)
		moduleOutput = append(moduleOutput, fmt.Sprintf("%s | %s", module.Name, age.String()))
	}

	moduleResult := columnize.SimpleFormat(moduleOutput)
	fmt.Println(moduleResult)

}
