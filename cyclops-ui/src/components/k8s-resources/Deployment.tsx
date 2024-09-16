import React, { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import { resourceStream } from "../../utils/api/sse/resources";
import { isStreamingEnabled } from "../../utils/api/common";
import { ResourceRef } from "../../utils/resourceRef";

interface Props {
  name: string;
  namespace: string;
}

const Deployment = ({ name, namespace }: Props) => {
  const [deployment, setDeployment] = useState({
    status: "",
    pods: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    if (isStreamingEnabled()) {
      resourceStream(`apps`, `v1`, `Deployment`, name, namespace, (r: any) => {
        setDeployment(r);
      });
    }
  }, [name, namespace]);

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

    if (isStreamingEnabled()) {
      return () => {};
    }

    const interval = setInterval(() => fetchDeployment(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchDeployment]);

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
          Replicas: {deployment.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable
            namespace={namespace}
            pods={deployment.pods}
            updateResourceData={fetchDeployment}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Deployment;
