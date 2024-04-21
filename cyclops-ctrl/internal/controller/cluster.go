package controller

import (
	"fmt"
	"net/http"

	"github.com/cyclops-ui/cycops/cycops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cycops/cycops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cycops/cycops-ctrl/internal/models/dto"
	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/api/errors"
)

type Cluster struct {
	kubernetesClient *k8sclient.KubernetesClient
}

func NewClusterController(kubernetes *k8sclient.KubernetesClient) *Cluster {
	return &Cluster{
		kubernetesClient: kubernetes,
	}
}

func (c *Cluster) ListNodes(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	nodes, err := c.kubernetesClient.ListNodes()
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, mapper.MapNodes(nodes))
}

func (c *Cluster) GetNode(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	nodeName := ctx.Param("name")

	node, err := c.kubernetesClient.GetNode(nodeName)
	if errors.IsNotFound(err) {
		fmt.Printf("Node %s does not exist.\n", nodeName)
		ctx.JSON(http.StatusBadRequest, dto.Error{
			Message:     "Node with name does not exist",
			Description: "Check if the provided node name is correct",
		})
		return
	}
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	pods, err := c.kubernetesClient.GetPodsForNode(nodeName)
	if err != nil {
		fmt.Printf("Error listing pods for node: %v", nodeName)
		ctx.JSON(http.StatusInternalServerError, dto.Error{
			Message: fmt.Sprintf("Error listing pods for node: %v", nodeName),
		})
		return
	}

	dto := mapper.MapNode(node, pods)

	ctx.JSON(http.StatusOK, dto)
}
