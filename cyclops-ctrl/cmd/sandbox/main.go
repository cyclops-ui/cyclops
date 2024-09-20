package main

func main() {
	//k8sClient, err := k8sclient.New()
	//if err != nil {
	//	fmt.Println("error bootstrapping Kubernetes client", err)
	//	panic(err)
	//}
	//
	//specs := []k8sclient.ResourceWatchSpec{
	//	// Example: Listening to Pods in default namespace, Deployments with specific name in my-namespace, and Services in all namespaces
	//	{GVR: schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}, Namespace: "default", Name: "my-api"},
	//	{GVR: schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}, Namespace: "default", Name: "other-app"},
	//}
	//
	//eventChan, err := k8sClient.WatchKubernetesResources(specs)
	//if err != nil {
	//	log.Fatalf("Error starting Kubernetes resource watch: %v", err)
	//}
	//
	//for event := range eventChan {
	//	fmt.Println("Event received:", event.GetKind(), event.GetName())
	//}
}
