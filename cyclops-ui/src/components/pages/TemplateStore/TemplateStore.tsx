import React, { useEffect, useState } from "react";
import {
  Col,
  Table,
  Alert,
  Row,
  Button,
  Modal,
  Form,
  Input,
  Divider,
  message,
  Spin,
  notification,
  Radio,
  Popover,
  Checkbox,
  Switch,
  AutoComplete,
} from "antd";
import axios from "axios";
import {
  DeleteOutlined,
  EditOutlined,
  FileSyncOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import "./custom.css";
import { mapResponseError } from "../../../utils/api/errors";
import defaultTemplate from "../../../static/img/default-template-icon.png";
import {
  FeedbackError,
  FormValidationErrors,
} from "../../errors/FormValidationErrors";

import gitLogo from "../../../static/img/git.png";
import helmLogo from "../../../static/img/helm.png";
import dockerLogo from "../../../static/img/docker-mark-blue.png";
import { useTheme } from "../../theme/ThemeContext";
import Title from "antd/es/typography/Title";

const TemplateStore = () => {
  const { mode } = useTheme();

  const [templates, setTemplates] = useState([]);
  const [query, setQuery] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState("");
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");
  const [newTemplateModal, setNewTemplateModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editModal, setEditModal] = useState("");
  const [loadingTemplateName, setLoadingTemplateName] = useState<{
    [key: string]: boolean;
  }>({});
  const [requestStatus, setRequestStatus] = useState<{ [key: string]: string }>(
    {},
  );
  const [enforceGitOpsEnabled, setEnforceGitOpsEnabled] = useState(false);
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const sourceTypeFilter = ["git", "helm", "oci", "unknown"];
  const [templateSourceTypeFilter, setTemplateSourceTypeFilter] =
    useState<string[]>(sourceTypeFilter);

  const [repoRevisions, setRepoRevisions] = useState<string[]>([]);
  const [repoRevisionOptions, setRepoRevisionOptions] = useState([]);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [notificationApi, contextHolder] = notification.useNotification();

  const openNotification = (errors: FeedbackError[]) => {
    notificationApi.error({
      message: "Submit failed!",
      description: <FormValidationErrors errors={errors} />,
      placement: "topRight",
      duration: 0,
    });
  };

  useEffect(() => {
    axios
      .get(`/api/templates/store`)
      .then((res) => {
        setTemplates(res.data);
        setFilteredTemplates(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, []);

  useEffect(() => {
    var updatedList = [...templates];
    updatedList = updatedList
      .filter((template: any) => {
        return (
          template.name.toLowerCase().indexOf(query.toLowerCase().trim()) !== -1
        );
      })
      .filter((template: any) => {
        if (
          !template.ref.sourceType &&
          templateSourceTypeFilter.includes("unknown")
        )
          return true;
        else return templateSourceTypeFilter.includes(template.ref.sourceType);
      });
    setFilteredTemplates(updatedList);
  }, [templateSourceTypeFilter, query, templates]);

  const onSubmitFailed = (
    errors: Array<{ message: string; description: string }>,
  ) => {
    const errorMessages: FeedbackError[] = [];
    errors.forEach(function (error: any) {
      errorMessages.push({
        key: error.message,
        errors: [error.description],
      });
    });
    openNotification(errorMessages);
  };

  const handleOKAdd = () => {
    addForm.submit();
  };

  const handleOKEdit = () => {
    editForm.submit();
  };

  const handleSubmit = (values: any) => {
    setConfirmLoading(true);

    axios
      .put(`/api/templates/store`, values)
      .then(() => {
        setNewTemplateModal(false);
        setConfirmLoading(false);
        window.location.href = "/templates";
      })
      .catch((error) => {
        setConfirmLoading(false);
        onSubmitFailed([error.response.data]);
      });
  };

  const handleUpdateSubmit = (values: any) => {
    setConfirmLoading(true);

    values.name = editModal;

    axios
      .post(`/api/templates/store/` + editModal, values)
      .then(() => {
        setNewTemplateModal(false);
        setConfirmLoading(false);
        window.location.href = "/templates";
      })
      .catch((error) => {
        setConfirmLoading(false);
        onSubmitFailed([error.response.data]);
      });
  };

  const validateAllTemplates = async () => {
    for (const templateToBeValidate of filteredTemplates) {
      const templateInfo = (templateToBeValidate as any).ref;
      const templateName = (templateToBeValidate as any).name;
      setLoadingTemplateName((prevState) => {
        return { ...prevState, [templateName]: true };
      });
      await axios
        .get(
          `/api/templates?repo=${templateInfo.repo}&path=${templateInfo.path}&commit=${templateInfo.version}&sourceType=${templateInfo.sourceType}`,
        )
        .then(() => {
          setRequestStatus((prevStatus) => ({
            ...prevStatus,
            [templateName]: "success",
          }));
          message.success(templateName + " Template reference is valid!");
          setError({ message: "", description: "" });
        })
        .catch((error) => {
          setRequestStatus((prevStatus) => ({
            ...prevStatus,
            [templateName]: "error",
          }));
          setError(mapResponseError(error));
        })
        .finally(() => {
          setLoadingTemplateName((prevState) => {
            return { ...prevState, [templateName]: false };
          });
        });
    }
  };

  const checkTemplateReference = (
    repo: string,
    path: string,
    version: string,
    templateName: string,
    sourceType: string,
  ) => {
    setLoadingTemplateName((prevState) => {
      return { ...prevState, [templateName]: true };
    });
    axios
      .get(
        `/api/templates?repo=${repo}&path=${path}&commit=${version}&sourceType=${sourceType}`,
      )
      .then((res) => {
        setLoadingTemplateName((prevState) => {
          return { ...prevState, [templateName]: false };
        });
        setRequestStatus((prevStatus) => ({
          ...prevStatus,
          [templateName]: "success",
        }));
        message.success("Template reference is valid!");
        setError({ message: "", description: "" });
      })
      .catch((error) => {
        setLoadingTemplateName((prevState) => {
          return { ...prevState, [templateName]: false };
        });
        setRequestStatus((prevStatus) => ({
          ...prevStatus,
          [templateName]: "error",
        }));
        message.error("Template reference is Invalid!");
      });
  };

  const deleteTemplateRef = () => {
    axios
      .delete(`/api/templates/store/` + confirmDelete)
      .then((res) => {
        setNewTemplateModal(false);
        setConfirmLoading(false);
        window.location.href = "/templates";
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  };

  const handleCancelModal = () => {
    setNewTemplateModal(false);
  };

  const handleCancelEditModal = () => {
    setEditModal("");
  };

  const handleCancelDeleteModal = () => {
    setConfirmDelete("");
  };

  const templateFilterPopover = () => {
    return (
      <Checkbox.Group
        style={{ display: "block" }}
        onChange={(selectedItems: any[]) =>
          setTemplateSourceTypeFilter(selectedItems)
        }
        value={templateSourceTypeFilter}
      >
        {sourceTypeFilter.map((item, index) => (
          <Checkbox key={index} value={item}>
            {item}
          </Checkbox>
        ))}
      </Checkbox.Group>
    );
  };

  const advancedTemplateGitOpsWrite = () => {
    return (
      <div
        style={{
          backgroundColor: mode === "light" ? "#fafafa" : "#333",
          border: `1px solid ${mode === "light" ? "#c3c3c3" : "#707070"}`,
          borderRadius: "7px",
          padding: "16px",
          marginTop: "24px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
            }}
          >
            <Switch
              checked={enforceGitOpsEnabled}
              onChange={setEnforceGitOpsEnabled}
            />
            <div style={{ margin: 0 }}>Enforce GitOps Write</div>
          </div>
          <p style={{ color: "#8b8e91", margin: "4px 0 0 0" }}>
            Configure GitOps settings to push changes to a git repository
            instead of deploying directly to the cluster.
          </p>
        </div>
        {enforceGitOpsEnabled && (
          <>
            <Form.Item
              label="Repository URL"
              name={["enforceGitOpsWrite", "repo"]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="https://github.com/org/repo" />
            </Form.Item>

            <Form.Item
              label="Path"
              name={["enforceGitOpsWrite", "path"]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              style={{ marginBottom: 8 }}
            >
              <Input placeholder="/path/to/templates" />
            </Form.Item>

            <Form.Item
              label="Branch"
              name={["enforceGitOpsWrite", "branch"]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input placeholder="main" />
            </Form.Item>
          </>
        )}
      </div>
    );
  };

  const fetchRepoRevisions = (e) => {
    axios
      .get(`/api/templates/revisions?repo=` + e.target.value)
      .then((res) => {
        setRepoRevisions(res.data);
      })
      .catch(() => {});
  };

  const handleRepoInput = (value) => {
    if (repoRevisions.length === 0) {
      setRepoRevisionOptions([]);
      return;
    }

    const filtered = repoRevisions
      .filter((item) => item.toLowerCase().includes(value.toLowerCase()))
      .map((item) => ({ value: item }));
    setRepoRevisionOptions(filtered);
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
      {contextHolder}
      <Row gutter={[40, 0]} style={{ justifyContent: "space-between" }}>
        <Col>
          <Title level={2}>Templates: {filteredTemplates.length}</Title>
        </Col>
        <Col>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {filteredTemplates.length !== 0 && (
              <Button
                block
                onClick={() => {
                  validateAllTemplates();
                }}
              >
                Validate All Templates
              </Button>
            )}
            <Button
              type={"primary"}
              block
              onClick={() => {
                setNewTemplateModal(true);
              }}
            >
              Add template reference
            </Button>
          </div>
        </Col>
      </Row>
      <Row gutter={[40, 0]}>
        <Col span={18}>
          <Input
            placeholder={"Search templates"}
            style={{ width: "30%", marginBottom: "1rem" }}
            onChange={(event) => setQuery(event.target.value)}
            addonAfter={
              <>
                <Popover content={templateFilterPopover()} trigger="click">
                  <FilterOutlined />
                </Popover>
              </>
            }
          ></Input>
        </Col>
      </Row>
      <Col span={24} style={{ overflowX: "auto" }}>
        <Table dataSource={filteredTemplates}>
          <Table.Column
            dataIndex="iconURL"
            width={"3%"}
            render={function (iconURL) {
              if (!iconURL || iconURL.length === 0) {
                return (
                  <img
                    alt=""
                    style={{
                      verticalAlign: "middle",
                      margin: "-5px",
                      maxHeight: "36px",
                    }}
                    src={defaultTemplate}
                  />
                );
              }

              return (
                <img
                  alt=""
                  style={{
                    verticalAlign: "middle",
                    margin: "-5px",
                    maxHeight: "36px",
                  }}
                  src={iconURL}
                />
              );
            }}
          />
          <Table.Column title="Name" dataIndex="name" width={"20%"} />
          <Table.Column
            title="Repo"
            dataIndex={["ref", "repo"]}
            width={"30%"}
          />
          <Table.Column
            title="Path"
            dataIndex={["ref", "path"]}
            width={"20%"}
            render={function (value: any, record: any, index: number) {
              if (!value.startsWith("/")) {
                return "/" + value;
              }
              return value;
            }}
          />
          <Table.Column
            title="Version"
            dataIndex={["ref", "version"]}
            width={"10%"}
            render={function (value: any, record: any, index: number) {
              if (String(value).length === 0) {
                return <span style={{ color: "#A0A0A0" }}>{"<default>"}</span>;
              }
              return value;
            }}
          />
          <Table.Column
            title="Validate"
            width="5%"
            render={(template) => (
              <>
                {loadingTemplateName[template.name] === true ? (
                  <Spin />
                ) : (
                  <FileSyncOutlined
                    className={classNames("statustemplate", {
                      success: requestStatus[template.name] === "success",
                      error: requestStatus[template.name] === "error",
                    })}
                    onClick={function () {
                      checkTemplateReference(
                        template.ref.repo,
                        template.ref.path,
                        template.ref.version,
                        template.name,
                        template.ref.sourceType,
                      );
                    }}
                  />
                )}
              </>
            )}
          />
          <Table.Column
            title="Edit"
            width="5%"
            render={(template) => (
              <>
                <EditOutlined
                  className={"edittemplate"}
                  onClick={function () {
                    editForm.setFieldsValue(template);
                    if (template.enforceGitOpsWrite === undefined) {
                      editForm.setFieldValue(["enforceGitOpsWrite"], undefined);
                    }
                    setEnforceGitOpsEnabled(
                      template.enforceGitOpsWrite !== undefined,
                    );
                    setEditModal(template.name);
                  }}
                />
              </>
            )}
          />
          <Table.Column
            title="Delete"
            width="5%"
            render={(template) => (
              <>
                <DeleteOutlined
                  className={"deletetemplate"}
                  onClick={function () {
                    setConfirmDelete(template.name);
                  }}
                />
              </>
            )}
          />
        </Table>
      </Col>
      <Modal
        title="Add new"
        open={newTemplateModal}
        onOk={handleOKAdd}
        onCancel={handleCancelModal}
        confirmLoading={confirmLoading}
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
            style={{ marginBottom: "20px" }}
          />
        )}
        <Form
          onFinish={handleSubmit}
          form={addForm}
          initialValues={{ remember: true }}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
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
            style={{ marginBottom: "12px" }}
            label="Name"
            name={"name"}
            rules={[
              {
                required: true,
                message: "Template ref name is required",
              },
              {
                max: 63,
                message:
                  "Template ref name must contain no more than 63 characters",
              },
              {
                pattern: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
                message:
                  "Template ref name must follow the Kubernetes naming convention",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Divider style={{ margin: "12px 0" }} />

          <Form.Item
            name={["ref", "sourceType"]}
            label="Select template source"
            style={{ marginBottom: "12px" }}
          >
            <Radio.Group
              optionType="button"
              style={{ width: "100%" }}
              className={"templatetypes"}
            >
              <Radio value="git" className={"templatetype"}>
                <img src={gitLogo} alt="git" className={"templatetypeicon"} />
                Git
              </Radio>
              <Radio value="helm" className={"templatetype"}>
                <img src={helmLogo} alt="helm" className={"templatetypeicon"} />
                Helm repo
              </Radio>
              <Radio value="oci" className={"templatetype"}>
                <img
                  src={dockerLogo}
                  alt="docker"
                  className={"templatetypeicon"}
                />
                OCI registry
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Repository URL"
            name={["ref", "repo"]}
            rules={[{ required: true, message: "Repo URL is required" }]}
            style={{ marginBottom: "12px" }}
          >
            <Input onBlur={fetchRepoRevisions} />
          </Form.Item>

          <Form.Item
            label="Path"
            name={["ref", "path"]}
            rules={[{ required: true, message: "Path is required" }]}
            style={{ marginBottom: "12px" }}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Version"
            name={["ref", "version"]}
            style={{ marginBottom: "12px" }}
          >
            <AutoComplete
              options={repoRevisionOptions}
              onSearch={handleRepoInput}
              allowClear
            >
              <Input />
            </AutoComplete>
          </Form.Item>

          {advancedTemplateGitOpsWrite()}
        </Form>
      </Modal>
      <Modal
        title={
          <div>
            Edit template ref{" "}
            <span style={{ color: "#ff8803" }}>{editModal}</span>
          </div>
        }
        open={editModal.length > 0}
        onOk={handleOKEdit}
        onCancel={handleCancelEditModal}
        confirmLoading={confirmLoading}
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
            style={{ marginBottom: "20px" }}
          />
        )}
        <Form
          style={{ paddingTop: "24px" }}
          onFinish={handleUpdateSubmit}
          form={editForm}
          initialValues={{ remember: false }}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
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
            name={["ref", "sourceType"]}
            label="Select template source"
            style={{ marginBottom: "12px" }}
          >
            <Radio.Group
              optionType="button"
              style={{ width: "100%" }}
              className={"templatetypes"}
            >
              <Radio value="git" className={"templatetype"}>
                <img src={gitLogo} alt="git" className={"templatetypeicon"} />
                Git
              </Radio>
              <Radio value="helm" className={"templatetype"}>
                <img src={helmLogo} alt="helm" className={"templatetypeicon"} />
                Helm repo
              </Radio>
              <Radio value="oci" className={"templatetype"}>
                <img
                  src={dockerLogo}
                  alt="docker"
                  className={"templatetypeicon"}
                />
                OCI registry
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Repository URL"
            name={["ref", "repo"]}
            rules={[{ required: true, message: "Repo URL is required" }]}
            style={{ marginBottom: "12px" }}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Path"
            name={["ref", "path"]}
            rules={[{ required: true, message: "Path is required" }]}
            style={{ marginBottom: "12px" }}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Version"
            name={["ref", "version"]}
            style={{ marginBottom: "12px" }}
          >
            <Input />
          </Form.Item>
          {advancedTemplateGitOpsWrite()}
        </Form>
      </Modal>
      <Modal
        title={
          <>
            Delete template reference{" "}
            <span style={{ color: "red" }}>{confirmDelete}</span>
          </>
        }
        open={confirmDelete.length > 0}
        onCancel={handleCancelDeleteModal}
        width={"40%"}
        footer={
          <Button
            danger
            block
            disabled={confirmDelete !== confirmDeleteInput}
            onClick={deleteTemplateRef}
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
        <Divider style={{ fontSize: "120%" }} orientationMargin="0" />
        In order to delete this template ref, type the template ref name in the
        box below
        <Input
          placeholder={confirmDelete}
          required
          onChange={(e: any) => {
            setConfirmDeleteInput(e.target.value);
          }}
        />
      </Modal>
    </div>
  );
};

export default TemplateStore;
