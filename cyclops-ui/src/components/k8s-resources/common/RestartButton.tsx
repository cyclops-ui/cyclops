import { Button, notification } from "antd";
import axios from "axios";
import React from "react";
import { mapResponseError } from "../../../utils/api/errors";

interface Props {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
}

export const RestartButton = ({
  group,
  version,
  kind,
  name,
  namespace,
}: Props) => {
  const handleRestart = (
    group: string,
    version: string,
    kind: string,
    name: string,
    namespace: string,
  ) => {
    axios
      .post(
        `/api/resources/restart?group=${group}&version=${version}&kind=${kind}&name=${name}&namespace=${namespace}`,
      )
      .then(() => {
        notification.success({
          message: "Restart Successful",
          description: `${kind} ${namespace}/${name} has been restarted successfully.`,
          duration: 10,
        });
      })
      .catch((error) => {
        notification.error({
          message: "Restart Failed: ",
          description: `${mapResponseError(error).description}`,
          duration: 10,
        });
      });
  };

  return (
    <Button
      onClick={() => {
        handleRestart(group, version, kind, name, namespace);
      }}
    >
      Restart
    </Button>
  );
};

export function canRestart(
  group: string,
  version: string,
  kind: string,
): boolean {
  return (
    group === "apps" &&
    version === "v1" &&
    (kind === "Deployment" || kind === "StatefulSet" || kind === "DaemonSet")
  );
}
