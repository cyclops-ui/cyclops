import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Button,
  Col,
  ConfigProvider,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Popover,
  Radio,
  Row,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import "ace-builds/src-noconflict/ace";
import {
  BookOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseSquareTwoTone,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import "./custom.css";

import "ace-builds/src-noconflict/mode-jsx";
import ReactAce from "react-ace";

import { mapResponseError } from "../../../utils/api/errors";
import ResourceList from "../../k8s-resources/ResourceList/ResourceList";
import { Workload } from "../../../utils/k8s/workload";

import {
  moduleTemplateReferenceView,
  templateRef,
} from "../../../utils/templateRef";
import YAML from "yaml";

import { resourcesStream } from "../../../utils/api/sse/resources";
import {
  isWorkload,
  ResourceRef,
  resourceRefKey,
} from "../../../utils/resourceRef";
import { ResourceListActionsProvider } from "../../k8s-resources/ResourceList/ResourceListActionsContext";

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
  targetNamespace: string;
  template: templateRef;
  iconURL: string;
  gitOpsWrite: {
    repo: string;
    path: string;
    branch: string;
  };
}

export interface ModuleResourceDetailsProps {
  name: string;
  themeColor?: string;
  streamingDisabled: boolean;
  fetchModule: (moduleName: string) => Promise<any>;
  fetchModuleRawManifest: (moduleName: string) => Promise<string>;
  fetchModuleRenderedManifest: (moduleName: string) => Promise<string>;
  reconcileModule: (moduleName: string) => Promise<any>;
  deleteModule: (moduleName: string, deleteMethod?: string) => Promise<any>;
  onDeleteModuleSuccess: (moduleName: string) => void;
  fetchModuleResources: (moduleName: string) => Promise<any[]>;
  fetchResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => () => Promise<any>;
  fetchResourceManifest: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
    includeManagedFields: boolean,
  ) => Promise<string>;
  resourceStreamImplementation?: (
    path: string,
    setResource: (any) => void,
  ) => void;
  restartResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<any>;
  deleteResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<any>;
  getPodLogs: (
    namespace: string,
    name: string,
    container: string,
  ) => Promise<string[]>;
  downloadPodLogs?: (
    namespace: string,
    name: string,
    container: string,
  ) => void;
  streamPodLogs?: (
    namespace: string,
    name: string,
    container: string,
    setLog: (log: string, isReset?: boolean) => void,
    setError: (err: Error, isReset?: boolean) => void,
    signalController: AbortController,
  ) => void;
  onEditModule?: (moduleName: string) => void;
  onRollbackModule?: (moduleName: string) => void;
}

