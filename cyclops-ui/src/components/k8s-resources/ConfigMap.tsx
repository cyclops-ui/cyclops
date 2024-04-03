import React, { useEffect, useState } from "react";
import { Divider, Row, Alert, Descriptions } from "antd";
import axios from "axios";
import ReactAce from "react-ace";

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
        if (error?.response?.data) {
          setError({
            message: error.response.data.message || String(error),
            description:
              error.response.data.description ||
              "Check if Cyclops backend is available on: " +
                window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        } else {
          setError({
            message: String(error),
            description:
              "Check if Cyclops backend is available on: " +
              window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST,
          });
        }
      });
  }

  useEffect(() => {
    fetchConfigMap();
    const interval = setInterval(() => fetchConfigMap(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const configMapData = (configMap: any) => {
    if (configMap.data) {
      return (
        <Descriptions style={{ width: "100%" }} bordered>
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
        return "json";
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
