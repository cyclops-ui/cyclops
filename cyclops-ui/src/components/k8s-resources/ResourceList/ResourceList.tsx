import React, { useState } from "react";
import {
  Divider,
  Row,
  Tooltip,
  Button,
  Collapse,
  Col,
  Checkbox,
  Spin,
  Popover,
  Input,
  Modal,
  Alert,
} from "antd";
import axios from "axios";
import ReactAce from "react-ace";
import {
  isWorkload,
  ResourceRef,
  resourceRefKey,
} from "../../../utils/resourceRef";
import Deployment from "../Deployment";
import CronJob from "../CronJob";
import Job from "../Job";
import DaemonSet from "../DaemonSet";
import StatefulSet from "../StatefulSet";
import Pod from "../Pod";
import Service from "../Service";
import ConfigMap from "../ConfigMap";
import PersistentVolumeClaim from "../PersistentVolumeClaim";
import Secret from "../Secret";
import {
  CaretRightOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseSquareTwoTone,
  CopyOutlined,
  FileTextOutlined,
  SearchOutlined,
  WarningTwoTone,
} from "@ant-design/icons";
import { isStreamingEnabled } from "../../../utils/api/common";
import { canRestart, RestartButton } from "../common/RestartButton";
import { gvkString } from "../../../utils/k8s/gvk";
import Title from "antd/es/typography/Title";
import { mapResponseError } from "../../../utils/api/errors";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { Workload } from "../../../utils/k8s/workload";

interface Props {
  loadResources: boolean;
  resources: any[];
  workloads: Map<string, Workload>;
  onResourceDelete: () => void;
}

