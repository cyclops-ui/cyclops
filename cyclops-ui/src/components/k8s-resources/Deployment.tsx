import { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert, Spin } from "antd";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import { isStreamingEnabled } from "../../utils/api/common";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";

interface Props {
  name: string;
  namespace: string;
  workload: any;
}

const Deployment = ({ name, namespace, workload }: Props) => {
  const { fetchResource, streamingDisabled } = useResourceListActions();

  const [loading, setLoading] = useState(true);

  const [deployment, setDeployment] = useState({
    status: "",
    pods: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchDeployment = useCallback(() => {
    fetchResource("apps", "v1", "Deployment", namespace, name)()
      .then((res) => {
        setDeployment(res);
        setLoading(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoading(false);
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchDeployment();

    if (isStreamingEnabled()) {
      return;
    }

    const interval = setInterval(() => fetchDeployment(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchDeployment]);

  function getPods() {
    if (workload && !streamingDisabled) {
      return workload.pods;
    }

    return deployment.pods;
  }

  function getPodsLength() {
    let pods = getPods();

    if (Array.isArray(pods)) {
      return pods.length;
    }

    return 0;
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
      <Row>
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Replicas: {getPodsLength()}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable
            namespace={namespace}
            pods={getPods()}
            updateResourceData={() => {}}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Deployment;
