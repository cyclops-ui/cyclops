package kubeconfig

import (
	"path/filepath"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"

	"github.com/spf13/cobra"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

var Moduleset *client.CyclopsV1Alpha1Client

func GetKubeConfig() func(cmd *cobra.Command, args []string) {
	return func(cmd *cobra.Command, args []string) {
		var kubeconfig string
		if home := homedir.HomeDir(); home != "" {
			kubeconfig = filepath.Join(home, ".kube", "config")
		} else {
			kubeconfig = ""
		}

		config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			panic(err.Error())
		}

		Moduleset, err = client.NewForConfig(config)
		if err != nil {
			panic(err.Error())
		}
	}
}
