package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/cyclops-ui/cycops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cycops-ctrl/internal/controller"
	"github.com/cyclops-ui/cycops-ctrl/internal/storage/templates"
)

type Handler struct {
	router *gin.Engine

	templatesStorage *templates.Storage
	k8sClient        *k8sclient.KubernetesClient
}

func New(templates *templates.Storage, kubernetesClient *k8sclient.KubernetesClient) (*Handler, error) {
	return &Handler{
		templatesStorage: templates,
		k8sClient:        kubernetesClient,
		router:           gin.New(),
	}, nil
}

func (h *Handler) Start() error {
	gin.SetMode(gin.DebugMode)

	templatesController := controller.NewTemplatesController(h.templatesStorage, h.k8sClient)
	modulesController := controller.NewModulesController(h.templatesStorage, h.k8sClient)

	h.router = gin.New()

	h.router.GET("/ping", h.pong())

	// templates
	h.router.POST("/create-config", templatesController.StoreConfiguration)
	h.router.GET("/create-config/:name", templatesController.GetConfiguration)
	h.router.GET("/configuration-details", templatesController.GetConfigurationsDetails)
	h.router.GET("/configuration/:name/versions", templatesController.GetConfigurationsVersions)
	h.router.GET("/templates/git", templatesController.GetTemplateFromGit)
	h.router.GET("/templates/git/initial", templatesController.GetTemplateInitialValuesFromGit)

	// modules
	h.router.GET("/modules/:name", modulesController.GetModule)
	h.router.GET("/modules/list", modulesController.ListModules)
	h.router.DELETE("/modules/:name", modulesController.DeleteModule)
	h.router.POST("/modules/new", modulesController.CreateModule)
	h.router.POST("/modules/update", modulesController.UpdateModule)

	h.router.GET("/modules/:name/resources", modulesController.ResourcesForModule)
	h.router.DELETE("/modules/:name/resources", modulesController.DeleteModuleResource)
	h.router.GET("/modules/:name/resources/hierarchy", modulesController.ResourcesHierarchyForModule)

	h.router.GET("/modules/:name/template", modulesController.Template)
	h.router.GET("/modules/:name/helm-template", modulesController.HelmTemplate)
	//h.router.POST("/modules/resources", modulesController.ModuleToResources)

	h.router.GET("/resources/pods/:namespace/:name/:container/logs", modulesController.GetLogs)
	h.router.GET("/resources/pods/:namespace/:name/:container/logs/download", modulesController.DownloadLogs)

	h.router.Use(h.options)

	return h.router.Run()
}

func (h *Handler) pong() func(ctx *gin.Context) {
	return func(ctx *gin.Context) {
		ctx.String(http.StatusOK, "pong")
	}
}

func (h *Handler) options(ctx *gin.Context) {
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
