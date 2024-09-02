import { CopyOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Col, Modal, Tooltip } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import ReactAce from "react-ace/lib/ace";

interface PodManifestProps {
  pod: any;
}

const PodManifest = ({ pod }: PodManifestProps) => {
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
      const { group, name, namespace } = pod;
      const { data: manifestData } = await axios.get(`/api/manifest`, {
        params: {
          group,
          version: "v1",
          kind: "Pod",
          name,
          namespace: namespace.length ? namespace : "default",
          includeManagedFields: showManagedFields,
        },
      });
      setManifest(manifestData);
    }
  }, [pod, showManagedFields, modal]);

  useEffect(() => {
    fetchManifest();
  }, [showManagedFields, fetchManifest]);

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    setShowManagedFields(e.target.checked);
  };

  return (
    <Col span={12} style={{ paddingLeft: 4 }}>
      <Button
        style={{ width: "100%" }}
        onClick={() => {
          setModal({ on: true });
        }}
      >
        View Manifest
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
          theme={"github"}
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
    </Col>
  );
};
export default PodManifest;
