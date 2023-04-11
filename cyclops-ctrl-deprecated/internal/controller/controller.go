package controller

import (
	"bytes"
	"context"
	"errors"
	"flag"
	"fmt"
	"gitops/internal/storage"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gitops/internal/models"
	"gitops/internal/template"
	v1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

const (
	kubectl       = "kubectl"
	allNamespaces = "all"
)

var (
	clientset *kubernetes.Clientset
)

func init() {
	if os.Getenv("ENVIRONMENT") == "local" {
		var kubeconfig *string
		if home := homedir.HomeDir(); home != "" {
			kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
		} else {
			kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
		}
		flag.Parse()

		config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
		if err != nil {
			panic(err)
		}

		clientset, err = kubernetes.NewForConfig(config)
		if err != nil {
			panic(err)
		}

		return
	}

	config, err := rest.InClusterConfig()
	if err != nil {
		panic(err)
	}

	clientset, err = kubernetes.NewForConfig(config)
	if err != nil {
		panic(err)
	}
}

type Controller struct {
	storage *storage.Storage
}

func New() (*Controller, error) {
	store, err := storage.New()
	if err != nil {
		return nil, err
	}

	return &Controller{
		storage: store,
	}, nil
}

func DeployApp(ctx *gin.Context) {
	var reqData models.DeployRequest

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData)
		return
	}

	manifest, err := template.TemplateManifest(reqData)
	if err != nil {
		fmt.Println("error templating manifest", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	if err := kubectlApply(manifest); err != nil {
		fmt.Println("error applying", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Status(http.StatusOK)
}

func (c *Controller) DeployAppUsingManifest(ctx *gin.Context) {
	var reqData models.DeployWithManifestRequest

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData)
		ctx.Status(http.StatusBadRequest)
		return
	}

	if err := kubectlApply(reqData.Manifest); err != nil {
		fmt.Println("error applying", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	if err := c.storage.StoreHistoryEntry("", reqData.AppName, models.HistoryEntry{
		ChangeTitle:      reqData.ChangeTitle,
		Date:             time.Now().String(),
		AppliedManifest:  reqData.Manifest,
		ReplacedManifest: reqData.PreviousManifest,
		Success:          true,
	}); err != nil {
		fmt.Println("unable to store manifest to history")
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func Rescale(ctx *gin.Context) {
	var reqData models.RescaleRequest

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData)
		ctx.Status(http.StatusBadRequest)
		return
	}

	deploymentClient := clientset.AppsV1().Deployments(reqData.Namespace)
	scale, err := deploymentClient.GetScale(context.TODO(), reqData.Name, metav1.GetOptions{})
	if err != nil {
		fmt.Println("error get deployment", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	sc := *scale
	sc.Spec.Replicas = reqData.DesiredReplicas

	if _, err := deploymentClient.UpdateScale(context.TODO(), reqData.Name, &sc, metav1.UpdateOptions{}); err != nil {
		fmt.Println("error get deployment", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Status(http.StatusOK)
}

func DeployUsingStruct(ctx *gin.Context) {
	deploymentClient := clientset.AppsV1().Deployments(apiv1.NamespaceDefault)

	_, err := deploymentClient.Create(
		context.TODO(),
		&v1.Deployment{
			TypeMeta: metav1.TypeMeta{
				Kind: "deployment",
			},
			ObjectMeta: metav1.ObjectMeta{
				Name:      "cile-k8s-api",
				Namespace: apiv1.NamespaceDefault,
				Labels: map[string]string{
					"app": "nginx",
				},
			},
			Spec: v1.DeploymentSpec{
				Replicas: getInt32Ptr(3),
				Selector: &metav1.LabelSelector{
					MatchLabels: map[string]string{
						"app": "nginx",
					},
				},
				Template: apiv1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{
						Labels: map[string]string{
							"app": "nginx",
						},
					},
					Spec: apiv1.PodSpec{
						Containers: []apiv1.Container{
							{
								Name:  "cile-k8s-api",
								Image: "nginx",
								Ports: []apiv1.ContainerPort{
									{
										ContainerPort: 80,
									},
								},
							},
						},
					},
				},
				Strategy:                v1.DeploymentStrategy{},
				MinReadySeconds:         0,
				RevisionHistoryLimit:    nil,
				Paused:                  false,
				ProgressDeadlineSeconds: nil,
			},
		},
		metav1.CreateOptions{},
	)

	if err != nil {
		fmt.Println("unable to deploy", err)
		ctx.Status(http.StatusBadRequest)
		return
	}

	ctx.Status(http.StatusOK)
}

func (c *Controller) Delete(ctx *gin.Context) {
	var reqData models.DeleteRequest

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData)
		ctx.Status(http.StatusBadRequest)
		return
	}

	cmd := exec.Command(kubectl, "delete", reqData.Kind, reqData.Name)
	cmd.Stdout = os.Stdout
	err := cmd.Run()
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	if err := c.storage.DeleteDeploymentHistory(reqData.Namespace, reqData.Name); err != nil {
		fmt.Println("error deleting history", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func GetDeployment(ctx *gin.Context) {
	deploymentClient := clientset.AppsV1().Deployments(ctx.Param("namespace"))
	deployment, err := deploymentClient.Get(context.TODO(), ctx.Param("name"), metav1.GetOptions{})
	if err != nil {
		fmt.Println("error get deployment", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	podClient := clientset.CoreV1().Pods(ctx.Param("namespace"))
	podList, err := podClient.List(context.TODO(), metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%v", deployment.Name),
	})
	if err != nil {
		fmt.Println("error get pods", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	pods := make([]*models.Pod, 0, len(podList.Items))
	envVars := make([]models.EnvironmentVariable, 0)
	seen := make(map[string]struct{})
	for _, pod := range podList.Items {
		pods = append(pods, &models.Pod{
			Name:         pod.Name,
			NodeName:     pod.Spec.NodeName,
			Containers:   mapImages(deployment.Spec.Template.Spec),
			Healthy:      true,
			Age:          shortDur(time.Now().Sub(deployment.CreationTimestamp.Time)),
			Status:       string(pod.Status.Phase),
			Labels:       mapLabels(deployment.Labels),
			CyclopsFleet: pod.Annotations["cyclops.fleet.version"],
		})

		for _, ev := range pod.Spec.Containers[0].Env {
			if _, ok := seen[ev.Name]; ok {
				continue
			}

			seen[ev.Name] = struct{}{}
			envVars = append(envVars, models.EnvironmentVariable{
				Name:  ev.Name,
				Value: ev.Value,
			})
		}
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, models.Deployment{
		AppName:              deployment.Name,
		Replicas:             int(*deployment.Spec.Replicas),
		Namespace:            deployment.Namespace,
		ImageName:            mapImages(deployment.Spec.Template.Spec),
		Kind:                 "Deployment",
		Age:                  shortDur(time.Now().Sub(deployment.CreationTimestamp.Time)),
		Restarts:             deployment.Generation,
		Healthy:              deployment.Status.AvailableReplicas == deployment.Status.Replicas,
		Labels:               mapLabels(deployment.Labels),
		EnvironmentVariables: envVars,
		Pods:                 pods,
	})
}

func (c *Controller) GetDeploymentFieldsValues(ctx *gin.Context) {
	name, namespace := ctx.Param("name"), ctx.Param("namespace")

	deploymentClient := clientset.AppsV1().Deployments(namespace)
	deployment, err := deploymentClient.Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		fmt.Println("error get deployment", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	configKey := deployment.Annotations["cyclops.config"]

	config, err := c.storage.GetConfig(configKey)
	if err != nil {
		fmt.Println("error fetching config", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	buff := new(bytes.Buffer)

	command := exec.Command(kubectl, "get", "deployments", name, "-n", namespace, "-o", "yaml")
	command.Stdout = buff
	command.Stderr = os.Stderr
	if err = command.Run(); err != nil {
		fmt.Println("error kubectl get", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, struct {
		CurrentVersion string                 `json:"current_version"`
		Configuration  models.ConfigSpec      `json:"configuration"`
		Fields         map[string]interface{} `json:"fields"`
	}{
		CurrentVersion: deployment.Annotations["cyclops.fleet.version"],
		Configuration:  config,
		Fields:         parseManifestByFields(buff.String(), config.Fields),
	})
}

func GetMultiArtefactsK8s(ctx *gin.Context) {
	namespaces := strings.Split(ctx.Param("namespace"), ",")
	deployments := make([]*models.DeploymentPreview, 0)

	for _, ns := range namespaces {
		deploymentClient := clientset.AppsV1().Deployments(getNamespace(ns))
		deploymentList, err := deploymentClient.List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			fmt.Println("error list deployments", err)
			ctx.Status(http.StatusInternalServerError)
			return
		}
		for _, deployment := range deploymentList.Items {
			deployments = append(deployments, &models.DeploymentPreview{
				AppName:   deployment.Name,
				Replicas:  int(*deployment.Spec.Replicas),
				ImageName: mapImages(deployment.Spec.Template.Spec),
				Namespace: deployment.Namespace,
				Kind:      deployment.Kind,
				Healthy:   deployment.Status.AvailableReplicas == deployment.Status.Replicas,
				Manifest:  "",
			})
		}
	}

	sort.Slice(deployments, func(i, j int) bool {
		return deployments[i].AppName < deployments[j].AppName
	})

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, deployments)
}

func GetManifest(ctx *gin.Context) {
	var reqData models.DeployRequest

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData)
		ctx.String(http.StatusInternalServerError, "error binding request")
		return
	}

	reqData = mapAppLabel(reqData)

	manifest, err := template.TemplateManifest(reqData)
	if err != nil {
		fmt.Println("error templating manifest", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, models.PreviewResponse{
		// TODO encode
		Manifest: manifest,
	})
}

func TemplateManifest(ctx *gin.Context) {
	var reqData models.ConfigurableRequest

	if err := ctx.BindJSON(&reqData); err != nil {
		fmt.Println("error binding request", reqData, err)
		ctx.String(http.StatusInternalServerError, "error binding request")
		return
	}

	manifest, err := template.TemplateManifestNew(reqData)
	if err != nil {
		fmt.Println("error patching cyclops data", reqData, err)
		ctx.String(http.StatusInternalServerError, "error binding request")
		return
	}

	// TODO: decide if cyclops should be aware of annotations
	//manifest, err = setCyclopsMetaAnnotations(manifest, map[string]string{
	//	"cyclops.fleet.version": reqData.ChangeTitle,
	//	"cyclops.config":        reqData.ConfigName,
	//})
	//if err != nil {
	//	fmt.Println("error patching cyclops data", reqData, err)
	//	ctx.String(http.StatusInternalServerError, "error binding request")
	//	return
	//}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, models.PreviewResponse{
		// TODO encode
		Manifest: manifest,
	})
}

func GetNamespaces(ctx *gin.Context) {
	namespaceClient := clientset.CoreV1().Namespaces()
	namespaces, err := namespaceClient.List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		fmt.Println("error get namespaces", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, &models.NamespaceResponse{
		Namespaces: mapNamespaces(namespaces),
	})
}

func CreateSSHPod(ctx *gin.Context) {
	manifest, err := template.TemplateManifest(models.DeployRequest{
		AppName:      "ssh-dev-pod-name",
		Replicas:     1,
		Namespace:    "default",
		Kind:         "deployment",
		ImageName:    "nginx",
		NeedsService: false,
	})
	if err != nil {
		fmt.Println("error templating manifest", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	if err := kubectlApply(manifest); err != nil {
		fmt.Println("error applying", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	podClient := clientset.CoreV1().Pods(apiv1.NamespaceDefault)
	podList, err := podClient.List(context.TODO(), metav1.ListOptions{})

	if err != nil {
		fmt.Println("error getting pods", err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	time.Sleep(time.Second * 3)

	for _, pod := range podList.Items {
		if pod.Labels["app"] != "nginx-dev-pod" {
			continue
		}

		ctx.Header("Access-Control-Allow-Origin", "*")
		ctx.JSON(http.StatusOK, struct {
			Command string `json:"command"`
		}{
			Command: fmt.Sprintf("kubectl --stdin --tty exec %v -- /bin/sh", pod.Name),
		})
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.String(http.StatusInternalServerError, "didnt find any ssh pods")
}

func Options(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")
	if ctx.Request.Method != http.MethodOptions {
		ctx.Next()
		return
	}

	ctx.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
	ctx.Header("Access-Control-Allow-Headers", "authorization, origin, content-type, accept")
	ctx.Header("Allow", "HEAD,GET,POST,PUT,PATCH,DELETE,OPTIONS")
	ctx.Header("Content-Type", "application/json")
	ctx.AbortWithStatus(http.StatusOK)
}

func mapImages(podSpec apiv1.PodSpec) string {
	images := make([]string, 0, len(podSpec.Containers))

	for _, container := range podSpec.Containers {
		images = append(images, container.Image)
	}

	return strings.Join(images, ",")
}

func mapNamespaces(namespacesList *apiv1.NamespaceList) []*models.Namespace {
	namespaces := make([]*models.Namespace, 0, len(namespacesList.Items))

	for _, namespace := range namespacesList.Items {
		namespaces = append(namespaces, &models.Namespace{
			Name: namespace.Name,
		})
	}

	return namespaces
}

func getNamespace(namespace string) string {
	if namespace == "" || namespace == allNamespaces {
		return apiv1.NamespaceAll
	}

	return namespace
}

func shortDur(d time.Duration) string {
	s := d.String()
	if strings.HasSuffix(s, "m0s") {
		s = s[:len(s)-2]
	}
	if strings.HasSuffix(s, "h0m") {
		s = s[:len(s)-2]
	}
	return s
}

func kubectlApply(manifest string) error {
	fmt.Println(manifest)
	f, err := os.Create("./tmp/manifest.yaml")
	defer f.Close()
	if err != nil {
		return errors.New("error creating a file")
	}

	_, err = f.Write([]byte(manifest))
	if err != nil {
		return errors.New("error writing a file")
	}

	// TODO: error handling
	c := exec.Command(kubectl, "apply", "-f", "./tmp/manifest.yaml")
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	if err = c.Run(); err != nil {
		return err
	}

	return nil
}

func getInt32Ptr(v int32) *int32 {
	i := v
	return &i
}

func getStringPtr(v string) *string {
	i := v
	return &i
}

func mapLabels(l map[string]string) []models.Label {
	labels := make([]models.Label, 0, len(l))
	for k, v := range l {
		labels = append(labels, models.Label{
			Key:   k,
			Value: v,
		})
	}

	sort.Slice(labels, func(i, j int) bool {
		return labels[i].Key < labels[i].Key
	})

	return labels
}

func mapAppLabel(request models.DeployRequest) models.DeployRequest {
	for _, label := range request.Labels {
		if label.Key == "app" {
			return request
		}
	}

	request.Labels = append(request.Labels, models.Label{
		Key:   "app",
		Value: request.AppName,
	})

	return request
}

func mapEnvVars(all []models.EnvironmentVariable, seen map[string]struct{}, env []apiv1.EnvVar) []models.EnvironmentVariable {
	for _, v := range env {
		if _, mapped := seen[v.Name]; mapped {
			continue
		}

		seen[v.Name] = struct{}{}
		all = append(all, models.EnvironmentVariable{
			Name:  v.Name,
			Value: v.Value,
		})
	}

	return all
}