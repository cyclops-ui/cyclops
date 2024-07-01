import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Input,
  Modal,
  Popover,
  Row,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import "ace-builds/src-noconflict/ace";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  CaretRightOutlined,
  CheckCircleTwoTone,
  CloseSquareTwoTone,
  SearchOutlined,
  WarningTwoTone,
} from "@ant-design/icons";
import "./custom.css";

import "ace-builds/src-noconflict/mode-jsx";
import ReactAce from "react-ace";
import Deployment from "../k8s-resources/Deployment";
import CronJob from "../k8s-resources/CronJob";
import DaemonSet from "../k8s-resources/DaemonSet";
import StatefulSet from "../k8s-resources/StatefulSet";
import Pod from "../k8s-resources/Pod";
import Service from "../k8s-resources/Service";
import ConfigMap from "../k8s-resources/ConfigMap";
import PersistentVolumeClaim from "../k8s-resources/PersistentVolumeClaim";

import {
  moduleTemplateReferenceView,
  templateRef,
} from "../../utils/templateRef";
import { gvkString } from "../../utils/k8s/gvk";
import { mapResponseError } from "../../utils/api/errors";
import Secret from "../k8s-resources/Secret";
const languages = [
  "javascript",
  "java",
  "python",
  "xml",
  "ruby",
  "sass",
  "markdown",
  "mysql",
  "json",
  "html",
  "handlebars",
  "golang",
  "csharp",
  "elixir",
  "typescript",
  "css",
];

const themes = [
  "monokai",
  "github",
  "tomorrow",
  "kuroir",
  "twilight",
  "xcode",
  "textmate",
  "solarized_dark",
  "solarized_light",
  "terminal",
];

languages.forEach((lang) => {
  require(`ace-builds/src-noconflict/mode-${lang}`);
  require(`ace-builds/src-noconflict/snippets/${lang}`);
});
themes.forEach((theme) => require(`ace-builds/src-noconflict/theme-${theme}`));

const { Title } = Typography;

interface module {
  name: string;
  namespace: string;
  template: templateRef;
}

interface resourceRef {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
}

