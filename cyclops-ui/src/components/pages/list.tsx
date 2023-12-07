import React, {useEffect, useState} from 'react';
import {Button, Col, Divider, Row, Select, Table, Tag, Typography, Input, Space} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import axios from 'axios';

const {Title} = Typography;

const List = () => {
    const history = useNavigate();
    const [allData, setAllData] = useState([]);
    const [namespacesState, setNamespacesState] = useState([]);
    useEffect(() => {
        console.log(process.env)

        console.log(process.env.REACT_APP_CYCLOPS_CTRL_HOST);

        axios.get("http://localhost:8080" + `/namespaces/default/kinds/deployment`).then(res => {
            setAllData(res.data);
        });

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces`).then(res => {
            console.log(res.data)
            setNamespacesState(res.data.namespaces)
        });
    }, []);

    async function handleChange(value: any) {
        await axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces/` + value + `/kinds/deployment`).then(res => {
            setAllData(res.data);
        });
    }

    const namespaces: {} | any = [];
    namespacesState.map((namespace: any) => {
        namespaces.push(<Select.Option key={namespace.name}>{namespace.name}</Select.Option>)
    })

    const data = [{}];
    allData.map((deployment: any) => {
        console.log(deployment)
        data.push({
            appName: deployment.app_name,
            imageName: deployment.image_name,
            namespace: deployment.namespace,
            replicas: deployment.replicas,
            healthy: deployment.healthy,
        })
        return data;
    });

    const [dataSource, setDataSource] = useState(data);
    const [value, setValue] = useState('');

    const handleClick = () => {
        history('/form')
    }

    const handleClickNew = () => {
        history('/new-app')
    }

    const editDeployment = () => {
        console.log("editing")
    }

    const deleteDeployment = () => {
        console.log("deleting")
    }

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Title level={2}>
                        Deployed services
                    </Title>
                </Col>
                <Col span={6}>
                    <Button onClick={handleClick} block>Add deployment</Button>
                    <Button onClick={handleClickNew} block>Add deployment configurable</Button>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Select
                        mode="tags"
                        placeholder={"Select namespaces"}
                        style={{width: '30%'}}
                        onChange={handleChange}
                    >
                        {namespaces}
                    </Select>
                </Col>
            </Row>
            <Divider orientationMargin="0"/>
            <Col span={24} style={{overflowX: "auto"}}>
                <Table dataSource={data.slice(1, data.length)}>
                    <Table.Column
                        title='App Name'
                        dataIndex='appName'
                        filterSearch={true}
                        key='appName'
                    />
                    <Table.Column
                        title='Namespace'
                        dataIndex='namespace'
                    />
                    <Table.Column
                        title='Images'
                        dataIndex='imageName'
                        width={'30%'}
                        key='imageName'
                        render={imageName => (
                            <>
                                {
                                    imageName.split(',').map((image: string) => {
                                        if (image.length === 0) {
                                            return
                                        }
                                        return (
                                            <Tag color={'blue'} key={image} style={{fontSize: '120%'}}>
                                                {image}
                                            </Tag>
                                        );
                                    })
                                }
                            </>
                        )}
                    />
                    <Table.Column
                        title='Replicas'
                        dataIndex='replicas'
                    />
                    <Table.Column
                        title='Healthy'
                        dataIndex='healthy'
                        key='healty'
                        render={healthy => (
                            <Icon theme="twoTone" type={healthy === true ? 'check-circle' : 'close-square'}
                                  twoToneColor={healthy === true ? 'blue' : 'red'} style={{fontSize: '150%'}}/>
                        )}
                    />
                    <Table.Column
                        title='Edit'
                        width='15%'
                        render={() =>
                            <Button onClick={editDeployment} block>Edit</Button>
                        }
                    />
                    <Table.Column
                        title='Details'
                        width='15%'
                        render={deployment =>
                            <Button onClick={function () {
                                window.location.href = "/ns/" + deployment.namespace + "/d/" + deployment.appName
                            }} block>Details</Button>
                        }
                    />
                </Table>
            </Col>
        </div>
    );
}

export default List;
