import React from "react";

import { useSearchParams } from "react-router-dom";

import { HelmReleaseEdit } from "../../../shared/HelmReleaseEdit/HelmReleaseEdit";
import {
  getHelmRelease,
  getHelmReleaseValues,
  migrateHelmRelease,
} from "../../../../utils/api/helm";
import { getTemplate } from "../../../../utils/api/api";

const MigrateRelease = () => {
  const [searchParams] = useSearchParams();
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const version = searchParams.get("version");

  return (
    <HelmReleaseEdit
      themePalette={"light"}
      themeColor={""}
      fetchHelmRelease={getHelmRelease}
      fetchHelmChartFields={() => {
        return getTemplate(repo, path, version, "");
      }}
      fetchHelmReleaseValues={getHelmReleaseValues}
      submitHelmReleaseUpdate={(releaseNamespace, releaseName, values) => {
        return migrateHelmRelease(releaseNamespace, releaseName, values, {
          repo: repo,
          path: path,
          version: version,
        });
      }}
      onSubmitSuccess={(releaseNamespace, releaseName) => {
        window.location.href = `/modules/${releaseName}`;
      }}
      onBackButton={(releaseNamespace, releaseName) => {
        window.location.href = `/modules/${releaseName}`;
      }}
    />
  );
};

export default MigrateRelease;
