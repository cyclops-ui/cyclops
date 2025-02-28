package sse

import (
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/integrations/helm"
	"github.com/gin-gonic/gin"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
)

type Server struct {
	k8sClient     k8sclient.IKubernetesClient
	releaseClient *helm.ReleaseClient
}

// Initialize event and Start procnteessing requests
func NewServer(k8sClient k8sclient.IKubernetesClient, releaseClient *helm.ReleaseClient) *Server {
	server := &Server{
		k8sClient:     k8sClient,
		releaseClient: releaseClient,
	}

	return server
}

func HeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")
		c.Writer.Header().Set("Transfer-Encoding", "chunked")
		c.Writer.Header().Set("X-Accel-Buffering", "no")
		c.Next()
	}
}
