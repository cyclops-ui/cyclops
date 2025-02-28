import { CopyOutlined, FileTextOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Modal, Tooltip } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { useCallback, useEffect, useState } from "react";
import ReactAce from "react-ace/lib/ace";
import { useResourceListActions } from "../../ResourceList/ResourceListActionsContext";
import { useTheme } from "../../../theme/ThemeContext";

interface PodManifestProps {
  pod: any;
}

const PodManifest = ({ pod }: PodManifestProps) => {
  const { mode } = useTheme();

  const { fetchResourceManifest } = useResourceListActions();

  const [manifest, setManifest] = useState("");
  const [showManagedFields, setShowManagedFields] = useState(false);
  const [modal, setModal] = useState({
    on: false,
  });
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const closeModal = () => {
    setModal({
      on: false,
    });
    setManifest("");
  };

  const fetchManifest = useCallback(async () => {
    if (modal.on) {
      const { name, namespace } = pod;
      fetchResourceManifest(
        "",
        "v1",
        "Pod",
        namespace.length ? namespace : "default",
        name,
        showManagedFields,
      ).then((manifest) => {
        setManifest(manifest);
      });
    }
  }, [pod, showManagedFields, modal, fetchResourceManifest]);

  useEffect(() => {
    fetchManifest();
  }, [showManagedFields, fetchManifest]);

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    setShowManagedFields(e.target.checked);
  };

  return (
    <>
      <Button
        style={{ width: "100%" }}
        onClick={() => {
          setModal({ on: true });
        }}
      >
        <h4 style={{ margin: "0" }}>
          <FileTextOutlined style={{ paddingRight: "5px" }} />
          View Manifest
        </h4>
      </Button>
      <Modal
        title={`Pod Manifest - ${pod.name}`}
        open={modal.on}
        onOk={closeModal}
        onCancel={closeModal}
        cancelButtonProps={{ style: { display: "none" } }}
        width={"60%"}
      >
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
            style={{ paddingBottom: "20px" }}
          />
        )}
        <Checkbox
          onChange={handleCheckboxChange}
          checked={showManagedFields}
          style={{ marginBottom: "15px" }}
        >
          Include Managed Fields
        </Checkbox>
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
          value={manifest}
        />
        <Tooltip title={"Copy Manifest"} trigger="hover">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(manifest);
            }}
            style={{
              position: "absolute",
              right: "50px",
              top: "100px",
            }}
          >
            <CopyOutlined
              style={{
                fontSize: "20px",
              }}
            />
          </Button>
        </Tooltip>
      </Modal>
    </>
  );
};
export default PodManifest;