export const ModuleResourceDetails = ({
  name,
  themeColor,
  streamingDisabled,
  fetchModule,
  fetchModuleRawManifest,
  fetchModuleRenderedManifest,
  reconcileModule,
  deleteModule,
  onDeleteModuleSuccess,
  fetchModuleResources,
  fetchResource,
  fetchResourceManifest,
  resourceStreamImplementation,
  restartResource,
  deleteResource,
  getPodLogs,
  downloadPodLogs,
  streamPodLogs,
  onEditModule,
  onRollbackModule,
}: ModuleResourceDetailsProps) => {
  const [loading, setLoading] = useState(false);
  const [loadModule, setLoadModule] = useState(false);
  const [loadResources, setLoadResources] = useState(false);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);

  const [deleteName, setDeleteName] = useState("");
  const [deleteModuleForm] = Form.useForm();

  const [resources, setResources] = useState<any[]>([]);
  const [workloads, setWorkloads] = useState<Map<string, Workload>>(new Map());

  function getWorkload(ref: ResourceRef): Workload | undefined {
    let k = resourceRefKey(ref);

    return workloads.get(k);
  }

  function putWorkload(ref: ResourceRef, workload: Workload) {
    let k = resourceRefKey(ref);

    setWorkloads((prev) => {
      const s = new Map(prev);
      s.set(k, workload);
      return s;
    });
  }

  const [module, setModule] = useState<module>({
    name: "",
    namespace: "",
    targetNamespace: "",
    template: {
      repo: "",
      path: "",
      version: "",
      resolvedVersion: "",
      sourceType: "",
    },
    iconURL: "",
    gitOpsWrite: {
      repo: "",
      path: "",
      branch: "",
    },
  });

  const [loadingRawManifest, setLoadingRawManifest] = useState(false);
  const [viewRawManifest, setViewRawManifest] = useState(false);
  const [rawModuleManifest, setRawModuleManifest] = useState("");

  const [loadingRenderedManifest, setLoadingRenderedManifest] = useState(false);
  const [viewRenderedManifest, setViewRenderedManifest] = useState(false);
  const [renderedManifest, setRenderedManifest] = useState("");

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchModuleResourcesCallback = useCallback(() => {
    fetchModuleResources(name)
      .then((res) => {
        setResources(res);
        setLoadResources(true);
      })
      .catch((error) => {
        setLoading(false);
        setLoadResources(true);
        setError(mapResponseError(error));
      });
  }, [name, fetchModuleResources]);

  useEffect(() => {
    fetchModule(name)
      .then((res) => {
        setModule(res);
        setLoadModule(true);
      })
      .catch((error) => {
        setLoading(false);
        setLoadModule(true);
        setError(mapResponseError(error));
      });

    fetchModuleResourcesCallback();
    const interval = setInterval(() => fetchModuleResourcesCallback(), 10000);
    return () => {
      clearInterval(interval);
    };
  }, [name, fetchModule, fetchModuleResourcesCallback]);

  useEffect(() => {
    if (!streamingDisabled) {
      resourcesStream(
        `/stream/resources/${name}`,
        (r: any) => {
          let resourceRef: ResourceRef = {
            group: r.group,
            version: r.version,
            kind: r.kind,
            name: r.name,
            namespace: r.namespace,
          };

          putWorkload(resourceRef, r);
        },
        resourceStreamImplementation,
      );
    }
  }, [name, streamingDisabled, resourceStreamImplementation]);

  const changeDeleteName = (e: any) => {
    setDeleteName(e.target.value);
  };

  const handleCancel = () => {
    setLoading(false);
  };

  const handleDeleteModule = (deleteModuleValues) => {
    deleteModule(name, deleteModuleValues.method)
      .then(() => {
        onDeleteModuleSuccess(name);
      })
      .catch((error) => {
        setLoading(false);
        setError(mapResponseError(error));
      });
  };

  const getResourcesToDelete = () => {
    let resourcesToDelete: JSX.Element[] = [];

    if (!loadResources) {
      return <Spin />;
    }

    resources.forEach((resource: any) => {
      resourcesToDelete.push(
        <Row>
          {resource.kind}: {resource.namespace} / {resource.name}
        </Row>,
      );
    });

    return resourcesToDelete;
  };

  const isModuleSourceGit = () => {
    return (
      module.gitOpsWrite &&
      typeof module.gitOpsWrite.repo === "string" &&
      module.gitOpsWrite.repo.trim() !== ""
    );
  };

  const selectDeletionMethod = () => {
    if (!isModuleSourceGit()) {
      return <></>;
    }

    return (
      <Form.Item
        name="method"
        style={{ width: "100%", marginBottom: "12px" }}
        rules={[
          {
            required: true,
            message: "Select module deletion method!",
          },
        ]}
        label={
          <div>
            Deletion Method
            <p style={{ color: "#8b8e91", marginBottom: "0px" }}>
              Select how you want to delete this Module.
            </p>
          </div>
        }
      >
        <Radio.Group
          optionType="button"
          style={{
            width: "100%",
            display: "flex",
          }}
        >
          <Popover
            content={
              "Deletes the Module from the cluster directly and doesnt remove the file from Git"
            }
            placement={"topRight"}
          >
            <Radio.Button
              value="cluster"
              style={{
                flex: 1,
                textAlign: "center",
              }}
            >
              In-cluster
            </Radio.Button>
          </Popover>
          <Popover
            content={
              <div>
                <Row>Deletes the Module config file from the git repo:</Row>
                <Row style={{ color: "#777" }}>
                  {module.gitOpsWrite.repo} / {module.gitOpsWrite.path}
                </Row>
              </div>
            }
            placement={"topLeft"}
          >
            <Radio.Button
              value="git"
              style={{
                flex: 1,
                textAlign: "center",
              }}
            >
              Git repo
            </Radio.Button>
          </Popover>
        </Radio.Group>
      </Form.Item>
    );
  };

  const moduleLoading = () => {
    if (!loadModule) {
      return <Spin />;
    }

    return (
      <div>
        <Row gutter={[40, 0]}>
          <Col>
            <Title level={1} style={{ marginTop: "0px" }}>
              {module.iconURL ? (
                <img
                  alt=""
                  style={{ height: "1.5em", marginRight: "8px" }}
                  src={module.iconURL}
                />
              ) : (
                <></>
              )}
              <Tooltip title={"Copy module name to clipboard"} trigger="hover">
                <span
                  onClick={() => navigator.clipboard.writeText(name)}
                  style={{ cursor: "pointer" }}
                >
                  {name}
                </span>
              </Tooltip>
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
            <Tooltip title={"Copy namespace to clipboard"} trigger="hover">
              <span
                style={{ cursor: "pointer" }}
                onClick={() =>
                  navigator.clipboard.writeText(module.targetNamespace)
                }
              >
                {module.targetNamespace}
              </span>
            </Tooltip>
          </Descriptions.Item>
        </Descriptions>
        <Row gutter={[40, 0]} style={{ paddingTop: "8px" }}>
          <Col span={24}>{moduleTemplateReferenceView(module.template)}</Col>
        </Row>
      </div>
    );
  };

  const moduleStatusIcon = () => {
    if (!loadModule || !loadResources) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Spin />
        </div>
      );
    }

    let resourcesWithStatus = 0;
    let status = "";
    for (let i = resources.length - 1; i >= 0; i--) {
      let resource = resources[i] as any;
      if (resource.status === undefined) {
        continue;
      }

      resourcesWithStatus++;

      let resourceStatus = resource.status;
      if (!streamingDisabled && isWorkload(resource)) {
        resourceStatus = getWorkload(resource)?.status;
      }

      if (resourceStatus === "progressing") {
        status = "progressing";
        continue;
      }

      if (resourceStatus === "unhealthy") {
        status = "unhealthy";
        break;
      }
    }

    if (resourcesWithStatus === 0) {
      return <></>;
    }

    if (status === "progressing") {
      return (
        <ClockCircleTwoTone
          style={{
            verticalAlign: "middle",
            height: "100%",
            marginBottom: "4px",
            fontSize: "150%",
          }}
          twoToneColor={"#ffcc00"}
        />
      );
    }

    if (status === "unhealthy") {
      return (
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

    return (
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
  };

  const handleViewRawModuleManifest = () => {
    setLoadingRawManifest(true);
    setViewRawManifest(true);

    fetchModuleRawManifest(name)
      .then((res) => {
        let m = YAML.parse(res);

        if (m.status) {
          delete m.status;
        }
        if (m.metadata) {
          if (m.metadata.creationTimestamp) {
            delete m.metadata.creationTimestamp;
          }

          if (m.metadata.generation) {
            delete m.metadata.generation;
          }

          if (m.metadata.resourceVersion) {
            delete m.metadata.resourceVersion;
          }

          if (m.metadata.uid) {
            delete m.metadata.uid;
          }
        }

        setRawModuleManifest(YAML.stringify(m));
        setLoadingRawManifest(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoadingRawManifest(false);
      });
  };

  const handleViewRenderedManifest = () => {
    setLoadingRenderedManifest(true);
    setViewRenderedManifest(true);

    fetchModuleRenderedManifest(name)
      .then((res) => {
        setRenderedManifest(res);
        setLoadingRenderedManifest(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoadingRenderedManifest(false);
      });
  };

  const submitReconcileModule = () => {
    setLoadingReconciliation(true);

    reconcileModule(name)
      .then((res) => {
        setLoadingReconciliation(false);
        notification.success({
          message: "Reconciliation triggered",
          description: `${name} has been queued for reconciliation. All the resources will be recreated`,
          duration: 10,
        });
      })
      .catch((error) => {
        notification.error({
          message: "Reconciliation triggering failed",
          description: `${mapResponseError(error).description}`,
          duration: 10,
        });
        setLoadingReconciliation(false);
      });
  };

  const moduleManifestContent = (content: string, loading: boolean) => {
    if (loading) {
      return <Spin />;
    }

    return (
      <div>
        <Divider />
        <div style={{ position: "relative" }}>
          <ReactAce
            mode={"sass"}
            theme={"github"}
            fontSize={12}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            readOnly={true}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: false,
              showLineNumbers: true,
              tabSize: 4,
              useWorker: false,
            }}
            style={{
              width: "100%",
            }}
            value={content}
          />
          <Tooltip title={"Copy manifest"} trigger="hover">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(content);
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
      </div>
    );
  };

  return (
    <div>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: themeColor || "#FF8803",
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
            style={{ marginBottom: "20px" }}
          />
        )}
        {moduleLoading()}
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Actions
        </Divider>
        <Row gutter={[20, 0]}>
          {onEditModule ? (
            <Col>
              <Button
                onClick={() => {
                  onEditModule(name);
                }}
                block
              >
                <EditOutlined />
                Edit
              </Button>
            </Col>
          ) : (
            <></>
          )}
          <Col>
            <Button
              onClick={submitReconcileModule}
              block
              loading={loadingReconciliation}
            >
              <UndoOutlined />
              Reconcile
            </Button>
          </Col>
          {onRollbackModule ? (
            <Col>
              <Button onClick={() => onRollbackModule(name)} block>
                <BookOutlined />
                Rollback
              </Button>
            </Col>
          ) : (
            <></>
          )}
          <Col>
            <Button onClick={handleViewRawModuleManifest} block>
              <FileTextOutlined />
              Module manifest
            </Button>
          </Col>
          <Col>
            <Button onClick={handleViewRenderedManifest} block>
              <FileTextOutlined />
              Rendered manifest
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
              <DeleteOutlined />
              Delete
            </Button>
          </Col>
        </Row>
        <ResourceListActionsProvider
          streamingDisabled={streamingDisabled}
          fetchResource={fetchResource}
          fetchResourceManifest={fetchResourceManifest}
          resourceStreamImplementation={resourceStreamImplementation}
          restartResource={restartResource}
          deleteResource={deleteResource}
          getPodLogs={getPodLogs}
          downloadPodLogs={downloadPodLogs}
          streamPodLogs={streamPodLogs}
        >
          <ResourceList
            loadResources={loadResources}
            resources={resources}
            workloads={workloads}
            onResourceDelete={() => {
              setLoadResources(false);
              fetchModuleResourcesCallback();
            }}
          />
        </ResourceListActionsProvider>
        <Modal
          title={
            <>
              Delete module <span style={{ color: "red" }}>{name}</span>
            </>
          }
          open={loading}
          onCancel={handleCancel}
          width={"40%"}
          footer={
            <Button
              danger
              block
              disabled={deleteName !== name}
              onClick={() => {
                console.log("delte button hamndler");
                deleteModuleForm.submit();
              }}
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
          <Form
            form={deleteModuleForm}
            onFinish={handleDeleteModule}
            layout={"vertical"}
          >
            {getResourcesToDelete()}
            <Divider style={{ fontSize: "120%" }} orientationMargin="0" />
            {selectDeletionMethod()}
            <Form.Item
              name="deleteModuleName"
              label={
                "In order to delete this module and related resources, type the name of the module in the box below"
              }
            >
              <Input placeholder={name} required onChange={changeDeleteName} />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="Module manifest"
          open={viewRawManifest}
          onOk={() => setViewRawManifest(false)}
          onCancel={() => setViewRawManifest(false)}
          cancelButtonProps={{ style: { display: "none" } }}
          width={"70%"}
        >
          {moduleManifestContent(rawModuleManifest, loadingRawManifest)}
        </Modal>
        <Modal
          title="Rendered manifest"
          open={viewRenderedManifest}
          onOk={() => setViewRenderedManifest(false)}
          onCancel={() => setViewRenderedManifest(false)}
          cancelButtonProps={{ style: { display: "none" } }}
          width={"70%"}
        >
          {moduleManifestContent(renderedManifest, loadingRenderedManifest)}
        </Modal>
      </ConfigProvider>
    </div>
  );
};
