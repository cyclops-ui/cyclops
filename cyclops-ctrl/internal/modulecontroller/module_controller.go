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
	"strings"

	"github.com/go-logr/logr"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/yaml"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"

	cyclopsv1alpha1 "github.com/cyclops-ui/cyclops/cyclops-ctrl/api/v1alpha1"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cluster/k8sclient"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/storage/templates"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/telemetry"
	templaterepo "github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/template"
)

// ModuleReconciler reconciles a Module object
type ModuleReconciler struct {
	client.Client
	Scheme *runtime.Scheme

	templatesRepo    *templaterepo.Repo
	templates        *templates.Storage
	kubernetesClient *k8sclient.KubernetesClient

	telemetryClient telemetry.Client
	logger          logr.Logger
}

func NewModuleReconciler(
	client client.Client,
	scheme *runtime.Scheme,
	templatesRepo *templaterepo.Repo,
	kubernetesClient *k8sclient.KubernetesClient,
	telemetryClient telemetry.Client,
) *ModuleReconciler {
	return &ModuleReconciler{
		Client:           client,
		Scheme:           scheme,
		templatesRepo:    templatesRepo,
		kubernetesClient: kubernetesClient,
		telemetryClient:  telemetryClient,
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

	var module cyclopsv1alpha1.Module
	err := r.Get(ctx, req.NamespacedName, &module)
	if apierrors.IsNotFound(err) {
		r.logger.Info("delete module", "namespaced name", req.NamespacedName)
		resources, err := r.kubernetesClient.GetResourcesForModule(req.Name)
		if err != nil {
			r.logger.Error(err, "error on get module resources", "namespaced name", req.NamespacedName)

			if err = r.setStatus(ctx, module, req.NamespacedName, cyclopsv1alpha1.Failed, err.Error(), nil); err != nil {
				return ctrl.Result{}, err
			}

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

				if err = r.setStatus(ctx, module, req.NamespacedName, cyclopsv1alpha1.Failed, err.Error(), nil); err != nil {
					return ctrl.Result{}, err
				}
			}
		}

		return ctrl.Result{}, nil
	}
	if err != nil {
		return ctrl.Result{}, err
	}

	r.logger.Info("upsert module", "namespaced name", req.NamespacedName)

	installErrors, err := r.moduleToResources(req.Name)
	if err != nil {
		r.logger.Error(err, "error on upsert module", "namespaced name", req.NamespacedName)

		if err = r.setStatus(ctx, module, req.NamespacedName, cyclopsv1alpha1.Failed, err.Error(), nil); err != nil {
			return ctrl.Result{}, err
		}

		return ctrl.Result{}, err
	}

	if len(installErrors) != 0 {
		return ctrl.Result{}, r.setStatus(
			ctx,
			module,
			req.NamespacedName,
			cyclopsv1alpha1.Failed,
			"error decoding/applying resources",
			installErrors,
		)
	}

	return ctrl.Result{}, r.setStatus(ctx, module, req.NamespacedName, cyclopsv1alpha1.Succeeded, "", nil)
}

// SetupWithManager sets up the controller with the Manager.
func (r *ModuleReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&cyclopsv1alpha1.Module{}).
		Complete(r)
}

func (r *ModuleReconciler) moduleToResources(name string) ([]string, error) {
	module, err := r.kubernetesClient.GetModule(name)
	if err != nil {
		return nil, err
	}

	template, err := r.templatesRepo.GetTemplate(
		module.Spec.TemplateRef.URL,
		module.Spec.TemplateRef.Path,
		module.Spec.TemplateRef.Version,
	)
	if err != nil {
		return nil, err
	}

	installErrors, err := r.generateResources(r.kubernetesClient, *module, template)
	if err != nil {
		return nil, err
	}

	return installErrors, nil
}

func (r *ModuleReconciler) generateResources(kClient *k8sclient.KubernetesClient, module cyclopsv1alpha1.Module, moduleTemplate *models.Template) ([]string, error) {
	out, err := templaterepo.HelmTemplate(module, moduleTemplate)
	if err != nil {
		return nil, err
	}

	installErrors := make([]string, 0)

	for _, s := range strings.Split(out, "---") {
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

		if err := kClient.CreateDynamic(&obj); err != nil {
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

	return installErrors, nil
}

func (r *ModuleReconciler) setStatus(
	ctx context.Context,
	module cyclopsv1alpha1.Module,
	namespacedName types.NamespacedName,
	status cyclopsv1alpha1.ReconciliationStatusState,
	reason string,
	installErrors []string,
) error {
	module.Status = cyclopsv1alpha1.ModuleStatus{ReconciliationStatus: cyclopsv1alpha1.ReconciliationStatus{
		Status: status,
		Reason: reason,
		Errors: installErrors,
	}}

	if err := r.Status().Update(ctx, &module); err != nil {
		r.logger.Error(err, "error updating module status", "namespaced name", namespacedName)
		return err
	}

	return nil
}
