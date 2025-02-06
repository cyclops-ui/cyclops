import React from "react";

import { useParams } from "react-router-dom";

import "./custom.css";
import { EditModuleComponent } from "../../shared";
import {
  getModule,
  getTemplate,
  getTemplateInitialValues,
  updateModule,
} from "../../../utils/api/api";
import { useTheme } from "../../theme/ThemeContext";

const EditModule = () => {
  let { moduleName } = useParams();
  const { mode } = useTheme();

  return (
    <EditModuleComponent
      themePalette={mode}
      moduleName={moduleName}
      fetchModule={getModule}
      getTemplate={getTemplate}
      getTemplateInitialValues={getTemplateInitialValues}
      updateModule={updateModule}
      onUpdateModuleSuccess={(moduleName) => {
        window.location.href = "/modules/" + moduleName;
      }}
      onBackButton={(moduleName) => {
        window.location.href = "/modules/" + moduleName;
      }}
    />
  );
};

export default EditModule;
