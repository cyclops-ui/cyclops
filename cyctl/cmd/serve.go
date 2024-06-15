package cmd

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"github.com/spf13/cobra"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"path/filepath"
	"strings"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/portforward"
	"k8s.io/client-go/transport/spdy"
	"k8s.io/client-go/util/homedir"
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
		startPortForwarding(localPort)
	},
}

func startPortForwarding(localPort int) {
	var kubeconfig *string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	flag.Parse()

	config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
	if err != nil {
		log.Fatal(err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatal(err)
	}

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

	rand.Seed(time.Now().UnixNano())
	podIndex := rand.Intn(len(podList.Items))
	podName := podList.Items[podIndex].Name

	roundTripper, upgrader, err := spdy.RoundTripperFor(config)
	if err != nil {
		log.Fatal(err)
	}

	path := fmt.Sprintf("/api/v1/namespaces/%s/pods/%s/portforward", "cyclops", podName)
	hostIP := strings.TrimLeft(config.Host, "htps:/")
	serverURL := url.URL{Scheme: "https", Path: path, Host: hostIP}

	dialer := spdy.NewDialer(upgrader, &http.Client{Transport: roundTripper}, http.MethodPost, &serverURL)

	ports := []string{fmt.Sprintf("%d:80", localPort)}

	stopChan, readyChan := make(chan struct{}, 1), make(chan struct{}, 1)
	out, errOut := new(bytes.Buffer), new(bytes.Buffer)

	forwarder, err := portforward.New(dialer, ports, stopChan, readyChan, out, errOut)
	if err != nil {
		log.Fatal(err)
	}

	go func() {
		for range readyChan {
		}
		if len(errOut.String()) != 0 {
			log.Fatal(errOut.String())
		} else if len(out.String()) != 0 {
			fmt.Println(out.String())
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
