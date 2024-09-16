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
  onStatusUpdate: (status: string) => void;
}

interface Statefulset {
  status: string;
  pods: any[];
}

const StatefulSet = ({ name, namespace, onStatusUpdate }: Props) => {
  const [statefulSet, setStatefulSet] = useState<Statefulset>({
    status: "",
    pods: [],
  });

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    if (isStreamingEnabled()) {
      resourceStream(`apps`, `v1`, `StatefulSet`, name, namespace, (r: any) => {
        setStatefulSet(r);
        onStatusUpdate(r.status);
      });
    }
  }, [name, namespace]);

  const fetchStatefulSet = useCallback(() => {
    axios
      .get(`/api/resources`, {
        params: {
          group: `apps`,
          version: `v1`,
          kind: `StatefulSet`,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setStatefulSet(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [name, namespace]);

  useEffect(() => {
    fetchStatefulSet();

    if (isStreamingEnabled()) {
      return () => {};
    }

    const interval = setInterval(() => fetchStatefulSet(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchStatefulSet]);

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
          Replicas: {statefulSet.pods.length}
        </Divider>
        <Col span={24} style={{ overflowX: "auto" }}>
          <PodTable
            namespace={namespace}
            pods={statefulSet.pods}
            updateResourceData={fetchStatefulSet}
          />
        </Col>
      </Row>
    </div>
  );
};

export default StatefulSet;
