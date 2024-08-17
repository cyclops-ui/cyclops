import React, { useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable";

interface Props {
  name: string;
  namespace: string;
}

const DaemonSet = ({ name, namespace }: Props) => {
  const [daemonSet, setDaemonSet] = useState({
    status: "",
    pods: [],
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchDaemonSet() {
      axios
        .get(`/api/resources`, {
          params: {
            group: `apps`,
            version: `v1`,
            kind: `DaemonSet`,
            name: name,
            namespace: namespace,
          },
        })
        .then((res) => {
          setDaemonSet(res.data);
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchDaemonSet();
    const interval = setInterval(() => fetchDaemonSet(), 15000);
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
      <Row>
        <Divider
          style={{ fontSize: "120%" }}
          orientationMargin="0"
          orientation={"left"}
        >
          Pods: {daemonSet.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable namespace={namespace} pods={daemonSet.pods} />
        </Col>
      </Row>
    </div>
  );
};

export default DaemonSet;
