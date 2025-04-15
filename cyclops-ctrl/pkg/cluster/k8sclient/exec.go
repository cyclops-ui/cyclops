package k8sclient

import (
	v1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/tools/remotecommand"
)

func (k *KubernetesClient) CommandExecutor(namespace, podName, container string) (remotecommand.Executor, error) {
	req := k.clientset.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(podName).
		Namespace(namespace).
		SubResource("exec").
		VersionedParams(&v1.PodExecOptions{
			Container: container,
			Command:   []string{"sh"},
			Stdin:     true,
			Stdout:    true,
			Stderr:    true,
			TTY:       true,
		}, scheme.ParameterCodec)

	//fmt.Println(req.URL().String())
	//
	//return remotecommand.NewWebSocketExecutor(k.config, "POST", req.URL().String())

	return remotecommand.NewSPDYExecutor(k.config, "POST", req.URL())
}
