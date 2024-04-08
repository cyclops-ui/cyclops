import React, { useEffect, useState } from "react";
import {Col, Table, Typography, Alert, Row, Button, Tabs, Modal, Form, Input, Divider} from "antd";
import axios from "axios";
import Title from "antd/es/typography/Title";
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";
import styles from "./styles.module.css"

const TemplateStore = () => {
  const [templates, setTemplates] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState("")
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("")
  const [newTemplateModal, setNewTemplateModal] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editModal, setEditModal] = useState({
      on: false,
      name: "",
      repo: "",
      path: "",
      version: "",
  })
  const [error, setError] = useState({
    message: "",
    description: "",
  });

    const [form] = Form.useForm();

    useEffect(() => {
    axios
      .get(`/api/templates/store`)
      .then((res) => {
        setTemplates(res.data);
      })
      .catch((error) => {
        if (error?.response?.data) {
          setError({
            message: error.response.data.message || String(error),
            description: error.response.data.description || "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        } else {
          setError({
            message: String(error),
            description:
              "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        }
      });
  }, []);

  const handleOK = () => {
      form.submit();
  }

  const handleSubmit = (values: any) => {
      setConfirmLoading(true);

      axios
          .put(`/api/templates/store`, values)
          .then((res) => {
              setNewTemplateModal(false);
              setConfirmLoading(false);
              window.location.href = "/templates";
          })
          .catch((error) => {
              setConfirmLoading(false);
              if (error?.response?.data) {
                  setError({
                      message: error.response.data.message || String(error),
                      description:
                          error.response.data.description ||
                          "Check if Cyclops backend is available on: " +
                          window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
                  });
              } else {
                  setError({
                      message: String(error),
                      description:
                          "Check if Cyclops backend is available on: " +
                          window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
                  });
              }
          });
  }

    const handleUpdateSubmit = (values: any) => {
        setConfirmLoading(true);

        values.name = editModal.name;

        axios
            .post(`/api/templates/store/` + editModal.name, values)
            .then((res) => {
                setNewTemplateModal(false);
                setConfirmLoading(false);
                window.location.href = "/templates";
            })
            .catch((error) => {
                setConfirmLoading(false);
                if (error?.response?.data) {
                    setError({
                        message: error.response.data.message || String(error),
                        description:
                            error.response.data.description ||
                            "Check if Cyclops backend is available on: " +
                            window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
                    });
                } else {
                    setError({
                        message: String(error),
                        description:
                            "Check if Cyclops backend is available on: " +
                            window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
                    });
                }
            });
    }

  const deleteTemplateRef = () => {
      axios
          .delete(`/api/templates/store/` + confirmDelete)
          .then((res) => {
              setNewTemplateModal(false);
              setConfirmLoading(false);
              window.location.href = "/templates";
          })
          .catch((error) => {
              if (error?.response?.data) {
                  setError({
                      message: error.response.data.message || String(error),
                      description:
                          error.response.data.description ||
                          "Check if Cyclops backend is available on: " +
                          window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
                  });
              } else {
                  setError({
                      message: String(error),
                      description:
                          "Check if Cyclops backend is available on: " +
                          window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
                  });
              }
          });
  }

  const handleCancelModal = () => {
    setNewTemplateModal(false);
  }

    const handleCancelEditModal = () => {
        setEditModal({
            on: false,
            name: "",
            repo: "",
            path: "",
            version: "",
        });
    }

  const handleCancelDeleteModal = () => {
    setConfirmDelete("");
  }

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
          <Title level={2}>Templates: {templates.length}</Title>
        </Col>
        <Col span={6}>
          <Button
              type={"primary"}
              block
              onClick={() => { setNewTemplateModal(true) }
          }>
              Add template reference
          </Button>
        </Col>
      </Row>
      <Col span={24} style={{ overflowX: "auto" }}>
        <Table dataSource={templates}>
          <Table.Column title="Name" dataIndex="name" width={"30%"} />
          <Table.Column title="Repo" dataIndex={["ref", "repo"]} width={"30%"} />
          <Table.Column
              title="Path"
              dataIndex={["ref", "path"]}
              width={"10%"}
              render={function (value: any, record: any, index: number) {
                if (!value.startsWith('/')) {
                  return '/' + value;
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
                      return <span style={{color: "#A0A0A0"}}>{'<default>'}</span>
                  }
                  return value;
              }}
          />
            <Table.Column
                width="5%"
                render={(template) => (
                    <>
                        <EditOutlined
                            className={styles.edittemplate}
                            onClick={function () {
                                setEditModal({
                                    on: true,
                                    name: template.name,
                                    repo: template.ref.repo,
                                    path: template.ref.path,
                                    version: template.ref.version,
                                })
                            }}
                        />
                    </>
                )}
            />
            <Table.Column
                width="5%"
                render={(template) => (
                    <>
                        <DeleteOutlined
                            className={styles.deletetemplate}
                            onClick={function () {
                                setConfirmDelete(template.name)
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
        onOk={handleOK}
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
              form={form}
              initialValues={{ remember: true }}
              labelCol={{span: 6}}
          >
              <Form.Item
                  style={{paddingTop: "20px"}}
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

              <Divider/>

              <Form.Item
                  label="Repository URL"
                  name={["ref", "repo"]}
                  rules={[{ required: true, message: 'Repo URL is required' }]}
              >
                  <Input />
              </Form.Item>

              <Form.Item
                  label="Path"
                  name={["ref", "path"]}
                  rules={[{ required: true, message: 'Path is required' }]}
              >
                  <Input />
              </Form.Item>

              <Form.Item
                  label="Version"
                  name={["ref", "version"]}
              >
                  <Input />
              </Form.Item>
          </Form>
      </Modal>
        <Modal
            title={<div>Edit template ref <span style={{color: "#ff8803"}}>{editModal.name}</span></div>}
            open={editModal.on}
            onOk={handleOK}
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
                style={{paddingTop: "50px"}}
                onFinish={handleUpdateSubmit}
                form={form}
                initialValues={{ remember: true }}
                labelCol={{span: 6}}
            >
                <Form.Item
                    label="Repository URL"
                    name={["ref", "repo"]}
                    rules={[{ required: true, message: 'Repo URL is required' }]}
                    initialValue={editModal.repo}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Path"
                    name={["ref", "path"]}
                    rules={[{ required: true, message: 'Path is required' }]}
                    initialValue={editModal.path}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Version"
                    name={["ref", "version"]}
                    initialValue={editModal.version}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
        <Modal
            title="Delete template ref"
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
            In order to delete this template ref, type the template ref name in the box below
            <Input placeholder={confirmDelete} required onChange={(e: any) => {
                setConfirmDeleteInput(e.target.value)
            }} />
        </Modal>
    </div>
  );
};

export default TemplateStore;
