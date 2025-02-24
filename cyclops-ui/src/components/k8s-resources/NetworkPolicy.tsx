import { Divider, Alert, Table, Spin } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { mapResponseError } from "../../utils/api/errors";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";
import ReactAce from "react-ace";
import YAML from "yaml";

interface Props {
  namespace: string;
  name: string;
}

interface NetworkPolicyData {
  pods: [];
  ingress: {};
  egress: {};
}

const NetworkPolicy = ({ namespace, name }: Props) => {
  const [loading, setLoading] = useState(true);
  const { fetchResource } = useResourceListActions();

  const [networkPolicy, setNetworkPolicy] = useState<NetworkPolicyData>({
    pods: [],
    ingress: {},
    egress: {},
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchNetworkPolicy = useCallback(() => {
    fetchResource("networking.k8s.io", "v1", "NetworkPolicy", namespace, name)()
      .then((res) => {
        setNetworkPolicy(res);
        setLoading(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoading(false);
      });
  }, [name, fetchResource]);

  useEffect(() => {
    fetchNetworkPolicy();

    const interval = setInterval(() => fetchNetworkPolicy(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchNetworkPolicy]);

  const editorHeight = (lines: number) => {
    if (lines > 20) {
      return "320px";
    } else {
      return `${lines * 16}px`;
    }
  };

  const stringifyRulesToYaml = (obj: any) => {
    try {
      return YAML.stringify(obj);
    } catch (error) {
      console.error("YAML stringify error:", error);
      return `YAML stringify error: ${error}`;
    }
  };

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
        Ingress
      </Divider>
      <ReactAce
        style={{
          width: "100%",
          height: editorHeight(
            stringifyRulesToYaml(networkPolicy.ingress).split("\n").length,
          ),
        }}
        mode={"sass"}
        value={stringifyRulesToYaml(networkPolicy.ingress)}
        readOnly={true}
      />
      <Divider
        style={{ fontSize: "120%" }}
        orientationMargin="0"
        orientation={"left"}
      >
        Egress
      </Divider>
      <ReactAce
        style={{
          width: "100%",
          height: editorHeight(
            stringifyRulesToYaml(networkPolicy.egress).split("\n").length,
          ),
        }}
        mode={"sass"}
        value={stringifyRulesToYaml(networkPolicy.egress)}
        readOnly={true}
      />
      <Divider
        style={{ fontSize: "120%" }}
        orientationMargin="0"
        orientation={"left"}
      >
        Target pods
      </Divider>
      <Table dataSource={networkPolicy.pods}>
        <Table.Column title={"Name"} dataIndex="name" />
        <Table.Column title={"Namespace"} dataIndex="namespace" />
      </Table>
    </div>
  );
};

export default NetworkPolicy;
