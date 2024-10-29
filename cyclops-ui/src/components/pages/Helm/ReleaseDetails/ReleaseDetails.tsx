import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Input,
  Modal,
  Row,
  Spin,
  Tooltip,
  Typography,
} from "antd";
import "ace-builds/src-noconflict/ace";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  DeleteOutlined,
  EditOutlined,
  RocketOutlined,
} from "@ant-design/icons";

import "ace-builds/src-noconflict/mode-jsx";

import { mapResponseError } from "../../../../utils/api/errors";
import ResourceList from "../../../k8s-resources/ResourceList/ResourceList";
import { Workload } from "../../../../utils/k8s/workload";

import helmLogo from "../../../../static/img/helm.png";
import { ResourceRef, resourceRefKey } from "../../../../utils/resourceRef";
import { isStreamingEnabled } from "../../../../utils/api/common";
import { resourcesStream } from "../../../../utils/api/sse/resources";

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

const ReleaseDetails = () => {
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

  let { releaseNamespace, releaseName } = useParams();

  useEffect(() => {
    function fetchRelease() {
      axios
        .get(`/api/helm/releases/` + releaseNamespace + "/" + releaseName)
        .then((res) => {
          setRelease(res.data);
          setLoadModule(true);
        })
        .catch((error) => {
          setLoading(false);
          setLoadModule(true);
          setError(mapResponseError(error));
        });
    }

    fetchRelease();
  }, [releaseNamespace, releaseName]);

  const fetchReleaseResources = useCallback(() => {
    axios
      .get(
        `/api/helm/releases/` +
          releaseNamespace +
          `/` +
          releaseName +
          `/resources`,
      )
      .then((res) => {
        setResources(res.data);
        setLoadResources(true);
      })
      .catch((error) => {
        setLoading(false);
        setLoadResources(true);
        setError(mapResponseError(error));
      });
  }, [releaseNamespace, releaseName]);

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
        `/api/stream/releases/resources/${releaseName}`,
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
      );
    }
  }, [releaseName]);

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

  const uninstallRelease = () => {
    axios
      .delete(`/api/helm/releases/${releaseNamespace}/${releaseName}`)
      .then(() => {
        window.location.href = "/helm/releases";
      })
      .catch((error) => {
        setLoading(false);
        setError(mapResponseError(error));
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
          <Tooltip placement="top" title={"Comming soon!"}>
            <Button
              // onClick={() => {
              //     setTempalteMigrationModal(true);
              // }}
              type={"primary"}
              disabled={true}
              block
            >
              <RocketOutlined />
              Migrate to Cyclops Module
            </Button>
          </Tooltip>
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
      <ResourceList
        loadResources={loadResources}
        resources={resources}
        workloads={workloads}
        onResourceDelete={function () {}}
      />
      {/*<Modal*/}
      {/*    title="Migrate to a Cyclops Module"*/}
      {/*    open={templateMigrationModal}*/}
      {/*    onCancel={handleCancelModal}*/}
      {/*    onOk={handleCancelModal}*/}
      {/*    confirmLoading={confirmLoading}*/}
      {/*    width={"60%"}*/}
      {/*>*/}
      {/*    <h3>Coming soon</h3>*/}
      {/*</Modal>*/}
      <Modal
        title={
          <>
            Uninstall release <span style={{ color: "red" }}>{releaseNamespace}/{releaseName}</span>
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
            onClick={uninstallRelease}
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

export default ReleaseDetails;
