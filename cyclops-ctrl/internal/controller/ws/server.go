package sse

import (
	"context"
	"fmt"
	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"io"
	"k8s.io/client-go/tools/remotecommand"
	"net/http"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/pkg/cluster/k8sclient"
)

type Server struct {
	k8sClient k8sclient.IKubernetesClient
}

func NewServer(k8sClient k8sclient.IKubernetesClient) *Server {
	server := &Server{
		k8sClient: k8sClient,
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

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (s *Server) ExecCommand(c *gin.Context) {
	namespace := c.Param("podNamespace")
	pod := c.Param("podName")
	container := c.Param("containerName")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, dto.NewError(err.Error(), err.Error()))
		return
	}
	defer conn.Close()

	fmt.Println(namespace, pod, container)

	exec, err := s.k8sClient.CommandExecutor(namespace, pod, container)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, dto.NewError("failed to init command exector", err.Error()))
		return
	}

	wsStream := newWebSocketStream(conn, "in")

	go wsStream.readLoop()

	err = exec.StreamWithContext(context.Background(), remotecommand.StreamOptions{
		Stdin:  wsStream,
		Stdout: wsStream,
		Stderr: wsStream,
		Tty:    true,
	})
	if err != nil {
		conn.WriteMessage(websocket.TextMessage, []byte("Stream error: "+err.Error()))
	}
}

type webSocketStream struct {
	name     string
	conn     *websocket.Conn
	recv     chan []byte
	readErr  chan error
	writeErr chan error
}

func newWebSocketStream(conn *websocket.Conn, name string) *webSocketStream {
	return &webSocketStream{
		name:     name,
		conn:     conn,
		recv:     make(chan []byte),
		readErr:  make(chan error),
		writeErr: make(chan error),
	}
}

func (w *webSocketStream) readLoop() {
	for {
		_, msg, err := w.conn.ReadMessage()
		if err != nil {
			w.readErr <- err
			close(w.recv)
			return
		}
		w.recv <- msg
	}
}

// Read implements io.Reader (for stdin)
func (w *webSocketStream) Read(p []byte) (int, error) {
	//n := copy(p, []byte("ls\n"))
	//
	//fmt.Println()
	//fmt.Println("start")
	//fmt.Println(string(p))
	//fmt.Println("end")
	//fmt.Println()
	//
	//return n, nil

	data, ok := <-w.recv
	if !ok {
		fmt.Println("eof")
		return 0, io.EOF
	}

	//n := copy(p, []byte("ls\n"))
	//
	//fmt.Println()
	//fmt.Println("start")
	//fmt.Println(string(p))
	//fmt.Println("end")
	//fmt.Println()
	//
	//return n, nil

	data = append(data, []byte("\n")...)

	n := copy(p, data)
	fmt.Println(w.name, string(data), string(p), n)
	return n, nil
}

// Write implements io.Writer (for stdout/stderr from container)
func (w *webSocketStream) Write(p []byte) (int, error) {
	fmt.Println("dobio na write", w.name, p, string(p))
	err := w.conn.WriteMessage(websocket.TextMessage, p)
	if err != nil {
		w.writeErr <- err
	}
	return len(p), err
}
