import React, {useEffect, useState} from 'react';
import {Button, Col, Divider, Row, Select, Table, Tag, Typography, Input, Space} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import axios from 'axios';
import SearchInput from "../searchbar";
import { SearchOutlined } from '@ant-design/icons';

const {Title} = Typography;

const Modules = () => {
    const history = useNavigate();
    const [allData, setAllData] = useState([]);
    const [namespacesState, setNamespacesState] = useState([]);
    useEffect(() => {
        console.log(process.env)

        console.log(process.env.REACT_APP_CYCLOPS_CTRL_HOST);

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/list`).then(res => {
            console.log(res.data)
            setAllData(res.data);
        });

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces`).then(res => {
            console.log(res.data)
            setNamespacesState(res.data.namespaces)
        });
    }, []);

    async function handleChange(value: any) {
        await axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/list`).then(res => {
            setAllData(res.data);
        });
    }

    const namespaces: {} | any = [];
    namespacesState.map((namespace: any) => {
        namespaces.push(<Select.Option key={namespace.name}>{namespace.name}</Select.Option>)
    })

    const data = [{}];
    allData.map((module: any) => {
        data.push({
            name: module.name,
            imageName: module.image_name,
            template: module.template,
            namespace: module.namespace,
            replicas: module.replicas,
            healthy: module.healthy,
        })
        return data;
    });

    const [dataSource, setDataSource] = useState(data);
    const [value, setValue] = useState('');

    const handleClick = () => {
        history('/modules/new')
    }

    const handleClickNew = () => {
        history('/new-app')
    }

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Title level={2}>
                        Deployed modules
                    </Title>
                </Col>
                <Col span={6}>
                    <Button onClick={handleClick} block>Add module</Button>
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
                        title='Module name'
                        dataIndex='name'
                        filterSearch={true}
                        key='name'
                    />
                    <Table.Column
                        title='Namespace'
                        dataIndex='namespace'
                    />
                    <Table.Column
                        title='Details'
                        width='15%'
                        render={module =>
                            <Button onClick={function () {
                                window.location.href = "/modules/" + module.name
                            }} block>Details</Button>
                        }
                    />
                    <Table.Column
                        title='Edit'
                        width='15%'
                        render={module =>
                            <Button onClick={function () {
                                window.location.href = "/modules/" + module.name + "/edit"
                            }} block>Edit</Button>
                        }
                    />
                </Table>
            </Col>
        </div>
    );
}

export default Modules;
