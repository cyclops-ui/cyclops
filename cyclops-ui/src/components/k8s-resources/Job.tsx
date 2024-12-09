import React, { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";

interface Props {
  name: string;
  namespace: string;
}

const Job = ({ name, namespace }: Props) => {
  const { fetchResource } = useResourceListActions();

  const [job, setJob] = useState({
    status: "",
    pods: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchJob = useCallback(() => {
    fetchResource("batch", "v1", "Job", namespace, name)()
      .then((res) => {
        setJob(res);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchJob();
    const interval = setInterval(() => fetchJob(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchJob]);

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
          <PodTable
            namespace={namespace}
            pods={job.pods}
            updateResourceData={fetchJob}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Job;
