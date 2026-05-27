import React from "react";
import { Button, Divider, Spin, Tooltip } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import "ace-builds/src-noconflict/mode-sass";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-twilight";
import ReactAce from "react-ace";

interface Props {
  content: string;
  loading: boolean;
  mode: "light" | "dark";
}

const ManifestContent = ({ content, loading, mode }: Props) => {
  if (loading) {
    return <Spin />;
  }

  return (
    <div>
      <Divider />
      <div style={{ position: "relative" }}>
        <ReactAce
          mode={"sass"}
          theme={mode === "light" ? "github" : "twilight"}
          fontSize={12}
          showPrintMargin={true}
          showGutter={true}
          highlightActiveLine={true}
          readOnly={true}
          setOptions={{
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: false,
            showLineNumbers: true,
            tabSize: 4,
            useWorker: false,
          }}
          style={{
            width: "100%",
          }}
          value={content}
        />
        <Tooltip title={"Copy manifest"} trigger="hover">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(content);
            }}
            style={{
              position: "absolute",
              right: "20px",
              top: "10px",
            }}
          >
            <CopyOutlined
              style={{
                fontSize: "20px",
              }}
            />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default ManifestContent;
