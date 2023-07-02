import React, {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    Col,
    Collapse,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Switch, Tooltip,
    Typography
} from 'antd';
import axios from 'axios';
import {useNavigate} from 'react-router';
import {InfoCircleOutlined, LinkOutlined, MinusCircleOutlined, PlusOutlined, WarningFilled} from "@ant-design/icons";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import {useParams} from "react-router-dom";
import Link from "antd/lib/typography/Link";
import ReactDiffViewer from "react-diff-viewer";

const {TextArea} = Input;

const {Title} = Typography;
const layout = {
    labelCol: {span: 4},
    wrapperCol: {span: 16},
};

const EditModule = () => {
    const [module, setModule] = useState({
        name: "",
        values: {},
        template: {
            name: "",
            version: "",
            git: {
                repo: "",
                path: "",
            }
        }
    });

    const [form] = Form.useForm();

    const [versions, setVersions] = useState([]);
    const [targetVersion, setTargetVersion] = useState([]);

    const [loading, setLoading] = useState(false);
    const [dplName, setName] = useState("");
    const [allConfigs, setAllConfigs] = useState([]);
    const [manifest, setManifest] = useState("");
    const [values, setValues] = useState({});
    const [config, setConfig] = useState({
        name: "",
        manifest: "",
        fields: [],
        properties: [],
    })
    const [error, setError] = useState({
        message: "",
        description: "",
    });

    const [migrating, setMigrating] = useState(false);
    const [migrateDiff, setMigrateDiff] = useState({
        current: "",
        new: ""
    })

    const history = useNavigate();

    let {moduleName} = useParams();

    useEffect(() => {
        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName).then(res => {
            setModule({
                name: res.data.name,
                values: res.data.values,
                template: res.data.template,
            });

            form.setFieldsValue(res.data.values);

            if (module.name.length !== 0 ) {
                axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + res.data.template + `?version=` + res.data.version).then(res => {
                    setConfig(res.data);
                }).catch(error => {
                    setLoading(false);
                    if (error.response === undefined) {
                        setError({
                            message: String(error),
                            description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                        })
                    } else {
                        setError(error.response.data);
                    }
                });
            } else {
                axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/templates/git?repo=` + res.data.template.git.repo + `&path=` + res.data.template.git.path).then(res => {
                    setConfig(res.data);
                }).catch(error => {
                    setLoading(false);
                    if (error.response === undefined) {
                        setError({
                            message: String(error),
                            description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                        })
                    } else {
                        setError(error.response.data);
                    }
                });
            }
        }).catch(error => {
            setLoading(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        });
    }, []);

    const configNames: {} | any = [];
    allConfigs.map((c: any) => {
        configNames.push(<Select.Option key={c.name}>{c.name}</Select.Option>)
    })

    const handleVersionChange = (value: any) => {
        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + module.name + `/template?version=` + value).then(res => {
            setMigrateDiff(res.data);
        }).catch(error => {
            setLoading(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        });
        setTargetVersion(value)
    }

    const getVersions = () => {
        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration/` + module.template + `/versions`).then(res => {
            let configVersions = res.data.sort(function(a: string, b: string){
                if (a === "latest") {return -1}
                if (b === "latest") {return 1}
                if(a < b) { return 1; }
                if(a > b) { return -1; }
                return 0;
            })

            const versionOptions: {} | any = [];
            configVersions.map((v: any) => {
                versionOptions.push(<Select.Option key={v}>{v}</Select.Option>)
            })

            setVersions(versionOptions);
        }).catch(error => {
            setLoading(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        });
    }

    const handleSubmit = (values: any) => {
        console.log({
            "values": values,
            "name": values["cyclops_module_name"],
            "template": config.name,
        })

        values["cyclops_module_name"] = module.name;

        axios.post(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/update`,
            {
                "values": values,
                "name": values["cyclops_module_name"],
                "template": module.template,
            }).then(res => {
                console.log(res);
                window.location.href = "/modules/" + moduleName
            }).catch(error => {
            setLoading(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        });

        setName(values.app_name);
        setLoading(true);
    }

    const handleMigrate = () => {
        console.log(targetVersion)

        axios.post(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/update`,
            {
                "values": module.values,
                "name": module.name,
                "template": module.template,
                "version": targetVersion,
            })
            .then(res => {
                console.log(res);
                window.location.href = "/modules/" + moduleName
            }).catch(error => {
            setLoading(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        });
    }

    const handleCancel = () => {
        setLoading(false)
    };

    const handleCancelMigrating = () => {
        setMigrating(false);
    };

    const handleChange = (value: any) => {
        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + value).then(res => {
            setConfig(res.data);
        }).catch(error => {
            setLoading(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        });
    }

    function mapFields(fields: any[], parent: string, level: number) {
        const formFields: {} | any = [];
        fields.forEach((field: any) => {
            console.log(field.name, level)

            let fieldName = parent === "" ? field.name : parent.concat(".").concat(field.name)

            switch (field.type) {
                case "string":
                    formFields.push(
                        <Form.Item initialValue={field.initialValue} name={fieldName} id={fieldName}
                                   label={field.display_name} labelCol={{span: 4 + level}}>
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
                        <Form.Item initialValue={field.initialValue} name={fieldName} id={fieldName} label={
                            <Tooltip title={field.description} trigger="click">
                                {field.display_name}</Tooltip>
                        } labelCol={{span: 4 + level}}>
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
                        <Form.Item initialValue={field.initialValue} name={fieldName} id={fieldName}
                                   label={field.display_name} labelCol={{span: 4 + level}}>
                            <Switch />
                        </Form.Item>
                    )
                    return;
                case "object":
                    var header = <Row>{field.name}</Row>

                    if (field.description && field.description.length !== 0) {
                        header = <Row gutter={[0, 8]}>
                            <Col span={15} style={{display: 'flex', justifyContent: 'flex-start'}}>
                                {field.name}
                            </Col>
                            <Col span={9} style={{display: 'flex', justifyContent: 'flex-end'}}>
                                <Tooltip title={field.description} trigger={["hover", "click"]}>
                                    <InfoCircleOutlined style={{right: "0px", fontSize: '20px'}}/>
                                </Tooltip>
                            </Col>
                        </Row>
                    }

                    formFields.push(
                        <Col span={level === 0 ? 19 : 24} offset={level === 0 ? 2 : 0} style={{paddingBottom: "15px"}}>
                            <Collapse defaultActiveKey={fieldName}>
                                <Collapse.Panel key={fieldName} header={header}>
                                    {mapFields(field.properties, fieldName, level + 1)}
                                </Collapse.Panel>
                            </Collapse>
                        </Col>
                    )
                    return;
                case "map":
                    formFields.push(
                        <Form.Item name={fieldName} label={field.display_name} labelCol={{span: 4 + level}}>
                            <Form.List name={fieldName}>
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

        return formFields
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
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        {module.name}
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={24}>
                    <Form {...layout} form={form} autoComplete={"off"} onFinish={handleSubmit}>
                        {/*<Col span={18}>*/}
                        {/*    <Link aria-level={3} href={`/configurations/` + module.template}>*/}
                        {/*        <LinkOutlined/>*/}
                        {/*        { module.template.name.length === 0 && module.template.git.repo + '/' + module.template.git.path }*/}

                        {/*        { module.template.name.length !== 0 && module.template.name + '@' + module.template.version }*/}
                        {/*    </Link>*/}
                        {/*    <Button onClick={function () {*/}
                        {/*        setMigrating(true)*/}
                        {/*        getVersions()*/}
                        {/*    }} block>Migrate</Button>*/}
                        {/*</Col>*/}
                        {/*<Modal*/}
                        {/*    title="Migrate module to different template version"*/}
                        {/*    visible={migrating}*/}
                        {/*    onCancel={handleCancelMigrating}*/}
                        {/*    width={'40%'}*/}
                        {/*    footer={*/}
                        {/*        <Button block onClick={handleMigrate}>Migrate</Button>*/}
                        {/*    }*/}
                        {/*>*/}
                        {/*    <Select*/}
                        {/*        placeholder={"Template version"}*/}
                        {/*        style={{width: '30%'}}*/}
                        {/*        onChange={handleVersionChange}*/}
                        {/*    >*/}
                        {/*        {versions}*/}
                        {/*    </Select>*/}
                        {/*    <ReactDiffViewer*/}
                        {/*        oldValue={migrateDiff.current}*/}
                        {/*        newValue={migrateDiff.new}*/}
                        {/*        splitView={true}*/}
                        {/*        leftTitle={"current manifest"}*/}
                        {/*        rightTitle={"updated manifest"}*/}
                        {/*        useDarkTheme={false}*/}
                        {/*    />*/}
                        {/*</Modal>*/}
                        <Divider orientation="left" orientationMargin="0">
                            Edit Module
                        </Divider>
                        {mapFields (config.fields, "" , 0)}
                        <div style={{textAlign: "right"}}>
                            <Button type="primary" htmlType="submit" name="Save">
                                Save
                            </Button>{' '}
                            <Button type="ghost" htmlType="button" onClick={() => history('/modules/' + moduleName)}>
                                Back
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </div>
    );
}
export default EditModule;
