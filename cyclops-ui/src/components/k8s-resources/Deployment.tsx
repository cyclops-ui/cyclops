import { Alert, Col, Divider, Row } from "antd";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { isStreamingEnabled } from "../../utils/api/common";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import ReplicaSetProgress from "./common/ReplicaSetProgress";

interface Props {
  name: string;
  namespace: string;
  workload: any;
}

const Deployment = ({ name, namespace, workload }: Props) => {
  const [deployment, setDeployment] = useState({
    status: "",
    pods: [],
    replicas: 0,
    activeReplicaSet: "",
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchDeployment = useCallback(() => {
    axios
      .get(`/api/resources`, {
        params: {
          group: `apps`,
          version: `v1`,
          kind: `Deployment`,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setDeployment(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name, namespace]);

  useEffect(() => {
    fetchDeployment();

    const interval = setInterval(() => fetchDeployment(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchDeployment]);

  function getPods() {
    if (workload && isStreamingEnabled()) {
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

  const { pods, replicas, activeReplicaSet } = deployment;

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
          {replicas && activeReplicaSet && (
            <ReplicaSetProgress
              pods={pods}
              replicas={replicas}
              activeReplicaSet={activeReplicaSet}
            />
          )}
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
