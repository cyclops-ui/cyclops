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
} from "antd";
import axios from "axios";
import Title from "antd/es/typography/Title";
import {
  DeleteOutlined,
  EditOutlined,
  FileSyncOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import classNames from "classnames";
import styles from "./styles.module.css";
import { mapResponseError } from "../../../utils/api/errors";
import defaultTemplate from "../../../static/img/default-template-icon.png";
import {
  FeedbackError,
  FormValidationErrors,
} from "../../errors/FormValidationErrors";

import gitLogo from "../../../static/img/git.png";
import helmLogo from "../../../static/img/helm.png";
import dockerLogo from "../../../static/img/docker-mark-blue.png";

const TemplateStore = () => {
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
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const sourceTypeFilter = ["git", "helm", "oci", "unknown"];
  const [templateSourceTypeFilter, setTemplateSourceTypeFilter] =
    useState<string[]>(sourceTypeFilter);

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
                    className={classNames(styles.statustemplate, {
                      [styles.success]:
                        requestStatus[template.name] === "success",
                      [styles.error]: requestStatus[template.name] === "error",
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
                  className={styles.edittemplate}
                  onClick={function () {
                    editForm.setFieldValue(
                      ["ref", "sourceType"],
                      template.ref.sourceType,
                    );
                    editForm.setFieldValue(["ref", "repo"], template.ref.repo);
                    editForm.setFieldValue(["ref", "path"], template.ref.path);
                    editForm.setFieldValue(
                      ["ref", "version"],
                      template.ref.version,
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
                  className={styles.deletetemplate}
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
          labelCol={{ span: 6 }}
        >
          <Form.Item
            style={{ paddingTop: "20px" }}
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
                pattern: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, // only alphanumeric characters and hyphens, cannot start or end with a hyphen and the alpha characters can only be lowercase
                message:
                  "Template ref name must follow the Kubernetes naming convention",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Divider />

          <Form.Item
            name={["ref", "sourceType"]}
            label="Select template source"
          >
            <Radio.Group
              optionType="button"
              style={{ width: "100%" }}
              className={styles.templatetypes}
            >
              <Radio value="git" className={styles.templatetype}>
                <img
                  src={gitLogo}
                  alt="git"
                  className={styles.templatetypeicon}
                />
                Git
              </Radio>
              <Radio value="helm" className={styles.templatetype}>
                <img
                  src={helmLogo}
                  alt="helm"
                  className={styles.templatetypeicon}
                />
                Helm repo
              </Radio>
              <Radio value="oci" className={styles.templatetype}>
                <img
                  src={dockerLogo}
                  alt="docker"
                  className={styles.templatetypeicon}
                />
                OCI registry
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Repository URL"
            name={["ref", "repo"]}
            rules={[{ required: true, message: "Repo URL is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Path"
            name={["ref", "path"]}
            rules={[{ required: true, message: "Path is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Version" name={["ref", "version"]}>
            <Input />
          </Form.Item>
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
          style={{ paddingTop: "50px" }}
          onFinish={handleUpdateSubmit}
          form={editForm}
          initialValues={{ remember: false }}
          labelCol={{ span: 6 }}
        >
          <Form.Item
            name={["ref", "sourceType"]}
            label="Select template source"
          >
            <Radio.Group
              optionType="button"
              style={{ width: "100%" }}
              className={styles.templatetypes}
            >
              <Radio value="git" className={styles.templatetype}>
                <img
                  src={gitLogo}
                  alt="git"
                  className={styles.templatetypeicon}
                />
                Git
              </Radio>
              <Radio value="helm" className={styles.templatetype}>
                <img
                  src={helmLogo}
                  alt="helm"
                  className={styles.templatetypeicon}
                />
                Helm repo
              </Radio>
              <Radio value="oci" className={styles.templatetype}>
                <img
                  src={dockerLogo}
                  alt="docker"
                  className={styles.templatetypeicon}
                />
                OCI registry
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            label="Repository URL"
            name={["ref", "repo"]}
            rules={[{ required: true, message: "Repo URL is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Path"
            name={["ref", "path"]}
            rules={[{ required: true, message: "Path is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Version" name={["ref", "version"]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={
          <>
            Delete template reference <span style={{ color: "red" }}>{confirmDelete}</span>
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
