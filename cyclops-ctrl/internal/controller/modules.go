package controller

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"sigs.k8s.io/yaml"

	"github.com/gin-gonic/gin"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/mapper"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/prometheus"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/telemetry"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template/render"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type Modules struct {
	kubernetesClient *k8sclient.KubernetesClient
	templatesRepo    *template.Repo
	renderer         *render.Renderer
	telemetryClient  telemetry.Client
	monitor          prometheus.Monitor
}

func NewModulesController(
	templatesRepo *template.Repo,
	kubernetes *k8sclient.KubernetesClient,
	renderer *render.Renderer,
	telemetryClient telemetry.Client,
	monitor prometheus.Monitor,
) *Modules {
	return &Modules{
		kubernetesClient: kubernetes,
		templatesRepo:    templatesRepo,
		renderer:         renderer,
		telemetryClient:  telemetryClient,
		monitor:          monitor,
	}
}

func (m *Modules) GetModule(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	moduleDTO, err := mapper.ModuleToDTO(*module)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error mapping module", err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, moduleDTO)
}

func (m *Modules) GetRawModuleManifest(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	module.History = []v1alpha1.HistoryEntry{}
	module.ObjectMeta.ManagedFields = []metav1.ManagedFieldsEntry{}

	module.Kind = "Module"
	module.APIVersion = "cyclops-ui.com/v1alpha1"

	data, err := yaml.Marshal(module)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error marshaling module", err.Error()))
		return
	}

	ctx.Data(http.StatusOK, gin.MIMEYAML, data)
}

func (m *Modules) ListModules(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	modules, err := m.kubernetesClient.ListModules()
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching modules", err.Error()))
		return
	}

	dtoModules := mapper.ModuleListToDTO(modules)

	for i, dtoModule := range dtoModules {
		dtoModuleStatus, err := m.kubernetesClient.GetModuleResourcesHealth(dtoModule.Name)
		if err != nil {
			fmt.Println(err)
			ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching modules", err.Error()))
			return
		}

		dtoModules[i].Status = dtoModuleStatus
	}

	ctx.JSON(http.StatusOK, dtoModules)
}

func (m *Modules) DeleteModule(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	err := m.kubernetesClient.DeleteModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error deleting module", err.Error()))
		return
	}

	m.monitor.DecModule()
	ctx.Status(http.StatusOK)
}

func (m *Modules) GetModuleHistory(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, module.History)
}

func (m *Modules) Manifest(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	var request v1alpha1.HistoryEntry
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error loading template", err.Error()))
		return
	}

	targetTemplate, err := m.templatesRepo.GetTemplate(
		request.TemplateRef.URL,
		request.TemplateRef.Path,
		request.TemplateRef.Version,
		"",
	)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	manifest, err := m.renderer.HelmTemplate(v1alpha1.Module{
		ObjectMeta: metav1.ObjectMeta{
			Name: ctx.Param("name"),
		},
		Spec: v1alpha1.ModuleSpec{
			TemplateRef: v1alpha1.TemplateRef{
				URL:     request.TemplateRef.URL,
				Path:    request.TemplateRef.Path,
				Version: request.TemplateRef.Version,
			},
			Values: request.Values,
		},
	}, targetTemplate)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	manifest = strings.TrimPrefix(manifest, "\n---")
	manifest = strings.TrimSuffix(manifest, "---\n")

	ctx.String(http.StatusOK, manifest)
}

func (m *Modules) CurrentManifest(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	targetTemplate, err := m.templatesRepo.GetTemplate(
		module.Spec.TemplateRef.URL,
		module.Spec.TemplateRef.Path,
		module.Spec.TemplateRef.Version,
		module.Status.TemplateResolvedVersion,
	)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	manifest, err := m.renderer.HelmTemplate(*module, targetTemplate)
	if err != nil {
		fmt.Println(err)
		ctx.Status(http.StatusInternalServerError)
		return
	}

	manifest = strings.TrimPrefix(manifest, "---\n")
	manifest = strings.TrimSuffix(manifest, "---\n")

	ctx.String(http.StatusOK, manifest)
}

func (m *Modules) DeleteModuleResource(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	var request dto.DeleteResource
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error mapping module request", err.Error()))
		return
	}

	err := m.kubernetesClient.Delete(&request)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error deleting module", err.Error()))
		return
	}

	ctx.Status(http.StatusOK)
}

func (m *Modules) CreateModule(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	var request dto.Module
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println("error binding request", request)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error loading template", err.Error()))
		return
	}

	module, err := mapper.RequestToModule(request)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error mapping module", err.Error()))
		return
	}

	m.telemetryClient.ModuleCreation()

	err = m.kubernetesClient.CreateModule(module)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error creating module", err.Error()))
		return
	}

	m.monitor.IncModule()
	ctx.Status(http.StatusOK)
}

