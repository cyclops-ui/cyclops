package controller

import (
	"fmt"
	"gitops/internal/workflow/cyclops"
	"gitops/internal/workflow/cyclops/models"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Controller struct {
	workflowRunner *cyclops.WorkflowRunner
}

func New(workflowRunner *cyclops.WorkflowRunner) *Controller {
	return &Controller{
		workflowRunner: workflowRunner,
	}
}

func (c *Controller) DeployApp(ctx *gin.Context) {
	var request models.DeployRequest
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		return
	}

	if err := c.workflowRunner.DeployApp(request); err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Status(http.StatusOK)
}

func (c *Controller) DeployAppUsingManifest(ctx *gin.Context) {
	var request models.DeployWithManifestRequest
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	if err := c.workflowRunner.DeployUsingManifest(request); err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (c *Controller) Rescale(ctx *gin.Context) {
	var request models.RescaleRequest
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	if err := c.workflowRunner.Rescale(request); err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Status(http.StatusOK)
}

func (c *Controller) DeployUsingStruct(ctx *gin.Context) {
	deploymentSpec := &v1.Deployment{
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
	}

	if err := c.workflowRunner.DeployUsingStruct(deploymentSpec); err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusBadRequest)
		return
	}

	ctx.Status(http.StatusOK)
}

func (c *Controller) Delete(ctx *gin.Context) {
	var request models.DeleteRequest
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	if err := c.workflowRunner.Delete(request); err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (c *Controller) GetDeployment(ctx *gin.Context) {
	namespace := ctx.Param("namespace")
	name := ctx.Param("name")

	deployment, err := c.workflowRunner.GetDeployment(namespace, name)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, deployment)
}

func (c *Controller) GetDeploymentFieldsValues(ctx *gin.Context) {
	name, namespace := ctx.Param("name"), ctx.Param("namespace")

	fields, err := c.workflowRunner.GetDeploymentFields(namespace, name)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, fields)
}

func (c *Controller) GetMultiArtefactsK8s(ctx *gin.Context) {
	namespaces := strings.Split(ctx.Param("namespace"), ",")

	deployments, err := c.workflowRunner.GetMultiArtefacts(namespaces)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, deployments)
}

func (c *Controller) GetManifest(ctx *gin.Context) {
	var request models.DeployRequest
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	manifest, err := c.workflowRunner.GetManifest(request)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, manifest)
}

func (c *Controller) TemplateManifest(ctx *gin.Context) {
	var request models.ConfigurableRequest
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	manifest, err := c.workflowRunner.TemplateManifest(request)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, manifest)
}

func (c *Controller) GetNamespaces(ctx *gin.Context) {
	namespaces, err := c.workflowRunner.GetNamespaces()
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, namespaces)
}

func (c *Controller) CreateSSHPod(ctx *gin.Context) {
	podList, err := c.workflowRunner.CreateSSHPod()
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	time.Sleep(time.Second * 3)

	for _, pod := range podList {
		if pod.Labels["app"] != "nginx-dev-pod" {
			continue
		}

		ctx.Header("Access-Control-Allow-Origin", "*")
		ctx.JSON(http.StatusOK, models.Cmd{
			Command: fmt.Sprintf("kubectl --stdin --tty exec %v -- /bin/sh", pod.Name),
		})
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.String(http.StatusInternalServerError, "didnt find any ssh pods")
}

func (c *Controller) History(ctx *gin.Context) {
	namespace := ""
	name := ctx.Param("name")

	history, err := c.workflowRunner.GetDeploymentHistory(namespace, name)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, history)
}

func getInt32Ptr(v int32) *int32 {
	i := v
	return &i
}
