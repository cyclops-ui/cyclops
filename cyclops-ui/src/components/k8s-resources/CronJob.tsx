import React, { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert, Spin } from "antd";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";

interface Props {
  name: string;
  namespace: string;
}

const CronJob = ({ name, namespace }: Props) => {
  const { fetchResource } = useResourceListActions();

  const [loading, setLoading] = useState(true);

  const [cronjob, setCronjob] = useState({
    status: "",
    pods: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const fetchCronJob = useCallback(() => {
    fetchResource("batch", "v1", "CronJob", namespace, name)()
      .then((res) => {
        setCronjob(res);
        setLoading(false);
      })
      .catch((error) => {
        setError(mapResponseError(error));
        setLoading(false);
      });
  }, [name, namespace, fetchResource]);

  useEffect(() => {
    fetchCronJob();
    const interval = setInterval(() => fetchCronJob(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchCronJob]);

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
          Pods: {cronjob.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable
            namespace={namespace}
            pods={cronjob.pods}
            updateResourceData={fetchCronJob}
          />
        </Col>
      </Row>
    </div>
  );
};

export default CronJob;
