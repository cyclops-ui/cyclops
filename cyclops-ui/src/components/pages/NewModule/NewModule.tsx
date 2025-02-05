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
  const { isDarkMode } = useTheme();

  return (
    <div style={{ backgroundColor: isDarkMode ? "#fff" : "#333" }}>
      <CreateModuleComponent
        themePalette={isDarkMode ? "light" : "dark"}
        getTemplateStore={getTemplateStore}
        getNamespaces={getNamespaces}
        getTemplate={getTemplate}
        getTemplateInitialValues={getTemplateInitialValues}
        submitModule={createModule}
        onSubmitModuleSuccess={(moduleName) => {
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
