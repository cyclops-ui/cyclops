import React, { useCallback, useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import { resourceStream } from "../../utils/api/sse/resources";
import { isStreamingEnabled } from "../../utils/api/common";

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
    if (isStreamingEnabled()) {
      resourceStream(`apps`, `v1`, `DaemonSet`, name, namespace, (r: any) => {
        setDaemonSet(r);
      });
    }
  }, [name, namespace]);

  const fetchDaemonSet = useCallback(() => {
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
  }, [name, namespace]);

  useEffect(() => {
    fetchDaemonSet();

    if (isStreamingEnabled()) {
      return () => {};
    }

    const interval = setInterval(() => fetchDaemonSet(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchDaemonSet]);

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
          <PodTable
            namespace={namespace}
            pods={daemonSet.pods}
            updateResourceData={fetchDaemonSet}
          />
        </Col>
      </Row>
    </div>
  );
};

export default DaemonSet;
