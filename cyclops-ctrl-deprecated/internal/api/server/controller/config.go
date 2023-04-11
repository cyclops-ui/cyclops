package controller

import (
	"fmt"
	"gitops/internal/workflow/cyclops/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func (c *Controller) StoreConfiguration(ctx *gin.Context) {
	var request models.AppConfiguration

	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.Status(http.StatusBadRequest)
		return
	}

	// TODO this needs to be moved to some other layer
	request.Created = time.Now().Format(time.RFC822)
	request.Edited = time.Now().Format(time.RFC822)

	request.Version = semantic(request.Version)

	if err := c.workflowRunner.SetConfiguration(request); err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.Status(http.StatusOK)
}

// TODO kaj je ovo
func semantic(current string) string {
	if len(current) == 0 {
		return "v1"
	}

	version, _ := strconv.Atoi(current[1:])

	version++

	return fmt.Sprintf("v%d", version)
}

func (c *Controller) GetConfiguration(ctx *gin.Context) {
	name := ctx.Param("name")
	version := ctx.Query("version")

	configuration, err := c.workflowRunner.GetConfiguration(name, version)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	modules, err := c.workflowRunner.GetModulesForConfiguration(name)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	configuration.Modules = modules

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, configuration)
}

func (c *Controller) GetConfigurationsDetails(ctx *gin.Context) {
	configurations, err := c.workflowRunner.GetConfigurationsDetails()
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, configurations)
}

func (c *Controller) GetConfigurationsVersions(ctx *gin.Context) {
	versions, err := c.workflowRunner.GetConfigurationVersions(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.Header("Access-Control-Allow-Origin", "*")
	ctx.JSON(http.StatusOK, versions)
}
