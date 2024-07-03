import axios from "axios";
import React, { useEffect, useState } from "react";
import { mapResponseError } from "../../utils/api/errors";
import { Alert, Descriptions, Divider, Table } from "antd";

interface Props {
  name: string;
  namespace: string;
}

interface secret {
  type: string;
  dataKeys: string[];
}

const Secret = ({ name, namespace }: Props) => {
  const [secret, setSecret] = useState<secret>({
    type: "",
    dataKeys: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchSecret() {
      axios
        .get(`/api/resources`, {
          params: {
            group: ``,
            version: `v1`,
            kind: `Secret`,
            name: name,
            namespace: namespace,
          },
        })
        .then((res) => {
          setSecret({
            type: res.data.type,
            dataKeys: res.data.dataKeys,
          });
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchSecret();
    const interval = setInterval(() => fetchSecret(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [name, namespace]);

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
