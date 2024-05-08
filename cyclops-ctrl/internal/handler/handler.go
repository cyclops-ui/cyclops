package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/controller"
	prometheusHandler "github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/prometheus"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/telemetry"
	templaterepo "github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template"
)

type Handler struct {
	router *gin.Engine

	templatesRepo *templaterepo.Repo
	k8sClient     *k8sclient.KubernetesClient

	telemetryClient telemetry.Client
	monitor         prometheusHandler.Monitor
}

func New(
	templatesRepo *templaterepo.Repo,
	kubernetesClient *k8sclient.KubernetesClient,
	telemetryClient telemetry.Client,
) (*Handler, error) {
	return &Handler{
		templatesRepo:   templatesRepo,
		k8sClient:       kubernetesClient,
		telemetryClient: telemetryClient,
		router:          gin.New(),
	}, nil
}

func (h *Handler) Start() error {
	gin.SetMode(gin.DebugMode)
	templatesController := controller.NewTemplatesController(h.templatesRepo, h.k8sClient)
	modulesController := controller.NewModulesController(h.templatesRepo, h.k8sClient, h.telemetryClient, h.monitor)
	clusterController := controller.NewClusterController(h.k8sClient)

	h.router = gin.New()

	h.router.GET("/ping", h.pong())

	// templates
	h.router.GET("/templates", templatesController.GetTemplate)
	h.router.GET("/templates/initial", templatesController.GetTemplateInitialValues)

	// templates store
	h.router.GET("/templates/store", templatesController.ListTemplatesStore)
	h.router.PUT("/templates/store", templatesController.CreateTemplatesStore)
	h.router.POST("/templates/store/:name", templatesController.EditTemplatesStore)
	h.router.DELETE("/templates/store/:name", templatesController.DeleteTemplatesStore)

	// modules
	h.router.GET("/modules/:name", modulesController.GetModule)
	h.router.GET("/modules/list", modulesController.ListModules)
	h.router.DELETE("/modules/:name", modulesController.DeleteModule)
	h.router.POST("/modules/new", modulesController.CreateModule)
	h.router.POST("/modules/update", modulesController.UpdateModule)
	h.router.GET("/modules/:name/history", modulesController.GetModuleHistory)
	h.router.POST("/modules/:name/manifest", modulesController.Manifest)
	h.router.GET("/modules/:name/currentManifest", modulesController.CurrentManifest)
	h.router.GET("/modules/:name/resources", modulesController.ResourcesForModule)
	h.router.DELETE("/modules/:name/resources", modulesController.DeleteModuleResource)
	h.router.GET("/modules/:name/template", modulesController.Template)
	h.router.GET("/modules/:name/helm-template", modulesController.HelmTemplate)
	//h.router.POST("/modules/resources", modulesController.ModuleToResources)

	h.router.GET("/resources/pods/:namespace/:name/:container/logs", modulesController.GetLogs)
	h.router.GET("/resources/pods/:namespace/:name/:container/logs/download", modulesController.DownloadLogs)

	h.router.GET("/manifest", modulesController.GetManifest)
	h.router.GET("/resources", modulesController.GetResource)

	h.router.GET("/nodes", clusterController.ListNodes)
	h.router.GET("/nodes/:name", clusterController.GetNode)

	h.router.GET("/metrics", prometheusHandler.PromHandler(h.monitor))

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
