package ws

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"k8s.io/client-go/tools/remotecommand"

	"github.com/cyclops-ui/cyclops/cyclops-ctrl/internal/models/dto"
)

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
		m := dto.NewExecOutput("Stream error: " + err.Error())

		p, err := m.Bytes()
		if err != nil {
			conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			return
		}

		conn.WriteMessage(websocket.TextMessage, p)
	}
}

type webSocketStream struct {
	name     string
	conn     *websocket.Conn
	recv     chan *dto.ExecIn
	readErr  chan error
	writeErr chan error
}

func newWebSocketStream(conn *websocket.Conn, name string) *webSocketStream {
	return &webSocketStream{
		name:     name,
		conn:     conn,
		recv:     make(chan *dto.ExecIn),
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

		execIn, err := dto.NewExecInput(msg)
		if err != nil {
			w.readErr <- err
			close(w.recv)
			return
		}

		w.recv <- execIn
	}
}

// Read implements io.Reader (for stdin)
func (w *webSocketStream) Read(p []byte) (int, error) {
	msg, ok := <-w.recv
	if !ok {
		return 0, io.EOF
	}

	data := append([]byte(msg.Command), []byte("\n")...)

	n := copy(p, data)
	return n, nil
}

// Write implements io.Writer (for stdout/stderr from container)
func (w *webSocketStream) Write(p []byte) (int, error) {
	m := dto.NewExecOutput(string(p))
	output, err := m.Bytes()
	if err != nil {
		return 0, err
	}

	err = w.conn.WriteMessage(websocket.TextMessage, output)
	if err != nil {
		w.writeErr <- err
	}
	return len(p), err
}
