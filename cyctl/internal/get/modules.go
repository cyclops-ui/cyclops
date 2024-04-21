package get

import (
	"context"
	"fmt"
	"time"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func ListModules(clientset *kubernetes.Clientset) {
	labelSelector := metav1.LabelSelector{
		MatchLabels: map[string]string{
			"app.kubernetes.io/managed-by": "cyclops",
		},
	}

	modules, err := clientset.AppsV1().Deployments("").List(context.TODO(), metav1.ListOptions{
		LabelSelector: metav1.FormatLabelSelector(&labelSelector),
	})
	if err != nil {
		if errors.IsNotFound(err) {
			fmt.Println("No modules found.")
			return
		}
		fmt.Printf("Error listing modules: %v\n", err)
		return
	}

	fmt.Println("NAME       AGE")
	for _, module := range modules.Items {
		age := time.Since(module.CreationTimestamp.Time).Round(time.Second)
		fmt.Printf("%-10s %s\n", module.Name, age.String())
	}
}
