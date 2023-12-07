import React, {useEffect, useState} from 'react';
import {Button, Col, Divider, Row, Select, Table, Tag, Typography, Input, Space} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import axios from 'axios';
import {PodTerminalViewer} from "./pod-terminal-viewer/pod-terminal-viewer";

const {Title} = Typography;

const Terminal = () => {
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

    const commands = {
        whoami: "jackharper",
        cd: (directory: any) => `changed path to ${directory}`
    };

    var input = ""

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
            <PodTerminalViewer
                applicationName={"appname"}
                applicationNamespace={"appns"}
                projectName={"project"}
                containerName={"conatiner"}
            />
        </div>
    );
}

export default Terminal;
