import React, { useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable";

interface Props {
  name: string;
  namespace: string;
}

const CronJob = ({ name, namespace }: Props) => {
  const [cronjob, setCronjob] = useState({
    status: "",
    pods: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  function fetchCronJob() {
    axios
      .get(`/api/resources`, {
        params: {
          group: `batch`,
          version: `v1`,
          kind: `CronJob`,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setCronjob(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }

  useEffect(() => {
    fetchCronJob();
    const interval = setInterval(() => fetchCronJob(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, []);

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
          Pods: {cronjob.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable namespace={namespace} pods={cronjob.pods} />
        </Col>
      </Row>
    </div>
  );
};

export default CronJob;
