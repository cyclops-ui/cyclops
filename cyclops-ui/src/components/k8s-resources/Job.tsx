import React, { useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable";

interface Props {
  name: string;
  namespace: string;
}

const Job = ({ name, namespace }: Props) => {
  const [job, setJob] = useState({
    status: "",
    pods: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchJob() {
      axios
        .get(`/api/resources`, {
          params: {
            group: `batch`,
            version: `v1`,
            kind: `Job`,
            name: name,
            namespace: namespace,
          },
        })
        .then((res) => {
          setJob(res.data);
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchJob();
    const interval = setInterval(() => fetchJob(), 15000);
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
          Pods: {job.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable namespace={namespace} pods={job.pods} />
        </Col>
      </Row>
    </div>
  );
};

export default Job;
