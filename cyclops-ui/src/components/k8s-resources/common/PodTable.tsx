import React, { useState } from "react";
import {
  Button,
  Col,
  Divider,
  Table,
  Tag,
  TabsProps,
  Tabs,
  Modal,
  Alert,
  Tooltip,
} from "antd";
import axios from "axios";
import { formatPodAge } from "../../../utils/pods";
import ReactAce from "react-ace";
import { mapResponseError } from "../../../utils/api/errors";
import ExecModal from './ExecModal'; // Import the ExecModal component

const PodTable = ({ pods, namespace }: Props) => {
  const [logs, setLogs] = useState("");
  const [logsModal, setLogsModal] = useState({
    on: false,
    namespace: "",
    pod: "",
    containers: [],
    initContainers: [],
  });
  const [execModal, setExecModal] = useState({ // Added state for ExecModal
    on: false,
    podName: "",
    containerName: "",
  });
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
    setLogs("");
  };

  const handleCancelExec = () => { // Added handler for closing ExecModal
    setExecModal({
      on: false,
      podName: "",
      containerName: "",
    });
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
                onClick={downloadLogs(container.name)}
                disabled={logs === "No logs available"}
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
                onClick={downloadLogs(container.name)}
                disabled={logs === "No logs available"}
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

  const openExecModal = (podName: string, containerName: string) => { // Added function to open ExecModal
    setExecModal({
      on: true,
      podName: podName,
      containerName: containerName,
    });
  };

  return (
    <div>
      <Table dataSource={pods}>
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
          render={(containers, record: any) => (
            <>
              {containers.map((container: any) => {
                let color = container.status.running ? "green" : "red";

                if (record.podPhase === "Pending") {
                  color = "yellow";
                }

                return (
                  <Tooltip
                    key={container.name}
                    title={
                      <div>
                        <div key={container.name}>
                          <strong>{container.name}:</strong>{" "}
                          {container.status.status}
                          <br />
                          <small>{container.status.message}</small>
                        </div>
                      </div>
                    }
                  >
                    <Tag
                      color={color}
                      key={container.image}
                      style={{ fontSize: "100%" }}
                    >
                      {container.image}
                    </Tag>
                  </Tooltip>
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
              <Button
                type="primary"
                onClick={() => openExecModal(pod.name, pod.containers[0].name)} // Added button for Exec
                style={{ marginTop: '10px' }}
                block
              >
                Exec
              </Button>
            </>
          )}
        />
      </Table>
      <Modal
        title="Logs"
        open={logsModal.on}
        onOk={handleCancelLogs}
        onCancel={handleCancelLogs}
        cancelButtonProps={{ style: { display: "none" } }}
        width={"60%"}
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
      <ExecModal // Added ExecModal component
        visible={execModal.on}
        onCancel={handleCancelExec}
        podName={execModal.podName}
        containerName={execModal.containerName}
        namespace={namespace}
      />
    </div>
  );
};

export default PodTable;
