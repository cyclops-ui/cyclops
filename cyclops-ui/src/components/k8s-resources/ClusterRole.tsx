import React, { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert, Table, Tag } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import { isStreamingEnabled } from "../../utils/api/common";

interface Props {
  name: string;
}

interface Rule {
  verbs: string[];
  apiGroups: string[];
  resources: string[];
}

interface ClusterRoleData {
  rules: Rule[];
}

const ClusterRole = ({ name }: Props) => {
  const [clusterRole, setClusterRole] = useState<ClusterRoleData>({
    rules: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchClusterRole = useCallback(() => {
    axios
      .get(`/api/resources`, {
        params: {
          group: `rbac.authorization.k8s.io`,
          version: `v1`,
          kind: `ClusterRole`,
          name: name,
        },
      })
      .then((res) => {
        setClusterRole({
          rules: res.data.rules || [],
        });
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name]);

  useEffect(() => {
    fetchClusterRole();

    if (isStreamingEnabled()) {
      return;
    }

    const interval = setInterval(() => fetchClusterRole(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchClusterRole]);

  const columns = [
    {
      title: "API Groups",
      dataIndex: "apiGroups",
      key: "apiGroups",
      render: (apiGroups: string[]) => (
        <>
          {apiGroups.map((group) => (
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
      render: (resources: string[]) => (
        <>
          {resources.map((resource) => (
            <Tag key={resource} color="green">
              {resource}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "Verbs",
      dataIndex: "verbs",
      key: "verbs",
      render: (verbs: string[]) => (
        <>
          {verbs.map((verb) => (
            <Tag key={verb} color="orange">
              {verb}
            </Tag>
          ))}
        </>
      ),
    },
  ];

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
          <Table
            dataSource={clusterRole.rules}
            columns={columns}
            rowKey={(record) =>
              `${record.apiGroups.join()}-${record.resources.join()}-${record.verbs.join()}`
            }
          />
        </Col>
      </Row>
    </div>
  );
};

export default ClusterRole;
