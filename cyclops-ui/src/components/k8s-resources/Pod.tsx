import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Row,
  Typography,
  Alert,
  Tag,
  Tabs,
  Modal,
  TabsProps,
} from "antd";
import ReactAce from "react-ace";
import { formatPodAge } from "../../utils/pods";
import { mapResponseError } from "../../utils/api/errors";
import { logStream } from "../../utils/api/sse/logs";
import { DownloadOutlined } from "@ant-design/icons";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";
const { Title } = Typography;

interface Props {
  name: string;
  namespace: string;
}

interface container {
  name: string;
  image: string;
}

interface pod {
  status: string;
  containers: container[];
  initContainers: container[];
  podPhase: string;
  node: string;
  started: string;
}

interface logsModal {
  on: boolean;
  containers: container[];
  initContainers: container[];
}

const Pod = ({ name, namespace }: Props) => {
  const {
    streamingDisabled,
    fetchResource,
    getPodLogs,
    downloadPodLogs,
    streamPodLogs,
  } = useResourceListActions();
  const logsSignalControllerRef = useRef<AbortController | null>(null);

  const [pod, setPod] = useState<pod>({
    status: "",
    containers: [],
    initContainers: [],
    podPhase: "",
    node: "",
    started: "",
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });
  const [logsModal, setLogsModal] = useState<logsModal>({
    on: false,
    containers: [],
    initContainers: [],
  });
  const [logs, setLogs] = useState<string[]>([]);

  const fetchPod = useCallback(() => {
    fetchResource("", "v1", "Pod", namespace, name)()
      .then((res) => {
        setPod(res);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchPod();
    const interval = setInterval(() => fetchPod(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchPod]);

  const handleCancelLogs = () => {
    setLogsModal({
      on: false,
      containers: [],
      initContainers: [],
    });
    setLogs([]);
  };

  const downloadLogs = (container: string) => {
    return () => downloadPodLogs(namespace, name, container);
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
              {downloadPodLogs ? (
                <div>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={downloadLogs(container.name)}
                    disabled={logs.length === 0}
                  >
                    Download
                  </Button>
                  <Divider
                    style={{ marginTop: "16px", marginBottom: "16px" }}
                  />
                </div>
              ) : (
                <></>
              )}
              <ReactAce
                style={{ width: "100%" }}
                mode={"sass"}
                value={
                  logs.length === 0 ? "No logs available" : logs.join("\n")
                }
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
              {downloadPodLogs ? (
                <div>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={downloadLogs(container.name)}
                    disabled={logs.length === 0}
                  >
                    Download
                  </Button>
                  <Divider
                    style={{ marginTop: "16px", marginBottom: "16px" }}
                  />
                </div>
              ) : (
                <></>
              )}
              <ReactAce
                style={{ width: "100%" }}
                mode={"sass"}
                value={
                  logs.length === 0 ? "No logs available" : logs.join("\n")
                }
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
    const controller = new AbortController();
    if (logsSignalControllerRef.current !== null) {
      logsSignalControllerRef.current.abort();
    }
    logsSignalControllerRef.current = controller; // store the controller to be able to abort the request
    setLogs(() => []);

    if (!streamingDisabled) {
      logStream(
        namespace,
        name,
        container,
        (log, isReset = false) => {
          if (isReset) {
            setLogs(() => []);
          } else {
            setLogs((prevLogs) => {
              return [...prevLogs, log];
            });
          }
        },
        (err, isReset = false) => {
          if (isReset) {
            setError({
              message: "",
              description: "",
            });
          } else {
            setError(mapResponseError(err));
          }
        },
        controller,
      );
    } else {
      getPodLogs(namespace, name, container)
        .then((res) => {
          if (res) {
            setLogs(res);
          } else {
            setLogs(() => []);
          }
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }
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
      <Divider />
      <Row>
        <Title level={5}>Phase: {pod.podPhase}</Title>
      </Row>
      <Row>
        <Title level={5}>Node: {pod.node}</Title>
      </Row>
      <Row>
        <Title level={5}> Started: {formatPodAge(pod.started)}</Title>
      </Row>
      <Row>
        <Title level={5}>Containers:</Title>
      </Row>
      <Row>
        <>
          {pod.containers.map((container: any) => {
            let color = container.status.running ? "green" : "red";
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
      </Row>
      <Row style={{ marginTop: "15px" }}>
        <Col style={{ float: "right" }}>
          <Button
            onClick={function () {
              if (!streamingDisabled) {
                const controller = new AbortController();
                logsSignalControllerRef.current = controller; // store the controller to be able to abort the request

                logStream(
                  namespace,
                  name,
                  pod.containers[0].name,
                  (log, isReset = false) => {
                    if (isReset) {
                      setLogs(() => []);
                    } else {
                      setLogs((prevLogs) => {
                        return [...prevLogs, log];
                      });
                    }
                  },
                  (err, isReset = false) => {
                    if (isReset) {
                      setError({
                        message: "",
                        description: "",
                      });
                    } else {
                      setError(mapResponseError(err));
                    }
                  },
                  controller,
                  streamPodLogs,
                );
              } else {
                getPodLogs(namespace, name, pod.containers[0].name)
                  .then((res) => {
                    if (res) {
                      setLogs(res);
                    } else {
                      setLogs(() => []);
                    }
                  })
                  .catch((error) => {
                    setError(mapResponseError(error));
                  });
              }

              setLogsModal({
                on: true,
                containers: pod.containers,
                initContainers: pod.initContainers,
              });
            }}
            block
          >
            View Logs
          </Button>
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

export default Pod;
