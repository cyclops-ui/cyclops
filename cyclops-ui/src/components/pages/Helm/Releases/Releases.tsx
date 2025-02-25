import React, { useEffect, useState } from "react";
import {
  Col,
  Divider,
  Row,
  Typography,
  Input,
  Alert,
  Empty,
  Spin,
  Table,
  ConfigProvider,
  Button,
  Modal,
  Form,
} from "antd";

import axios from "axios";

import { mapResponseError } from "../../../../utils/api/errors";

import helmLogo from "../../../../static/img/helm.png";
import {
  ExportOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { HelmReleaseMigrationTemplateModal } from "../../../shared/HelmReleaseDetails/HelmReleaseDetails";
import { getTemplate } from "../../../../utils/api/api";
import {
  getHelmReleaseValues,
  migrateHelmRelease,
} from "../../../../utils/api/helm";
import { SuccessIcon, PendingIcon, ErrorIcon } from "../../../status/icons";

const { Title } = Typography;

const HelmReleases = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [searchInputFilter, setsearchInputFilter] = useState("");
  const [error, setError] = useState({
    message: "",
    description: "",
  });
  const [migrationTemplateError, setMigrationTemplateError] = useState({
    message: "",
    description: "",
  });
  const [releasesMigrationError, setReleasesMigrationError] = useState({
    message: "",
    description: "",
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const [templateMigrationModal, setTemplateMigrationModal] = useState(false);
  const [templateMigrationModalLoading, setTemplateMigrationModalLoading] =
    useState(false);
  const [migrateTemplateRefForm] = Form.useForm();

  const [releaseMigrationModal, setReleaseMigrationModal] = useState(false);
  const [releaseMigrationModalProgress, setReleaseMigrationModalProgress] =
    useState<{
      [key: string]: string;
    }>({});
  const [batchMigrationFinished, setBatchMigrationFinished] = useState(false);

  useEffect(() => {
    setLoadingReleases(true);

    function fetchReleases() {
      axios
        .get(`/api/helm/releases`)
        .then((res) => {
          setAllData(res.data);
          setLoadingReleases(false);
        })
        .catch((error) => {
          setError(mapResponseError(error));
          setLoadingReleases(false);
        });
    }

    fetchReleases();
    const interval = setInterval(() => fetchReleases(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    var updatedList = [...allData];
    updatedList = updatedList.filter((module: any) => {
      return (
        module.name.toLowerCase().indexOf(searchInputFilter.toLowerCase()) !==
        -1
      );
    });
    setFilteredData(updatedList);
  }, [allData, searchInputFilter]);

  const handleSearch = (event: any) => {
    const query = event.target.value;
    setsearchInputFilter(query);
  };

  const handleSubmitMigrationTemplate = async () => {
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
        setTemplateMigrationModal(false);
        setReleaseMigrationModal(true);
      })
      .catch((e) => {
        setMigrationTemplateError(mapResponseError(e));
        setTemplateMigrationModalLoading(false);
      });
  };

  const runReleaseBatchMigration = async () => {
    selectedRowKeys.forEach((r) => {
      const k = r.toString();

      setReleaseMigrationModalProgress((prevState) => {
        return { ...prevState, [k]: "pending" };
      });
    });

    const templateRef = migrateTemplateRefForm.getFieldsValue();

    for (let r of selectedRowKeys) {
      const k = r.toString();

      setReleaseMigrationModalProgress((prevState) => {
        return { ...prevState, [k]: "migrating" };
      });

      const keyParts = k.split("/");
      const releaseNamespace = keyParts[0];
      const releaseName = keyParts[1];

      try {
        const values = await getHelmReleaseValues(
          releaseNamespace,
          releaseName,
        );
        await migrateHelmRelease(releaseNamespace, releaseName, values, {
          repo: templateRef["repo"],
          path: templateRef["path"],
          version: templateRef["version"],
        });

        setReleaseMigrationModalProgress((prevState) => ({
          ...prevState,
          [k]: "success",
        }));
      } catch (e) {
        setReleasesMigrationError(mapResponseError(e));
        setReleaseMigrationModalProgress((prevState) => ({
          ...prevState,
          [k]: "error",
        }));
        break;
      }
    }

    setBatchMigrationFinished(true);
  };

  const handleSubmitMigrateModal = () => {
    Modal.confirm({
      title: "Confirm migration",
      content:
        "Migration from Helm releases to Cyclops Modules will retain the existing resources, but releases will not be visible in the the Cyclops UI or the `helm ls` command. In case you want to revert to Helm releases, you can just reinstall them.",
      okText: "Run Migration",
      cancelText: "Cancel",
      icon: <InfoCircleOutlined style={{ color: "#1890ff" }} />, // Use info icon
      okButtonProps: {
        style: { backgroundColor: "#ff8803" },
      },
      cancelButtonProps: {
        style: { borderColor: "#ff8803", color: "#ff8803" },
      },
      onOk: runReleaseBatchMigration,
    });
  };

  const handleCancelMigrateModal = () => {
    setReleaseMigrationModal(false);
    setLoadingReleases(true);
    setReleasesMigrationError({ message: "", description: "" });
    setSelectedRowKeys([]);
    setReleaseMigrationModalProgress({});
    setBatchMigrationFinished(false);

    axios
      .get(`/api/helm/releases`)
      .then((res) => {
        setAllData(res.data);
        setLoadingReleases(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoadingReleases(false);
      });
  };

  const renderReleasesTable = () => {
    if (loadingReleases) {
      return <Spin size={"large"} />;
    }

    if (filteredData.length === 0) {
      return (
        <div style={{ width: "100%" }}>
          <Empty description="No Helm releases found"></Empty>
        </div>
      );
    }

    return (
      <ConfigProvider
        theme={{
          components: {
            Table: {
              // rowHoverBg: "#fce7cf",
            },
          },
        }}
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: onSelectChange,
            columnWidth: "3%",
          }}
          dataSource={filteredData}
          rowKey={(r) => {
            return `${r.namespace}/${r.name}`;
          }}
        >
          <Table.Column
            width={"3%"}
            render={() => {
              return (
                <img
                  alt=""
                  style={{ height: "1.5em", marginRight: "8px" }}
                  src={helmLogo}
                />
              );
            }}
          />
          <Table.Column
            width={"25%"}
            title={"Release"}
            render={(release: any) => {
              return (
                <a href={`/helm/releases/${release.namespace}/${release.name}`}>
                  <ExportOutlined style={{ paddingRight: "8px" }} />
                  {release.name}:{release.revision}
                </a>
              );
            }}
          />
          <Table.Column
            title="Namespace"
            dataIndex={"namespace"}
            width={"20%"}
          />
          <Table.Column title="Chart" dataIndex={"chart"} width={"20%"} />
          <Table.Column title="Version" dataIndex={"version"} width={"10%"} />
        </Table>
      </ConfigProvider>
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

      <Row gutter={[40, 0]}>
        <Col span={18}>
          <Title level={2}>Existing Helm releases</Title>
        </Col>
        <Col span={6}>
          <Button
            type={"primary"}
            onClick={() => {
              setTemplateMigrationModal(true);
            }}
            block
            style={{
              fontWeight: "600",
            }}
            disabled={selectedRowKeys.length === 0}
          >
            Migrate to Cyclops Modules
          </Button>
        </Col>
      </Row>

      <Row>
        <Col span={6}>
          <Input
            placeholder={"Search releases"}
            style={{ width: "100%" }}
            onChange={handleSearch}
          ></Input>
        </Col>
      </Row>
      <Divider orientationMargin="0" />
      <Row gutter={[16, 16]}>
        <Col span={24}>{renderReleasesTable()}</Col>
      </Row>
      <Modal
        title="Select the template to use for the migration"
        open={templateMigrationModal}
        onCancel={() => {
          setTemplateMigrationModal(false);
        }}
        onOk={handleSubmitMigrationTemplate}
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
              setMigrationTemplateError({
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
        title="Migrate releases to Cyclops modules"
        open={releaseMigrationModal}
        onCancel={handleCancelMigrateModal}
        onOk={handleSubmitMigrateModal}
        okText={"Run migration"}
        okButtonProps={{ disabled: batchMigrationFinished }}
        cancelText={"Close"}
        confirmLoading={templateMigrationModalLoading}
        width={"80%"}
      >
        {releasesMigrationError.message.length !== 0 && (
          <Alert
            message={releasesMigrationError.message}
            description={releasesMigrationError.description}
            type="error"
            closable
            afterClose={() => {
              setReleasesMigrationError({
                message: "",
                description: "",
              });
            }}
            style={{ marginBottom: "20px" }}
          />
        )}
        <Row style={{ paddingBottom: "8px" }}>
          Helm releases below will be migrated to Cyclops Modules. All of the
          releases will retain the values used when last deployed. All the
          Modules will use the following template:
        </Row>
        <Row style={{ paddingBottom: "8px" }}>
          <pre>
            {migrateTemplateRefForm.getFieldsValue()["repo"]} /{" "}
            {migrateTemplateRefForm.getFieldsValue()["path"]} @{" "}
            {migrateTemplateRefForm.getFieldsValue()["version"]}
          </pre>
        </Row>
        <Row>Modules to migrate:</Row>
        <Table dataSource={selectedRowKeys}>
          <Table.Column
            title={"release name"}
            render={(r) => {
              return r.toString().split("/")[1];
            }}
          />
          <Table.Column
            title={"release namespace"}
            render={(r) => {
              return r.toString().split("/")[0];
            }}
          />
          <Table.Column
            title={"Migration status"}
            render={(r) => {
              const status = releaseMigrationModalProgress[r.toString()];
              switch (status) {
                case "pending":
                  return (
                    <PendingIcon
                      style={{
                        verticalAlign: "middle",
                        height: "100%",
                        marginBottom: "4px",
                        fontSize: "150%",
                      }}
                    />
                  );
                case "migrating":
                  return (
                    <LoadingOutlined
                      style={{
                        verticalAlign: "middle",
                        height: "100%",
                        marginBottom: "4px",
                        fontSize: "150%",
                        color: "#1591ea",
                      }}
                    />
                  );
                case "success":
                  return (
                    <SuccessIcon
                      style={{
                        verticalAlign: "middle",
                        height: "100%",
                        marginBottom: "4px",
                        fontSize: "150%",
                      }}
                    />
                  );
                case "error":
                  return (
                    <ErrorIcon
                      style={{
                        verticalAlign: "middle",
                        height: "100%",
                        marginBottom: "4px",
                        fontSize: "150%",
                      }}
                    />
                  );
              }
            }}
          />
        </Table>
      </Modal>
    </div>
  );
};

export default HelmReleases;
