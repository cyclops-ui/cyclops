import { Button, notification } from "antd";
import React from "react";
import { mapResponseError } from "../../../utils/api/errors";
import { UndoOutlined } from "@ant-design/icons";

interface Props {
  group: string;
  version: string;
  kind: string;
  name: string;
  namespace: string;
  restartResource?: (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => Promise<boolean>;
}

export const RestartButton = ({
  group,
  version,
  kind,
  name,
  namespace,
  restartResource,
}: Props) => {
  const handleRestart = (
    group: string,
    version: string,
    kind: string,
    namespace: string,
    name: string,
  ) => {
    restartResource(group, version, kind, namespace, name)
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
        handleRestart(group, version, kind, namespace, name);
      }}
    >
      <UndoOutlined />
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
