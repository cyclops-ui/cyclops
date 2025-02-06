import { DownloadOutlined, ReadOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Divider, Modal, Tabs, TabsProps } from "antd";
import { useRef, useState } from "react";
import ReactAce from "react-ace/lib/ace";
import { mapResponseError } from "../../../../utils/api/errors";
import { logStream } from "../../../../utils/api/sse/logs";
import "ace-builds/src-noconflict/ext-searchbox";
import { useResourceListActions } from "../../ResourceList/ResourceListActionsContext";

interface PodLogsProps {
  pod: any;
}

const PodLogs = ({ pod }: PodLogsProps) => {
  const { streamingDisabled, getPodLogs, downloadPodLogs, streamPodLogs } =
    useResourceListActions();
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
        logsModal.namespace,
        logsModal.pod,
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
        streamPodLogs,
      );
    } else {
      getPodLogs(logsModal.namespace, logsModal.pod, container)
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

  const downloadLogs = (container: string) => {
    return () => downloadPodLogs(logsModal.namespace, logsModal.pod, container);
  };

  return (
    <>
      <Button
        style={{ width: "100%" }}
        onClick={function () {
          if (!streamingDisabled) {
            const controller = new AbortController();
            logsSignalControllerRef.current = controller; // store the controller to be able to abort the request

            logStream(
              pod.namespace,
              pod.name,
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
            getPodLogs(pod.namespace, pod.name, pod.containers[0].name)
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
            namespace: pod.namespace,
            pod: pod.name,
            containers: pod.containers,
            initContainers: pod.initContainers,
          });
        }}
      >
        <h4 style={{ margin: "0" }}>
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
        width={"90%"}
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
