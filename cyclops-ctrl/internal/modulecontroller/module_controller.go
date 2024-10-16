/*
Copyright 2023.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package modulecontroller

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/go-logr/logr"
	"helm.sh/helm/v3/pkg/chart"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/yaml"
	"k8s.io/client-go/util/workqueue"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller"
	"sigs.k8s.io/controller-runtime/pkg/log"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/prometheus"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/telemetry"
	templaterepo "github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template/render"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
)

// ModuleReconciler reconciles a Module object
type ModuleReconciler struct {
	client.Client
	Scheme *runtime.Scheme

	templatesRepo    templaterepo.ITemplateRepo
	kubernetesClient k8sclient.IKubernetesClient
	renderer         *render.Renderer

	telemetryClient telemetry.Client
	monitor         prometheus.Monitor
	logger          logr.Logger
}

func NewModuleReconciler(
	client client.Client,
	scheme *runtime.Scheme,
	templatesRepo templaterepo.ITemplateRepo,
	kubernetesClient k8sclient.IKubernetesClient,
	renderer *render.Renderer,
	telemetryClient telemetry.Client,
	monitor prometheus.Monitor,
) *ModuleReconciler {
	return &ModuleReconciler{
		Client:           client,
		Scheme:           scheme,
		templatesRepo:    templatesRepo,
		kubernetesClient: kubernetesClient,
		renderer:         renderer,
		telemetryClient:  telemetryClient,
		monitor:          monitor,
		logger:           ctrl.Log.WithName("reconciler"),
	}
}

//+kubebuilder:rbac:groups=cyclops-ui.com,resources=modules,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=cyclops-ui.com,resources=modules/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=cyclops-ui.com,resources=modules/finalizers,verbs=update

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
// TODO(user): Modify the Reconcile function to compare the state specified by
// the Module object against the actual cluster state, and then
// perform operations to make the cluster state reflect the state specified by
// the user.
//
// For more details, check Reconcile and its Result here:
// - https://pkg.go.dev/sigs.k8s.io/controller-runtime@v0.14.4/pkg/reconcile
func (r *ModuleReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	_ = log.FromContext(ctx)
	r.telemetryClient.ModuleReconciliation()
	r.monitor.OnReconciliation()

	startTime := time.Now()

	defer func(startTime time.Time) {
		r.monitor.ObserveReconciliationDuration(time.Since(startTime).Seconds())
	}(startTime)

	var module cyclopsv1alpha1.Module
	err := r.Get(ctx, req.NamespacedName, &module)
	if apierrors.IsNotFound(err) {
		r.logger.Info("delete module", "namespaced name", req.NamespacedName)
		resources, err := r.kubernetesClient.GetResourcesForModule(req.Name)
		if err != nil {
			r.logger.Error(err, "error on get module resources", "namespaced name", req.NamespacedName)
			r.monitor.OnFailedReconciliation()
			return ctrl.Result{}, err
		}

		for _, resource := range resources {
			if err := r.kubernetesClient.Delete(resource); err != nil {
				r.logger.Error(
					err,
					"error on delete module while deleting resource",
					"module namespaced name",
					req.NamespacedName,
					"resource namespaced name",
					fmt.Sprintf("%s/%s", resource.GetNamespace(), resource.GetName()),
				)
			}
		}

		return ctrl.Result{}, nil
	}
	if err != nil {
		r.monitor.OnFailedReconciliation()
		return ctrl.Result{}, err
	}

	r.logger.Info("upsert module", "namespaced name", req.NamespacedName)

	templateVersion := module.Status.TemplateResolvedVersion
	if len(templateVersion) == 0 {
		templateVersion = module.Spec.TemplateRef.Version
	}

	template, err := r.templatesRepo.GetTemplate(
		module.Spec.TemplateRef.URL,
		module.Spec.TemplateRef.Path,
		templateVersion,
		module.Status.TemplateResolvedVersion,
		module.Spec.TemplateRef.SourceType,
	)
	if err != nil {
		r.logger.Error(err, "error fetching module template", "namespaced name", req.NamespacedName)

		if err = r.setStatus(ctx, module, req.NamespacedName, cyclopsv1alpha1.Failed, templateVersion, err.Error(), nil, nil, ""); err != nil {
			return ctrl.Result{}, err
		}

		r.monitor.OnFailedReconciliation()

		return ctrl.Result{}, err
	}

	installErrors, childrenResources, err := r.moduleToResources(template, &module)
	if err != nil {
		r.logger.Error(err, "error on upsert module", "namespaced name", req.NamespacedName)

		if err = r.setStatus(ctx, module, req.NamespacedName, cyclopsv1alpha1.Failed, template.ResolvedVersion, err.Error(), nil, nil, template.IconURL); err != nil {
			return ctrl.Result{}, err
		}

		r.monitor.OnFailedReconciliation()

		return ctrl.Result{}, err
	}

	if len(installErrors) != 0 {
		r.monitor.OnFailedReconciliation()
		return ctrl.Result{}, r.setStatus(
			ctx,
			module,
			req.NamespacedName,
			cyclopsv1alpha1.Failed,
			template.ResolvedVersion,
			"error decoding/applying resources",
			installErrors,
			childrenResources,
			template.IconURL,
		)
	}

	return ctrl.Result{}, r.setStatus(
		ctx,
		module,
		req.NamespacedName,
		cyclopsv1alpha1.Succeeded,
		template.ResolvedVersion,
		"",
		nil,
		childrenResources,
		template.IconURL,
	)
}

// SetupWithManager sets up the controller with the Manager.
func (r *ModuleReconciler) SetupWithManager(mgr ctrl.Manager) error {
	rateLimiter := workqueue.NewMaxOfRateLimiter(
		workqueue.NewItemExponentialFailureRateLimiter(1*time.Second, 64*time.Second),
	)

	return ctrl.NewControllerManagedBy(mgr).
		For(&cyclopsv1alpha1.Module{}).
		WithOptions(controller.Options{RateLimiter: rateLimiter}).
		Complete(r)
}

func (r *ModuleReconciler) moduleToResources(template *models.Template, module *cyclopsv1alpha1.Module) ([]string, []cyclopsv1alpha1.GroupVersionResource, error) {
	crdInstallErrors := r.applyCRDs(template)

	installErrors, childrenGVRs, err := r.generateResources(r.kubernetesClient, *module, template)
	if err != nil {
		return nil, nil, err
	}

	return append(crdInstallErrors, installErrors...), childrenGVRs, nil
}

func (r *ModuleReconciler) generateResources(
	kClient k8sclient.IKubernetesClient,
	module cyclopsv1alpha1.Module,
	moduleTemplate *models.Template,
) ([]string, []cyclopsv1alpha1.GroupVersionResource, error) {
	out, err := r.renderer.HelmTemplate(module, moduleTemplate)
	if err != nil {
		return nil, nil, err
	}

	installErrors := make([]string, 0)
	childrenGVRs := make([]cyclopsv1alpha1.GroupVersionResource, 0)

	for _, s := range strings.Split(out, "\n---\n") {
		s := strings.TrimSpace(s)
		if len(s) == 0 {
			continue
		}

		var obj unstructured.Unstructured
		decoder := yaml.NewYAMLOrJSONDecoder(strings.NewReader(s), len(s))
		if err := decoder.Decode(&obj); err != nil {
			r.logger.Error(err, "could not decode resource",
				"module namespaced name",
				module.Name,
				"gvk",
				obj.GroupVersionKind().String(),
				"resource namespaced name",
				fmt.Sprintf("%s/%s", obj.GetNamespace(), obj.GetName()),
			)

			installErrors = append(installErrors, fmt.Sprintf(
				"%v%v/%v %v/%v failed to decode: %v",
				obj.GroupVersionKind().Group,
				obj.GroupVersionKind().Version,
				obj.GroupVersionKind().Kind,
				obj.GetNamespace(),
				obj.GetName(),
				err.Error(),
			))

			continue
		}

		if len(obj.UnstructuredContent()) == 0 {
			continue
		}

		labels := obj.GetLabels()
		if labels == nil {
			labels = make(map[string]string)
		}

		labels["app.kubernetes.io/managed-by"] = "cyclops"
		labels["cyclops.module"] = module.Name
		obj.SetLabels(labels)

		resourceName, err := kClient.GVKtoAPIResourceName(obj.GroupVersionKind().GroupVersion(), obj.GroupVersionKind().Kind)
		if err != nil {
			installErrors = append(installErrors, fmt.Sprintf(
				"%v%v/%v %v/%v failed to apply: %v",
				obj.GroupVersionKind().Group,
				obj.GroupVersionKind().Version,
				obj.GroupVersionKind().Kind,
				obj.GetNamespace(),
				obj.GetName(),
				err.Error(),
			))

			continue
		}

		gvr := cyclopsv1alpha1.GroupVersionResource{
			Group:    obj.GroupVersionKind().Group,
			Version:  obj.GroupVersionKind().Version,
			Resource: resourceName,
		}
		childrenGVRs = append(childrenGVRs, gvr)

		if err := kClient.CreateDynamic(gvr, &obj, module.Spec.TargetNamespace); err != nil {
			r.logger.Error(err, "could not apply resource",
				"module namespaced name",
				module.Name,
				"gvk",
				obj.GroupVersionKind().String(),
				"resource namespaced name",
				fmt.Sprintf("%s/%s", obj.GetNamespace(), obj.GetName()),
			)

			installErrors = append(installErrors, fmt.Sprintf(
				"%v%v/%v %v/%v failed to apply: %v",
				obj.GroupVersionKind().Group,
				obj.GroupVersionKind().Version,
				obj.GroupVersionKind().Kind,
				obj.GetNamespace(),
				obj.GetName(),
				err.Error(),
			))

			continue
		}
	}

	return installErrors, childrenGVRs, nil
}

func (r *ModuleReconciler) applyCRDs(template *models.Template) []string {
	installErrors := make([]string, 0)

	for _, d := range template.Dependencies {
		installErrors = append(installErrors, r.applyCRDs(d)...)
	}

	for _, crdFile := range template.CRDs {
		installErrors = append(installErrors, r.applyCRDFile(crdFile)...)
	}

	return installErrors
}

func (r *ModuleReconciler) applyCRDFile(file *chart.File) []string {
	installErrors := make([]string, 0)

	for _, s := range strings.Split(string(file.Data), "\n---\n") {
		s := strings.TrimSpace(s)
		if len(s) == 0 {
			continue
		}

		var crd *unstructured.Unstructured
		decoder := yaml.NewYAMLOrJSONDecoder(strings.NewReader(s), len(s))
		err := decoder.Decode(&crd)

		if crd == nil {
			continue
		}

		if err != nil {
			r.logger.Error(err, "could not decode crd",
				"crd file",
				file.Name,
			)

			installErrors = append(installErrors, fmt.Sprintf(
				"failed to decode CRD from file %v: %v",
				file.Name,
				err.Error(),
			))
			continue
		}

		if err := r.kubernetesClient.ApplyCRD(crd); err != nil {
			r.logger.Error(err, "failed to apply crd",
				"crd",
				crd.GetName(),
				"crd file",
				file.Name,
			)

			installErrors = append(installErrors, fmt.Sprintf(
				"failed to create CRD %v from file %v: %v",
				crd.GetName(),
				file.Name,
				err.Error(),
			))
			continue
		}
	}

	return installErrors
}

func (r *ModuleReconciler) mergeChildrenGVRs(existing, current []cyclopsv1alpha1.GroupVersionResource) []cyclopsv1alpha1.GroupVersionResource {
	unique := make(map[cyclopsv1alpha1.GroupVersionResource]struct{})
	for _, resource := range existing {
		unique[resource] = struct{}{}
	}

	for _, resource := range current {
		unique[resource] = struct{}{}
	}

	merged := make([]cyclopsv1alpha1.GroupVersionResource, 0)
	for u := range unique {
		merged = append(merged, u)
	}

	sort.Slice(merged, func(i, j int) bool {
		if merged[i].Group != merged[j].Group {
			return merged[i].Group < merged[j].Group
		}
		if merged[i].Version != merged[j].Version {
			return merged[i].Version < merged[j].Version
		}
		return merged[i].Resource < merged[j].Resource
	})

	return merged
}

func (r *ModuleReconciler) setStatus(
	ctx context.Context,
	module cyclopsv1alpha1.Module,
	namespacedName types.NamespacedName,
	status cyclopsv1alpha1.ReconciliationStatusState,
	templateResolvedVersion string,
	reason string,
	installErrors []string,
	childrenResources []cyclopsv1alpha1.GroupVersionResource,
	iconURL string,
) error {
	trv := module.Status.TemplateResolvedVersion
	if len(trv) == 0 {
		trv = templateResolvedVersion
	}

	module.Status = cyclopsv1alpha1.ModuleStatus{
		ReconciliationStatus: cyclopsv1alpha1.ReconciliationStatus{
			Status:     status,
			Reason:     reason,
			Errors:     installErrors,
			FinishedAt: time.Now().Format(time.RFC3339), // Convert time to string format
		},
		ManagedGVRs:             r.mergeChildrenGVRs(module.Status.ManagedGVRs, childrenResources),
		TemplateResolvedVersion: templateResolvedVersion,
		IconURL:                 iconURL,
	}

	if err := r.Status().Update(ctx, &module); err != nil {
		r.logger.Error(err, "error updating module status", "namespaced name", namespacedName)
		return err
	}

	return nil
}
