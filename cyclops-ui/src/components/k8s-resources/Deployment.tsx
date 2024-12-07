import React, { useCallback, useEffect, useState, useRef } from "react";
import { Col, Divider, Row, Alert, TabsProps, Button, Tabs, Modal } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import { isStreamingEnabled } from "../../utils/api/common";
import { logStream } from "../../utils/api/sse/logs";
import ReactAce from "react-ace/lib/ace";
import { ReadOutlined } from "@ant-design/icons";

interface Props {
  name: string;
  namespace: string;
  workload: any;
}

export const Deployment = ({ name, namespace, workload }: Props) => {
  const [deployment, setDeployment] = useState({
    status: "",
    pods: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchDeployment = useCallback(() => {
    axios
      .get(`/api/resources`, {
        params: {
          group: `apps`,
          version: `v1`,
          kind: `Deployment`,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setDeployment(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name, namespace]);

  useEffect(() => {
    fetchDeployment();

    if (isStreamingEnabled()) {
      return;
    }

    const interval = setInterval(() => fetchDeployment(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchDeployment]);

  function getPods() {
    if (workload && isStreamingEnabled()) {
      return workload.pods;
    }

    return deployment.pods;
  }

  function getPodsLength() {
    let pods = getPods();

    if (Array.isArray(pods)) {
      return pods.length;
    }

    return 0;
  }

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
          Replicas: {getPodsLength()}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable
            namespace={namespace}
            pods={getPods()}
            updateResourceData={() => {}}
          />
        </Col>
      </Row>
    </div>
  );
};

export const DeploymentLogsButton = ({ name, namespace, workload }: Props) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [logsModal, setLogsModal] = useState({
    on: false,
    containers: [],
    initContainers: [],
  });

  const logsSignalControllerRef = useRef<AbortController | null>(null);

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const handleCancelLogs = () => {
    setLogsModal({
      on: false,
      containers: [],
      initContainers: [],
    });
    setLogs([]);

    // send the abort signal
    if (logsSignalControllerRef.current !== null) {
      logsSignalControllerRef.current.abort();
    }
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
                disabled={logs.length === 0}
              >
                Download
              </Button>
              <Divider style={{ marginTop: "16px", marginBottom: "16px" }} />
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
              <Button
                type="primary"
                // icon={<DownloadOutlined />}
                onClick={downloadLogs(container.name)}
                disabled={logs.length === 0}
              >
                Download
              </Button>
              <Divider style={{ marginTop: "16px", marginBottom: "16px" }} />
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

  const onLogsTabsChange = () => {
    const controller = new AbortController();
    if (logsSignalControllerRef.current !== null) {
      logsSignalControllerRef.current.abort();
    }
    logsSignalControllerRef.current = controller; // store the controller to be able to abort the request
    setLogs(() => []);

    if (isStreamingEnabled()) {
      logStream(
        name,
        namespace,
        workload.pods[0].containers[0].name,
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
      axios
        .get(
          "/api/resources/deployments/" +
            namespace +
            "/" +
            name +
            "/" +
            workload.pods[0].containers[0].name +
            "/logs",
        )
        .then((res) => {
          if (res.data) {
            setLogs(res.data);
          } else {
            setLogs(() => []);
          }
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }
  };

  const downloadLogs = (container: string) => {
    return function () {
      window.location.href =
        "/api/resources/pods/" +
        namespace +
        "/" +
        workload.pods[0].name +
        "/" +
        container +
        "/logs/download";
    };
  };

  return (
    <>
      <Button
        style={{ width: "100%" }}
        onClick={function () {
          if (isStreamingEnabled()) {
            const controller = new AbortController();
            logsSignalControllerRef.current = controller; // store the controller to be able to abort the request

            logStream(
              workload.pods[0].name,
              namespace,
              workload.pods[0].containers[0].name,
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
            axios
              .get(
                "/api/resources/deployments/" +
                  namespace +
                  "/" +
                  name +
                  "/" +
                  workload.pods[0].containers[0].name +
                  "/logs",
              )
              .then((res) => {
                if (res.data) {
                  setLogs(res.data);
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
            containers: workload.pods[0].containers,
            initContainers: workload.pods[0].initContainers,
          });
        }}
      >
        <ReadOutlined style={{ paddingRight: "5px" }} />
        Deployment Logs
      </Button>
      <Modal
        title="Deployment Logs"
        open={logsModal.on}
        onOk={handleCancelLogs}
        onCancel={handleCancelLogs}
        cancelButtonProps={{ style: { display: "none" } }}
        style={{ zIndex: 100 }}
        width={"80%"}
      >
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
        <Tabs items={getTabItems()} onChange={onLogsTabsChange} />
      </Modal>
    </>
  );
};
