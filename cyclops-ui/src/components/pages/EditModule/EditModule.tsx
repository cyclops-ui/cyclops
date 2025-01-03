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

const EditModule = () => {
  let { moduleName } = useParams();

  return (
    <EditModuleComponent
      moduleName={moduleName}
      fetchModule={getModule}
      getTemplate={getTemplate}
      getTemplateInitialValues={getTemplateInitialValues}
      updateModule={updateModule}
      onUpdateModuleSuccess={(moduleName) => {
        window.location.href = "/modules/" + moduleName;
      }}
    />
  );
};

export default EditModule;
