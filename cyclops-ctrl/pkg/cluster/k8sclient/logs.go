package k8sclient

import (
	"bufio"
	"context"
	"io"
	"sort"

	apiv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
)

func (k *KubernetesClient) GetStreamedPodLogs(ctx context.Context, namespace, container, name string, logCount *int64, logChan chan<- string) error {
	podLogOptions := apiv1.PodLogOptions{
		Container:  container,
		TailLines:  logCount,
		Timestamps: true,
		Follow:     true,
	}

	podClient := k.clientset.CoreV1().Pods(namespace).GetLogs(name, &podLogOptions)
	stream, err := podClient.Stream(ctx)
	if err != nil {
		return err
	}
	defer stream.Close()

	scanner := bufio.NewScanner(stream)

	for scanner.Scan() {
		logChan <- scanner.Text()
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	return nil
}

func (k *KubernetesClient) GetPodLogs(namespace, container, name string, numLogs *int64) ([]string, error) {
	podLogOptions := apiv1.PodLogOptions{
		Container:  container,
		TailLines:  numLogs,
		Timestamps: true,
	}
	podClient := k.clientset.CoreV1().Pods(namespace).GetLogs(name, &podLogOptions)
	stream, err := podClient.Stream(context.Background())
	if err != nil {
		return nil, err
	}

	defer func(stream io.ReadCloser) {
		err := stream.Close()
		if err != nil {
			return
		}
	}(stream)

	var logs []string
	scanner := bufio.NewScanner(stream)
	for scanner.Scan() {
		logs = append(logs, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return logs, nil
}

func (k *KubernetesClient) GetDeploymentLogs(namespace, container, deployment string, numLogs *int64) ([]string, error) {
	deploymentClient := k.clientset.AppsV1().Deployments(namespace)
	deploymentObj, err := deploymentClient.Get(context.Background(), deployment, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	pods, err := k.clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(deploymentObj.Spec.Selector.MatchLabels).String(),
	})
	if err != nil {
		return nil, err
	}

	var logs []string
	for _, pod := range pods.Items {
		podLogs, err := k.GetPodLogs(namespace, container, pod.Name, numLogs)
		if err != nil {
			return nil, err
		}
		logs = append(logs, podLogs...)
	}
	sort.Strings(logs)
	return logs, nil
}

func (k *KubernetesClient) GetStatefulSetsLogs(namespace, container, name string, numLogs *int64) ([]string, error) {
	statefulsetClient := k.clientset.AppsV1().StatefulSets(namespace)
	statefulsetObj, err := statefulsetClient.Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	pods, err := k.clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: labels.Set(statefulsetObj.Spec.Selector.MatchLabels).String(),
	})
	if err != nil {
		return nil, err
	}

	var logs []string
	for _, pod := range pods.Items {
		podLogs, err := k.GetPodLogs(namespace, container, pod.Name, numLogs)
		if err != nil {
			return nil, err
		}
		logs = append(logs, podLogs...)
	}
	sort.Strings(logs)
	return logs, nil
}
