import React, { useEffect, useState } from "react";
import { Button, Col, Modal, Row, Table, Typography } from "antd";
import { useNavigate } from "react-router";
import axios from "axios";
import { useParams } from "react-router-dom";
import ReactDiffViewer from "react-diff-viewer";
import ReactAce from "react-ace";
import { mapResponseError } from "../../utils/api/errors";
import Alert from "antd/lib/alert/Alert";

const { Title } = Typography;

require(`ace-builds/src-noconflict/mode-sass`);
require(`ace-builds/src-noconflict/snippets/sass`);
require(`ace-builds/src-noconflict/theme-github`);

const ModuleHistory = () => {
  const history = useNavigate();
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const [diff, setDiff] = useState({
    curr: "",
    previous: "",
  });
  const [diffModal, setDiffModal] = useState({
    open: false,
    generation: 0,
  });

  const [manifest, setManifest] = useState("");
  const [manifestModal, setManifestModal] = useState({
    open: false,
    generation: 0,
  });

  const [historyEntries, setHistoryEntries] = useState([]);

  let { moduleName } = useParams();
  useEffect(() => {
    axios
      .get(`/api/modules/` + moduleName + `/history`)
      .then((res) => {
        setHistoryEntries(res.data);
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });

    axios
      .get(`/api/modules/` + moduleName + `/currentManifest`)
      .then((res) => {
        setDiff({
          curr: res.data,
          previous: diff.previous,
        });
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  }, [diff.previous, moduleName]);

  const handleOk = () => {
    setDiffModal({
      open: false,
      generation: 0,
    });

    let target: any = {};
    historyEntries.forEach((h: any) => {
      if (h.generation === diffModal.generation) {
        target = h;
      }
    });

    axios
      .post(`/api/modules/update`, {
        values: target.values,
        name: moduleName,
        template: target.template,
      })
      .then((res) => {
        window.location.href = "/modules/" + moduleName;
      })
      .catch((error) => {
        setError(mapResponseError(error));
      });
  };

  const handleCancelDiff = () => {
    setDiffModal({
      open: false,
      generation: 0,
    });
  };

  const handleCancelManifest = () => {
    setManifestModal({
      open: false,
      generation: 0,
    });
  };

  const openRollbackModal = (text: any, record: any, index: any) => {
    let target: any = {};
    historyEntries.forEach((h: any) => {
      if (h.generation === record.generation) {
        target = h;
      }
    });

    axios
      .post("/api/modules/" + moduleName + "/manifest", {
        template: target.template,
        values: target.values,
      })
      .then(function (res) {
        setDiff({
          curr: diff.curr,
          previous: res.data,
        });
      })
      .catch(function (error) {
        setError(mapResponseError(error));
      });

    setDiffModal({
      open: true,
      generation: record.generation,
    });
  };

  const openManifestModal = (text: any, record: any, index: any) => {
    let target: any = {};
    historyEntries.forEach((h: any) => {
      if (h.generation === record.generation) {
        target = h;
      }
    });

    axios
      .post("/api/modules/" + moduleName + "/manifest", {
        template: target.template,
        values: target.values,
      })
      .then(function (res) {
        setManifest(res.data);
      })
      .catch(function (error) {
        setError(mapResponseError(error));
      });

    setManifestModal({
      open: true,
      generation: record.generation,
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
      <Row gutter={[40, 0]}>
        <Col span={18}>
          <Title level={2}>{moduleName} history</Title>
        </Col>
      </Row>
      <Col span={24} style={{ overflowX: "auto" }}>
        <Table dataSource={historyEntries}>
          <Table.Column
            title="Generation"
            dataIndex="generation"
            key="generation"
            render={(generation: number) => (
              <Typography.Text>{generation}</Typography.Text>
            )}
          />
          <Table.Column
            dataIndex="Manifest"
            key="manifest"
            width="15%"
            render={(text, record, index) => (
              <Button
                onClick={() => openManifestModal(text, record, index)}
                block
              >
                Manifest
              </Button>
            )}
          />
          <Table.Column
            dataIndex="Manifest changes"
            key="diff"
            width="15%"
            render={(text, record, index) => (
              <Button
                onClick={() => openRollbackModal(text, record, index)}
                block
              >
                Rollback
              </Button>
            )}
          />
        </Table>
      </Col>
      <Modal
        title="Manifest"
        open={manifestModal.open}
        onOk={handleCancelManifest}
        onCancel={handleCancelManifest}
        cancelButtonProps={{ style: { display: "none" } }}
        width={"40%"}
      >
        <ReactAce
          mode={"sass"}
          theme={"github"}
          fontSize={12}
          showPrintMargin={true}
          showGutter={true}
          highlightActiveLine={true}
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
      </Modal>
      <Modal
        title="Manifest changes"
        open={diffModal.open}
        onOk={handleOk}
        onCancel={handleCancelDiff}
        width={"60%"}
      >
        <ReactDiffViewer
          oldValue={diff.curr}
          newValue={diff.previous}
          splitView={true}
          leftTitle={"current"}
          rightTitle={"previous"}
          useDarkTheme={false}
        />
      </Modal>
      <Button
        style={{ float: "right" }}
        htmlType="button"
        onClick={() => history("/modules/" + moduleName)}
      >
        Back
      </Button>
    </div>
  );
};

export default ModuleHistory;
