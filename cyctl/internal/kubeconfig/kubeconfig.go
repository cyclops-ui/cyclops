package kubeconfig

import (
	"path/filepath"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1/client"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"

	"github.com/spf13/cobra"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

var Moduleset *client.CyclopsV1Alpha1Client
var Clientset *kubernetes.Clientset
var Config *rest.Config
var K8sClient *k8sclient.KubernetesClient

func GetKubeConfig() func(cmd *cobra.Command, args []string) {
	return func(cmd *cobra.Command, args []string) {
		var kubeconfig string
		if home := homedir.HomeDir(); home != "" {
			kubeconfig = filepath.Join(home, ".kube", "config")
		} else {
			kubeconfig = ""
		}

		var err error
		Config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			panic(err.Error())
		}

		Moduleset, err = client.NewForConfig(Config)
		if err != nil {
			panic(err.Error())
		}

		Clientset, err = kubernetes.NewForConfig(Config)
		if err != nil {
			panic(err.Error())
		}

		K8sClient, err = k8sclient.New()
		if err != nil {
			panic(err.Error())
		}
	}
}
