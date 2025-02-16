import React, { useCallback, useEffect, useState } from "react";
import {
  Col,
  Divider,
  Row,
  Table,
  Alert,
  Descriptions,
  Button,
  Spin,
  Popover,
  Modal,
  Checkbox,
} from "antd";
import { mapResponseError } from "../../utils/api/errors";
import { ApiOutlined, CopyOutlined, EllipsisOutlined } from "@ant-design/icons";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  name: string;
  namespace: string;
}

interface externalIP {
  ip: string;
  hostname: string;
}

interface port {
  name: string;
  protocol: string;
  port: string;
  targetPort: string;
}

interface service {
  ports: port[];
  externalIPs: externalIP[];
  serviceType: string;
}

const Service = ({ name, namespace }: Props) => {
  const { mode } = useTheme();

  const { fetchResource } = useResourceListActions();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<service>({
    externalIPs: [],
    ports: [],
    serviceType: "",
  });
  const [portForwardModal, setPortForwardModal] = useState({
    open: false,
    ports: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchService = useCallback(() => {
    fetchResource("", "v1", "Service", namespace, name)()
      .then((res) => {
        setService(res);
        setLoading(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoading(false);
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchService();
    const interval = setInterval(() => fetchService(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchService]);

  const externalIPsHostname = (hostname: string) => {
    if (!hostname) {
      return <span style={{ color: "#A0A0A0" }}>{"<no hostname found>"}</span>;
    }

    return (
      <span style={{ color: "#7a7a7a" }}>
        {hostname}
        <Button
          type="text"
          onClick={() => {
            navigator.clipboard.writeText(hostname);
          }}
          style={{
            marginLeft: "4px",
            padding: "2px 1.5px",
          }}
        >
          <CopyOutlined
            style={{
              fontSize: "15px",
              color: "#7a7a7a",
            }}
          />
        </Button>
      </span>
    );
  };

  const pendingExternalIPs = () => {
    if (service.externalIPs.length === 0) {
      return (
        <Descriptions style={{ width: "100%" }} bordered column={1}>
          <Descriptions.Item
            key={"pending_port"}
            labelStyle={{ width: "20%" }}
            label={<span>Pending</span>}
          >
            <span style={{ color: "#A0A0A0" }}>{"<no hostname found>"}</span>
          </Descriptions.Item>
        </Descriptions>
      );
    }

    return (
      <Descriptions
        size={"small"}
        style={{ width: "100%" }}
        bordered
        column={1}
      >
        {service.externalIPs.map((externalIP, index) => (
          <Descriptions.Item
            key={index}
            labelStyle={{ width: "20%" }}
            label={
              <span>
                {externalIP.ip}
                <Button
                  type="text"
                  onClick={() => {
                    navigator.clipboard.writeText(externalIP.ip);
                  }}
                  style={{
                    marginLeft: "4px",
                    padding: "2px 1.5px",
                  }}
                >
                  <CopyOutlined
                    style={{
                      fontSize: "15px",
                      color: "#7a7a7a",
                    }}
                  />
                </Button>
              </span>
            }
          >
            {externalIPsHostname(externalIP.hostname)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  const externalIPs = () => {
    if (
      service.serviceType !== "LoadBalancer" &&
      service.externalIPs.length === 0
    ) {
      return <></>;
    }

    return (
      <Row>
        <Divider orientation={"left"} orientationMargin="0">
          External IPs
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          {pendingExternalIPs()}
        </Col>
      </Row>
    );
  };

  const portActionsMenu = (port: any) => {
    return (
      <div style={{ width: "400px" }}>
        <h3>Port actions</h3>
        <Divider style={{ margin: "8px" }} />
        <Row style={{ margin: 4, gap: 8 }}>
          <Button
            style={{ width: "100%" }}
            onClick={() => {
              setPortForwardModal({ open: true, ports: [port.port] });
            }}
          >
            <ApiOutlined />
            Port forward
          </Button>
        </Row>
      </div>
    );
  };

  const portForwardCommand = (
    <div>
      <span style={{ color: mode === "light" ? "navy" : "lightblue" }}>
        kubectl{" "}
      </span>
      <span>port-forward -n </span>
      <span style={{ color: "#CC6903" }}>{namespace} </span>
      <span style={{ color: "#CC6903" }}>svc/{name} </span>
      {portForwardModal.ports.map((port: string) => {
        return (
          <span style={{ color: "#CC6903" }}>
            {port}:{port}{" "}
          </span>
        );
      })}
    </div>
  );

  const portForwardCommandValue = `kubectl port-forward -n ${namespace} svc/${name} ${portForwardModal.ports
    .map((port: string) => {
      return `${port}:${port}`;
    })
    .join(" ")}`;

  if (loading) return <Spin size="large" style={{ marginTop: "20px" }} />;

  return (
    <div>
      {error.message.length !== 0 && (
        <Alert
          message={error.message}
          description={error.description}
          type="error"
          closable
          afterClose={() => {
            setError({
              message: "",
              description: "",
            });
          }}
          style={{ marginBottom: "20px" }}
        />
      )}
      {externalIPs()}
      <Divider orientation={"left"} orientationMargin="0">
        Ports
      </Divider>
      <Row>
        <Col span={24} style={{ overflowX: "auto" }}>
          <Table dataSource={service.ports}>
            <Table.Column
              title="Name"
              dataIndex="name"
              key="name"
              render={(text) =>
                text ? (
                  text
                ) : (
                  <span style={{ color: "#A0A0A0" }}>{"<not set>"}</span>
                )
              }
            />
            <Table.Column title="Protocol" dataIndex="protocol" />
            <Table.Column title="Port" dataIndex="port" />
            <Table.Column title="Target port" dataIndex="targetPort" />
            <Table.Column
              title="Actions"
              key="actions"
              width="8%"
              render={(port) => (
                <Popover
                  placement={"topRight"}
                  content={portActionsMenu(port)}
                  trigger="click"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <EllipsisOutlined />
                  </div>
                </Popover>
              )}
            />
          </Table>
        </Col>
      </Row>
      <Modal
        title="Port forward command"
        open={portForwardModal.open}
        onCancel={() => {
          setPortForwardModal({ open: false, ports: [] });
        }}
        cancelButtonProps={{ style: { display: "none" } }}
        okButtonProps={{ style: { display: "none" } }}
        style={{ zIndex: 103 }}
        width={"60%"}
      >
        <div style={{ paddingTop: "8px", paddingBottom: "4px" }}>
          Copy the command below and run it from your terminal to exec into the
          pod:
        </div>
        <pre
          style={{
            background: mode === "light" ? "#f5f5f5" : "#383838",
            padding: "10px",
            borderRadius: "5px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "50px",
          }}
        >
          {portForwardCommand}
          <Button
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(portForwardCommandValue);
            }}
            style={{
              position: "relative",
              padding: "2px 8px",
              fontSize: "12px",
            }}
          />
        </pre>
        Select which ports you want to port-forward:
        <div>
          <Checkbox.Group
            onChange={(v) => {
              setPortForwardModal({ open: true, ports: v });
            }}
            value={portForwardModal.ports}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              {service.ports.map((port: any) => (
                <Checkbox key={port.port} value={port.port}>
                  {port.name} <span style={{ color: "#999" }}>{port.port}</span>
                </Checkbox>
              ))}
            </div>
          </Checkbox.Group>
        </div>
      </Modal>
    </div>
  );
};

export default Service;
