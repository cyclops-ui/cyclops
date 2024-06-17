package cmd

import (
	"context"
	"fmt"
	"github.com/spf13/cobra"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/cyclops-ui/cycops-cyctl/internal/kubeconfig"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/portforward"
	"k8s.io/client-go/transport/spdy"
)

var serveCMD = &cobra.Command{
	Use:   "serve -port [port]",
	Short: "Start the Cyclops UI",
	Long:  "Start the Cyclops UI by forwarding the Cyclops UI service's port to a local port",
	Run: func(cmd *cobra.Command, args []string) {
		localPort, err := cmd.Flags().GetInt("port")
		if err != nil {
			log.Fatal(err)
		}
		startPortForwarding(kubeconfig.Clientset, localPort)
	},
}

func startPortForwarding(clientset *kubernetes.Clientset, localPort int) {
	service, err := clientset.CoreV1().Services("cyclops").Get(context.TODO(), "cyclops-ui", metav1.GetOptions{})
	if err != nil {
		log.Fatal(err)
	}

	podList, err := clientset.CoreV1().Pods("cyclops").List(context.TODO(), metav1.ListOptions{
		LabelSelector: labels.Set(service.Spec.Selector).String(),
	})
	if err != nil {
		log.Fatal(err)
	}
	if len(podList.Items) == 0 {
		log.Fatal("no pods found for service cyclops-ui in namespace cyclops")
	}

	podName := podList.Items[0].Name

	roundTripper, upgrader, err := spdy.RoundTripperFor(kubeconfig.Config)
	if err != nil {
		log.Fatal(err)
	}

	path := fmt.Sprintf("/api/v1/namespaces/%s/pods/%s/portforward", "cyclops", podName)
	hostIP := strings.TrimLeft(kubeconfig.Config.Host, "htps:/")
	serverURL := url.URL{Scheme: "https", Path: path, Host: hostIP}

	dialer := spdy.NewDialer(upgrader, &http.Client{Transport: roundTripper}, http.MethodPost, &serverURL)

	ports := []string{fmt.Sprintf("%d:80", localPort)}

	stopChan, readyChan := make(chan struct{}, 1), make(chan struct{}, 1)

	forwarder, err := portforward.New(dialer, ports, stopChan, readyChan, os.Stdout, os.Stderr)
	if err != nil {
		log.Fatal(err)
	}

	go func() {
		for range readyChan {
		}
	}()

	if err = forwarder.ForwardPorts(); err != nil {
		log.Fatal(err)
	}

	fmt.Println("Port forwarding stopped")
}

func init() {
	serveCMD.Flags().IntP("port", "p", 3000, "local port to forward to")
	RootCmd.AddCommand(serveCMD)
}
