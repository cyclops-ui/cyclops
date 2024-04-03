import React, { useEffect, useState } from "react";
import {Col, Table, Typography, Alert, Row} from "antd";
import axios from "axios";
import Title from "antd/es/typography/Title";

const TemplateStore = () => {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState({
    message: "",
    description: "",
  });

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
    </div>
  );
};

export default TemplateStore;
