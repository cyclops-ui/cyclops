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
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";

import AceEditor from "react-ace";

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
    const history = useNavigate();

    let {name} = useParams();

    useEffect(() => {
        setLoading(true);
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration-details`).then(res => {
            setAllConfigs(res.data);
        });

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
                "name": values["cyclops_module_name"],
                "values": values,
                "template": config.name,
                "version": config.version,
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
            let configVersions = res.data.sort(function(a: string, b: string){
                if (a === "latest") {return -1}
                if (b === "latest") {return 1}
                if(a < b) { return 1; }
                if(a > b) { return -1; }
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

    const formFields: {} | any = [];
    config.fields.forEach((field: any) => {
        switch (field.type) {
            case "string":
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
                        Define Module
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Form {...layout} autoComplete={"off"} onFinish={handleSubmit}>
                        <Divider orientation="left" orientationMargin="0">
                            Select configuration
                        </Divider>
                        <Select
                            placeholder={"Template"}
                            style={{width: '30%'}}
                            onChange={handleChange}
                        >
                            {configNames}
                        </Select>
                        {'  '}
                        <Select
                            placeholder={"Template version"}
                            style={{width: '30%'}}
                            onChange={handleVersionChange}
                        >
                            {versions}
                        </Select>
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
export default NewModule;
