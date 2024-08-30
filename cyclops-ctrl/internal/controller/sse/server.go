package sse

import (
	"fmt"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/cluster/k8sclient"
	"github.com/gin-gonic/gin"
	"log"
)

type Server struct {
	// Events are pushed to this channel by the main events-gathering routine
	Message k8sEvents

	// New client connections
	NewClients chan k8sEvents

	// Closed client connections
	ClosedClients chan k8sEvents

	// Total client connections
	TotalClients map[k8sEvents]bool

	k8sClient *k8sclient.KubernetesClient
}

// Initialize event and Start procnteessing requests
func NewServer(k8sClient *k8sclient.KubernetesClient) *Server {
	server := &Server{
		Message:       make(k8sEvents),
		NewClients:    make(chan k8sEvents),
		ClosedClients: make(chan k8sEvents),
		TotalClients:  make(map[k8sEvents]bool),
		k8sClient:     k8sClient,
	}

	go server.listen()

	return server
}

// It Listens all incoming requests from clients.
// Handles addition and removal of clients and broadcast messages to clients.
func (s *Server) listen() {
	for {
		select {
		// Add new available client
		case client := <-s.NewClients:
			s.TotalClients[client] = true
			log.Printf("Client added. %d registered clients", len(s.TotalClients))

		// Remove closed client
		case client := <-s.ClosedClients:
			delete(s.TotalClients, client)
			close(client)
			log.Printf("Removed client. %d registered clients", len(s.TotalClients))

		// Broadcast message to client
		case eventMsg := <-s.Message:
			for clientMessageChan := range s.TotalClients {
				clientMessageChan <- eventMsg
			}
		}
	}
}

func (s *Server) ServeHTTP() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Initialize client channel
		clientChan := make(k8sEvents)

		// Send new connection to event server
		s.NewClients <- clientChan

		defer func() {
			// Send closed connection to event server
			s.ClosedClients <- clientChan
		}()

		c.Set("clientChan", clientChan)

		c.Next()

		fmt.Println("gotov s next")
	}
}

func HeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")
		c.Writer.Header().Set("Transfer-Encoding", "chunked")
		c.Next()
	}
}
