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
import { mapResponseError } from "../../utils/api/errors";

interface Props {
  name: string;
  namespace: string;
}

interface container {
  name: string;
}
interface pod {
  name: string;
  containers: container[];
}

interface statefulSet {
  status: string;
  pods: pod[];
}

const StatefulSet = ({ name, namespace }: Props) => {
  const [statefulSet, setStatefulSet] = useState<statefulSet>({
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
  const [statefulSetLogs, setStatefulSetLogs] = useState("");
  const [statefulSetLogsModal, setStatefulSetLogsModal] = useState({
    on: false,
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
        setError(mapResponseError(error));
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

  const handleCancelStatefulSetLogs = () => {
    setStatefulSetLogsModal({
      on: false,
    });
    setStatefulSetLogs("");
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
        setError(mapResponseError(error));
      });
  };

  const getStatefulSetLogsTabItems = () => {
    let items: TabsProps["items"] = [];
    let keys: string[] = [];

    if (statefulSet.pods !== null) {
      for (var pod of statefulSet.pods) {
        for (var container of pod.containers) {
          if (!keys.includes(container.name)) {
            items.push({
              key: `${container.name}`,
              label: `${container.name}`,
              children: (
                <Col>
                  <ReactAce
                    style={{ width: "100%" }}
                    mode={"sass"}
                    value={statefulSetLogs}
                    readOnly={true}
                  />
                </Col>
              ),
            });
            keys.push(container.name);
          }
        }
      }
    }

    return items;
  };

  const getStatefulSetLogs = (container: string) => {
    axios
      .get(
        "/api/resources/statefulsets/" +
          namespace +
          "/" +
          name +
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
          setStatefulSetLogs(log);
        } else {
          setStatefulSetLogs("No logs available");
        }
      })
      .catch((error) => {
        setError(mapResponseError(error));
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
          Statefulset logs
        </Divider>
        <Button
          onClick={function () {
            getStatefulSetLogs(statefulSet.pods[0].containers[0].name);
            setStatefulSetLogsModal({
              on: true,
            });
          }}
        >
          View Logs
        </Button>
      </Row>
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
                          setError(mapResponseError(error));
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
      <Modal
        title="Stefulset Logs"
        open={statefulSetLogsModal.on}
        onOk={handleCancelStatefulSetLogs}
        onCancel={handleCancelStatefulSetLogs}
        cancelButtonProps={{ style: { display: "none" } }}
        width={"60%"}
      >
        <Tabs
          items={getStatefulSetLogsTabItems()}
          onChange={getStatefulSetLogs}
        />
      </Modal>
    </div>
  );
};

export default StatefulSet;
