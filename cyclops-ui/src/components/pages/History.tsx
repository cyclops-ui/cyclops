import React, { useEffect, useState } from "react";
import { Button, Col, Modal, Row, Table, Typography } from "antd";
import { useNavigate } from "react-router";
import axios from "axios";
import { useParams } from "react-router-dom";
import ReactDiffViewer from "react-diff-viewer";
import AceEditor from "react-ace";
import ReactAce from "react-ace";

const { Title, Text } = Typography;

require(`ace-builds/src-noconflict/mode-sass`);
require(`ace-builds/src-noconflict/snippets/sass`);
require(`ace-builds/src-noconflict/theme-github`);

const ModuleHistory = () => {
  const history = useNavigate();
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
  let { moduleNamespace } = useParams();

  useEffect(() => {
    axios
      .get(`/api/modules/` + moduleNamespace + "/" + moduleName + `/history`)
      .then((res) => {
        console.log(res.data);
        setHistoryEntries(res.data);
      });

    axios
      .get(
        `/api/modules/` +
          moduleNamespace +
          "/" +
          moduleName +
          `/currentManifest`,
      )
      .then((res) => {
        setDiff({
          curr: res.data,
          previous: diff.previous,
        });
      });
  }, []);

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
        namespace: moduleNamespace,
        template: target.template,
      })
      .then((res) => {
        window.location.href = "/modules/" + moduleNamespace + "/" + moduleName;
      })
      .catch((error) => {
        // setLoading(false);
        // if (error.response === undefined) {
        //     setError({
        //         message: String(error),
        //         description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
        //     })
        // } else {
        //     setError(error.response.data);
        // }
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
      .post(
        "/api/modules/" + moduleNamespace + "/" + moduleName + "/manifest",
        {
          template: target.template,
          values: target.values,
        },
      )
      .then(function (res) {
        setDiff({
          curr: diff.curr,
          previous: res.data,
        });
      })
      .catch(function (error) {
        console.log(error);
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
      .post(
        "/api/modules/" + moduleNamespace + "/" + moduleName + "/manifest",
        {
          template: target.template,
          values: target.values,
        },
      )
      .then(function (res) {
        setManifest(res.data);
      })
      .catch(function (error) {
        console.log(error);
      });

    setManifestModal({
      open: true,
      generation: record.generation,
    });
  };

  return (
    <div>
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
          {/*<Table.Column*/}
          {/*    title='Date'*/}
          {/*    dataIndex='date'*/}
          {/*    key='date'*/}
          {/*    render={(date) => (*/}
          {/*        <Text code style={{fontSize: '110%'}}>{date}</Text>*/}
          {/*    )}*/}
          {/*/>*/}
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
          {/*<Table.Column*/}
          {/*    title='Success'*/}
          {/*    dataIndex='success'*/}
          {/*    key='success'*/}
          {/*    render={success => (*/}
          {/*        <Icon theme="twoTone" type={success === true ? 'check-circle' : 'close-square'}*/}
          {/*              twoToneColor={success === true ? 'blue' : 'red'} style={{fontSize: '150%'}}/>*/}
          {/*    )}*/}
          {/*/>*/}
          {/*<Table.Column*/}
          {/*    width='15%'*/}
          {/*    render={(text, record, index) =>*/}
          {/*            <Button onClick={() => openModal(text, record, index)} block>Rollback</Button>*/}
          {/*    }*/}
          {/*/>*/}
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
        onClick={() =>
          history("/modules/" + moduleNamespace + "/" + moduleName)
        }
      >
        Back
      </Button>
    </div>
  );
};

export default ModuleHistory;
