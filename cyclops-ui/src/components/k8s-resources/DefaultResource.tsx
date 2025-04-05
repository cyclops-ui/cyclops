import React, { useCallback, useEffect, useState } from "react";
import { Alert, Descriptions } from "antd";
import axios from "axios";
import { mapResponseError } from "../../utils/api/errors";
import ResourceList from "./ResourceList/ResourceList";
import { useResourceListActions } from "./ResourceList/ResourceListActionsContext";
import { Workload } from "../../utils/k8s/workload";
import { ResourceRef, resourceRefKey } from "../../utils/resourceRef";
import { resourcesStream } from "../../utils/api/sse/resources";

interface Props {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
  onResourceDelete: () => void;
}

const DefaultResource = ({
  group,
  version,
  kind,
  name,
  namespace,
  onResourceDelete,
}: Props) => {
  const { streamingDisabled, resourceStreamImplementation } =
    useResourceListActions();

  const [resource, setResource] = useState<{
    children: any[];
    additionalPrinterColumns: Record<string, any>;
  }>({
    children: [],
    additionalPrinterColumns: {},
  });
  const [workloads, setWorkloads] = useState<Map<string, Workload>>(new Map());

  function putWorkload(ref: ResourceRef, workload: Workload) {
    let k = resourceRefKey(ref);

    setWorkloads((prev) => {
      const s = new Map(prev);
      s.set(k, workload);
      return s;
    });
  }

  const [error, setError] = useState({
    message: "",
    description: "",
  });
  const [loadResources, setLoadResources] = useState(false);

  const fetchResource = useCallback(() => {
    axios
      .get(`/api/resources`, {
        params: {
          group: group,
          version: version,
          kind: kind,
          name: name,
          namespace: namespace,
        },
      })
      .then((res) => {
        setResource(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      })
      .finally(() => {
        setLoadResources(true);
      });
  }, [name, namespace, group, version, kind]);

  useEffect(() => {
    fetchResource();

    const interval = setInterval(() => fetchResource(), 15000);
    return () => {
      clearInterval(interval);
    };
  }, [fetchResource]);

  useEffect(() => {
    if (!streamingDisabled) {
      resourcesStream(
        `/stream/resources/crd?group=${group}&version=${version}&kind=${kind}&namespace=${namespace}&name=${name}`,
        (r: any) => {
          let resourceRef: ResourceRef = {
            group: r.group,
            version: r.version,
            kind: r.kind,
            name: r.name,
            namespace: r.namespace,
          };

          putWorkload(resourceRef, r);
        },
        resourceStreamImplementation,
      );
    }
  }, [
    group,
    version,
    kind,
    namespace,
    name,
    streamingDisabled,
    resourceStreamImplementation,
  ]);

  const additionalPrinterColumns = (
    additionalPrinterColumns: Record<string, any>,
  ) => {
    const entries = Object.entries<string>(additionalPrinterColumns ?? {});

    if (entries.length === 0) return;

    return (
      <Descriptions
        style={{ width: "100%", paddingTop: "24px" }}
        size={"small"}
        bordered
        column={1}
      >
        {Object.entries<string>(additionalPrinterColumns).map(
          ([key, dataValue]) => (
            <Descriptions.Item
              key={key}
              labelStyle={{ width: "40%" }}
              label={key}
              span={24}
            >
              {dataValue}
            </Descriptions.Item>
          ),
        )}
      </Descriptions>
    );
  };

  const resourceList = () => {
    if (resource.children) {
      return (
        <ResourceList
          loadResources={loadResources}
          resources={resource.children}
          workloads={workloads}
          onResourceDelete={onResourceDelete}
        />
      );
    }
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
      <div
        style={{
          paddingLeft: "12px",
          paddingRight: "12px",
        }}
      >
        {additionalPrinterColumns(resource.additionalPrinterColumns)}
        {resourceList()}
      </div>
    </div>
  );
};

export default DefaultResource;
