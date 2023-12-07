import React, {useEffect, useState} from 'react';
import {Button, Col, Divider, Row, Select, Table, Tag, Typography, Input, Space, Card, Alert} from 'antd';
import {useNavigate} from 'react-router';
import axios from 'axios';
import Link from "antd/lib/typography/Link";

const {Title} = Typography;

const Modules = () => {
    const history = useNavigate();
    const [allData, setAllData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [namespacesState, setNamespacesState] = useState([]);
    const [error, setError] = useState({
        message: "",
        description: "",
    });

    useEffect(() => {
        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/list`).then(res => {
            setAllData(res.data);
            setFilteredData(res.data);
        }).catch(error => {
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        })
    }, []);

    async function handleChange(value: any) {
        await axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/list`).then(res => {
            setAllData(res.data);
        });
    }

    const namespaces: {} | any = [];
    namespacesState.map((namespace: any) => {
        namespaces.push(<Select.Option key={namespace.name}>{namespace.name}</Select.Option>)
    })

    const [value, setValue] = useState('');

    const handleClick = () => {
        history('/modules/new')
    }

    const handleClickNew = () => {
        history('/new-app')
    }

    const handleSearch = (event: any) => {
        const query = event.target.value;
        var updatedList = [...allData];
        updatedList = updatedList.filter((module: any) => {
            return module.name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
        });
        setFilteredData(updatedList);
    }

    const getStatusColor = (module: any) => {
        if (module.status === "undefined") {
            return "gray"
        }

        if (module.status === "healthy") {
            return "#27D507"
        }

        return "#FF0000"
    }

    const getTemplateVersion = (version: string) => {
        if (version === "") {
            return "main"
        }

        return version
    }

    return (
        <div>
            {
                error.message.length !== 0 && <Alert
                    message={error.message}
                    description={error.description}
                    type="error"
                    closable
                    afterClose={() => {setError({
                        message: "",
                        description: "",
                    })}}
                    style={{marginBottom: '20px'}}
                />
            }
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
                    <Input
                        placeholder={"Search modules"}
                        style={{width: '30%'}}
                        onChange={handleSearch}
                    >
                    </Input>
                </Col>
            </Row>
            <Divider orientationMargin="0"/>
            <Row gutter={[16, 16]}>
                {filteredData.map((module:any, index) => (
                    <Col key={index} span={8}>
                        <Card title={ module.name } style={{
                            borderLeft: "solid " + getStatusColor(module) + " 5px"
                        }}>
                            <Row gutter={[16, 16]}>
                                <Col span={24} style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block"
                                }}>
                                    Repo:
                                    <Link aria-level={3} href={module.template.git.repo}>
                                        {module.template.name.length === 0 && " " + module.template.git.repo}
                                    </Link>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]} >
                                <Col span={24} style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block"
                                }}>
                                    Path:
                                    <Link aria-level={3} href={ module.template.git.repo + `/tree/` + getTemplateVersion(module.template.git.commit) + `/` + module.template.git.path }>
                                        { module.template.name.length === 0 && " " + module.template.git.path }
                                    </Link>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]}>
                                <Col span={24} style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block"
                                }}>
                                    Version: {getTemplateVersion(module.template.git.commit)}
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
