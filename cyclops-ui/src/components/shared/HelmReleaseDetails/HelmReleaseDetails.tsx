import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Form,
  FormInstance,
  Input,
  Modal,
  Row,
  Spin,
  Typography,
} from "antd";
import "ace-builds/src-noconflict/ace";
import {
  DeleteOutlined,
  EditOutlined,
  RocketOutlined,
} from "@ant-design/icons";

import "ace-builds/src-noconflict/mode-jsx";

import { mapResponseError } from "../../../utils/api/errors";
import ResourceList from "../../k8s-resources/ResourceList/ResourceList";
import { Workload } from "../../../utils/k8s/workload";

import helmLogo from "../../../static/img/helm.png";
import { ResourceRef, resourceRefKey } from "../../../utils/resourceRef";
import { isStreamingEnabled } from "../../../utils/api/common";
import { resourcesStream } from "../../../utils/api/sse/resources";
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

interface chartSource {
  repo: string;
  path: string;
  version: string;
  full: string;
}

interface release {
  name: string;
  namespace: string;
  manifest: string;
  chart: string;
  version: string;
  sources: chartSource[];
}

interface HelmReleaseDetailsProps {
  releaseName: string;
  releaseNamespace: string;
  streamingDisabled: boolean;
  getRelease: (releaseNamespace: string, releaseName: string) => Promise<any>;
  uninstallRelease: (
    releaseNamespace: string,
    releaseName: string,
  ) => Promise<any>;
  onUninstallReleaseSuccess: (
    releaseNamespace: string,
    releaseName: string,
  ) => void;
  fetchHelmReleaseResources: (
    releaseNamespace: string,
    releaseName: string,
  ) => Promise<any[]>;
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
  ) => Promise<boolean>;
  deleteResource: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<boolean>;
  getPodLogs?: (
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
  getTemplate: (
    repo: string,
    path: string,
    version: string,
    sourceType: string,
  ) => Promise<any>;
}

