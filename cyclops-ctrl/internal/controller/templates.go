package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	json "github.com/json-iterator/go"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/telemetry"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
)

type Templates struct {
	templatesRepo    *template.Repo
	kubernetesClient *k8sclient.KubernetesClient
	telemetryClient  telemetry.Client
}

func NewTemplatesController(
	templatesRepo *template.Repo,
	kubernetes *k8sclient.KubernetesClient,
	telemetryClient telemetry.Client,
) *Templates {
	return &Templates{
		templatesRepo:    templatesRepo,
		kubernetesClient: kubernetes,
		telemetryClient:  telemetryClient,
	}
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

func (c *Templates) GetTemplate(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	repo := ctx.Query("repo")
	path := ctx.Query("path")
	commit := ctx.Query("commit")

	if repo == "" {
		ctx.String(http.StatusBadRequest, "set repo field")
		return
	}

	t, err := c.templatesRepo.GetTemplate(
		repo,
		path,
		commit,
		"",
		cyclopsv1alpha1.TemplateSource(""),
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error loading template", err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, t)
}

func (c *Templates) GetTemplateInitialValues(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	repo := ctx.Query("repo")
	path := ctx.Query("path")
	commit := ctx.Query("commit")

	if repo == "" {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Specify repo field", "Repo not specified"))
		return
	}

	initial, err := c.templatesRepo.GetTemplateInitialValues(repo, path, commit)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error loading template initial values", err.Error()))
		return
	}

	data, err := json.Marshal(initial)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error loading template initial values", err.Error()))
		return
	}

	ctx.Data(http.StatusOK, gin.MIMEJSON, data)
}

func (c *Templates) ListTemplatesStore(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	store, err := c.kubernetesClient.ListTemplateStore()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching templates store", err.Error()))
		return
	}

	storeDTO := mapper.TemplateStoreListToDTO(store)

	ctx.JSON(http.StatusOK, storeDTO)
}

func (c *Templates) CreateTemplatesStore(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	var templateStore *dto.TemplateStore
	if err := ctx.ShouldBind(&templateStore); err != nil {
		fmt.Println("error binding request", templateStore)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error binding request", err.Error()))
		return
	}

	templateStore.TemplateRef.URL = strings.Trim(templateStore.TemplateRef.URL, "/")
	templateStore.TemplateRef.Path = strings.Trim(templateStore.TemplateRef.Path, "/")
	templateStore.TemplateRef.Version = strings.Trim(templateStore.TemplateRef.Version, "/")

	if templateStore.TemplateRef.URL == "" {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Invalid template reference", "Template repo not set"))
		return
	}

	tmpl, err := c.templatesRepo.GetTemplate(
		templateStore.TemplateRef.URL,
		templateStore.TemplateRef.Path,
		templateStore.TemplateRef.Version,
		"",
		cyclopsv1alpha1.TemplateSource(templateStore.TemplateRef.TemplateSource),
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error loading template", err.Error()))
		return
	}

	k8sTemplateStore := mapper.DTOToTemplateStore(*templateStore, tmpl.IconURL)

	c.telemetryClient.TemplateCreation()

	if err := c.kubernetesClient.CreateTemplateStore(k8sTemplateStore); err != nil {
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error creating module", err.Error()))
		return
	}

	ctx.Status(http.StatusCreated)
}

func (c *Templates) EditTemplatesStore(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	var templateStore *dto.TemplateStore
	if err := ctx.ShouldBind(&templateStore); err != nil {
		fmt.Println("error binding request", templateStore)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error binding request", err.Error()))
		return
	}

	templateStore.TemplateRef.URL = strings.Trim(templateStore.TemplateRef.URL, "/")
	templateStore.TemplateRef.Path = strings.Trim(templateStore.TemplateRef.Path, "/")
	templateStore.TemplateRef.Version = strings.Trim(templateStore.TemplateRef.Version, "/")

	if templateStore.TemplateRef.URL == "" {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Invalid template reference", "Template repo not set"))
		return
	}

	tmpl, err := c.templatesRepo.GetTemplate(
		templateStore.TemplateRef.URL,
		templateStore.TemplateRef.Path,
		templateStore.TemplateRef.Version,
		"",
		cyclopsv1alpha1.TemplateSource(templateStore.TemplateRef.TemplateSource),
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error loading template", err.Error()))
		return
	}

	templateStore.Name = ctx.Param("name")

	k8sTemplateStore := mapper.DTOToTemplateStore(*templateStore, tmpl.IconURL)

	c.telemetryClient.TemplateEdit()

	if err := c.kubernetesClient.UpdateTemplateStore(k8sTemplateStore); err != nil {
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error creating module", err.Error()))
		return
	}

	ctx.Status(http.StatusCreated)
}

func (c *Templates) DeleteTemplatesStore(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	templateRefName := ctx.Param("name")

	if err := c.kubernetesClient.DeleteTemplateStore(templateRefName); err != nil {
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error deleting module", err.Error()))
		return
	}

	ctx.Status(http.StatusOK)
}
