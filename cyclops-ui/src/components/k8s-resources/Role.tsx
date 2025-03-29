import { Col, Divider, Row, Alert, Table, Tag, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { mapResponseError } from "../../utils/api/errors";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";

interface Props {
  name: string;
  namespace: string;
}

interface Rule {
  verbs?: string[];
  apiGroups?: string[];
  resources?: string[];
  nonResourceURLs?: string[];
}

interface RoleData {
  rules: Rule[];
}

const Role = ({ name, namespace }: Props) => {
  const [loading, setLoading] = useState(true);
  const { fetchResource } = useResourceListActions();

  const [role, setRole] = useState<RoleData>({
    rules: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchRole = useCallback(() => {
    fetchResource("rbac.authorization.k8s.io", "v1", "Role", namespace, name)()
      .then((res) => {
        setRole({
          rules: res.rules || [],
        });
        setLoading(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoading(false);
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchRole();

    const interval = setInterval(() => fetchRole(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchRole]);

  const columns = [
    {
      title: "Verbs",
      dataIndex: "verbs",
      key: "verbs",
      render: (verbs?: string[]) => (
        <>
          {verbs?.map((verb) => (
            <Tag key={verb} color="orange">
              {verb}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "API Groups",
      dataIndex: "apiGroups",
      key: "apiGroups",
      render: (apiGroups?: string[]) => (
        <>
          {apiGroups?.map((group) => (
            <Tag key={group} color="blue">
              {group || "*"}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "Resources",
      dataIndex: "resources",
      key: "resources",
      render: (resources?: string[]) => (
        <>
          {resources?.map((resource) => (
            <Tag key={resource} color="green">
              {resource}
            </Tag>
          ))}
        </>
      ),
    },
  ];

  if (role.rules.some((rule) => rule.nonResourceURLs)) {
    columns.push({
      title: "Non resource URLs",
      dataIndex: "nonResourceURLs",
      key: "nonResourceURLs",
      render: (nonResourceURLs?: string[]) => (
        <>
          {nonResourceURLs?.map((url) => (
            <Tag key={url} color="purple">
              {url}
            </Tag>
          ))}
        </>
      ),
    });
  }

  if (loading) return <Spin size="large" style={{ marginTop: "20px" }} />;

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
      <Divider
        style={{ fontSize: "120%" }}
        orientationMargin="0"
        orientation={"left"}
      >
        Rules
      </Divider>
      <Row>
        <Col span={24} style={{ overflowX: "auto" }}>
          <Table dataSource={role.rules} columns={columns} />
        </Col>
      </Row>
    </div>
  );
};

export default Role;