func (m *Modules) UpdateModule(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	var request dto.Module
	if err := ctx.BindJSON(&request); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error mapping module request", err.Error()))
		return
	}

	curr, err := m.kubernetesClient.GetModule(request.Name)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching module", err.Error()))
		return
	}

	module, err := mapper.RequestToModule(request)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error creating module", err.Error()))
		return
	}

	history := curr.History
	if curr.History == nil {
		history = make([]v1alpha1.HistoryEntry, 0)
	}

	module.History = append([]v1alpha1.HistoryEntry{{
		Generation: curr.Generation,
		TemplateRef: v1alpha1.HistoryTemplateRef{
			URL:     curr.Spec.TemplateRef.URL,
			Path:    curr.Spec.TemplateRef.Path,
			Version: curr.Status.TemplateResolvedVersion,
		},
		Values: curr.Spec.Values,
	}}, history...)

	if len(module.History) > 10 {
		module.History = module.History[:len(module.History)-1]
	}

	module.SetResourceVersion(curr.GetResourceVersion())

	module.Status.TemplateResolvedVersion = request.Template.ResolvedVersion
	module.Status.ReconciliationStatus = curr.Status.ReconciliationStatus
	module.Status.IconURL = curr.Status.IconURL
	module.Status.ManagedGVRs = curr.Status.ManagedGVRs

	module.Spec.TargetNamespace = curr.Spec.TargetNamespace
	module.SetLabels(curr.GetLabels())

	result, err := m.kubernetesClient.UpdateModuleStatus(&module)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error updating module status", err.Error()))
		return
	}

	module.ResourceVersion = result.ResourceVersion
	err = m.kubernetesClient.UpdateModule(&module)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error updating module", err.Error()))
		return
	}

	ctx.Status(http.StatusOK)
}

func (m *Modules) ReconcileModule(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	moduleName := ctx.Param("name")

	module, err := m.kubernetesClient.GetModule(moduleName)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching module", err.Error()))
		return
	}

	annotations := module.GetAnnotations()
	if annotations == nil {
		annotations = make(map[string]string)
	}

	annotations["cyclops/reconciled-at"] = time.Now().Format(time.RFC3339)
	module.SetAnnotations(annotations)

	module.Kind = "Module"
	module.APIVersion = "cyclops-ui.com/v1alpha1"

	err = m.kubernetesClient.UpdateModule(module)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error updating module", err.Error()))
		return
	}

	ctx.Status(http.StatusAccepted)
}

func (m *Modules) ResourcesForModule(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.NewError("Error mapping module request", err.Error()))
		return
	}

	templateVersion := module.Status.TemplateResolvedVersion
	if len(templateVersion) == 0 {
		templateVersion = module.Spec.TemplateRef.Version
	}

	t, err := m.templatesRepo.GetTemplate(
		module.Spec.TemplateRef.URL,
		module.Spec.TemplateRef.Path,
		templateVersion,
		module.Status.TemplateResolvedVersion,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching template", err.Error()))
		return
	}

	resources, err := m.kubernetesClient.GetResourcesForModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching module resources", err.Error()))
		return
	}

	manifest, err := m.renderer.HelmTemplate(*module, t)
	if err != nil {
		fmt.Println("error rendering manifest", err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error rendering Module manifest", err.Error()))
		return
	}

	resources, err = m.kubernetesClient.GetDeletedResources(resources, manifest, module.Spec.TargetNamespace)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching deleted module resources", err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, resources)
}

func (m *Modules) Template(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching module", err.Error()))
		return
	}

	currentTemplate, err := m.templatesRepo.GetTemplate(
		module.Spec.TemplateRef.URL,
		module.Spec.TemplateRef.Path,
		module.Spec.TemplateRef.Version,
		module.Status.TemplateResolvedVersion,
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching template", err.Error()))
		return
	}

	currentManifest, err := m.renderer.HelmTemplate(*module, currentTemplate)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error templating current", err.Error()))
		return
	}

	proposedTemplate, err := m.templatesRepo.GetTemplate(
		module.Spec.TemplateRef.URL,
		module.Spec.TemplateRef.Path,
		module.Spec.TemplateRef.Version,
		module.Status.TemplateResolvedVersion,
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error creating proposed template", err.Error()))
		return
	}

	proposedManifest, err := m.renderer.HelmTemplate(*module, proposedTemplate)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error templating proposed", err.Error()))
		return
	}

	res := dto.TemplatesResponse{
		Current: currentManifest,
		New:     proposedManifest,
	}

	ctx.JSON(http.StatusOK, res)
}

func (m *Modules) HelmTemplate(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	module, err := m.kubernetesClient.GetModule(ctx.Param("name"))
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching module", err.Error()))
		return
	}

	currentTemplate, err := m.templatesRepo.GetTemplate(
		module.Spec.TemplateRef.URL,
		module.Spec.TemplateRef.Path,
		module.Spec.TemplateRef.Version,
		module.Status.TemplateResolvedVersion,
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching template", err.Error()))
		return
	}

	_, err = m.renderer.HelmTemplate(*module, currentTemplate)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error templating", err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, "{}")
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

