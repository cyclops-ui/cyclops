import React, {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Row,
    Select,
    Space,
    Switch,
    Typography,
    Tooltip
} from 'antd';
import axios from 'axios';
import {useNavigate} from 'react-router';
import {MinusCircleOutlined, PlusOutlined, InfoCircleOutlined} from "@ant-design/icons";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import {useParams} from "react-router-dom";

const {TextArea} = Input;

const {Title} = Typography;
const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};

const NewModule = () => {
    const [loading, setLoading] = useState(false);
    const [versions, setVersions] = useState([]);
    const [dplName, setName] = useState("");
    const [allConfigs, setAllConfigs] = useState([]);
    const [manifest, setManifest] = useState("");
    const [values, setValues] = useState({});
    const [config, setConfig] = useState({
        name: "",
        version: "",
        manifest: "",
        fields: []
    })

    const [gitTemplate, setGitTemplate] = useState({
        repo: "",
        path: ""
    })

    const [error, setError] = useState({
        message: "",
        description: "",
    });

    const [successLoad, setSuccessLoad] = useState(false);

    const history = useNavigate();

    let {name} = useParams();

    useEffect(() => {
        setLoading(true);
        // axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration-details`).then(res => {
        //     setAllConfigs(res.data);
        // });

        setLoading(false);
    }, []);

    const configNames: {} | any = [];
    allConfigs.map((c: any) => {
        configNames.push(<Select.Option key={c.name}>{c.name}</Select.Option>)
    })

    const handleSubmit = (values: any) => {
        console.log({
            "values": values,
            "name": values["cyclops_module_name"],
            "template": config.name,
        })

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/new`,
            {
                name: values["cyclops_module_name"],
                values: values,
                template: {
                    name: config.name,
                    version: config.version,
                    git: {
                        repo: gitTemplate.repo,
                        path: gitTemplate.path,
                    }
                },
            })
            .then(res => {
                console.log(res);
                window.location.href = "/modules"
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })

        setName(values.app_name);
        setLoading(true);
    }

    const handleCancel = () => {
        setLoading(false)
    };

    const handleChange = (value: any) => {
        setConfig({
            name: value,
            version: "",
            fields: [],
            manifest: "",
        })

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration/` + value + `/versions`).then(res => {
            let configVersions = res.data.sort(function (a: string, b: string) {
                if (a === "latest") {
                    return -1
                }
                if (b === "latest") {
                    return 1
                }
                if (a < b) {
                    return 1;
                }
                if (a > b) {
                    return -1;
                }
                return 0;
            })

            console.log(configVersions);

            const versionOptions: {} | any = [];
            configVersions.map((v: any) => {
                versionOptions.push(<Select.Option key={v}>{v}</Select.Option>)
            })

            setVersions(versionOptions);
        });
    }

    const handleVersionChange = (value: any) => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + config.name + `?version=` + value).then(res => {
            setConfig(res.data);
        });
    }

    const loadTemplate = () => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/templates/git?repo=` + gitTemplate.repo + `&path=` + gitTemplate.path).then(res => {
            setConfig(res.data);

            setError({
                message: "",
                description: "",
            });
            setSuccessLoad(true);
        }).catch(function (error) {
            setError(error.response.data);
            setSuccessLoad(false);

            return
        });
    }


    const formFields: {} | any = [];
    config.fields.forEach((field: any) => {
        switch (field.type) {
            case "string":
                formFields.push(
                    <Form.Item initialValue={field.initialValue} name={field.name} id={field.name}
                               label={field.display_name}>
                        <Input addonAfter={
                            <Tooltip title={field.description} trigger="click">
                                <InfoCircleOutlined/>
                            </Tooltip>
                        }/>
                    </Form.Item>
                )
                return;
            case "number":
                formFields.push(
                    <Form.Item initialValue={field.initialValue} name={field.name} id={field.name} label={
                        <Tooltip title={field.description} trigger="click">
                            {field.display_name}
                        </Tooltip>
                    }>
                        <InputNumber style={{width: '100%'}} addonAfter={
                            <Tooltip title={field.description} trigger="click">
                                <InfoCircleOutlined/>
                            </Tooltip>
                        }/>
                    </Form.Item>
                )
                return;
            case "boolean":
                formFields.push(
                    <Form.Item initialValue={field.initialValue} name={field.name} id={field.name}
                               label={field.display_name}>
                        <Switch />
                        <Tooltip title={field.description} trigger="click">
                            <InfoCircleOutlined style={{paddingLeft: '10px'}}/>
                        </Tooltip>
                    </Form.Item>
                )
                return;
            case "map":
                formFields.push(
                    <Form.Item name={field.name} label={field.display_name}>
                        <Form.List name={field.name}>
                            {(fields, {add, remove}) => (
                                <>
                                    {fields.map(({key, name, ...restField}) => (
                                        <Space key={key} style={{display: 'flex', marginBottom: 8}}
                                               align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'key']}
                                                rules={[{required: true, message: 'Missing key'}]}
                                            >
                                                <Input/>
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'value']}
                                                rules={[{required: true, message: 'Missing value'}]}
                                            >
                                                <Input/>
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)}/>
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined/>}>
                                            Add
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </Form.Item>
                )
        }
    })

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
            {
                successLoad && <Alert
                    message={"Loaded template successfully"}
                    description={error.description}
                    type="success"
                    closable
                    afterClose={() => {
                        setSuccessLoad(false);
                    }}
                    style={{marginBottom: '20px'}}
                />
            }
            <Row gutter={[40, 0]}>
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        Define Module
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Form {...layout} autoComplete={"off"} onFinish={handleSubmit}>
                        <Divider orientation="left" orientationMargin="0">
                            Module template
                        </Divider>
                        <Input
                            placeholder={"Repository"}
                            style={{width: '40%'}}
                            onChange={(value: any) => {
                                setGitTemplate({
                                    repo: value.target.value,
                                    path: gitTemplate.path,
                                })
                            }}
                        />
                        {' / '}
                        <Input
                            placeholder={"Path"}
                            style={{width: '30%'}}
                            onChange={(value: any) => {
                                setGitTemplate({
                                    repo: gitTemplate.repo,
                                    path: value.target.value,
                                })
                            }}
                        />
                        {'  '}
                        <Button type="primary" htmlType="button" onClick={loadTemplate}>
                            Load
                        </Button>
                        {/*<Divider orientation="left" orientationMargin="0">*/}
                        {/*    Select configuration*/}
                        {/*</Divider>*/}
                        {/*<Select*/}
                        {/*    placeholder={"Template"}*/}
                        {/*    style={{width: '30%'}}*/}
                        {/*    onChange={handleChange}*/}
                        {/*>*/}
                        {/*    {configNames}*/}
                        {/*</Select>*/}
                        {/*{'  '}*/}
                        {/*<Select*/}
                        {/*    placeholder={"Template version"}*/}
                        {/*    style={{width: '30%'}}*/}
                        {/*    onChange={handleVersionChange}*/}
                        {/*>*/}
                        {/*    {versions}*/}
                        {/*</Select>*/}
                        <Divider orientation="left" orientationMargin="0">
                            Module name
                        </Divider>
                        <Form.Item name="cyclops_module_name" id="cyclops_module_name" label="Module name"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Module name',
                                       }
                                   ]}
                        >
                            <Input/>
                        </Form.Item>
                        <Divider orientation="left" orientationMargin="0">
                            Define Module
                        </Divider>
                        {formFields}
                        <div style={{textAlign: "right"}}>
                            <Button type="primary" loading={loading} htmlType="submit" name="Save">
                                Save
                            </Button>{' '}
                            <Button type="ghost" htmlType="button" onClick={() => history('/')}>
                                Back
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </div>
    );
}
export default NewModule;
