import React from "react";
import { HelmReleaseEdit } from "../../../shared/HelmReleaseEdit";
import {
  getHelmReleaseFields,
  getHelmReleaseValues,
  upgradeHelmRelease,
} from "../../../../utils/api/helm";
import { useTheme } from "../../../theme/ThemeContext";

const EditRelease = () => {
  const { mode } = useTheme();

  return (
    <HelmReleaseEdit
      themePalette={mode}
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