func (m *Modules) GetLogs(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	logCount := int64(100)
	rawLogs, err := m.kubernetesClient.GetPodLogs(
		ctx.Param("namespace"),
		ctx.Param("container"),
		ctx.Param("name"),
		&logCount,
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching logs", err.Error()))
		return
	}

	logs := make([]string, 0, len(rawLogs))
	for _, log := range rawLogs {
		logs = append(logs, trimLogLine(log))
	}

	ctx.JSON(http.StatusOK, logs)
}

func (m *Modules) GetLogsStream(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	logCount := int64(100)

	logChan := make(chan string)

	go func() {
		defer close(logChan)

		err := m.kubernetesClient.GetStreamedPodLogs(
			ctx.Request.Context(), // we will have to pass the context for the k8s podClient - so it can stop the stream when the client disconnects
			ctx.Param("namespace"),
			ctx.Param("container"),
			ctx.Param("name"),
			&logCount,
			logChan,
		)
		if err != nil {
			return
		}
	}()

	// stream logs to the client
	ctx.Stream(func(w io.Writer) bool {
		for {
			select {
			case log, ok := <-logChan:
				if !ok {
					return false
				}

				ctx.SSEvent("pod-log", trimLogLine(log))
				return true
			case <-ctx.Request.Context().Done():
				return false
			case <-ctx.Done():
				return false
			}
		}
	})
}

func (m *Modules) GetDeploymentLogs(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	logCount := int64(100)
	logs, err := m.kubernetesClient.GetDeploymentLogs(
		ctx.Param("namespace"),
		ctx.Param("container"),
		ctx.Param("deployment"),
		&logCount,
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching logs", err.Error()))
		return
	}
	ctx.JSON(http.StatusOK, logs)
}

func (m *Modules) GetStatefulSetsLogs(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	logCount := int64(100)
	logs, err := m.kubernetesClient.GetStatefulSetsLogs(
		ctx.Param("namespace"),
		ctx.Param("container"),
		ctx.Param("name"),
		&logCount,
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching logs", err.Error()))
		return
	}

	ctx.JSON(http.StatusOK, logs)
}

func (m *Modules) DownloadLogs(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	namespace := ctx.Param("namespace")
	container := ctx.Param("container")
	name := ctx.Param("name")

	logs, err := m.kubernetesClient.GetPodLogs(
		namespace,
		container,
		name,
		nil,
	)
	if err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, dto.NewError("Error fetching logs", err.Error()))
		return
	}

	tempFile, err := os.CreateTemp("", fmt.Sprintf("%v-%v-*.txt", name, container))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file"})
		return
	}
	defer tempFile.Close()

	for _, log := range logs {
		_, err = tempFile.WriteString(log + "\n")
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write to file"})
			return
		}
	}

	ctx.Header("Content-Description", "File Transfer")
	ctx.Header("Content-Disposition", "attachment; filename="+fmt.Sprintf("%v-%v.txt", name, container))
	ctx.Header("Content-Type", "application/octet-stream")
	ctx.Header("Content-Transfer-Encoding", "binary")
	ctx.File(tempFile.Name())
}

func (m *Modules) GetManifest(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	group := ctx.Query("group")
	version := ctx.Query("version")
	kind := ctx.Query("kind")
	name := ctx.Query("name")
	namespace := ctx.Query("namespace")
	includeManagedFields := ctx.Query("includeManagedFields") == "true"

	manifest, err := m.kubernetesClient.GetManifest(group, version, kind, name, namespace, includeManagedFields)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to fetch resource manifest",
			"reason": err.Error(),
		})
		return
	}

	ctx.String(http.StatusOK, manifest)
}

func (m *Modules) Restart(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	group := ctx.Query("group")
	version := ctx.Query("version")
	kind := ctx.Query("kind")
	name := ctx.Query("name")
	namespace := ctx.Query("namespace")

	err := m.kubernetesClient.Restart(group, version, kind, name, namespace)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to restart resource",
			"reason": err.Error(),
		})
		return
	}

	ctx.String(http.StatusOK, "")
}

func (m *Modules) GetResource(ctx *gin.Context) {
	ctx.Header("Access-Control-Allow-Origin", "*")

	group := ctx.Query("group")
	version := ctx.Query("version")
	kind := ctx.Query("kind")
	name := ctx.Query("name")
	namespace := ctx.Query("namespace")

	resource, err := m.kubernetesClient.GetResource(group, version, kind, name, namespace)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Failed to fetch resource",
			"reason": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, resource)
}

func getTargetGeneration(generation string, module *v1alpha1.Module) (*v1alpha1.Module, bool) {
	// no generation specified means current generation
	if len(generation) == 0 {
		return module, true
	}

	var target *v1alpha1.HistoryEntry
	for _, entry := range module.History {
		if fmt.Sprintf("%v", entry.Generation) == generation {
			target = &entry
		}
	}

	if target == nil {
		return nil, false
	}

	return &v1alpha1.Module{
		TypeMeta:   module.TypeMeta,
		ObjectMeta: module.ObjectMeta,
		Spec:       module.Spec,
		Status:     module.Status,
	}, true
}

func trimLogLine(logLine string) string {
	parts := strings.SplitN(logLine, " ", 2)
	if len(parts) > 1 {
		return parts[1]
	}
	return logLine
}
