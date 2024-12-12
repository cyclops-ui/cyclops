import React, { useCallback, useEffect, useState } from "react";
import { mapResponseError } from "../../utils/api/errors";
import { Alert, Descriptions, Divider, Spin } from "antd";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";

interface Props {
  name: string;
  namespace: string;
}

interface secret {
  type: string;
  dataKeys: string[];
}

const Secret = ({ name, namespace }: Props) => {
  const { fetchResource } = useResourceListActions();

  const [loading, setLoading] = useState(true);
  const [secret, setSecret] = useState<secret>({
    type: "",
    dataKeys: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchSecret = useCallback(() => {
    fetchResource("", "v1", "Secret", namespace, name)()
      .then((res) => {
        setSecret({
          type: res.type,
          dataKeys: res.dataKeys,
        });
        setLoading(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoading(false);
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchSecret();
    const interval = setInterval(() => fetchSecret(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchSecret]);

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
        Type: {secret.type}
      </Divider>

      <Descriptions style={{ width: "100%" }} bordered column={1}>
        {secret.dataKeys.map((key, index) => (
          <Descriptions.Item
            key={index}
            labelStyle={{ width: "20%" }}
            label={key}
            span={1}
          >
            ****
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};

export default Secret;
