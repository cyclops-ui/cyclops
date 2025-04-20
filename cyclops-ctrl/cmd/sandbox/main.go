package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"k8s.io/client-go/kubernetes/scheme"
	"os"
	"path/filepath"

	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
	//"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/remotecommand"
	"k8s.io/client-go/util/homedir"
)

func main() {
	// Load kubeconfig
	var kubeconfig *string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	namespace := flag.String("namespace", "default", "namespace of the pod")
	podName := flag.String("pod", "", "name of the pod")
	containerName := flag.String("container", "", "name of the container in the pod")
	flag.Parse()

	if *podName == "" {
		fmt.Println("Pod name is required")
		os.Exit(1)
	}

	// Build config from kubeconfig file
	config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
	if err != nil {
		panic(err.Error())
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	// Create the REST request
	req := clientset.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(*podName).
		Namespace(*namespace).
		SubResource("exec").
		VersionedParams(&v1.PodExecOptions{
			Container: *containerName,
			Command:   []string{"sh"},
			Stdin:     true,
			Stdout:    true,
			Stderr:    true,
			TTY:       true,
		}, scheme.ParameterCodec)

	exec, err := remotecommand.NewSPDYExecutor(config, "POST", req.URL())
	if err != nil {
		panic(err)
	}

	m := MojWriter{}

	var stderr bytes.Buffer
	options := remotecommand.StreamOptions{
		Stdin:  &m,
		Stdout: &m,
		Stderr: &m,
		Tty:    true,
	}

	fmt.Println("rokam stram")

	err = exec.StreamWithContext(context.Background(), options)
	if err != nil {
		fmt.Printf("Command execution error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("dobio nekaj", err)

	//fmt.Printf("STDOUT:\n%s\n", stdout.String())
	fmt.Printf("STDERR:\n%s\n", stderr.String())
}

type MojWriter struct {
}

func (m MojWriter) Write(p []byte) (n int, err error) {
	fmt.Println("ja sam writer", string(p), "kaka")
	return len(p), nil
}

func (m MojWriter) Read(p []byte) (n int, err error) {
	n = copy(p, []byte("ls\n"))

	fmt.Println()
	fmt.Println("start")
	fmt.Println(string(p))
	fmt.Println("end")
	fmt.Println()

	return
}
