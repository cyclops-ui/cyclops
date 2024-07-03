import React, { useEffect, useState } from "react";
import { Divider, Row, Alert, Descriptions } from "antd";
import axios from "axios";
import ReactAce from "react-ace";
import { mapResponseError } from "../../utils/api/errors";

interface Props {
  name: string;
  namespace: string;
}

const ConfigMap = ({ name, namespace }: Props) => {
  const [configMap, setConfigMap] = useState({});
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchConfigMap() {
      axios
        .get(`/api/resources`, {
          params: {
            group: ``,
            version: `v1`,
            kind: `ConfigMap`,
            name: name,
            namespace: namespace,
          },
        })
        .then((res) => {
          setConfigMap(res.data);
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchConfigMap();
    const interval = setInterval(() => fetchConfigMap(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [name, namespace]);

  const configMapData = (configMap: any) => {
    if (configMap.data) {
      return (
        <Descriptions style={{ width: "100%" }} bordered column={1}>
          {Object.entries<string>(configMap.data).map(([key, dataValue]) => (
            <Descriptions.Item
              key={key}
              labelStyle={{ width: "20%" }}
              label={key}
              span={24}
            >
              {configMapDataValues(key, dataValue)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      );
    }
  };

  const configMapDataValues = (key: string, data: string) => {
    if (configMapDataExtension(key) === "json") {
      data = JSON.stringify(JSON.parse(data), null, 2);
    }

    const lines = data.split("\n").length;

    if (lines > 1) {
      return (
        <ReactAce
          setOptions={{ useWorker: false }}
          value={data}
          readOnly={true}
          width="100%"
          mode={configMapDataExtension(key)}
          height={calculateEditorHeight(lines)}
        />
      );
    } else {
      return data;
    }
  };

  const calculateEditorHeight = (lines: number) => {
    if (lines > 20) {
      return "320px";
    } else {
      return `${lines * 16}px`;
    }
  };

  const configMapDataExtension = (filename: string) => {
    const ext = filename.split(".").pop();
    switch (ext) {
      case "json":
        return "json";
      default:
        return "text";
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
      <Row>
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Data:
        </Divider>
        {configMapData(configMap)}
      </Row>
    </div>
  );
};

export default ConfigMap;