const ResourceList = ({
  loadResources,
  resources,
  workloads,
  onResourceDelete,
}: Props) => {
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [manifestModal, setManifestModal] = useState({
    on: false,
    resource: {
      group: "",
      version: "",
      kind: "",
      name: "",
      namespace: "",
    },
    manifest: "",
  });

  const [deleteResourceModal, setDeleteResourceModal] = useState(false);
  const [deleteResourceRef, setDeleteResourceRef] = useState<ResourceRef>({
    group: "",
    version: "",
    kind: "",
    name: "",
    namespace: "",
  });
  const [deleteResourceVerify, setDeleteResourceVerify] = useState("");

  const [showManagedFields, setShowManagedFields] = useState(false);

  const [resourceFilter, setResourceFilter] = useState<string[]>([]);
  const [activeCollapses, setActiveCollapses] = useState(new Map());

  function getWorkload(ref: ResourceRef): Workload | undefined {
    let k = resourceRefKey(ref);
    return workloads.get(k);
  }

  const handleCancelDeleteResource = () => {
    setDeleteResourceModal(false);
    setDeleteResourceRef({
      group: "",
      version: "",
      kind: "",
      name: "",
      namespace: "",
    });
    setDeleteResourceVerify("");
  };

  const deleteResource = () => {
    axios
      .delete(`/api/resources`, {
        data: {
          group: deleteResourceRef.group,
          version: deleteResourceRef.version,
          kind: deleteResourceRef.kind,
          name: deleteResourceRef.name,
          namespace: deleteResourceRef.namespace,
        },
      })
      .then(() => {
        onResourceDelete();
        // setLoadResources(false); TODO
        setDeleteResourceModal(false);
        // fetchModuleResources(); TODO
      })
      .catch((error) => {
        // setLoading(false); TODO
        setError(mapResponseError(error));
      });
  };

  const changeDeleteResourceVerify = (e: any) => {
    setDeleteResourceVerify(e.target.value);
  };

  const onResourceFilterUpdate = (kinds: string[]) => {
    setResourceFilter(kinds);
  };

  const handleCancelManifest = () => {
    setManifestModal({
      ...manifestModal,
      on: false,
    });
  };

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    setShowManagedFields(e.target.checked);
    fetchManifest(
      manifestModal.resource.group,
      manifestModal.resource.version,
      manifestModal.resource.kind,
      manifestModal.resource.namespace,
      manifestModal.resource.name,
      e.target.checked,
    );
  };

  function fetchManifest(
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
    showManagedFields: boolean,
  ) {
    axios
      .get(`/api/manifest`, {
        params: {
          group: group,
          version: version,
          kind: kind,
          name: name,
          namespace: namespace,
          includeManagedFields: showManagedFields,
        },
      })
      .then((res) => {
        setManifestModal((prev) => ({
          ...prev,
          manifest: res.data,
        }));
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }

  const resourceFilterOptions = () => {
    if (!loadResources) {
      return <Spin />;
    }

    let uniqueGVKs = new Set<string>();
    resources.forEach(function (resource: any) {
      uniqueGVKs.add(
        gvkString(resource.group, resource.version, resource.kind),
      );
    });

    let options: any[] = [];
    uniqueGVKs.forEach(function (gvk: string) {
      options.push(
        <Row>
          <Checkbox value={gvk}>{gvk}</Checkbox>
        </Row>,
      );
    });

    return options;
  };

  const resourceFilterPopover = () => {
    return (
      <Checkbox.Group
        style={{ display: "block" }}
        onChange={onResourceFilterUpdate}
        value={resourceFilter}
      >
        {resourceFilterOptions()}
      </Checkbox.Group>
    );
  };

  const getCollapseColor = (fieldName: string) => {
    if (
      activeCollapses.get(fieldName) &&
      activeCollapses.get(fieldName) === true
    ) {
      return "#EFEFEF";
    } else {
      return "#FAFAFA";
    }
  };

  const getCollapseWidth = (fieldName: string) => {
    if (
      activeCollapses.get(fieldName) &&
      activeCollapses.get(fieldName) === true
    ) {
      return "166%";
    } else {
      return "100%";
    }
  };

  const resourceCollapses: {} | any = [];
  resources.forEach((resource: any, index) => {
    let collapseKey =
      resource.kind + "/" + resource.namespace + "/" + resource.name;

    let resourceDetails = <p />;

    let resourceRef: ResourceRef = {
      group: resource.group,
      version: resource.version,
      kind: resource.kind,
      name: resource.name,
      namespace: resource.namespace,
    };

    switch (resource.kind) {
      case "Deployment":
        resourceDetails = (
          <Deployment
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
        break;
      case "CronJob":
        resourceDetails = (
          <CronJob name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "Job":
        resourceDetails = (
          <Job name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "DaemonSet":
        resourceDetails = (
          <DaemonSet
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
        break;
      case "StatefulSet":
        resourceDetails = (
          <StatefulSet
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
        break;
      case "Pod":
        resourceDetails = (
          <Pod name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "Service":
        resourceDetails = (
          <Service name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "ConfigMap":
        resourceDetails = (
          <ConfigMap name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "PersistentVolumeClaim":
        resourceDetails = (
          <PersistentVolumeClaim
            name={resource.name}
            namespace={resource.namespace}
          />
        );
        break;
      case "Secret":
        resourceDetails = (
          <Secret name={resource.name} namespace={resource.namespace} />
        );
        break;
    }

    let deletedWarning = <p />;

    if (resource.deleted) {
      deletedWarning = (
        <Tooltip
          title={"The resource is not a part of the Module and can be deleted"}
          trigger="click"
        >
          <WarningTwoTone
            twoToneColor="#F3801A"
            style={{ right: "0px", fontSize: "30px", paddingRight: "5px" }}
          />
        </Tooltip>
      );
    }

    let deleteButton = <p />;

    if (resource.deleted) {
      deleteButton = (
        <Button
          onClick={function () {
            setDeleteResourceVerify("");
            setDeleteResourceModal(true);
            setDeleteResourceRef({
              group: resource.group,
              version: resource.version,
              kind: resource.kind,
              name: resource.name,
              namespace: resource.namespace,
            });
          }}
          danger
          block
        >
          Delete
        </Button>
      );
    }

    let resourceStatus = resource.status;
    if (isStreamingEnabled() && isWorkload(resourceRef)) {
      resourceStatus = getWorkload(resourceRef)?.status;
    }

    const genExtra = (resource: any, status?: string) => {
      let statusIcon = <></>;
      if (status === "progressing") {
        statusIcon = (
          <ClockCircleTwoTone
            style={{
              paddingLeft: "5px",
              fontSize: "20px",
              verticalAlign: "middle",
            }}
            twoToneColor={"#ffcc00"}
          />
        );
      }
      if (status === "healthy") {
        statusIcon = (
          <CheckCircleTwoTone
            style={{
              paddingLeft: "5px",
              fontSize: "20px",
              verticalAlign: "middle",
            }}
            twoToneColor={"#52c41a"}
          />
        );
      }
      if (status === "unhealthy") {
        statusIcon = (
          <CloseSquareTwoTone
            style={{
              paddingLeft: "5px",
              fontSize: "20px",
              verticalAlign: "middle",
            }}
            twoToneColor={"red"}
          />
        );
      }

      let deletedIcon = <></>;
      if (resource.deleted) {
        deletedIcon = (
          <WarningTwoTone
            twoToneColor="#F3801A"
            style={{
              paddingLeft: "5px",
              fontSize: "20px",
              verticalAlign: "middle",
            }}
          />
        );
      }

      return (
        <Row gutter={[0, 8]}>
          <Col
            span={20}
            style={{
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <h3 style={{ margin: "0" }}>
              {resource.name} {resource.kind} {statusIcon}
            </h3>
          </Col>
          <Col span={4} style={{ display: "flex", justifyContent: "flex-end" }}>
            {deletedIcon}
          </Col>
        </Row>
      );
    };

    const getResourceDisplay = (
      group: string,
      version: string,
      kind: string,
    ): string => {
      if (resourceFilter.length === 0) {
        return "";
      }

      for (let filter of resourceFilter) {
        if (gvkString(group, version, kind) === filter) {
          return "";
        }
      }

      return "none";
    };

    const getStatusColor = (status: string, deleted: boolean) => {
      if (status === "unhealthy") {
        return "#FF0000";
      }

      if (deleted) {
        return "#ff9f1a";
      }

      if (status === "progressing") {
        return "#ffcc00";
      }

      return "#27D507";
    };

    const handleManifestClick = (resource: any) => {
      setManifestModal({
        on: true,
        resource: {
          group: resource.group,
          version: resource.version,
          kind: resource.kind,
          name: resource.name,
          namespace: resource.namespace,
        },
        manifest: "",
      });
      fetchManifest(
        resource.group,
        resource.version,
        resource.kind,
        resource.namespace,
        resource.name,
        showManagedFields,
      );
    };

    resourceCollapses.push(
      <Collapse.Panel
        header={genExtra(resource, resourceStatus)}
        key={collapseKey}
        style={{
          display: getResourceDisplay(
            resource.group,
            resource.version,
            resource.kind,
          ),
          width: getCollapseWidth(collapseKey),
          backgroundColor: getCollapseColor(collapseKey),
          marginBottom: "12px",
          borderRadius: "10px",
          border: "1px solid #E3E3E3",
          borderLeft:
            "solid " +
            getStatusColor(resourceStatus, resource.deleted) +
            " 4px",
        }}
      >
        <Row>
          <Col>{deletedWarning}</Col>
          <Col span={19}>
            <Row>
              <Title style={{ paddingRight: "10px" }} level={3}>
                {resource.name}
              </Title>
            </Row>
          </Col>
          <Col span={4} style={{ display: "flex", justifyContent: "flex-end" }}>
            {deleteButton}
          </Col>
        </Row>
        <Row>
          <Title level={4}>{resource.namespace}</Title>
        </Row>
        <Row gutter={[20, 0]}>
          <Col style={{ float: "right" }}>
            <Button onClick={() => handleManifestClick(resource)} block>
              <FileTextOutlined />
              View Manifest
            </Button>
          </Col>
          {canRestart(resource.group, resource.version, resource.kind) && (
            <Col style={{ float: "right" }}>
              <RestartButton
                group={resource.group}
                version={resource.version}
                kind={resource.kind}
                name={resource.name}
                namespace={resource.namespace}
              />
            </Col>
          )}
        </Row>
        {resourceDetails}
      </Collapse.Panel>,
    );
  });

  const loadingResourceCollapses = () => {
    if (loadResources) {
      return (
        <Collapse
          expandIcon={({ isActive }) => (
            <CaretRightOutlined rotate={isActive ? 90 : 0} />
          )}
          style={{
            width: "60%",
            border: "none",
            backgroundColor: "#FFF",
          }}
          onChange={function (values: string | string[]) {
            let m = new Map();
            for (let value of values) {
              m.set(value, true);
            }

            setActiveCollapses(m);
          }}
        >
          {resourceCollapses}
        </Collapse>
      );
    }

    return <Spin size="large" />;
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
      <Divider
        style={{ fontSize: "120%" }}
        orientationMargin="0"
        orientation={"left"}
      >
        {"Resources  "}
        <Popover
          content={resourceFilterPopover()}
          placement="rightBottom"
          title="Filter resources"
          trigger="click"
        >
          <SearchOutlined />
        </Popover>
      </Divider>
      {loadingResourceCollapses()}
      <Modal
        title="Manifest"
        open={manifestModal.on}
        onOk={handleCancelManifest}
        onCancel={handleCancelManifest}
        cancelButtonProps={{ style: { display: "none" } }}
        width={"70%"}
      >
        <Checkbox onChange={handleCheckboxChange} checked={showManagedFields}>
          Include Managed Fields
        </Checkbox>
        <Divider style={{ marginTop: "12px", marginBottom: "12px" }} />
        <div style={{ position: "relative" }}>
          <ReactAce
            style={{ width: "100%" }}
            mode={"sass"}
            value={manifestModal.manifest}
            readOnly={true}
          />
          <Tooltip title={"Copy Manifest"} trigger="hover">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(manifestModal.manifest);
              }}
              style={{
                position: "absolute",
                right: "20px",
                top: "10px",
              }}
            >
              <CopyOutlined
                style={{
                  fontSize: "20px",
                }}
              />
            </Button>
          </Tooltip>
        </div>
      </Modal>
      <Modal
        title={
          "Delete " +
          deleteResourceRef.kind +
          "/" +
          deleteResourceRef.name +
          " from namespace " +
          deleteResourceRef.namespace
        }
        open={deleteResourceModal}
        onCancel={handleCancelDeleteResource}
        footer={
          <Button
            danger
            block
            disabled={
              deleteResourceVerify !==
              deleteResourceRef.kind + " " + deleteResourceRef.name
            }
            onClick={deleteResource}
          >
            Delete
          </Button>
        }
        width={"40%"}
      >
        <p>
          In order to confirm deleting this resource, type:{" "}
          <code>{deleteResourceRef.kind + " " + deleteResourceRef.name}</code>
        </p>
        <Input
          placeholder={deleteResourceRef.kind + " " + deleteResourceRef.name}
          onChange={changeDeleteResourceVerify}
          value={deleteResourceVerify}
          required
        />
      </Modal>
    </div>
  );
};

export default ResourceList;
