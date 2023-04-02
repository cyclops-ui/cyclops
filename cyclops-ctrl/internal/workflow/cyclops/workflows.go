package cyclops

import (
	modules2 "gitops/internal/mapper/modules"
	"gitops/internal/models/crd/v1alpha1"
	"gitops/internal/models/dto"
	"gitops/internal/workflow/cyclops/models"
	"gitops/internal/workflow/cyclops/services/k8s_client"
	"gitops/internal/workflow/cyclops/services/k8s_mapper"
	"gitops/internal/workflow/cyclops/services/modulecontroller"
	"gitops/internal/workflow/cyclops/services/storage"
	"gitops/internal/workflow/cyclops/util/mapper"
	"gitops/internal/workflow/cyclops/util/parser"
	"gitops/internal/workflow/cyclops/util/template"
	v1 "k8s.io/api/apps/v1"
	apiv1 "k8s.io/api/core/v1"
	"sort"
	"strings"
	"time"
)

const allNamespaces = "all"

type WorkflowRunner struct {
	kubernetesClient *k8s_client.KubernetesClient
	storage          *storage.Storage
}

func NewWorkflowRunner() (*WorkflowRunner, error) {
	client, err := k8s_client.New()
	if err != nil {
		return nil, err
	}

	store, err := storage.New()
	if err != nil {
		return nil, err
	}

	return &WorkflowRunner{
		kubernetesClient: client,
		storage:          store,
	}, nil
}

func (w *WorkflowRunner) DeployApp(request models.DeployRequest) error {
	manifest, err := template.TemplateManifest(request)
	if err != nil {
		return err
	}

	if err := w.kubernetesClient.KubectlApply(manifest); err != nil {
		return err
	}

	return nil
}

func (w *WorkflowRunner) DeployUsingManifest(request models.DeployWithManifestRequest) error {
	if err := w.kubernetesClient.KubectlApply(request.Manifest); err != nil {
		return err
	}

	err := w.storage.StoreHistoryEntry("", request.AppName, models.HistoryEntry{
		ChangeTitle:      request.ChangeTitle,
		Date:             time.Now().String(),
		AppliedManifest:  request.Manifest,
		ReplacedManifest: request.PreviousManifest,
		Success:          true,
	})
	if err != nil {
		return err
	}

	return nil
}

func (w *WorkflowRunner) Rescale(request models.RescaleRequest) error {
	scale, err := w.kubernetesClient.GetScale(request.Namespace, request.Name)
	if err != nil {
		return err
	}

	sc := *scale
	sc.Spec.Replicas = request.DesiredReplicas

	if err := w.kubernetesClient.UpdateScale(request.Namespace, request.Name, sc); err != nil {
		return err
	}

	return nil
}

func (w *WorkflowRunner) DeployUsingStruct(spec *v1.Deployment) error {
	if err := w.kubernetesClient.Deploy(spec); err != nil {
		return err
	}

	return nil
}

func (w *WorkflowRunner) Delete(request models.DeleteRequest) error {
	if err := w.kubernetesClient.Delete(request.Kind, request.Name); err != nil {
		return err
	}

	if err := w.storage.DeleteDeploymentHistory(request.Namespace, request.Name); err != nil {
		return err
	}

	return nil
}

func (w *WorkflowRunner) GetDeployment(namespace, name string) (*models.Deployment, error) {
	deployment, err := w.kubernetesClient.GetDeployment(namespace, name)
	if err != nil {
		return nil, err
	}

	podList, err := w.kubernetesClient.GetPods(namespace, name)
	if err != nil {
		return nil, err
	}

	pods := make([]*models.Pod, 0, len(podList))
	envVars := make([]models.EnvironmentVariable, 0)
	seen := make(map[string]struct{})
	for _, pod := range podList {
		pods = append(pods, &models.Pod{
			Name:         pod.Name,
			NodeName:     pod.Spec.NodeName,
			Containers:   k8s_mapper.MapImages(deployment.Spec.Template.Spec),
			Healthy:      true,
			Age:          shortDur(time.Now().Sub(deployment.CreationTimestamp.Time)),
			Status:       string(pod.Status.Phase),
			Labels:       mapLabels(deployment.Labels),
			CyclopsFleet: pod.Annotations["cyclops.fleet.version"],
		})

		for _, ev := range pod.Spec.Containers[0].Env {
			if _, ok := seen[ev.Name]; ok {
				continue
			}

			seen[ev.Name] = struct{}{}
			envVars = append(envVars, models.EnvironmentVariable{
				Name:  ev.Name,
				Value: ev.Value,
			})
		}
	}

	return &models.Deployment{
		AppName:              deployment.Name,
		Replicas:             int(*deployment.Spec.Replicas),
		Namespace:            deployment.Namespace,
		ImageName:            k8s_mapper.MapImages(deployment.Spec.Template.Spec),
		Kind:                 "Deployment",
		Age:                  shortDur(time.Now().Sub(deployment.CreationTimestamp.Time)),
		Restarts:             deployment.Generation,
		Healthy:              deployment.Status.AvailableReplicas == deployment.Status.Replicas,
		Labels:               mapLabels(deployment.Labels),
		EnvironmentVariables: envVars,
		Pods:                 pods,
	}, nil
}

