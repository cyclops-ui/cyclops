package sse

import (
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func (s *Server) Resources(ctx *gin.Context) {
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
