import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Row,
  Table,
  Alert,
  Tag,
  Tabs,
  Modal,
  TabsProps,
} from "antd";
import axios from "axios";
import { formatPodAge } from "../../utils/pods";
// import { DownloadOutlined } from "@ant-design/icons";
import ReactAce from "react-ace";

interface Props {
  name: string;
  namespace: string;
}

const StatefulSet = ({ name, namespace }: Props) => {
  const [statefulSet, setStatefulSet] = useState({
    status: "",
    pods: [],
  });
  const [logs, setLogs] = useState("");
  const [logsModal, setLogsModal] = useState({
    on: false,
    namespace: "",
    pod: "",
    containers: [],
    initContainers: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  function fetchStatefulSet() {
    axios
      .get(`/api/resources`, {
        params: {
          group: `apps`,
          version: `v1`,
          kind: `StatefulSet`,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setStatefulSet(res.data);
      })
      .catch((error) => {
        if (error?.response?.data) {
          setError({
            message: error.response.data.message || String(error),
            description:
              error.response.data.description ||
              "Check if Cyclops backend is available on: " +
                window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        } else {
          setError({
            message: String(error),
            description:
              "Check if Cyclops backend is available on: " +
              window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        }
      });
  }

  useEffect(() => {
    fetchStatefulSet();
    const interval = setInterval(() => fetchStatefulSet(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleCancelLogs = () => {
    setLogsModal({
      on: false,
      namespace: "",
      pod: "",
      containers: [],
      initContainers: [],
    });
    setLogs("");
  };

  const downloadLogs = (container: string) => {
    return function () {
      window.location.href =
        "/api/resources/pods/" +
        logsModal.namespace +
        "/" +
        logsModal.pod +
        "/" +
        container +
        "/logs/download";
    };
  };

  const getTabItems = () => {
    let items: TabsProps["items"] = [];

    let container: any;

    if (logsModal.containers !== null) {
      for (container of logsModal.containers) {
        items.push({
          key: container.name,
          label: container.name,
          children: (
            <Col>
              <Button
                type="primary"
                // icon={<DownloadOutlined />}
                onClick={downloadLogs(container.name)}
              >
                Download
              </Button>
              <Divider style={{ marginTop: "16px", marginBottom: "16px" }} />
              <ReactAce
                style={{ width: "100%" }}
                mode={"sass"}
                value={logs}
                readOnly={true}
              />
            </Col>
          ),
        });
      }
    }

    if (logsModal.initContainers !== null) {
      for (container of logsModal.initContainers) {
        items.push({
          key: container.name,
          label: "(init container) " + container.name,
          children: (
            <Col>
              <Button
                type="primary"
                // icon={<DownloadOutlined />}
                onClick={downloadLogs(container.name)}
              >
                Download
              </Button>
              <Divider style={{ marginTop: "16px", marginBottom: "16px" }} />
              <ReactAce
                style={{ width: "100%" }}
                mode={"sass"}
                value={logs}
                readOnly={true}
              />
            </Col>
          ),
        });
      }
    }

    return items;
  };

  const onLogsTabsChange = (container: string) => {
    axios
      .get(
        "/api/resources/pods/" +
          logsModal.namespace +
          "/" +
          logsModal.pod +
          "/" +
          container +
          "/logs",
      )
      .then((res) => {
        if (res.data) {
          let log = "";
          res.data.forEach((s: string) => {
            log += s;
            log += "\n";
          });
          setLogs(log);
        } else {
          setLogs("No logs available");
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          setError({
            message: error.response.data.message || String(error),
            description:
              error.response.data.description ||
              "Check if Cyclops backend is available on: " +
                window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        } else {
          setError({
            message: String(error),
            description:
              "Check if Cyclops backend is available on: " +
              window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        }
      });
  };

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
      <Row>
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Replicas: {statefulSet.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <Table dataSource={statefulSet.pods}>
            <Table.Column
              title="Name"
              dataIndex="name"
              filterSearch={true}
              key="name"
            />
            <Table.Column title="Node" dataIndex="node" />
            <Table.Column title="Phase" dataIndex="podPhase" />
            <Table.Column
              title="Started"
              dataIndex="started"
              render={(value) => <span>{formatPodAge(value)}</span>}
            />
            <Table.Column
              title="Images"
              dataIndex="containers"
              key="containers"
              width="15%"
              render={(containers) => (
                <>
                  {containers.map((container: any, record: any) => {
                    let color = container.status.running ? "green" : "red";

                    if (record.podPhase === "Pending") {
                      color = "yellow";
                    }

                    return (
                      <Tag
                        color={color}
                        key={container.image}
                        style={{ fontSize: "100%" }}
                      >
                        {container.image}
                      </Tag>
                    );
                  })}
                </>
              )}
            />
            <Table.Column
              title="Logs"
              width="15%"
              render={(pod) => (
                <>
                  <Button
                    onClick={function () {
                      axios
                        .get(
                          "/api/resources/pods/" +
                            namespace +
                            "/" +
                            pod.name +
                            "/" +
                            pod.containers[0].name +
                            "/logs",
                        )
                        .then((res) => {
                          if (res.data) {
                            let log = "";
                            res.data.forEach((s: string) => {
                              log += s;
                              log += "\n";
                            });
                            setLogs(log);
                          } else {
                            setLogs("No logs available");
                          }
                        })
                        .catch((error) => {
                          if (error?.response?.data) {
                            setError({
                              message:
                                error.response.data.message || String(error),
                              description:
                                error.response.data.description ||
                                "Check if Cyclops backend is available on: " +
                                  window.__RUNTIME_CONFIG__
                                    .REACT_APP_CYCLOPS_CTRL_HOST,
                            });
                          } else {
                            setError({
                              message: String(error),
                              description:
                                "Check if Cyclops backend is available on: " +
                                window.__RUNTIME_CONFIG__
                                  .REACT_APP_CYCLOPS_CTRL_HOST,
                            });
                          }
                        });
                      setLogsModal({
                        on: true,
                        namespace: namespace,
                        pod: pod.name,
                        containers: pod.containers,
                        initContainers: pod.initContainers,
                      });
                    }}
                    block
                  >
                    View Logs
                  </Button>
                </>
              )}
            />
          </Table>
        </Col>
      </Row>
      <Modal
        title="Logs"
        open={logsModal.on}
        onOk={handleCancelLogs}
        onCancel={handleCancelLogs}
        cancelButtonProps={{ style: { display: "none" } }}
        width={"60%"}
      >
        <Tabs items={getTabItems()} onChange={onLogsTabsChange} />
      </Modal>
    </div>
  );
};

export default StatefulSet;
