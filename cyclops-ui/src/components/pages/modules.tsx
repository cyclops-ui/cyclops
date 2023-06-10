import React, {useEffect, useState} from 'react';
import {Button, Col, Divider, Row, Select, Table, Tag, Typography, Input, Space, Card} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import axios from 'axios';
import SearchInput from "../searchbar";
import {LinkOutlined, SearchOutlined} from '@ant-design/icons';
import Link from "antd/lib/typography/Link";

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
            <Row gutter={[16, 16]}>
                {allData.map((module:any, index) => (
                    <Col key={index} span={6}>
                        <Card title={module.name}>
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    Repo:
                                    <Link aria-level={3} href={module.template.git.repo}>
                                        {module.template.name.length === 0 && " " + module.template.git.repo}
                                    </Link>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    Path:
                                    <Link aria-level={3} href={ module.template.git.repo + `/tree/master/` + module.template.git.path }>
                                        { module.template.name.length === 0 && " " + module.template.git.path }
                                    </Link>
                                </Col>
                            </Row>
                            <Row style={{paddingTop: "15px"}}>
                                <Col>
                                    <Button type={"primary"} onClick={ function() {window.location.href = "/modules/" + module.name} } block>Details</Button>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}

export default Modules;
