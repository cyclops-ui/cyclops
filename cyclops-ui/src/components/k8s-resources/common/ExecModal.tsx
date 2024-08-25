import React, { useEffect, useRef } from 'react';
import { Modal } from 'antd';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';

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
        terminal.write('Error: Could not connect to the terminal.\r\n');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        terminal.write('Connection closed.\r\n');
      };

      terminal.onData((data) => {
        ws.send(data);
      });

      return () => {
        ws.close();
        if (xtermRef.current) {
          xtermRef.current.dispose();
        }
      };
    }
  }, [visible, podName, containerName, namespace]);

  return (
    <Modal
      title={`Exec Terminal - Pod: ${podName}, Container: ${containerName}`}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      bodyStyle={{ height: '60vh', padding: 0 }}
    >
      <div ref={terminalRef} style={{ height: '100%' }}></div>
    </Modal>
  );
};

export default ExecModal;
