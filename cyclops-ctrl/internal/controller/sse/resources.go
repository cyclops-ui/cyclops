package sse

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	"io"
	"net/http"
	"time"

	"github.com/pkg/errors"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
)

func (s *Server) Resources(ctx *gin.Context) {
	resources, err := s.k8sClient.GetWorkloadsForModule(ctx.Param("name"))
	if err != nil {
		ctx.String(http.StatusInternalServerError, err.Error())
		return
	}

	s.streamResources(ctx, resources)
}

func (s *Server) ReleaseResources(ctx *gin.Context) {
	resources, err := s.k8sClient.GetWorkloadsForRelease(ctx.Param("name"))
	if err != nil {
		ctx.String(http.StatusInternalServerError, err.Error())
		return
	}

	s.streamResources(ctx, resources)
}

func (s *Server) streamResources(ctx *gin.Context, resources []dto.Resource) {
	watchSpecs := make([]k8sclient.ResourceWatchSpec, 0, len(resources))
	for _, resource := range resources {
		if !k8sclient.IsWorkload(resource.GetGroup(), resource.GetVersion(), resource.GetKind()) {
			continue
		}

		resourceName, err := kindToResource(resource.GetKind())
		if err != nil {
			ctx.String(http.StatusInternalServerError, err.Error())
			return
		}

		watchSpecs = append(watchSpecs, k8sclient.ResourceWatchSpec{
			GVR: schema.GroupVersionResource{
				Group:    resource.GetGroup(),
				Version:  resource.GetVersion(),
				Resource: resourceName,
			},
			Namespace: resource.GetNamespace(),
			Name:      resource.GetName(),
		})
	}

	stopCh := make(chan struct{})

	watchResource, err := s.k8sClient.WatchKubernetesResources(watchSpecs, stopCh)
	if err != nil {
		ctx.String(http.StatusInternalServerError, err.Error())
		return
	}

	ctx.Stream(func(w io.Writer) bool {
		for {
			select {
			case u, ok := <-watchResource:
				if !ok {
					return false
				}

				res, err := s.k8sClient.GetResource(
					u.GroupVersionKind().Group,
					u.GroupVersionKind().Version,
					u.GroupVersionKind().Kind,
					u.GetName(),
					u.GetNamespace(),
				)
				if err != nil {
					continue
				}

				ctx.SSEvent("resource-update", res)
				return true
			case <-ctx.Request.Context().Done():
				close(stopCh)
				return false
			case <-ctx.Done():
				close(stopCh)
				return false
			}
		}
	})
}

func (s *Server) SingleResource(ctx *gin.Context) {
	type Ref struct {
		Group     string `json:"group" form:"group"`
		Version   string `json:"version" form:"version"`
		Kind      string `json:"kind" form:"kind"`
		Name      string `json:"name" form:"name"`
		Namespace string `json:"namespace" form:"namespace"`
	}

	var r *Ref
	if err := ctx.BindJSON(&r); err != nil {
		ctx.Status(http.StatusBadRequest)
		return
	}

	resourceName, err := s.k8sClient.GVKtoAPIResourceName(
		schema.GroupVersion{
			Group:   r.Group,
			Version: r.Version,
		},
		r.Kind,
	)

	watchResource, err := s.k8sClient.WatchResource(r.Group, r.Version, resourceName, r.Name, r.Namespace)
	if err != nil {
		ctx.String(http.StatusInternalServerError, err.Error())
		return
	}

	p := NewProxyChan(ctx.Request.Context(), watchResource.ResultChan(), time.Second*10)

	ctx.Stream(func(w io.Writer) bool {
		for {
			select {
			case _, ok := <-p.Events():
				if !ok {
					return false
				}

				res, err := s.k8sClient.GetResource(
					r.Group,
					r.Version,
					r.Kind,
					r.Name,
					r.Namespace,
				)
				if err != nil {
					continue
				}

				ctx.SSEvent("resource-update", res)
				return true
			case <-ctx.Request.Context().Done():
				watchResource.Stop()
				close(p.output)
				return false
			case <-ctx.Done():
				watchResource.Stop()
				close(p.output)
				return false
			}
		}
	})
}

func kindToResource(kind string) (string, error) {
	switch kind {
	case "Deployment":
		return "deployments", nil
	case "StatefulSet":
		return "statefulsets", nil
	case "DaemonSet":
		return "daemonsets", nil
	default:
		return "", errors.Errorf("kind %v is not a workload", kind)
	}
}
