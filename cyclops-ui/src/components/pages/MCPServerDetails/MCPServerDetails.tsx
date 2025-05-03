import React, { useEffect, useState } from "react";

import { ModuleResourceDetails } from "../../shared";
import {
  deleteModule,
  deleteResource,
  fetchModuleRawManifest,
  fetchModuleRenderedManifest,
  fetchModuleResources,
  fetchResource,
  fetchResourceManifest,
  getModule,
  getPodLogs,
  reconcileModule,
  restartResource,
} from "../../../utils/api/api";
import { isStreamingEnabled } from "../../../utils/api/common";
import { useTheme } from "../../theme/ThemeContext";
import axios from "axios";
import { mapResponseError } from "../../../utils/api/errors";
import Title from "antd/es/typography/Title";
import { Alert, Button, Col, Row } from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import MarkdownViewer from "./MarkdownViewer";

const MCPServerDetails = () => {
  const { mode } = useTheme();

  const [mcpServerStatus, setMcpServerStatus] = useState<
    "installed" | "pending" | "none"
  >("none");

  const [error, setError] = useState({
    message: "",
    description: "",
  });

  useEffect(() => {
    function fetchMCPStatus() {
      axios
        .get(`/api/modules/mcp/status`)
        .then((res) => {
          if (res.data?.installed === true) {
            setMcpServerStatus("installed");
          }
        })
        .catch((error) => {
          setError(mapResponseError(error));
        });
    }

    fetchMCPStatus();
    const interval = setInterval(() => fetchMCPStatus(), 10000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleInstallMCP = () => {
    setMcpServerStatus("pending");
    axios
      .post(`/api/modules/mcp/install`)
      .then(() => {
        setMcpServerStatus("installed");
      })
      .catch((error) => {
        setMcpServerStatus("none");
        setError(mapResponseError(error));
      });
  };

  return (
    <div>
      {error.message.length !== 0 && (
        <Alert
          message={error.message}
          description={error.description}
          type="error"
          closable
          afterClose={() => {
            setError({
              message: "",
              description: "",
            });
          }}
          style={{ marginBottom: "20px" }}
        />
      )}
      {mcpServerStatus === "installed" ? (
        <ModuleResourceDetails
          themePalette={mode}
          name={"mcp-cyclops"}
          streamingDisabled={!isStreamingEnabled()}
          fetchModule={getModule}
          fetchModuleRawManifest={fetchModuleRawManifest}
          fetchModuleRenderedManifest={fetchModuleRenderedManifest}
          reconcileModule={reconcileModule}
          fetchModuleResources={fetchModuleResources}
          fetchResource={fetchResource}
          fetchResourceManifest={fetchResourceManifest}
          restartResource={restartResource}
          deleteResource={deleteResource}
          getPodLogs={getPodLogs}
          deleteModule={deleteModule}
          onDeleteModuleSuccess={() => {
            window.location.href = "/modules";
          }}
          downloadPodLogs={(
            namespace: string,
            podName: string,
            container: string,
          ) => {
            window.location.href =
              "/api/resources/pods/" +
              namespace +
              "/" +
              podName +
              "/" +
              container +
              "/logs/download";
          }}
          onEditModule={(moduleName: string) => {
            window.location.href = "/modules/mcp-cyclops/edit";
          }}
          onRollbackModule={(moduleName: string) => {
            window.location.href = "/modules/mcp-cyclops/rollback";
          }}
        />
      ) : (
        <div>
          <Title>mcp-cyclops</Title>
          <Row gutter={[16, 0]}>
            <Col span={6}>
              <Button
                onClick={handleInstallMCP}
                block
                type={"primary"}
                style={{
                  fontWeight: "600",
                }}
              >
                <PlusCircleOutlined />
                Install Cyclops MCP server
              </Button>
            </Col>
          </Row>
          <Row gutter={[16, 0]} style={{ padding: "16px" }}>
            <MarkdownViewer
              url={
                "https://raw.githubusercontent.com/cyclops-ui/mcp-cyclops/refs/heads/main/cyclops-addon.md"
              }
            />
          </Row>
        </div>
      )}
    </div>
  );
};

export default MCPServerDetails;
