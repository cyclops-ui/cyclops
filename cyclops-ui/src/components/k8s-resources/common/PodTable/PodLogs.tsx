import { ReadOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Divider, Modal, Tabs, TabsProps } from "antd";
import { useRef, useState } from "react";
import ReactAce from "react-ace/lib/ace";
import { mapResponseError } from "../../../../utils/api/errors";
import { isStreamingEnabled } from "../../../../utils/api/common";
import { logStream } from "../../../../utils/api/sse/logs";
import axios from "axios";

interface PodLogsProps {
  pod: any;
}

const PodLogs = ({ pod }: PodLogsProps) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [logsModal, setLogsModal] = useState({
    on: false,
    namespace: "",
    pod: "",
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
      namespace: "",
      pod: "",
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

  const onLogsTabsChange = (container: string) => {
    const controller = new AbortController();
    if (logsSignalControllerRef.current !== null) {
      logsSignalControllerRef.current.abort();
    }
    logsSignalControllerRef.current = controller; // store the controller to be able to abort the request
    setLogs(() => []);

    if (isStreamingEnabled()) {
      logStream(
        logsModal.pod,
        logsModal.namespace,
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
        logsModal.namespace +
        "/" +
        logsModal.pod +
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
              pod.name,
              pod.namespace,
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
            );
          } else {
            axios
              .get(
                "/api/resources/pods/" +
                  pod.namespace +
                  "/" +
                  pod.name +
                  "/" +
                  pod.containers[0].name +
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
            namespace: pod.namespace,
            pod: pod.name,
            containers: pod.containers,
            initContainers: pod.initContainers,
          });
        }}
      >
        <h4>
          <ReadOutlined style={{ paddingRight: "5px" }} />
          View Logs
        </h4>
      </Button>
      <Modal
        title="Logs"
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
            style={{ paddingBottom: "20px" }}
          />
        )}
        <Tabs items={getTabItems()} onChange={onLogsTabsChange} />
      </Modal>
    </>
  );
};
export default PodLogs;
