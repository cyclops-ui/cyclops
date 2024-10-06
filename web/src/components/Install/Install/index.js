import React from "react";
import styles from "./styles.module.css";

import CodeBlockString from "@docusaurus/theme-classic/lib/theme/CodeBlock/Content/String";

const InstallCmd = () => {
  return (
    <center className={styles.command}>
      <h2 className={styles.commandDesc}>Install it with a single command</h2>
      <CodeBlockString language={"sh"}>
        {"kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.13.1/install/cyclops-install.yaml && \n" +
          "kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/v0.13.1/install/demo-templates.yaml"}
      </CodeBlockString>
    </center>
  );
};

export default InstallCmd;
