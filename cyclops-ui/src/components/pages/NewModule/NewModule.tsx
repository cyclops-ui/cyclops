import React from "react";
import { CreateModuleComponent } from "../../shared/CreateModule";
import {
  createModule,
  getNamespaces,
  getTemplate,
  getTemplateInitialValues,
  getTemplateStore,
} from "../../../utils/api/api";
import { useTheme } from "../../theme/ThemeContext";

const NewModule = () => {
  const { mode } = useTheme();

  return (
    <div>
      <CreateModuleComponent
        themePalette={mode}
        getTemplateStore={getTemplateStore}
        getNamespaces={getNamespaces}
        getTemplate={getTemplate}
        getTemplateInitialValues={getTemplateInitialValues}
        submitModule={createModule}
        onSubmitModuleSuccess={(moduleName, gitOpsWriteEnabled) => {
          if (gitOpsWriteEnabled) {
            window.location.href = "/modules";
            return;
          }

          window.location.href = "/modules/" + moduleName;
        }}
        onBackButton={() => {
          window.location.href = "/modules";
        }}
      />
    </div>
  );
};
export default NewModule;
