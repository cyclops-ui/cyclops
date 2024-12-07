import React, { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import { isStreamingEnabled } from "../../utils/api/common";
import { useModuleDetailsActions } from "../shared/ModuleResourceDetails/ModuleDetailsActionsContext";

interface Props {
  name: string;
  namespace: string;
  workload: any;
}

const StatefulSet = ({ name, namespace, workload }: Props) => {
  const { fetchResource } = useModuleDetailsActions();

  const [statefulSet, setStatefulSet] = useState({
    status: "",
    pods: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchStatefulSet = useCallback(() => {
    fetchResource("apps", "v1", "StatefulSet", namespace, name)()
      .then((res) => {
        setStatefulSet(res);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchStatefulSet();

    if (isStreamingEnabled()) {
      return;
    }

    const interval = setInterval(() => fetchStatefulSet(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchStatefulSet]);

  function getPods() {
    if (workload && isStreamingEnabled()) {
      return workload.pods;
    }

    return statefulSet.pods;
  }

  function getPodsLength() {
    let pods = getPods();

    if (Array.isArray(pods)) {
      return pods.length;
    }

    return 0;
  }

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

export default StatefulSet;