func (w *WorkflowRunner) GetDeploymentFields(namespace, name string) (*models.DeploymentFields, error) {
	deployment, err := w.kubernetesClient.GetDeployment(namespace, name)
	if err != nil {
		return nil, err
	}

	config, err := w.storage.GetConfig(deployment.Annotations["cyclops.config"], "")
	if err != nil {
		return nil, err
	}

	buff, err := w.kubernetesClient.GetDeploymentsYaml(name, namespace)
	if err != nil {
		return nil, err
	}

	return &models.DeploymentFields{
		CurrentVersion: deployment.Annotations["cyclops.fleet.version"],
		Configuration:  config,
		Fields:         parser.ParseManifestByFields(buff.String(), config.Fields),
	}, nil
}

func (w *WorkflowRunner) GetMultiArtefacts(namespaces []string) ([]*models.DeploymentPreview, error) {
	deployments := make([]*models.DeploymentPreview, 0)
	for _, namespace := range namespaces {
		deploymentList, err := w.kubernetesClient.GetDeployments(getNamespace(namespace))
		if err != nil {
			return nil, err
		}

		for _, deployment := range deploymentList {
			deployments = append(deployments, k8s_mapper.MapDeploymentPreview(deployment))
		}
	}

	sort.Slice(deployments, func(i, j int) bool {
		return deployments[i].AppName < deployments[j].AppName
	})

	return deployments, nil
}

func (w *WorkflowRunner) GetManifest(request models.DeployRequest) (*models.PreviewResponse, error) {
	manifest, err := template.TemplateManifest(mapAppLabel(request))
	if err != nil {
		return nil, err
	}

	return &models.PreviewResponse{
		Manifest: manifest,
	}, err
}

func (w *WorkflowRunner) TemplateManifest(request models.ConfigurableRequest) (*models.PreviewResponse, error) {
	manifest, err := template.TemplateManifestNew(request)
	if err != nil {
		return nil, err
	}

	// TODO: decide if cyclops should be aware of annotations
	//manifest, err = setCyclopsMetaAnnotations(manifest, map[string]string{
	//	"cyclops.fleet.version": reqData.ChangeTitle,
	//	"cyclops.config":        reqData.ConfigName,
	//})
	//if err != nil {
	//	fmt.Println("error patching cyclops data", reqData, err)
	//	ctx.String(http.StatusInternalServerError, "error binding request")
	//	return
	//}

	return &models.PreviewResponse{
		Manifest: manifest,
	}, nil
}

func (w *WorkflowRunner) GetNamespaces() (*models.NamespaceResponse, error) {
	namespaces, err := w.kubernetesClient.GetNamespaces()
	if err != nil {
		return nil, err
	}

	return &models.NamespaceResponse{
		Namespaces: k8s_mapper.MapNamespaces(namespaces),
	}, nil
}

func (w *WorkflowRunner) CreateSSHPod() ([]apiv1.Pod, error) {
	manifest, err := template.TemplateManifest(models.DeployRequest{
		AppName:      "ssh-dev-pod-name",
		Replicas:     1,
		Namespace:    "default",
		Kind:         "deployment",
		ImageName:    "nginx",
		NeedsService: false,
	})
	if err != nil {
		return nil, err
	}

	if err := w.kubernetesClient.KubectlApply(manifest); err != nil {
		return nil, err
	}

	podList, err := w.kubernetesClient.GetAllNamespacePods()
	if err != nil {
		return nil, err
	}

	return podList, nil
}

func (w *WorkflowRunner) GetDeploymentHistory(namespace, name string) ([]models.HistoryEntry, error) {
	return w.storage.GetDeploymentHistory(namespace, name)
}

func (w *WorkflowRunner) SetConfiguration(request models.AppConfiguration) error {
	return w.storage.StoreConfig(request.Name, request)
}

