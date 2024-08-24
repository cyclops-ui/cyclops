import React, { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css'; // Ensure you include xterm CSS for styling

interface ExecModalProps {
  visible: boolean;
  onCancel: () => void;
  podName: string;
  containerName: string;
  namespace: string;
}

const ExecModal: React.FC<ExecModalProps> = ({
  visible,
  onCancel,
  podName,
  containerName,
  namespace,
}) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (visible && terminalRef.current) {
      // Initialize the terminal
      const terminal = new Terminal();
      terminal.open(terminalRef.current);
      xtermRef.current = terminal;

      // Connect to the backend via WebSocket
      const ws = new WebSocket(`wss://your-backend-url/exec?pod=${podName}&container=${containerName}&namespace=${namespace}`);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        terminal.write('Welcome to the terminal!\r\n');
      };

      ws.onmessage = (event) => {
        terminal.write(event.data);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        terminal.write('Error connecting to WebSocket.\r\n');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        terminal.write('WebSocket connection closed.\r\n');
      };

      terminal.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        terminal.dispose();
      };
    }
  }, [visible, podName, containerName, namespace]);

  return (
    <Modal
      title="Terminal"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width="80%"
      bodyStyle={{ padding: 0 }}
    >
      <div ref={terminalRef} style={{ height: '500px' }}></div>
    </Modal>
  );
};

export default ExecModal;