export const HelmReleaseDetails = ({
  releaseName,
  releaseNamespace,
  streamingDisabled,
  getRelease,
  uninstallRelease,
  onUninstallReleaseSuccess,
  fetchHelmReleaseResources,
  fetchResource,
  fetchResourceManifest,
  resourceStreamImplementation,
  restartResource,
  deleteResource,
  getPodLogs,
  downloadPodLogs,
  streamPodLogs,
  getTemplate,
}: HelmReleaseDetailsProps) => {
  const [loading, setLoading] = useState(false);
  const [loadModule, setLoadModule] = useState(false);

  const [release, setRelease] = useState<release>({
    name: "",
    namespace: "",
    manifest: "",
    chart: "",
    version: "",
    sources: [],
  });

  const [confirmUninstall, setConfirmUninstall] = useState(false);
  const [confirmUninstallInput, setConfirmUninstallInput] = useState("");

  const [resources, setResources] = useState<any[]>([]);
  const [loadResources, setLoadResources] = useState(false);
  const [workloads, setWorkloads] = useState<Map<string, Workload>>(new Map());

  const [templateMigrationModal, setTemplateMigrationModal] = useState(false);
  const [templateMigrationModalLoading, setTemplateMigrationModalLoading] =
    useState(false);
  const [migrateTemplateRefForm] = Form.useForm();

  function putWorkload(ref: ResourceRef, workload: Workload) {
    let k = resourceRefKey(ref);

    setWorkloads((prev) => {
      const s = new Map(prev);
      s.set(k, workload);
      return s;
    });
  }

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [migrationTemplateError, setMigrationTemplateError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchRelease() {
      getRelease(releaseNamespace, releaseName)
        .then((res) => {
          setRelease(res);
          setLoadModule(true);
        })
        .catch((error) => {
          setLoading(false);
          setLoadModule(true);
          setError(mapResponseError(error));
        });
    }

    fetchRelease();
  }, [getRelease, releaseNamespace, releaseName]);

  const fetchReleaseResources = useCallback(() => {
    fetchHelmReleaseResources(releaseNamespace, releaseName)
      .then((res) => {
        setResources(res);
        setLoadResources(true);
      })
      .catch((error) => {
        setLoading(false);
        setLoadResources(true);
        setError(mapResponseError(error));
      });
  }, [fetchHelmReleaseResources, releaseNamespace, releaseName]);

  useEffect(() => {
    fetchReleaseResources();
    const interval = setInterval(() => fetchReleaseResources(), 10000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchReleaseResources]);

  useEffect(() => {
    if (isStreamingEnabled()) {
      resourcesStream(
        `/stream/releases/${releaseNamespace}/${releaseName}/resources`,
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
  }, [releaseNamespace, releaseName, resourceStreamImplementation]);

  const resourceLoading = () => {
    if (!loadModule) {
      return <Spin />;
    }

    return (
      <div>
        <Row gutter={[40, 0]}>
          <Col>
            <Title level={1}>
              <img
                alt=""
                style={{ height: "1.5em", marginRight: "8px" }}
                src={helmLogo}
              />
              {releaseName}
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
            key={"chart"}
            label={"chart "}
            contentStyle={{
              fontSize: "24px",
              fontWeight: "550",
            }}
          >
            {release.chart}:{release.version}
          </Descriptions.Item>
          <Descriptions.Item
            key={"namespace"}
            label={"namespace"}
            contentStyle={{
              fontSize: "24px",
              fontWeight: "550",
            }}
          >
            {release.namespace}
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  const handleUninstallRelease = () => {
    uninstallRelease(releaseNamespace, releaseName)
      .then(() => {
        onUninstallReleaseSuccess(releaseNamespace, releaseName);
      })
      .catch((error) => {
        setLoading(false);
        setError(mapResponseError(error));
      });
  };

  const handleSubmitMigrateModal = async () => {
    try {
      await migrateTemplateRefForm.validateFields();
    } catch (error) {
      return;
    }

    // setTemplateMigrationModal(false);
    setTemplateMigrationModalLoading(true);
    const templateRef = migrateTemplateRefForm.getFieldsValue();

    getTemplate(
      templateRef["repo"],
      templateRef["path"],
      templateRef["version"],
      "",
    )
      .then(() => {
        setTemplateMigrationModalLoading(false);
        window.location.href = `/helm/releases/${releaseNamespace}/${releaseName}/migrate?repo=${encodeURIComponent(templateRef["repo"])}&path=${encodeURIComponent(templateRef["path"])}&version=${encodeURIComponent(templateRef["version"])}`;
      })
      .catch((e) => {
        setMigrationTemplateError(mapResponseError(e));
        setTemplateMigrationModalLoading(false);
      });
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
      {resourceLoading()}
      <Row gutter={[12, 0]}>
        <Col>
          <Button
            onClick={() => {
              setTemplateMigrationModal(true);
            }}
            type={"primary"}
            block
          >
            <RocketOutlined />
            Migrate to Cyclops Module
          </Button>
        </Col>
        <Col>
          <Button
            onClick={() => {
              window.location.href = `/helm/releases/${releaseNamespace}/${releaseName}/edit`;
            }}
            block
          >
            <EditOutlined />
            Edit release
          </Button>
        </Col>
        <Col>
          <Button
            onClick={function () {
              setConfirmUninstall(true);
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
            fetchReleaseResources();
          }}
        />
      </ResourceListActionsProvider>
      <Modal
        title="Migrate to a Cyclops Module"
        open={templateMigrationModal}
        onCancel={() => {
          setTemplateMigrationModal(false);
        }}
        onOk={handleSubmitMigrateModal}
        confirmLoading={templateMigrationModalLoading}
        width={"60%"}
      >
        {migrationTemplateError.message.length !== 0 && (
          <Alert
            message={migrationTemplateError.message}
            description={migrationTemplateError.description}
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
        <Row style={{ paddingBottom: "8px" }}>
          Select the Helm chart you want to use for the Module (cannot be
          inferred from the Helm release)
        </Row>
        <Row>
          <HelmReleaseMigrationTemplateModal
            migrateTemplateRefForm={migrateTemplateRefForm}
          />
        </Row>
        <Row style={{ paddingTop: "8px", paddingBottom: "8px", color: "#888" }}>
          {templateMigrationModalLoading ? "Verifying template..." : ""}
        </Row>
      </Modal>
      <Modal
        title={
          <>
            Uninstall release{" "}
            <span style={{ color: "red" }}>
              {releaseNamespace}/{releaseName}
            </span>
          </>
        }
        open={confirmUninstall}
        onCancel={() => {
          setConfirmUninstall(false);
        }}
        width={"40%"}
        footer={
          <Button
            danger
            block
            disabled={confirmUninstallInput !== releaseName}
            onClick={handleUninstallRelease}
          >
            Delete
          </Button>
        }
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
        In order to uninstall this release and related resources, type the name
        of the release below
        <Input
          style={{ marginTop: "12px" }}
          placeholder={releaseName}
          required
          onChange={(e) => {
            setConfirmUninstallInput(e.target.value);
          }}
        />
      </Modal>
    </div>
  );
};

interface HelmReleaseMigrationTemplateModalProps {
  migrateTemplateRefForm: FormInstance;
}

export const HelmReleaseMigrationTemplateModal = ({
  migrateTemplateRefForm,
}: HelmReleaseMigrationTemplateModalProps) => {
  return (
    <Form
      form={migrateTemplateRefForm}
      layout="inline"
      autoComplete={"off"}
      // onFinish={handleSubmitMigrationTemplate}
      // onFinishFailed={onFinishFailed}
      style={{ width: "100%" }}
      requiredMark={(label, { required }) => (
        <Row>
          <Col>
            {required ? (
              <span style={{ color: "red", paddingRight: "3px" }}>*</span>
            ) : (
              <></>
            )}
          </Col>
          <Col>{label}</Col>
        </Row>
      )}
    >
      <Form.Item
        name={"repo"}
        rules={[{ required: true, message: "Provide template repo URL" }]}
        style={{ width: "50%", marginRight: "0" }}
      >
        <Input placeholder={"Repository"} />
      </Form.Item>
      <div
        style={{
          width: "2%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        /
      </div>
      <Form.Item
        name={"path"}
        rules={[{ required: true, message: "Provide template path" }]}
        style={{ width: "25%", marginRight: "0" }}
      >
        <Input placeholder={"Path"} />
      </Form.Item>
      <div
        style={{
          width: "2%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        @
      </div>
      <Form.Item
        name={"version"}
        rules={[{ required: true, message: "Provide template version" }]}
        style={{ width: "20%", marginRight: "0" }}
      >
        <Input placeholder={"Version"} />
      </Form.Item>
    </Form>
  );
};
