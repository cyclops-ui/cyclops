import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Col,
    Collapse,
    Divider,
    Form,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table, Tabs,
    Tag,
    Typography
} from 'antd';
import {useNavigate} from 'react-router';
import {MinusCircleOutlined, PlusOutlined, LinkOutlined} from "@ant-design/icons";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import axios from "axios";
import {useParams} from "react-router-dom";
import Link from "antd/lib/typography/Link";

const {TextArea} = Input;

const {Title} = Typography;
const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};

type Field = {
    name: string,
    type: string,
    manifest_key: string,
    display_name: string,
    initial_value: string,
    value: any,
}

const EditConfiguration = () => {
    const [loading, setLoading] = useState(false);
    const [manifest, setManifest] = useState("");
    const [versions, setVersions] = useState([]);
    const [namespacesState, setNamespacesState] = useState([]);
    let fields : Field[] = [];
    const [config, setConfig] = useState({
        name: "",
        modules: [],
        version: "",
        fields: fields,
        manifest: "",
    });
    const history = useNavigate();
    const [form] = Form.useForm();
    let {name} = useParams();

    useEffect(() => {
        setLoading(true);
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + name).then(res => {
            setConfig(res.data)

            form.setFieldsValue({
                name: res.data.name,
                fields: res.data.fields,
                manifest: res.data.manifest,
                version: res.data.version,
            })
        });

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration/` + name + `/versions`).then(res => {
            setVersions(res.data.sort(function(a: string, b: string){
                if (a === "latest") {return -1}
                if (b === "latest") {return 1}
                if(a < b) { return 1; }
                if(a > b) { return -1; }
                return 0;
            }))
        });

        setLoading(false);
    }, []);

    const handleSubmit = () => {
        let values = config;

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config`,
            values)
            .then(res => {
                window.location.href = "/configurations/" + name
            })
            .catch(error => {
                setLoading(false);
                console.log(error)
            })
    }

    const versionOptions: {} | any = [];
    versions.map((v: any) => {
        versionOptions.push(<Select.Option key={v}>{v}</Select.Option>)
    })

    const handleVersionChange = (value: any) => {
        setLoading(true);
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + name + `?version=` + value).then(res => {
            setConfig(res.data)

            form.setFieldsValue({
                name: res.data.name,
                fields: res.data.fields,
                manifest: res.data.manifest,
                version: res.data.version,
            })
        });

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration/` + name + `/versions`).then(res => {
            setVersions(res.data.sort(function(a: string, b: string){
                if (a === "latest") {return -1}
                if (b === "latest") {return 1}
                if(a < b) { return 1; }
                if(a > b) { return -1; }
                return 0;
            }))
        });

        setLoading(false);
    }

    const save = (name: string, field: Field) => {
        let fields = config.fields;
        let newFields: Field[] = [];
        fields.forEach(value => {
            if (value.name === name) {
                newFields.push(field);
            } else {
                newFields.push(value);
            }
        })

        setConfig({
            name: config.name,
            version: config.version,
            modules: config.modules,
            fields: newFields,
            manifest: config.manifest,
        })
    }

    const remove = (fieldName: string) => {
        let fields = config.fields;
        let newFields: Field[] = [];
        fields.forEach(value => {
            if (value.name !== fieldName) {
                newFields.push(value);
            }
        })

        setConfig({
            name: config.name,
            version: config.version,
            modules: config.modules,
            fields: newFields,
            manifest: config.manifest,
        })
    };

    const fieldForm = (field : Field) => {
        return <Space key={field.name} style={{display: 'block', marginBottom: 8}}
                      align="baseline">
            <Form.Item
                {...field}
                label="Name"
                style={{display: 'block'}}
                name={[field.name, 'name']}
                rules={[{required: true, message: 'Missing name'}]}
            >
                <Input id={"field_id_" + field.name} defaultValue={field.name} onChange={(e) => {
                    save(field.name,{
                        name: e.target.value,
                        type: field.type,
                        manifest_key: field.manifest_key,
                        display_name: field.display_name,
                        initial_value: field.initial_value,
                        value: field.value,
                    });
                }} />
            </Form.Item>
            <Form.Item
                {...field}
                label="Display name"
                style={{display: 'block'}}
                name={[field.name, 'display_name']}
                rules={[{required: true, message: 'Missing display name'}]}
            >
                <Input defaultValue={field.display_name} onChange={(e) => {
                    save(field.name,{
                        name: field.name,
                        type: field.type,
                        manifest_key: field.manifest_key,
                        display_name: e.target.value,
                        initial_value: field.initial_value,
                        value: field.value,
                    });
                }}/>
            </Form.Item>
            <Form.Item
                {...field}
                label="Type"
                style={{display: 'block'}}
                name={[field.name, 'type']}
                rules={[{required: true, message: 'Missing type'}]}
            >
                <Select placeholder={"string"} defaultValue={field.type} onSelect={(value) => {
                    save(field.name,{
                        name: field.name,
                        type: value,
                        manifest_key: field.manifest_key,
                        display_name: field.display_name,
                        initial_value: field.initial_value,
                        value: field.value,
                    });
                }}>
                    <Select.Option value="string">string</Select.Option>
                    <Select.Option value="number">number</Select.Option>
                    <Select.Option value="boolean">boolean</Select.Option>
                    <Select.Option value="map">map</Select.Option>
                </Select>
            </Form.Item>
            <MinusCircleOutlined label={"Remove field"} onClick={() => remove(field.name)}/>
            {/*<Button onClick={() => save({*/}
            {/*    name: "",*/}
            {/*    display_name: "",*/}
            {/*    value: "",*/}
            {/*    manifest_key: "",*/}
            {/*    initial_value: "",*/}
            {/*    type: "",*/}
            {/*})}>Save</Button>*/}
        </Space>
    }

    const newTabIndex = useRef(0);

    const add = () => {
        const newActiveKey = `newTab${newTabIndex.current++}`;
        const newPanes = [...config.fields];
        newPanes.push({
            name: "New field",
            display_name: "",
            type: "",
            value: "",
            initial_value: "",
            manifest_key:  "",
        });
        setConfig({
            name: config.name,
            version: config.version,
            modules: config.modules,
            fields: newPanes,
            manifest: config.manifest,
        })
    };

    const onEdit = (targetKey: any, action: any) => {
        if (action === 'add') {
            add();
        }
    };

    let fieldTabs = () => {
        return <Tabs
            type={"editable-card"}
            defaultActiveKey="1"
            tabPosition={'left'}
            onEdit={onEdit}
            items={config.fields.map(value => {
                return {
                    id: value.name,
                    closable: false,
                    key: value.name,
                    label: value.name,
                    children: fieldForm(value)
                };
            })}
        />
    }

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        Edit configuration: {name}
                    </Title>
                </Col>
                <Select
                    placeholder={"Select configuration"}
                    style={{width: '30%'}}
                    onChange={handleVersionChange}
                >
                    {versionOptions}
                </Select>
            <Divider orientation="left" orientationMargin="0">
                Template definition
            </Divider>
            <Col span={6}>
                {fieldTabs()}
            </Col>
            <Col span={18}>
            <Form {...layout} autoComplete={"off"} form={form} onFinish={handleSubmit} style={{width: "100%", alignItems: "right"}}>
                <Form.Item name="manifest" style={{width: "100%"}}>
                    <AceEditor
                        name="manifest"
                        style={{width: 'inherit'}}
                        mode="sass"
                        theme="github"
                        editorProps={{$blockScrolling: true}}
                        onChange={(value: string) => {
                            setConfig({
                                name: config.name,
                                version: config.version,
                                modules: config.modules,
                                fields: config.fields,
                                manifest: value,
                            })
                        }}
                    />
                </Form.Item>
            </Form>
            </Col>
            </Row>
            <Row>
                <Button type="primary" loading={loading} onClick={() => handleSubmit()} name="Save">
                    Save
                </Button>{'      '}
                <Button loading={loading} name="Restore">
                    Restore
                </Button>
            </Row>
            <Row>
                <Divider orientation="left" orientationMargin="0">
                    Modules using template
                </Divider>
            </Row>
            <Row>
                <Col span={24}>
                    <Table dataSource={config.modules}>
                        <Table.Column
                            title='Name'
                            dataIndex='name'
                            filterSearch={true}
                            key='name'
                        />
                        <Table.Column
                            title='Version'
                            dataIndex='version'
                            filterSearch={true}
                            key='version'
                        />
                        <Table.Column
                            title='Visit'
                            dataIndex='name'
                            key='name'
                            width='15%'
                            render={name => (
                                <>
                                    <Link href={`/modules/` + name}><LinkOutlined/> Visit</Link>
                                </>
                            )}
                        />
                    </Table>
                </Col>
            </Row>
        </div>
    );
}
export default EditConfiguration;
