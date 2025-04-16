import React, { useEffect, useRef } from "react";
import { Card } from "antd";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

interface ExecTerminalProps {
  namespace: string;
  podName: string;
  containerName: string;
}

const ExecTerminal = ({
  namespace,
  podName,
  containerName,
}: ExecTerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const term = useRef<Terminal | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const inputBuffer = useRef<string>("");

  useEffect(() => {
    inputBuffer.current = "";

    const t = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      cols: 80,
      theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
      },
    });

    term.current = t;

    const openTerminal = () => {
      if (terminalRef.current) {
        t.open(terminalRef.current);
        terminalRef.current.style.height = "100%";

        socket.current = new WebSocket(
          `ws://localhost:8888/exec/${namespace}/${podName}/${containerName}`,
        );

        socket.current.onopen = () => {
          t.writeln("[Connected to Kubernetes Pod]");
        };

        socket.current.onmessage = (event) => {
          if (event.data) {
            const msg = JSON.parse(event.data);
            t.write(msg?.output);
          }
        };

        socket.current.onerror = (err) => {
          console.error("WebSocket error:", err);
          t.writeln("[Error] WebSocket error");
        };

        socket.current.onclose = () => {
          t.writeln("[Disconnected]");
        };

        t.onData((data) => {
          const charCode = data.charCodeAt(0);

          switch (data) {
            case "\r": {
              const currentLine = inputBuffer.current.trimEnd();
              t.write("\r\n");

              if (currentLine.endsWith("\\")) {
                inputBuffer.current =
                  inputBuffer.current.replace(/\\\s*$/, "") + " ";
                t.write("> ");
              } else {
                const fullCommand = inputBuffer.current;
                inputBuffer.current = "";

                if (socket.current?.readyState === WebSocket.OPEN) {
                  socket.current.send(JSON.stringify({ command: fullCommand }));
                } else {
                  t.writeln("[Error] Socket not connected");
                }
              }
              break;
            }
            case "\u007F":
              if (inputBuffer.current.length > 0) {
                inputBuffer.current = inputBuffer.current.slice(0, -1);
                t.write("\b \b");
              }
              break;
            default:
              if (data.length === 1 && charCode < 32) {
                socket.current.send(JSON.stringify({ command: data }));
              } else {
                inputBuffer.current += data;
                t.write(data);
              }
              break;
          }
        });
      }
    };

    const rafId = requestAnimationFrame(openTerminal);

    return () => {
      cancelAnimationFrame(rafId);
      socket.current?.close();
      t.dispose();
    };
  }, [namespace, podName, containerName]);

  return (
    <Card style={{ backgroundColor: "#1e1e1e", color: "#fff", height: "100%" }}>
      <div
        ref={terminalRef}
        style={{
          height: "100%",
          marginBottom: "1rem",
          overflow: "hidden",
        }}
      />
    </Card>
  );
};

export default ExecTerminal;
