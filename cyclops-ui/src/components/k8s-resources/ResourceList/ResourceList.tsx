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
import ClusterRole from "../ClusterRole";
import Role from "../Role";
import ConfigMap from "../ConfigMap";
import PersistentVolumeClaim from "../PersistentVolumeClaim";
import Secret from "../Secret";
import NetworkPolicy from "../NetworkPolicy";

import {
  CaretRightOutlined,
  CopyOutlined,
  FileTextOutlined,
  FilterOutlined,
  WarningTwoTone,
} from "@ant-design/icons";
import { canRestart, RestartButton } from "../common/RestartButton";
import { gvkString } from "../../../utils/k8s/gvk";
import Title from "antd/es/typography/Title";
import { mapResponseError } from "../../../utils/api/errors";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { Workload } from "../../../utils/k8s/workload";
import { useResourceListActions } from "./ResourceListActionsContext";
import { useTheme } from "../../theme/ThemeContext";
import {
  SuccessIcon,
  PendingIcon,
  ErrorIcon,
  WarningIcon,
} from "../../status/icons";

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
  const {
    streamingDisabled,
    fetchResourceManifest,
    restartResource,
    deleteResource,
  } = useResourceListActions();

  const { mode } = useTheme();

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

  const handleDeleteResource = () => {
    deleteResource(
      deleteResourceRef.group,
      deleteResourceRef.version,
      deleteResourceRef.kind,
      deleteResourceRef.namespace,
      deleteResourceRef.name,
    )
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

  const fetchManifest = (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
    showManagedFields: boolean,
  ) => {
    fetchResourceManifest(
      group,
      version,
      kind,
      namespace,
      name,
      showManagedFields,
    )
      .then((res) => {
        setManifestModal((prev) => ({
          ...prev,
          manifest: res,
        }));
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  };

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
      if (mode === "dark") {
        return "#282828";
      }
      return "#EFEFEF";
    } else {
      if (mode === "dark") {
        return "#1a1a1a";
      }
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

    switch (true) {
      case resource.group === "apps" &&
        resource.version === "v1" &&
        resource.kind === "Deployment":
        resourceDetails = (
          <Deployment
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
        break;
      case resource.group === "batch" &&
        resource.version === "v1" &&
        resource.kind === "CronJob":
        resourceDetails = (
          <CronJob name={resource.name} namespace={resource.namespace} />
        );
        break;
      case resource.group === "batch" &&
        resource.version === "v1" &&
        resource.kind === "Job":
        resourceDetails = (
          <Job name={resource.name} namespace={resource.namespace} />
        );
        break;
      case resource.group === "apps" &&
        resource.version === "v1" &&
        resource.kind === "DaemonSet":
        resourceDetails = (
          <DaemonSet
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
        break;
      case resource.group === "apps" &&
        resource.version === "v1" &&
        resource.kind === "StatefulSet":
        resourceDetails = (
          <StatefulSet
            name={resource.name}
            namespace={resource.namespace}
            workload={getWorkload(resourceRef)}
          />
        );
        break;
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "Pod":
        resourceDetails = (
          <Pod name={resource.name} namespace={resource.namespace} />
        );
        break;
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "Service":
        resourceDetails = (
          <Service name={resource.name} namespace={resource.namespace} />
        );
        break;
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "ConfigMap":
        resourceDetails = (
          <ConfigMap name={resource.name} namespace={resource.namespace} />
        );
        break;
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "PersistentVolumeClaim":
        resourceDetails = (
          <PersistentVolumeClaim
            name={resource.name}
            namespace={resource.namespace}
          />
        );
        break;
      case resource.group === "" &&
        resource.version === "v1" &&
        resource.kind === "Secret":
        resourceDetails = (
          <Secret name={resource.name} namespace={resource.namespace} />
        );
        break;
      case resource.group === "rbac.authorization.k8s.io" &&
        resource.version === "v1" &&
        resource.kind === "ClusterRole":
        resourceDetails = <ClusterRole name={resource.name} />;
        break;
      case resource.group === "rbac.authorization.k8s.io" &&
        resource.version === "v1" &&
        resource.kind === "Role":
        resourceDetails = (
          <Role name={resource.name} namespace={resource.namespace} />
        );
        break;
      case resource.group === "networking.k8s.io" &&
        resource.version === "v1" &&
        resource.kind === "NetworkPolicy":
        resourceDetails = (
          <NetworkPolicy namespace={resource.namespace} name={resource.name} />
        );
        break;
    }

    let deletedWarning = <p />;

    if (resource.deleted) {
      deletedWarning = (
        <Tooltip
          title={"The resource is not a part of the Module and can be deleted"}
          trigger="hover"
        >
          <WarningTwoTone
            style={{ right: "0px", fontSize: "30px", paddingRight: "5px" }}
            twoToneColor={mode === "light" ? "#F3801A" : ["#F3801A", "#4a2607"]}
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
    if (!streamingDisabled && isWorkload(resourceRef)) {
      resourceStatus = getWorkload(resourceRef)?.status;
    }

    const genExtra = (resource: any, status?: string) => {
      let statusIcon = <></>;
      if (status === "progressing") {
        statusIcon = (
          <PendingIcon
            style={{
              paddingLeft: "5px",
              fontSize: "20px",
              verticalAlign: "middle",
            }}
          />
        );
      }
      if (status === "healthy") {
        statusIcon = (
          <SuccessIcon
            style={{
              paddingLeft: "5px",
              fontSize: "20px",
              verticalAlign: "middle",
            }}
          />
        );
      }
      if (status === "unhealthy") {
        statusIcon = (
          <ErrorIcon
            style={{
              paddingLeft: "5px",
              fontSize: "20px",
              verticalAlign: "middle",
            }}
          />
        );
      }

      let deletedIcon = <></>;
      if (resource.deleted) {
        deletedIcon = (
          <WarningIcon
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

    if (resource.missing) {
      resourceCollapses.push(
        <Collapse.Panel
          header={
            <Tooltip
              title={
                "The resource is missing from the cluster. Reconcile Module to recreate it."
              }
              trigger="hover"
              placement={"right"}
            >
              {genExtra(resource, resourceStatus)}
            </Tooltip>
          }
          key={collapseKey}
          collapsible={"disabled"}
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
            borderStyle: "dashed",
            borderColor: mode === "light" ? "#E3E3E3" : "#444",
            borderWidth: "1px",
          }}
        />,
      );
      return;
    }

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
          borderStyle: "solid",
          borderTopColor: mode === "light" ? "#E3E3E3" : "#444",
          borderRightColor: mode === "light" ? "#E3E3E3" : "#444",
          borderBottomColor: mode === "light" ? "#E3E3E3" : "#444",
          borderLeftStyle: "solid",
          borderLeftColor: getStatusColor(resourceStatus, resource.deleted),
          borderWidth: "1px",
          borderLeftWidth: "4px",
        }}
      >
        <Row>
          <Col>{deletedWarning}</Col>
          <Col span={19}>
            <Row>
              <Title
                level={3}
                style={{
                  paddingRight: "10px",
                  marginTop: "0px",
                  marginBottom: "10px",
                  color: mode === "dark" ? "#fff" : "#000",
                }}
              >
                {resource.name}
              </Title>
            </Row>
          </Col>
          <Col span={4} style={{ display: "flex", justifyContent: "flex-end" }}>
            {deleteButton}
          </Col>
        </Row>
        <Row>
          <Title
            level={4}
            style={{
              marginTop: "0px",
              marginBottom: "10px",
              color: mode === "dark" ? "#fff" : "#000",
            }}
          >
            {resource.namespace}
          </Title>
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
                restartResource={restartResource}
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
            backgroundColor: "transparent",
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
        <Popover
          content={resourceFilterPopover()}
          placement="rightBottom"
          title="Filter resources"
          trigger="click"
        >
          <span style={{ cursor: "pointer" }}>
            Resources
            <FilterOutlined style={{ paddingLeft: "8px" }} />
          </span>
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
            theme={mode === "light" ? "github" : "twilight"}
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
            onClick={handleDeleteResource}
          >
            Delete
          </Button>
        }
        width={"40%"}
      >
        <p>
          In order to confirm deleting this resource, type:{" "}
          <pre>{deleteResourceRef.kind + " " + deleteResourceRef.name}</pre>
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
