import React, {useEffect, useState} from 'react';
import {Button, Col, Collapse, Modal, Row, Table, Typography} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import axios from 'axios';
import {useParams} from "react-router-dom";
import ReactDiffViewer from "react-diff-viewer";

const {Title, Text} = Typography;

const DeploymentHistory = () => {
    const history = useNavigate();
    const [loading, setLoading] = useState(false);
    const [stagingManifest, setStagingManifest] = useState(false);
    const [allData, setAllData] = useState([]);
    let {namespace, deployment} = useParams();
    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/deployments/` + deployment + `/history`).then(res => {
            console.log(res.data)
            setAllData(res.data);
        });
    }, []);

    const data = [{}];
    allData.map((history_entry: any) => {
        data.push({
            change_title: history_entry.change_title,
            date: history_entry.date,
            diff: <ReactDiffViewer
                oldValue={history_entry.replaced_manifest}
                newValue={history_entry.applied_manifest}
                splitView={true}
                leftTitle={"previous manifest"}
                rightTitle={"updated manifest"}
                useDarkTheme={false}
            />,
            applied_manifest: history_entry.applied_manifest,
            success: history_entry.success,
        })
        return data;
    });

    const [dataSource, setDataSource] = useState(data);
    const [value, setValue] = useState('');

    const handleOk = () => {
        setLoading(false);
    };

    const handleCancel = () => {
        setLoading(false);
    };

    const openModal = (text: any, record: any, index: any) => {
        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/deployments/by_manifest/name',
            {
                change_title: record.change_title,
                manifest: record.applied_manifest,
                previous_manifest: record.applied_manifest,
                app_name: deployment,
            }
        )
            .then(function (response) {
                console.log(response)
                window.location.href = "/ns/" + namespace + "/d/" + deployment
            })
            .catch(function (error) {
                console.log(error)
            })
    }

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Title level={2}>
                        {deployment} deployment history
                    </Title>
                </Col>
            </Row>
            <Col span={24} style={{overflowX: "auto"}}>
                <Table dataSource={data.slice(1, data.length)}>
                    <Table.Column
                        title='Change title'
                        dataIndex='change_title'
                        key='change_title'
                        render={(change_title) => (
                            <Text style={{fontSize: '110%'}}>{change_title}</Text>
                        )}
                    />
                    <Table.Column
                        title='Date'
                        dataIndex='date'
                        key='date'
                        render={(date) => (
                            <Text code style={{fontSize: '110%'}}>{date}</Text>
                        )}
                    />
                    <Table.Column
                        dataIndex="diff"
                        key="diff"
                        render={diff => (
                            <Collapse>
                                <Collapse.Panel header='Applied diff' key='applied_diff'>
                                    {diff}
                                </Collapse.Panel>
                            </Collapse>
                        )}
                    />
                    <Table.Column
                        title='Success'
                        dataIndex='success'
                        key='success'
                        render={success => (
                            <Icon theme="twoTone" type={success === true ? 'check-circle' : 'close-square'}
                                  twoToneColor={success === true ? 'blue' : 'red'} style={{fontSize: '150%'}}/>
                        )}
                    />
                    <Table.Column
                        width='15%'
                        render={(text, record, index) =>
                                <Button onClick={() => openModal(text, record, index)} loading={loading} block>Rollback</Button>
                        }
                    />
                </Table>
            </Col>
            <Modal title="Rollback staging area" visible={loading} onOk={handleOk} onCancel={handleCancel}
                   width={'40%'}>
                <ReactDiffViewer
                    oldValue={""}
                    newValue={""}
                    splitView={true}
                    leftTitle={"current manifest"}
                    rightTitle={"updated manifest"}
                    useDarkTheme={false}
                />
            </Modal>
        </div>
    );
}

export default DeploymentHistory;
