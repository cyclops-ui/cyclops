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
import ReactDiffViewer from "react-diff-viewer";

const {TextArea} = Input;

const {Title} = Typography;
const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};

const EditAppForm = () => {
    const [loading, setLoading] = useState(false);
    const [dplName, setName] = useState("");
    const [newManifest, setNewManifest] = useState("");
    const [oldManifest, setOldManifest] = useState("");
    const [oldFieldValues, setOldFieldValues] = useState([]);
    const [oldVersion, setOldVersion] = useState([]);
    const [changeTitle, setChangeTitle] = useState("");
    const [config, setConfig] = useState({
        name: "",
        manifest: "",
        fields: []
    })
    const history = useNavigate();

    const [form] = Form.useForm();
    let {namespace, name} = useParams();

    useEffect(() => {
        setLoading(true);
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces/` + namespace + `/deployments/` + name + `/configuration`).then(res => {
            setLoading(true);
            setConfig(res.data.configuration);
            setOldFieldValues(res.data.fields);
            setOldVersion(res.data.current_version);
            form.setFieldsValue(res.data.fields)
            setLoading(false);
        });
        setLoading(false);
    }, []);

    const handleSubmit = (values: any) => {
        console.log({
            "fields": values,
            "manifest": config.manifest,
        })

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/deployments/configurable-manifest-preview`,
            {
                "fields": oldFieldValues,
                "manifest": config.manifest,
                "change_title": oldVersion,
                "config_name": config.name,
            })
            .then(res => {
                setOldManifest(res.data.manifest);
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/deployments/configurable-manifest-preview`,
            {
                "fields": values,
                "manifest": config.manifest,
                "change_title": values["change_title"],
                "config_name": config.name,
            })
            .then(res => {
                console.log(res);
                setNewManifest(res.data.manifest)
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })

        setName(values.app_name);
        setLoading(true);
    }

    const handleOk = () => {
        setLoading(false);

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/deployments/by_manifest/name',
            {
                change_title: changeTitle,
                manifest: newManifest,
                previous_manifest: oldManifest,
                app_name: name,
            }
        )
            .then(function (response) {
                console.log(response)
                window.location.href = "/ns/" + form.getFieldValue("namespace") + "/d/" + form.getFieldValue("app_name")
            })
            .catch(function (error) {
                console.log(error)
            })

        console.log("deployam");
        // do a post request and deploy
    };

    const handleCancel = () => {
        setLoading(false)
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
                        Edit application
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Form {...layout} autoComplete={"off"} form={form} onFinish={handleSubmit}>
                        <Divider orientation="left" orientationMargin="0">
                            Change title
                        </Divider>
                        <Form.Item name="change_title" id="change_title" label="ChangeTitle"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Input change title',
                                       }
                                   ]}
                        >
                            <Input onChange={(event => setChangeTitle(event.target.value))}/>
                        </Form.Item>
                        <Divider orientation="left" orientationMargin="0">
                            Edit deployment
                        </Divider>
                        {formFields}
                        <div style={{textAlign: "right"}}>
                            <Button type="primary" loading={loading} htmlType="submit" name="Save">
                                Save
                            </Button>{' '}
                            <Button type="ghost" htmlType="button" onClick={() => history('/list')}>
                                Back
                            </Button>
                            <Modal title="Staging area" visible={loading} onOk={handleOk} onCancel={handleCancel}
                                   width={'40%'}>
                                <AceEditor
                                    style={{width: '100%'}}
                                    name="staging_modal_input"
                                    mode="sass"
                                    theme="github"
                                    onChange={(value) => setNewManifest(value)}
                                    editorProps={{ $blockScrolling: true }}
                                    value={newManifest}
                                />
                                <ReactDiffViewer
                                    oldValue={oldManifest}
                                    newValue={newManifest}
                                    splitView={true}
                                    leftTitle={"current manifest"}
                                    rightTitle={"updated manifest"}
                                    useDarkTheme={false}
                                />
                            </Modal>
                        </div>
                    </Form>
                </Col>
            </Row>
        </div>
    );
}
export default EditAppForm;