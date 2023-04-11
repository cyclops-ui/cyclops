package controller

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/cyclops-ui/cycops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cycops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cycops-ctrl/internal/models/dto"
)

type Modules struct {
	kubernetesClient *k8sclient.KubernetesClient
}

func NewModulesController(kubernetes *k8sclient.KubernetesClient) *Modules {
	return &Modules{
		kubernetesClient: kubernetes,
	}
}

func (m *Modules) GetModule(ctx *gin.Context) {
	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, mapper.ModuleToDTO(*module))
}

func (m *Modules) ListModules(ctx *gin.Context) {
	modules, err := m.kubernetesClient.ListModules()
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, mapper.ModuleListToDTO(modules))
}

func (m *Modules) DeleteModule(ctx *gin.Context) {
	err := m.kubernetesClient.DeleteModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (m *Modules) CreateModule(ctx *gin.Context) {
	var request dto.Module
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	err := m.kubernetesClient.CreateModule(mapper.RequestToModule(request))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (m *Modules) UpdateModule(ctx *gin.Context) {
	var request dto.Module
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	curr, err := m.kubernetesClient.GetModule(request.Name)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	module := mapper.RequestToModule(request)
	module.SetResourceVersion(curr.GetResourceVersion())

	err = m.kubernetesClient.UpdateModule(module)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (m *Modules) ResourcesForModule(ctx *gin.Context) {
	resources, err := m.kubernetesClient.GetResourcesForModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}
	
	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, resources)
}

//func (m *Modules) ModuleToResources(ctx *gin.Context) {
//	err := m.kubernetesClient.ModuleToResources("test")
//	if err != nil {
//		fmt.Println(err)
//	}
//
//	ctx.Header("Access-Control-Allow-Origin", "*")
//	ctx.Status(http.StatusOK)
//}
//
//func (m *Modules) ResourcesForModule(ctx *gin.Context) {
//	resources, err := m.kubernetesClient.ResourcesForModule(ctx.Param("name"))
//	if err != nil {
//		fmt.Println(err)
//	}
//
//	ctx.Header("Access-Control-Allow-Origin", "*")
//	ctx.JSON(http.StatusOK, resources)
//}
