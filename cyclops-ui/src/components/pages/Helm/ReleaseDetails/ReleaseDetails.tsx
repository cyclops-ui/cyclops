import React from "react";
import "ace-builds/src-noconflict/ace";
import { useParams } from "react-router-dom";

import "ace-builds/src-noconflict/mode-jsx";

import { isStreamingEnabled } from "../../../../utils/api/common";
import { HelmReleaseDetails } from "../../../shared/HelmReleaseDetails";
import {
  getHelmRelease,
  getHelmReleaseResources,
  uninstallHelmRelease,
} from "../../../../utils/api/helm";
import {
  deleteResource,
  fetchResource,
  fetchResourceManifest,
  getPodLogs,
  restartResource,
} from "../../../../utils/api/api";

const ReleaseDetails = () => {
  let { releaseNamespace, releaseName } = useParams();

  return (
    <HelmReleaseDetails
      releaseName={releaseName}
      releaseNamespace={releaseNamespace}
      streamingDisabled={!isStreamingEnabled()}
      getRelease={getHelmRelease}
      uninstallRelease={uninstallHelmRelease}
      fetchHelmReleaseResources={getHelmReleaseResources}
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
  );
};

export default ReleaseDetails;
