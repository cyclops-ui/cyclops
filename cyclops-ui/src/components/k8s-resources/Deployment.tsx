import React, { useEffect, useState } from "react";
import { Col, Divider, Row, Alert } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import PodTable from "./common/PodTable/PodTable";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

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
    console.log("sse start");

    // const eventSource = new EventSource(`/api/stream/resources?group=apps&version=v1&kind=Deployment&name=${name}&namespace=${namespace}`);
    //
    // eventSource.onopen = function() {
    //   console.log("sse otvorio onopen");
    // };
    //
    // eventSource.onmessage = function(event) {
    //   console.log("sse Received data: ", event);
    // };
    //
    // eventSource.onerror = function(event) {
    //   console.log("sse Connection lost. Retrying...");
    // };

    fetchEventSource(`/api/stream/resources`, {
      method: "POST",
      body: JSON.stringify({
        group: `apps`,
        version: `v1`,
        kind: `Deployment`,
        name: name,
        namespace: namespace,
      }),
      onmessage(ev) {
        setDeployment(JSON.parse(ev.data));
      },
      onerror: (err) => {
        console.error("Error occurred:", err);
      },
      async onopen(response) {
        if (
          response.ok &&
          response.headers.get("content-type") === EventStreamContentType
        ) {
          console.log("sse onopen all good");
          return; // everything's good
        } else if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          // client-side errors are usually non-retriable:
          console.log("sse error client-side errors are usually non-retriable");
        } else {
          console.log("sse error retry");
        }
      },
      onclose: () => {
        console.log("sse prekinuo");
      },
    })
      .then((r) => console.log("sse THEN"))
      .catch((r) => console.log("see CATCH"));
  }, [name, namespace]);

  useEffect(() => {
    function fetchDeployment() {
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
    }

    fetchDeployment();
    // const interval = setInterval(() => fetchDeployment(), 15000);
    // return () => {
    //   clearInterval(interval);
    // };
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
