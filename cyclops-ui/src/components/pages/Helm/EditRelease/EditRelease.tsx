import React from "react";
import { HelmReleaseEdit } from "../../../shared/HelmReleaseEdit";
import {
  getHelmReleaseFields,
  getHelmReleaseValues,
  upgradeHelmRelease,
} from "../../../../utils/api/helm";

const EditRelease = () => {
  return (
    <HelmReleaseEdit
      themePalette={"light"}
      themeColor={""}
      fetchHelmChartFields={getHelmReleaseFields}
      fetchHelmReleaseValues={getHelmReleaseValues}
      submitHelmReleaseUpdate={upgradeHelmRelease}
      onSubmitSuccess={(releaseNamespace, releaseName) => {
        window.location.href = `/helm/releases/${releaseNamespace}/${releaseName}`;
      }}
      onBackButton={(releaseNamespace, releaseName) => {
        window.location.href = `/helm/releases/${releaseNamespace}/${releaseName}`;
      }}
    />
  );
};
export default EditRelease;
