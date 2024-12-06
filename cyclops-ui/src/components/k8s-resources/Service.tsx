import React, { useEffect, useState } from "react";
import {
  Col,
  Divider,
  Row,
  Table,
  Alert,
  Descriptions,
  Button,
  Spin,
} from "antd";
import { mapResponseError } from "../../utils/api/errors";
import { CopyOutlined } from "@ant-design/icons";

interface Props {
  name: string;
  namespace: string;
  fetchResource: () => Promise<any>;
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

const Service = ({ name, namespace, fetchResource }: Props) => {
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<service>({
    externalIPs: [],
    ports: [],
    serviceType: "",
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchService() {
      fetchResource()
        .then((res) => {
          setService(res);
          setLoading(false);
        })
        .catch((error) => {
          setError(mapResponseError(error));
          setLoading(false);
        });
    }

    fetchService();
    const interval = setInterval(() => fetchService(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchResource]);

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
          </Table>
        </Col>
      </Row>
    </div>
  );
};

export default Service;
