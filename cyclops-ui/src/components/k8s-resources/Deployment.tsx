import React, { useEffect, useState } from "react";
import { Col, Divider, Row, Alert, Button, notification } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable";

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
    function fetchDeployment() {
      axios
        .get(`/api/resources`, {
          params: {
            group: `apps`,
            version: `v1`,
            kind: `Deployment`,
            name,
            namespace,
          },
        })
        .then((res) => {
          setDeployment(res.data);
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchDeployment();
    const interval = setInterval(() => fetchDeployment(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [name, namespace]);

  const handleRestart = () => {
    axios
      .post(
        `/api/resources/restart?group=apps&version=v1&kind=Deployment&name=${namespace}&namespace=${namespace}`,
      )
      .then(() => {
        notification.success({
          message: "Restart Successful",
          description: "The Deployment has been restarted successfully.",
          duration: 10,
        });
      })
      .catch((error) => {
        notification.error({
          message: "Restart Failed",
          description: `${mapResponseError(error).description}`,
          duration: 10,
        });
      });
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
        <Col>
          <Button
            style={{ marginTop: "10px" }}
            onClick={() => {
              handleRestart();
            }}
          >
            Restart
          </Button>
        </Col>
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Replicas: {deployment.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable namespace={namespace} pods={deployment.pods} />
        </Col>
      </Row>
    </div>
  );
};

export default Deployment;
