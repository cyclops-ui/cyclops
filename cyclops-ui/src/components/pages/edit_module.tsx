import React, {useEffect, useState} from 'react';
import {
    Button,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Typography
} from 'antd';
import axios from 'axios';
import {useNavigate} from 'react-router';
import {LinkOutlined, MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";

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
    labelCol: {span: 8},
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
        fields: []
    })

    const [migrating, setMigrating] = useState(false);
    const [migrateDiff, setMigrateDiff] = useState({
        current: "",
        new: ""
    })

    const history = useNavigate();

    let {moduleName} = useParams();

    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName).then(res => {
            setModule({
                name: res.data.name,
                values: res.data.values,
                template: res.data.template,
            });

            form.setFieldsValue(res.data.values);

            if (module.name.length !== 0 ) {
                axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + res.data.template + `?version=` + res.data.version).then(res => {
                    setConfig(res.data);
                });
            } else {
                axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/templates/git?repo=` + res.data.template.git.repo + `&path=` + res.data.template.git.path).then(res => {
                    setConfig(res.data);

                    // setError({
                    //     message: "",
                    //     description: "",
                    // });
                    // setSuccessLoad(true);
                }).catch(function (error) {
                    // setError(error.response.data);
                    // setSuccessLoad(false);

                    return
                });
            }
        });
    }, []);

    const configNames: {} | any = [];
    allConfigs.map((c: any) => {
        configNames.push(<Select.Option key={c.name}>{c.name}</Select.Option>)
    })

    const handleVersionChange = (value: any) => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + module.name + `/template?version=` + value).then(res => {
            setMigrateDiff(res.data);
        });
        setTargetVersion(value)
    }

    const getVersions = () => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration/` + module.template + `/versions`).then(res => {
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
        });
    }

    const handleSubmit = (values: any) => {
        console.log({
            "values": values,
            "name": values["cyclops_module_name"],
            "template": config.name,
        })

        values["cyclops_module_name"] = module.name;

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/update`,
            {
                "values": values,
                "name": values["cyclops_module_name"],
                "template": module.template,
            })
            .then(res => {
                console.log(res);
                window.location.href = "/modules/" + moduleName
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })

        setName(values.app_name);
        setLoading(true);
    }

    const handleMigrate = () => {
        console.log(targetVersion)

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/update`,
            {
                "values": module.values,
                "name": module.name,
                "template": module.template,
                "version": targetVersion,
            })
            .then(res => {
                console.log(res);
                window.location.href = "/modules/" + moduleName
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })
    }

    const handleCancel = () => {
        setLoading(false)
    };

    const handleCancelMigrating = () => {
        setMigrating(false);
    };

    const handleChange = (value: any) => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + value).then(res => {
            setConfig(res.data);
        });
    }

    const formFields: {} | any = [];
    config.fields.forEach((field: any) => {
        switch (field.type) {
            case "string":
                console.log(module.values);
                console.log(field.name)
                formFields.push(
                    <Form.Item initialValue={field.initialValue} name={field.name} id={field.name}
                               label={field.display_name}>
                        <Input/>
                    </Form.Item>
                )
                return;
            case "number":
                formFields.push(
                    <Form.Item initialValue={field.initialValue} name={field.name} id={field.name}
                               label={field.display_name}>
                        <InputNumber/>
                    </Form.Item>
                )
                return;
            case "boolean":
                formFields.push(
                    <Form.Item initialValue={field.initialValue} name={field.name} id={field.name}
                               label={field.display_name}>
                        <Switch/>
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
            <Row gutter={[40, 0]}>
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        {module.name}
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Form {...layout} form={form} autoComplete={"off"} onFinish={handleSubmit}>
                        <Col span={18}>
                            <Link aria-level={3} href={`/configurations/` + module.template}>
                                <LinkOutlined/>
                                { module.template.name.length === 0 && module.template.git.repo + '/' + module.template.git.path }

                                { module.template.name.length !== 0 && module.template.name + '@' + module.template.version }
                            </Link>
                            <Button onClick={function () {
                                setMigrating(true)
                                getVersions()
                            }} block>Migrate</Button>
                        </Col>
                        <Modal
                            title="Migrate module to different template version"
                            visible={migrating}
                            onCancel={handleCancelMigrating}
                            width={'40%'}
                            footer={
                                <Button block onClick={handleMigrate}>Migrate</Button>
                            }
                        >
                            <Select
                                placeholder={"Template version"}
                                style={{width: '30%'}}
                                onChange={handleVersionChange}
                            >
                                {versions}
                            </Select>
                            <ReactDiffViewer
                                oldValue={migrateDiff.current}
                                newValue={migrateDiff.new}
                                splitView={true}
                                leftTitle={"current manifest"}
                                rightTitle={"updated manifest"}
                                useDarkTheme={false}
                            />
                        </Modal>
                        <Divider orientation="left" orientationMargin="0">
                            Edit Module
                        </Divider>
                        {formFields}
                        <div style={{textAlign: "right"}}>
                            <Button type="primary" htmlType="submit" name="Save">
                                Save
                            </Button>{' '}
                            <Button type="ghost" htmlType="button" onClick={() => history('/list')}>
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
