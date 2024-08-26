import React, { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Table } from "antd";
import { mapResponseError } from "../../utils/api/errors";

interface Props {
  name: string;
  namespace: string;
}

interface RoleData {
  name: string;
  apiGroup: string;
  get: boolean;
  list: boolean;
  watch: boolean;
  create: boolean;
  patch: boolean;
  update: boolean;
  delete: boolean;
  deleteList: boolean;
}

const Roles = ({ name, namespace }: Props) => {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchRoles() {
      axios
        .get(`/api/resources`, {
          params: {
            group: `rbac.authorization.k8s.io`,
            version: `v1`,
            kind: `Role`,
            name: name,
            namespace: namespace,
          },
        })
        .then((res) => {
          // Process and map the response data to the RoleData structure
          const mappedRoles: RoleData[] = res.data.map((role: any) => ({
            name: role.metadata.name,
            apiGroup: role.apiGroup,
            get: role.get,
            list: role.list,
            watch: role.watch,
            create: role.create,
            patch: role.patch,
            update: role.update,
            delete: role.delete,
            deleteList: role.deleteList,
          }));
          setRoles(mappedRoles);
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchRoles();
    const interval = setInterval(() => fetchRoles(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [name, namespace]);

  const columns = [
    { title: "NAME", dataIndex: "name", key: "name" },
    { title: "API-GROUP", dataIndex: "apiGroup", key: "apiGroup" },
    { title: "GET", dataIndex: "get", key: "get", render: (text: boolean) => (text ? "✓" : "x") },
    { title: "LIST", dataIndex: "list", key: "list", render: (text: boolean) => (text ? "✓" : "x") },
    { title: "WATCH", dataIndex: "watch", key: "watch", render: (text: boolean) => (text ? "✓" : "x") },
    { title: "CREATE", dataIndex: "create", key: "create", render: (text: boolean) => (text ? "✓" : "x") },
    { title: "PATCH", dataIndex: "patch", key: "patch", render: (text: boolean) => (text ? "✓" : "x") },
    { title: "UPDATE", dataIndex: "update", key: "update", render: (text: boolean) => (text ? "✓" : "x") },
    { title: "DELETE", dataIndex: "delete", key: "delete", render: (text: boolean) => (text ? "✓" : "x") },
    { title: "DEL-LIST", dataIndex: "deleteList", key: "deleteList", render: (text: boolean) => (text ? "✓" : "x") },
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
      <Table columns={columns} dataSource={roles} rowKey="name" />
    </div>
  );
};

export default Roles;
