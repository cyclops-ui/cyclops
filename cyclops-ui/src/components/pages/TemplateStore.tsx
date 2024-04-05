import React, { useEffect, useState } from "react";
import {Col, Table, Typography, Alert, Row, Button, Tabs, Modal, Form, Input} from "antd";
import axios from "axios";
import Title from "antd/es/typography/Title";

const TemplateStore = () => {
  const [templates, setTemplates] = useState([]);
  const [newTemplateModal, setNewTemplateModal] = useState(false)
    const [confirmLoading, setConfirmLoading] = useState(false);
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
              setConfirmLoading(true);
              window.location.href = "/templates";
          })
          .catch((error) => {
              if (error.response === undefined) {
                  setError({
                      message: String(error),
                      description:
                          "Check if Cyclops backend is available on: " +
                          window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
                  });
              } else {
                  setError({
                      message: error.message,
                      description: error.response.data,
                  });
              }
          });
  }

  const handleCancelModal = () => {
    setNewTemplateModal(false);
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
              width={"20%"}
              render={function (value: any, record: any, index: number) {
                if (!value.startsWith('/')) {
                  return '/' + value;
                }
                return value;
              }}
          />
          <Table.Column title="Version" dataIndex={["ref", "version"]} width={"10%"} />
        </Table>
      </Col>
      <Modal
        title="Add template ref"
        open={newTemplateModal}
        onOk={handleOK}
        onCancel={handleCancelModal}
        confirmLoading={confirmLoading}
        width={"60%"}
      >
          <Form
              onFinish={handleSubmit}
              form={form}
              initialValues={{ remember: true }}
              labelCol={{span: 6}}
          >
              <Form.Item
                  label="Template ref name"
                  name={"name"}
                  rules={[{ required: true, message: 'Template ref is required' }]}
              >
                  <Input />
              </Form.Item>

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
    </div>
  );
};

export default TemplateStore;
