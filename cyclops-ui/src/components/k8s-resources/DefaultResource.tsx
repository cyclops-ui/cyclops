import React, { useCallback, useEffect, useState } from "react";
import { Alert } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import ResourceList from "./ResourceList/ResourceList";

interface Props {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
  onResourceDelete: () => void;
}

const DefaultResource = ({
  group,
  version,
  kind,
  name,
  namespace,
  onResourceDelete,
}: Props) => {
  const [resource, setResource] = useState({
    children: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });
  const [loadResources, setLoadResources] = useState(false);

  const fetchResource = useCallback(() => {
    axios
      .get(`/api/resources`, {
        params: {
          group: group,
          version: version,
          kind: kind,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setResource(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      })
      .finally(() => {
        setLoadResources(true);
      });
  }, [name, namespace]);

  useEffect(() => {
    fetchResource();

    const interval = setInterval(() => fetchResource(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchResource, group, version, kind]);

  const resourceList = () => {
    if (resource.children) {
      return (
        <ResourceList
          loadResources={loadResources}
          resources={resource.children}
          workloads={new Map()}
          onResourceDelete={onResourceDelete}
        />
      );
    }
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
      <div
        style={{
          paddingLeft: "12px",
          paddingRight: "12px",
        }}
      >
        {resourceList()}
      </div>
    </div>
  );
};

export default DefaultResource;
