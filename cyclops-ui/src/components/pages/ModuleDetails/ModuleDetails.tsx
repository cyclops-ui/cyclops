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
        deleteModule={deleteModule}
        fetchModuleResources={fetchModuleResources}
        fetchResource={fetchResource}
        fetchResourceManifest={fetchResourceManifest}
        restartResource={restartResource}
        deleteResource={deleteResource}
        getPodLogs={getPodLogs}
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
      />
    </div>
  );
};

export default ModuleDetails;
