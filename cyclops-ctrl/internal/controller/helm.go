package controller

import (
	"fmt"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/integrations/helm"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	helm2 "github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/helm"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/telemetry"
	json "github.com/json-iterator/go"
	"helm.sh/helm/v3/pkg/chartutil"
	"net/http"
	"sort"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
	"github.com/gin-gonic/gin"
)

type Helm struct {
	kubernetesClient k8sclient.IKubernetesClient
	releaseClient    *helm.ReleaseClient
	telemetryClient  telemetry.Client
}

func NewHelmController(
	kubernetes k8sclient.IKubernetesClient,
	releaseClient *helm.ReleaseClient,
	telemetryClient telemetry.Client,
) *Helm {
	return &Helm{
		kubernetesClient: kubernetes,
		releaseClient:    releaseClient,
		telemetryClient:  telemetryClient,
	}
}

func (h *Helm) ListReleases(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	releases, err := h.releaseClient.ListReleases()
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error fetching existing Helm releases", err.Error()))
		return
	}

	mappedReleases, err := mapper.MapHelmReleases(releases)

	sort.Slice(mappedReleases, func(i, j int) bool {
		return mappedReleases[i].Name < mappedReleases[j].Name
	})

	ctx.JSON(http.StatusOK, mappedReleases)
}

func (h *Helm) GetRelease(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	name := ctx.Param("name")
	namespace := ctx.Param("namespace")

	release, err := h.releaseClient.GetRelease(namespace, name)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error fetching Helm release", err.Error()))
		return
	}

	mappedRelease, err := mapper.MapHelmRelease(release)

	ctx.JSON(http.StatusOK, mappedRelease)
}

func (h *Helm) UpgradeRelease(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	name := ctx.Param("name")
	namespace := ctx.Param("namespace")

	var values map[string]interface{}
	if err := ctx.BindJSON(&values); err != nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error binding values", err.Error()))
		return
	}

	h.telemetryClient.ReleaseUpdate()

	release, err := h.releaseClient.GetRelease(namespace, name)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error fetching existing release", err.Error()))
		return
	}

	if err := h.releaseClient.UpgradeRelease(namespace, name, values, release); err != nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error upgrading release", err.Error()))
		return
	}

	ctx.Status(http.StatusOK)
}

func (h *Helm) UninstallRelease(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	name := ctx.Param("name")
	namespace := ctx.Param("namespace")

	if err := h.releaseClient.UninstallRelease(namespace, name); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error uninstalling Helm release", err.Error()))
		return
	}

	ctx.Status(http.StatusOK)
}

func (h *Helm) GetReleaseResources(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	name := ctx.Param("name")

	resources, err := h.kubernetesClient.GetResourcesForRelease(name)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error fetching Helm release resources", err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, resources)
}

func (h *Helm) GetReleaseSchema(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	name := ctx.Param("name")
	namespace := ctx.Param("namespace")

	release, err := h.releaseClient.GetRelease(namespace, name)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching Helm release", err.Error()))
		return
	}

	if release.Chart == nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Helm release does not contain chart", err.Error()))
		return
	}

	if len(release.Chart.Schema) == 0 {
		ctx.JSON(http.StatusOK, nil)
	}

	var root *helm2.Property
	err = json.Unmarshal(release.Chart.Schema, &root)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("failed unmarshaling schema", err.Error()))
		return
	}

	if root == nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("no schema found", err.Error()))
		return
	}

	rootField := mapper.HelmSchemaToFields("", *root, root.Definitions, nil)

	ctx.JSON(http.StatusOK, rootField)
}

func (h *Helm) GetReleaseValues(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	name := ctx.Param("name")
	namespace := ctx.Param("namespace")

	release, err := h.releaseClient.GetRelease(namespace, name)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching Helm release", err.Error()))
		return
	}

	if release.Chart == nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Helm release does not contain chart", err.Error()))
		return
	}

	values, err := chartutil.CoalesceValues(release.Chart, release.Config)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("failed to merge values", err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, values)
}
