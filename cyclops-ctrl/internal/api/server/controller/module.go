package controller

import (
	"fmt"
	"github.com/gin-gonic/gin"
	modules2 "gitops/internal/mapper/modules"
	"net/http"
)

func (c *Controller) GetModule(ctx *gin.Context) {
	module, err := c.workflowRunner.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, modules2.ModuleToDTO(*module))
}

func (c *Controller) ListModules(ctx *gin.Context) {
	modules, err := c.workflowRunner.ListModules()
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, modules2.ModuleListToDTO(modules))
}

func (c *Controller) DeleteModule(ctx *gin.Context) {
	err := c.workflowRunner.DeleteModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (c *Controller) CreateModule(ctx *gin.Context) {
	var request modules2.ModuleDTO
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	err := c.workflowRunner.CreateModule(request)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	err = c.workflowRunner.ModuleToResources(request.Name)
	if err != nil {
		fmt.Println(err)
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (c *Controller) UpdateModule(ctx *gin.Context) {
	var request modules2.ModuleDTO
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	err := c.workflowRunner.UpdateModule(request)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	err = c.workflowRunner.UpdateModuleResources(request.Name)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (c *Controller) ModuleToResources(ctx *gin.Context) {
	err := c.workflowRunner.ModuleToResources("test")
	if err != nil {
		fmt.Println(err)
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

func (c *Controller) ResourcesForModule(ctx *gin.Context) {
	resources, err := c.workflowRunner.ResourcesForModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, resources)
}
