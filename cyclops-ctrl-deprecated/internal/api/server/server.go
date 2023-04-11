package server

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"gitops/internal/api/server/controller"
	"gitops/internal/workflow/cyclops"
	"net/http"
)

type Server struct {
	router         *gin.Engine
	workflowRunner *cyclops.WorkflowRunner
}

func New(workflowRunner *cyclops.WorkflowRunner) (*Server, error) {
	s := &Server{
		workflowRunner: workflowRunner,
	}

	return s, s.init()
}

func (s *Server) Start() error {
	return s.router.Run()
}

func (s *Server) init() error {
	gin.SetMode(gin.DebugMode)
	s.router = gin.New()

	s.router.GET("/ping", s.pong())

	ctrl := controller.New(s.workflowRunner)
	s.router.GET("/namespaces", ctrl.GetNamespaces)
	s.router.GET("/namespaces/:namespace/kinds/:kind", ctrl.GetMultiArtefactsK8s)
	s.router.GET("/namespaces/:namespace/deployments/:name", ctrl.GetDeployment)
	s.router.GET("/namespaces/:namespace/deployments/:name/configuration", ctrl.GetDeploymentFieldsValues)

	s.router.POST("/deployments/manifest_preview", ctrl.GetManifest)
	s.router.POST("/deployments/configurable-manifest-preview", ctrl.TemplateManifest)
	s.router.DELETE("/deployments/:name", ctrl.Delete)
	s.router.POST("/deployments/:name", ctrl.DeployApp)
	s.router.POST("/deployments/by_manifest/:name", ctrl.DeployAppUsingManifest)
	s.router.GET("/deployments/by_k8s_api/:name", ctrl.DeployUsingStruct)
	s.router.GET("/deployments/:name/history", ctrl.History)
	s.router.POST("/deployments/rescale", ctrl.Rescale)

	s.router.GET("/ssh-pod", ctrl.CreateSSHPod)

	s.router.POST("/create-config", ctrl.StoreConfiguration)
	s.router.GET("/create-config/:name", ctrl.GetConfiguration)
	s.router.GET("/configuration-details", ctrl.GetConfigurationsDetails)
	s.router.GET("/configuration/:name/versions", ctrl.GetConfigurationsVersions)

	s.router.GET("/modules/:name", ctrl.GetModule)
	s.router.GET("/modules/list", ctrl.ListModules)
	s.router.DELETE("/modules/:name", ctrl.DeleteModule)
	s.router.POST("/modules/new", ctrl.CreateModule)
	s.router.POST("/modules/update", ctrl.UpdateModule)
	s.router.POST("/modules/resources", ctrl.ModuleToResources)
	s.router.GET("/modules/:name/resources", ctrl.ResourcesForModule)

	s.router.Use(s.options)
	return nil
}

func (s *Server) pong() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		fmt.Println("aleufhgalkuehfg")
		ctx.String(http.StatusOK, "pong")
	}
}

func (s *Server) options(ctx *gin.Context) {
	fmt.Println("lirgarl;gi")

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