const ModuleDetails = () => {
  const [manifestModal, setManifestModal] = useState({
    on: false,
    manifest: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadModule, setLoadModule] = useState(false);
  const [loadResources, setLoadResources] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [deleteResourceVerify, setDeleteResourceVerify] = useState("");
  const [resources, setResources] = useState([]);
  const [module, setModule] = useState<module>({
    name: "",
    namespace: "",
    template: {
      repo: "",
      path: "",
      version: "",
      resolvedVersion: "",
    },
  });

  const [deleteResourceModal, setDeleteResourceModal] = useState(false);
  const [deleteResourceRef, setDeleteResourceRef] = useState<resourceRef>({
    group: "",
    version: "",
    kind: "",
    name: "",
    namespace: "",
  });

  const [resourceFilter, setResourceFilter] = useState<string[]>([]);

  const [activeCollapses, setActiveCollapses] = useState(new Map());

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  let { moduleName } = useParams();

  function fetchManifest(
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) {
    axios
      .get(`/api/manifest`, {
        params: {
          group: group,
          version: version,
          kind: kind,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setManifestModal({
          on: true,
          manifest: res.data,
        });
      })
      .catch((error) => {
        setLoading(false);
        setLoadModule(true);
        setError(mapResponseError(error));
      });
  }

  function fetchModule() {
    axios
      .get(`/api/modules/` + moduleName)
      .then((res) => {
        setModule(res.data);
        setLoadModule(true);
      })
      .catch((error) => {
        setLoading(false);
        setLoadModule(true);
        setError(mapResponseError(error));
      });
  }

  function fetchModuleResources() {
    axios
      .get(`/api/modules/` + moduleName + `/resources`)
      .then((res) => {
        setResources(res.data);
        setLoadResources(true);
      })
      .catch((error) => {
        setLoading(false);
        setLoadResources(true);
        setError(mapResponseError(error));
      });
  }

  useEffect(() => {
    fetchModule();
    fetchModuleResources();
    const interval = setInterval(() => fetchModuleResources(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const getCollapseColor = (fieldName: string) => {
    if (
      activeCollapses.get(fieldName) &&
      activeCollapses.get(fieldName) === true
    ) {
      return "#E3E3E3";
    } else {
      return "#F3F3F3";
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

  const changeDeleteName = (e: any) => {
    setDeleteName(e.target.value);
  };

  const changeDeleteResourceVerify = (e: any) => {
    setDeleteResourceVerify(e.target.value);
  };

  const handleCancelManifest = () => {
    setManifestModal({
      on: false,
      manifest: "",
    });
  };

  const handleCancelDeleteResource = () => {
    setDeleteResourceModal(false);
    setDeleteResourceRef({
      group: "",
      version: "",
      kind: "",
      name: "",
      namespace: "",
    });
  };

  const handleCancel = () => {
    setLoading(false);
  };

  const deleteDeployment = () => {
    axios
      .delete(`/api/modules/` + moduleName)
      .then(() => {
        window.location.href = "/modules";
      })
      .catch((error) => {
        setLoading(false);
        setError(mapResponseError(error));
      });
  };

  const getResourcesToDelete = () => {
    let resourcesToDelete: JSX.Element[] = [];

    resources.forEach((resource: any) => {
      resourcesToDelete.push(
        <Row>
          {resource.kind}: {resource.namespace} / {resource.name}
        </Row>,
      );
    });

    return resourcesToDelete;
  };

  const resourceCollapses: {} | any = [];

  const genExtra = (resource: any, status?: string) => {
    let statusIcon = <></>;
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

  resources.forEach((resource: any, index) => {
    let collapseKey =
      resource.kind + "/" + resource.namespace + "/" + resource.name;
    let statusIcon = <p />;

    let resourceDetails = <p />;

    switch (resource.kind) {
      case "Deployment":
        resourceDetails = (
          <Deployment name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "CronJob":
        resourceDetails = (
          <CronJob name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "DaemonSet":
        resourceDetails = (
          <DaemonSet name={resource.name} namespace={resource.namespace} />
        );
        break;
      case "StatefulSet":
        resourceDetails = (
          <StatefulSet name={resource.name} namespace={resource.namespace} />
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

    if (resource.status === "healthy") {
      statusIcon = (
        <CheckCircleTwoTone
          style={{ fontSize: "200%", verticalAlign: "middle" }}
          twoToneColor={"#52c41a"}
        />
      );
    }

    if (resource.status === "unhealthy") {
      statusIcon = (
        <CloseSquareTwoTone
          style={{ fontSize: "200%", verticalAlign: "middle" }}
          twoToneColor={"red"}
        />
      );
    }
    resourceCollapses.push(
      <Collapse.Panel
        header={genExtra(resource, resource.status)}
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
        }}
      >
        <Row>
          <Col>{deletedWarning}</Col>
          <Col span={19}>
            <Row>
              <Title style={{ paddingRight: "10px" }} level={3}>
                {resource.name}
              </Title>
              {statusIcon}
            </Row>
          </Col>
          <Col span={4} style={{ display: "flex", justifyContent: "flex-end" }}>
            {deleteButton}
          </Col>
        </Row>
        <Row>
          <Title level={4}>{resource.namespace}</Title>
        </Row>
        <Row>
          <Col style={{ float: "right" }}>
            <Button
              onClick={function () {
                fetchManifest(
                  resource.group,
                  resource.version,
                  resource.kind,
                  resource.namespace,
                  resource.name,
                );
              }}
              block
            >
              View Manifest
            </Button>
          </Col>
        </Row>
        {resourceDetails}
      </Collapse.Panel>,
    );
  });

  const resourcesLoading = () => {
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
    } else {
      return <Spin size="large" />;
    }
  };

  const moduleLoading = () => {
    if (loadModule) {
      return (
        <div>
          <Row gutter={[40, 0]}>
            <Col span={9}>
              <Title level={1}>
                <img
                  style={{ height: "1.5em", marginRight: "8px" }}
                  src={
                    "https://bitnami.com/assets/stacks/rabbitmq/img/rabbitmq-stack-220x234.png"
                  }
                />
                {module.name}
              </Title>
            </Col>
          </Row>
          <Descriptions
            column={1}
            colon={false}
            style={{ border: "0px" }}
            labelStyle={{
              color: "#737373",
              fontSize: "24px",
              fontWeight: "550",
            }}
          >
            <Descriptions.Item
              style={{ paddingBottom: "0" }}
              key={"status"}
              label={"status"}
              contentStyle={{
                fontSize: "150%",
              }}
            >
              {moduleStatusIcon()}
            </Descriptions.Item>
            <Descriptions.Item
              key={"namespace"}
              label={"namespace"}
              contentStyle={{
                fontSize: "24px",
                fontWeight: "550",
              }}
            >
              {module.namespace}
            </Descriptions.Item>
          </Descriptions>
          <Row gutter={[40, 0]} style={{ paddingTop: "8px" }}>
            <Col span={24}>{moduleTemplateReferenceView(module.template)}</Col>
          </Row>
        </div>
      );
    } else {
      return <Spin />;
    }
  };

  const moduleStatusIcon = () => {
    let resourcesWithStatus = 0;
    let status = true;
    for (let i = resources.length - 1; i >= 0; i--) {
      let resource = resources[i] as any;
      if (resource.status === undefined) {
        continue;
      }

      resourcesWithStatus++;

      if (resource.status === "unhealthy") {
        status = false;
        break;
      }
    }

    if (resourcesWithStatus === 0) {
      return <></>;
    }

    let statusIcon = <></>;
    if (status) {
      statusIcon = (
        <CheckCircleTwoTone
          style={{
            verticalAlign: "middle",
            height: "100%",
            marginBottom: "4px",
            fontSize: "150%",
          }}
          twoToneColor={"#52c41a"}
        />
      );
    }
    if (!status) {
      statusIcon = (
        <CloseSquareTwoTone
          style={{
            verticalAlign: "middle",
            height: "100%",
            marginBottom: "4px",
            fontSize: "150%",
          }}
          twoToneColor={"red"}
        />
      );
    }

    return statusIcon;
  };

  const deleteResource = () => {
    axios
      .delete(`/api/modules/` + moduleName + `/resources`, {
        data: {
          group: deleteResourceRef.group,
          version: deleteResourceRef.version,
          kind: deleteResourceRef.kind,
          name: deleteResourceRef.name,
          namespace: deleteResourceRef.namespace,
        },
      })
      .then(() => {
        setLoadResources(false);
        setDeleteResourceModal(false);
        fetchModuleResources();
      })
      .catch((error) => {
        setLoading(false);
        setError(mapResponseError(error));
      });
  };

  const onResourceFilterUpdate = (kinds: string[]) => {
    setResourceFilter(kinds);
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
      {moduleLoading()}
      <Row>
        <Title></Title>
      </Row>
      <Divider
        style={{ fontSize: "120%" }}
        orientationMargin="0"
        orientation={"left"}
      >
        Actions
      </Divider>
      <Row gutter={[40, 0]}>
        <Col>
          <Button
            onClick={function () {
              window.location.href = "/modules/" + moduleName + "/edit";
            }}
            block
          >
            Edit
          </Button>
        </Col>
        <Col>
          <Button
            onClick={function () {
              window.location.href = "/modules/" + moduleName + "/rollback";
            }}
            block
          >
            Rollback
          </Button>
        </Col>
        <Col>
          <Button
            onClick={function () {
              setLoading(true);
            }}
            danger
            block
            loading={loading}
          >
            Delete
          </Button>
        </Col>
      </Row>
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
          {/*<Button>Click me</Button>*/}
          <SearchOutlined />
        </Popover>
      </Divider>
      {resourcesLoading()}
      <Modal
        title="Delete module"
        open={loading}
        onCancel={handleCancel}
        width={"40%"}
        footer={
          <Button
            danger
            block
            disabled={deleteName !== moduleName}
            onClick={deleteDeployment}
          >
            Delete
          </Button>
        }
      >
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Child resources
        </Divider>
        {getResourcesToDelete()}
        <Divider style={{ fontSize: "120%" }} orientationMargin="0" />
        In order to delete this module and related resources, type the name of
        the module in the box below
        <Input placeholder={moduleName} required onChange={changeDeleteName} />
      </Modal>
      <Modal
        title="Manifest"
        open={manifestModal.on}
        onOk={handleCancelManifest}
        onCancel={handleCancelManifest}
        cancelButtonProps={{ style: { display: "none" } }}
        width={"40%"}
      >
        <ReactAce
          style={{ width: "100%" }}
          mode={"sass"}
          value={manifestModal.manifest}
          readOnly={true}
        />
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
          required
        />
      </Modal>
    </div>
  );
};

export default ModuleDetails;
