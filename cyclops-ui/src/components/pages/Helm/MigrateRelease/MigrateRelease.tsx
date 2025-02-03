import React from "react";

import { useSearchParams } from "react-router-dom";

import { HelmReleaseEdit } from "../../../shared/HelmReleaseEdit";
import {
  getHelmReleaseValues,
  migrateHelmRelease,
} from "../../../../utils/api/helm";
import { getTemplate } from "../../../../utils/api/api";
import { InfoCircleOutlined } from "@ant-design/icons";
import { Alert } from "antd";

const MigrateRelease = () => {
  const [searchParams] = useSearchParams();
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const version = searchParams.get("version");

  return (
    <div>
      <Alert
        message={
          <div>
            <InfoCircleOutlined
              style={{
                paddingRight: "5px",
                color: "#1890ff",
                fontSize: "24px",
                verticalAlign: "middle",
              }}
            />
            Migrating Helm release
          </div>
        }
        description={
          "Migration from Helm releases to Cyclops Modules will retain the existing resources, but releases will not be visible in the the Cyclops UI or the `helm ls` command. In case you want to revert to Helm releases, you can just reinstall them."
        }
        type="info"
        style={{
          borderColor: "#1890ff",
          borderWidth: "1.5px",
          marginBottom: "16px",
        }}
      />
      <HelmReleaseEdit
        themePalette={"light"}
        themeColor={""}
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
          window.location.href = `/helm/releases/${releaseNamespace}/${releaseName}`;
        }}
      />
    </div>
  );
};

export default MigrateRelease;
