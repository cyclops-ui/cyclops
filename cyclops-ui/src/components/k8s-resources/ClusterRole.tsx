import React, { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert, Table, Tag } from "antd";
import { mapResponseError } from "../../utils/api/errors";
import { useModuleDetailsActions } from "../shared/ModuleResourceDetails/ModuleDetailsActionsContext";

interface Props {
  name: string;
}

interface Rule {
  verbs?: string[];
  apiGroups?: string[];
  resources?: string[];
  nonResourceURLs?: string[];
}

interface ClusterRoleData {
  rules: Rule[];
}

const ClusterRole = ({ name }: Props) => {
  const { fetchResource } = useModuleDetailsActions();

  const [clusterRole, setClusterRole] = useState<ClusterRoleData>({
    rules: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchClusterRole = useCallback(() => {
    fetchResource("rbac.authorization.k8s.io", "v1", "ClusterRole", "", name)()
      .then((res) => {
        setClusterRole({
          rules: res.rules || [],
        });
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name, fetchResource]);

  useEffect(() => {
    fetchClusterRole();

    const interval = setInterval(() => fetchClusterRole(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchClusterRole]);

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

  if (clusterRole.rules.some((rule) => rule.nonResourceURLs)) {
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
          <Table dataSource={clusterRole.rules} columns={columns} />
        </Col>
      </Row>
    </div>
  );
};

export default ClusterRole;