func (w *WorkflowRunner) GetConfiguration(name, version string) (models.AppConfiguration, error) {
	return w.storage.GetConfig(name, version)
}

func (w *WorkflowRunner) GetConfigurationVersions(name string) ([]string, error) {
	return w.storage.GetConfigurationVersions(name)
}

func (w *WorkflowRunner) GetConfigurationsDetails() ([]models.AppConfiguration, error) {
	configurations, err := w.storage.ListConfigLatest()
	if err != nil {
		return nil, err
	}

	return mapper.MapConfigDetails(configurations), nil
}

func (w *WorkflowRunner) GetModulesForConfiguration(name string) ([]modules2.ModuleDTO, error) {
	modules, err := w.kubernetesClient.ListModules()
	if err != nil {
		return nil, err
	}

	modulesForConfig := make([]modules2.ModuleDTO, 0)
	for _, module := range modules {
		if module.Spec.TemplateRef.Name != name {
			continue
		}

		modulesForConfig = append(modulesForConfig, modules2.ModuleDTO{
			Name:    module.Name,
			Version: module.Spec.TemplateRef.Version,
		})
	}

	return modulesForConfig, nil
}

func (w *WorkflowRunner) GetModule(name string) (*v1alpha1.Module, error) {
	module, err := w.kubernetesClient.GetModule(name)
	if err != nil {
		panic(err)
	}

	return module, nil
}

func (w *WorkflowRunner) ListModules() ([]v1alpha1.Module, error) {
	modules, err := w.kubernetesClient.ListModules()
	if err != nil {
		panic(err)
	}

	return modules, nil
}

func (w *WorkflowRunner) DeleteModule(name string) error {
	resources, err := w.ResourcesForModule(name)
	if err != nil {
		return err
	}

	for _, resource := range resources {
		switch v := resource.(type) {
		case dto.Deployment:
			w.kubernetesClient.Delete("deployments", v.Name)
		case dto.Service:
			w.kubernetesClient.Delete("services", v.Name)
		}
	}

	return w.kubernetesClient.DeleteModule(name)
}

func (w *WorkflowRunner) CreateModule(request modules2.ModuleDTO) error {
	return w.kubernetesClient.CreateModule(modules2.RequestToModule(request))
}

func (w *WorkflowRunner) UpdateModule(request modules2.ModuleDTO) error {
	return w.kubernetesClient.UpdateModule(modules2.RequestToModule(request))
}

func (w *WorkflowRunner) ModuleToResources(name string) error {
	module, err := w.kubernetesClient.GetModule(name)
	if err != nil {
		return err
	}

	template, err := w.storage.GetConfig(module.Spec.TemplateRef.Name, module.Spec.TemplateRef.Version)
	if err != nil {
		return err
	}

	if err := modulecontroller.GenerateResources(w.kubernetesClient, *module, template); err != nil {
		return err
	}

	return nil
}

func (w *WorkflowRunner) UpdateModuleResources(name string) error {
	module, err := w.kubernetesClient.GetModule(name)
	if err != nil {
		return err
	}

	template, err := w.storage.GetConfig(module.Spec.TemplateRef.Name, module.Spec.TemplateRef.Version)
	if err != nil {
		return err
	}

	if err := modulecontroller.UpdateResources(w.kubernetesClient, *module, template); err != nil {
		return err
	}

	return nil
}

func (w *WorkflowRunner) ResourcesForModule(name string) ([]interface{}, error) {
	return w.kubernetesClient.GetResourcesForModule(name)
}

func shortDur(d time.Duration) string {
	s := d.String()
	if strings.HasSuffix(s, "m0s") {
		s = s[:len(s)-2]
	}
	if strings.HasSuffix(s, "h0m") {
		s = s[:len(s)-2]
	}
	return s
}

func mapLabels(l map[string]string) []models.Label {
	labels := make([]models.Label, 0, len(l))
	for k, v := range l {
		labels = append(labels, models.Label{
			Key:   k,
			Value: v,
		})
	}

	sort.Slice(labels, func(i, j int) bool {
		return labels[i].Key < labels[i].Key
	})

	return labels
}

func mapAppLabel(request models.DeployRequest) models.DeployRequest {
	for _, label := range request.Labels {
		if label.Key == "app" {
			return request
		}
	}

	request.Labels = append(request.Labels, models.Label{
		Key:   "app",
		Value: request.AppName,
	})

	return request
}

func getNamespace(namespace string) string {
	if namespace == "" || namespace == allNamespaces {
		return apiv1.NamespaceAll
	}

	return namespace
}
