import { DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Divider,
  Input,
  Modal,
  Popover,
  Row,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { useState } from "react";
import { mapResponseError } from "../../../../utils/api/errors";
import { formatPodAge } from "../../../../utils/pods";
import PodLogs from "./PodLogs";
import PodManifest from "./PodManifest";
import { useResourceListActions } from "../../ResourceList/ResourceListActionsContext";
import PodExec from "./PodExec";

interface Props {
  namespace: string;
  pods: any[];
  updateResourceData: () => void;
}

interface Pod {
  group: any;
  version: any;
  kind: any;
  name: string;
  namespace: any;
}

const PodTable = ({ pods, namespace, updateResourceData }: Props) => {
  const { deleteResource } = useResourceListActions();
  const [deletePodRef, setDeletePodRef] = useState<{
    on: boolean;
    podDetails: Pod;
  }>({
    on: false,
    podDetails: {
      group: "",
      version: "",
      kind: "",
      name: "",
      namespace: "",
    },
  });
  const [deletePodConfirmRef, setDeletePodConfirmRef] = useState<string>("");
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const handleCancelDeletePod = () => {
    setDeletePodRef({
      on: false,
      podDetails: {
        group: "",
        version: "",
        kind: "",
        name: "",
        namespace: "",
      },
    });
  };

  const handleDeletePodAction = async () => {
    try {
      await deleteResource(
        deletePodRef.podDetails.group,
        deletePodRef.podDetails.version,
        deletePodRef.podDetails.kind,
        deletePodRef.podDetails.namespace,
        deletePodRef.podDetails.name,
      );

      updateResourceData();

      setDeletePodConfirmRef("");
      setDeletePodRef({
        on: false,
        podDetails: {
          group: "",
          version: "",
          kind: "",
          name: "",
          namespace: "",
        },
      });
    } catch (error) {
      setError(mapResponseError(error));
    }
  };

  const handleDeletePodRefChange = (e: any) => {
    setDeletePodConfirmRef(e.target.value);
  };

  const podActionsMenu = (pod: any) => {
    return (
      <div style={{ width: "400px" }}>
        <h3>{pod.name} actions</h3>
        <Divider style={{ margin: "8px" }} />
        <Row style={{ margin: 4, gap: 8 }}>
          <PodLogs pod={{ ...pod, namespace }} />
          <PodManifest pod={{ ...pod, namespace }} />
          <PodExec pod={{ ...pod, namespace }} />
          <Button
            style={{ color: "red", width: "100%" }}
            onClick={function () {
              setError({ message: "", description: "" });
              setDeletePodRef({
                on: true,
                podDetails: {
                  group: ``,
                  version: `v1`,
                  kind: `Pod`,
                  name: pod.name,
                  namespace: namespace,
                },
              });
            }}
          >
            <h4 style={{ margin: "0" }}>
              <DeleteOutlined style={{ paddingRight: "5px" }} />
              Delete Pod
            </h4>
          </Button>
        </Row>
      </div>
    );
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
          title="Actions"
          key="actions"
          width="8%"
          // className={styles.actionsmenucol}
          render={(pod) => (
            <Popover
              placement={"topRight"}
              content={podActionsMenu(pod)}
              trigger="click"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <EllipsisOutlined
                // className={styles.actionsmenu}
                />
              </div>
            </Popover>
          )}
        />
      </Table>
      <Modal
        title={
          <div style={{ color: "red", marginBottom: "1rem" }}>
            <DeleteOutlined style={{ paddingRight: "5px" }} />
            Delete{" "}
            <span style={{ fontWeight: "bolder" }}>
              {" "}
              {deletePodRef.podDetails.name}{" "}
            </span>{" "}
            pod ?
          </div>
        }
        open={deletePodRef.on}
        onCancel={handleCancelDeletePod}
        footer={
          <Button
            danger
            block
            disabled={deletePodConfirmRef !== deletePodRef.podDetails.name}
            onClick={handleDeletePodAction}
          >
            Delete
          </Button>
        }
        width={"40%"}
        styles={{
          footer: {
            display: "flex",
            justifyContent: "center",
          },
        }}
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
        <p>
          In order to confirm deleting this resource, type: <br />{" "}
          <code>{deletePodRef.podDetails.name}</code>
        </p>
        <Input
          placeholder={deletePodRef.podDetails.name}
          onChange={handleDeletePodRefChange}
          value={deletePodConfirmRef}
          required
        />
      </Modal>
    </div>
  );
};

export default PodTable;
