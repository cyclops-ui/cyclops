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
  CheckCircleOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseCircleTwoTone,
  CloseSquareTwoTone,
  LoadingOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { HelmReleaseMigrationTemplateModal } from "../../../shared/HelmReleaseDetails/HelmReleaseDetails";
import { getTemplate } from "../../../../utils/api/api";
import {
  getHelmReleaseValues,
  migrateHelmRelease,
} from "../../../../utils/api/helm";

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

  // const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
  //   let newSelectedReleases: {namespace: string, name: string}[] = []
  //
  //   newSelectedRowKeys.forEach((k: string) => {
  //     const keyParts = k.split("/")
  //     newSelectedReleases.push({
  //       namespace: keyParts[0],
  //       name: keyParts[1],
  //     })
  //   })
  //
  //   setSelectedReleases(newSelectedRowKeys);
  // };

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

  const handleSubmitMigrationTemplate = () => {
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
        setReleaseMigrationModal(true);
      })
      .catch((e) => {
        setMigrationTemplateError(mapResponseError(e));
        setTemplateMigrationModalLoading(false);
      });
  };

  const handleSubmitMigrateModal = () => {
    selectedRowKeys.forEach((r) => {
      const k = r.toString();

      setReleaseMigrationModalProgress((prevState) => {
        return { ...prevState, [k]: "pending" };
      });
    });

    const templateRef = migrateTemplateRefForm.getFieldsValue();

    selectedRowKeys.forEach((r) => {
      setReleaseMigrationModalProgress((prevState) => {
        return { ...prevState, [k]: "migrating" };
      });

      const k = r.toString();
      const keyParts = k.split("/");
      const releaseNamespace = keyParts[0];
      const releaseName = keyParts[1];

      getHelmReleaseValues(releaseNamespace, releaseName)
        .then((values) => {
          migrateHelmRelease(releaseNamespace, releaseName, values, {
            repo: templateRef["repo"],
            path: templateRef["path"],
            version: templateRef["version"],
          })
            .then(() => {
              setReleaseMigrationModalProgress((prevState) => {
                return { ...prevState, [k]: "success" };
              });
            })
            .catch((error) => {
              setReleaseMigrationModalProgress((prevState) => {
                return { ...prevState, [k]: "error" };
              });
            });
        })
        .catch((error) => {
          setReleaseMigrationModalProgress((prevState) => {
            return { ...prevState, [k]: "error" };
          });
        });
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
          onRow={(release: any) => {
            return {
              style: { cursor: "pointer" },
              onClick: () => {
                window.location.href =
                  "/helm/releases/" + release.namespace + "/" + release.name;
              },
            };
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
                <div>
                  {release.name}:{release.revision}
                </div>
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
        title="Migrate releases to Cyclops modules"
        open={releaseMigrationModal}
        onCancel={() => {
          setTemplateMigrationModal(false);
        }}
        onOk={handleSubmitMigrateModal}
        okText={"Run migration"}
        confirmLoading={templateMigrationModalLoading}
        width={"80%"}
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
          Helm releases below will be migrated to Cyclops Modules. All of the
          releases will retain the values used when last deployed. All the
          Modules will use the following template:
        </Row>
        <Row style={{ paddingBottom: "8px" }}>
          <pre style={{ color: "navy" }}>
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
                case "error":
                  return (
                    <CloseCircleTwoTone
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
            }}
          />
        </Table>
      </Modal>
    </div>
  );
};

export default HelmReleases;
