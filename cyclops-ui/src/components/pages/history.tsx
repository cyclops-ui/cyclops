import React, {useEffect, useState} from 'react';
import {Button, Col, Collapse, Modal, Row, Table, Typography} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import axios from 'axios';
import {useParams} from "react-router-dom";
import ReactDiffViewer from "react-diff-viewer";
import {NumberOutlined} from "@ant-design/icons";
import ReactAce from "react-ace";
import AceEditor from "react-ace";

const {Title, Text} = Typography;

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

    const [allData, setAllData] = useState([]);
    let {moduleName} = useParams();
    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName + `/history`).then(res => {
            console.log(res.data)
            setAllData(res.data);
        });

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName + `/currentManifest`).then(res => {
            setDiff({
                curr: res.data,
                previous: diff.previous,
            })
        });
    }, []);

    const data = [{}];
    allData.map((entry: any) => {
        data.push({
            generation: entry.generation,
            template: entry.template,
            values: entry.values,
        })
        return data;
    });

    const [dataSource, setDataSource] = useState(data);
    const [value, setValue] = useState('');

    const handleOk = () => {
        setDiffModal({
            open: false,
            generation: 0,
        });

        let target: any = {}
        allData.forEach((h: any) => {
            if (h.generation === diffModal.generation) {
                target = h
            }
        })

        axios.post(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/update`,
            {
                "values": target.values,
                "name": moduleName,
                "template": target.template,
        }).then(res => {
            window.location.href = "/modules/" + moduleName
        }).catch(error => {
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
        let target: any = {}
        allData.forEach((h: any) => {
            if (h.generation === record.generation) {
                target = h
            }
        })

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/modules/' + moduleName + '/manifest',
            {
                template: target.template,
                values: target.values,
            }
        )
            .then(function (res) {
                setDiff({
                    curr: diff.curr,
                    previous: res.data,
                })
            })
            .catch(function (error) {
                console.log(error)
            })

        setDiffModal({
            open: true,
            generation: record.generation,
        });
    }

    const openManifestModal = (text: any, record: any, index: any) => {
        let target: any = {}
        allData.forEach((h: any) => {
            if (h.generation === record.generation) {
                target = h
            }
        })

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/modules/' + moduleName + '/manifest',
            {
                template: target.template,
                values: target.values,
            }
        )
            .then(function (res) {
                setManifest(res.data)
            })
            .catch(function (error) {
                console.log(error)
            })

        setManifestModal({
            open: true,
            generation: record.generation,
        });
    }

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Title level={2}>
                        {moduleName} history
                    </Title>
                </Col>
            </Row>
            <Col span={24} style={{overflowX: "auto"}}>
                <Table dataSource={data.slice(1, data.length)}>
                    <Table.Column
                        title='Generation'
                        dataIndex='generation'
                        key='generation'
                        render={(generation: number) => (
                            <Typography.Text>
                                {generation}
                            </Typography.Text>
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
                        render={(text, record, index) =>
                            <Button onClick={() => openManifestModal(text, record, index)} block>Manifest</Button>
                        }
                    />
                    <Table.Column
                        dataIndex="Manifest changes"
                        key="diff"
                        render={(text, record, index) =>
                            <Button onClick={() => openRollbackModal(text, record, index)} block>Rollback</Button>
                        }
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
                onCancel={handleCancelManifest}
                width={'40%'}
            >
                <AceEditor
                    mode={"yaml"}
                    theme="github"
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
                        useWorker: false
                    }}
                    style={{
                        height: "25em",
                        width: "100%"
                    }}
                    value={manifest}
                />
            </Modal>
            <Modal
                title="Manifest changes"
                open={diffModal.open}
                onOk={handleOk}
                onCancel={handleCancelDiff}
                width={'60%'}
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
        </div>
    );
}

export default ModuleHistory;
