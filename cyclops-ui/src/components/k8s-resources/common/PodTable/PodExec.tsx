import { CodeOutlined, CopyOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useState } from "react";
import "ace-builds/src-noconflict/ext-searchbox";
import { useTheme } from "../../../theme/ThemeContext";

interface PodExecProps {
  pod: any;
}

const PodExec = ({ pod }: PodExecProps) => {
  const { mode } = useTheme();

  const [openExecModal, setOpenExecModal] = useState(false);

  const execCommand = (
    <div>
      <span style={{ color: mode === "light" ? "navy" : "lightblue" }}>
        kubectl{" "}
      </span>
      <span>exec -n </span>
      <span style={{ color: "#CC6903" }}>{pod.namespace} </span>
      <span>-it </span>
      <span style={{ color: "#CC6903" }}>{pod.name} </span>
      <span>-- sh</span>
    </div>
  );

  return (
    <>
      <Button
        style={{ width: "100%" }}
        onClick={() => {
          setOpenExecModal(true);
        }}
      >
        <h4 style={{ margin: "0" }}>
          <CodeOutlined style={{ paddingRight: "5px" }} />
          Exec to pod
        </h4>
      </Button>
      <Modal
        title="Copy exec command"
        open={openExecModal}
        onCancel={() => {
          setOpenExecModal(false);
        }}
        cancelButtonProps={{ style: { display: "none" } }}
        okButtonProps={{ style: { display: "none" } }}
        style={{ zIndex: 100 }}
        width={"60%"}
      >
        <div style={{ paddingTop: "8px", paddingBottom: "4px" }}>
          Copy the command below and run it from your terminal to exec into the
          pod:
        </div>
        <pre
          style={{
            background: mode === "light" ? "#f5f5f5" : "#383838",
            padding: "10px",
            borderRadius: "5px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "50px",
          }}
        >
          {execCommand}
          <Button
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(
                `kubectl exec -n ${pod.namespace} -it ${pod.name} -- sh`,
              );
            }}
            style={{
              position: "relative", // No need for absolute, since flexbox handles it
              padding: "2px 8px",
              fontSize: "12px",
            }}
          />
        </pre>
      </Modal>
    </>
  );
};

export default PodExec;
