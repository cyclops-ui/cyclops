import React from "react";
import { useParams } from "react-router-dom";

import { ModuleResourceDetails } from "../../shared";
import {
  deleteModule,
  deleteResource,
  fetchModuleRawManifest,
  fetchModuleRenderedManifest,
  fetchModuleResources,
  fetchResource,
  fetchResourceManifest,
  getModule,
  getPodLogs,
  reconcileModule,
  restartResource,
} from "../../../utils/api/api";
import { isStreamingEnabled } from "../../../utils/api/common";

const ModuleDetails = () => {
  let { moduleName } = useParams();

  return (
    <div>
      <ModuleResourceDetails
        name={moduleName}
        streamingDisabled={!isStreamingEnabled()}
        fetchModule={getModule}
        fetchModuleRawManifest={fetchModuleRawManifest}
        fetchModuleRenderedManifest={fetchModuleRenderedManifest}
        reconcileModule={reconcileModule}
        fetchModuleResources={fetchModuleResources}
        fetchResource={fetchResource}
        fetchResourceManifest={fetchResourceManifest}
        restartResource={restartResource}
        deleteResource={deleteResource}
        getPodLogs={getPodLogs}
        deleteModule={deleteModule}
        onDeleteModuleSuccess={() => {
          window.location.href = "/modules";
        }}
        downloadPodLogs={(
          namespace: string,
          podName: string,
          container: string,
        ) => {
          window.location.href =
            "/api/resources/pods/" +
            namespace +
            "/" +
            podName +
            "/" +
            container +
            "/logs/download";
        }}
        onEditModule={(moduleName: string) => {
          window.location.href = "/modules/" + moduleName + "/edit";
        }}
        onRollbackModule={(moduleName: string) => {
          window.location.href = "/modules/" + moduleName + "/rollback";
        }}
      />
    </div>
  );
};

export default ModuleDetails;
