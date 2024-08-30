package sse

import (
	"fmt"
	"github.com/gin-gonic/gin"
	json "github.com/json-iterator/go"
	"io"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/watch"
	"net/http"
	"time"
)

type k8sEvents chan watch.Event

func (s *Server) Resources(ctx *gin.Context) {
	type Ref struct {
		Group     string `json:"group"`
		Version   string `json:"version"`
		Kind      string `json:"kind"`
		Name      string `json:"name"`
		Namespace string `json:"namespace"`
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

	p := NewProxyChan(ctx.Request.Context(), watchResource.ResultChan(), time.Second*5)

	ctx.Stream(func(w io.Writer) bool {
		for {
			select {
			case msg, ok := <-p.Events():
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

				d, _ := json.Marshal(msg)
				fmt.Println(string(d))

				ctx.SSEvent("resource-update", res)
				return true
			case <-ctx.Request.Context().Done():
				watchResource.Stop()
				return false
			}
		}
	})

}
