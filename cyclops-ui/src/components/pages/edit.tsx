import React, {useEffect, useState} from 'react';
import {Button, Col, Divider, Form, Input, InputNumber, message, Modal, Row, Select, Space, Typography} from 'antd';
import axios from 'axios';
import {useNavigate} from 'react-router';
import {useParams} from "react-router-dom";
import ReactDiffViewer from "react-diff-viewer";
import {MinusCircleOutlined, PlusOutlined} from '@ant-design/icons';

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

const {TextArea} = Input;

const {Title} = Typography;
const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};

var manifest = '';

interface pod {
    name: string,
    node_name: string,
    containers: string,
    memory: number,
    cpu: number,
    healthy: boolean,
    status: string,
    age: string,
}

interface dpl {
    app_name: string,
    namespace: string,
    kind: string,
    image_name: string,
    replicas: number,
    healthy: boolean,
    age: string,
    restarts: number,
    labels: Map<string, string>,
    environment_variables: Map<string, string>,
    pods: pod[],
}

const Edit = () => {
    const [loading, setLoading] = useState(false);
    const [oldManifest, setOldManifest] = useState("");
    const [newManifest, setNewManifest] = useState("");
    const [changeTitle, setChangeTitle] = useState("");

    const [oldConfig, setOldConfig] = useState<dpl>({
        age: "",
        app_name: "",
        healthy: false,
        image_name: "",
        kind: "",
        namespace: "",
        replicas: 0,
        restarts: 0,
        labels: new Map<string, string>(
            [
                ["app", "alinv"]
            ]
        ),
        environment_variables: new Map<string, string>(),
        pods: [],
    });

    const history = useNavigate();
    const [form] = Form.useForm();

    let {namespace, deployment} = useParams();
    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces/` + namespace + `/deployments/` + deployment).then(res => {
            form.setFieldsValue({
                app_name: res.data.app_name,
                image_name: res.data.image_name,
                replicas: res.data.replicas,
                labels: res.data.labels,
                environment_variables: res.data.environment_variables,
                namespace: res.data.namespace,
                kind: res.data.kind,
                service_name: "a",
                service_label: "a",
                port: 8080,
                target_port: 8080,
                protocol: "a",
                service_selector: "a",
            })
            setOldConfig(res.data)
            console.log(oldConfig)
        });
    }, []);

    const handleSubmit = (values: any) => {
        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/deployments/manifest_preview`,
            oldConfig)
            .then(res => {
                setOldManifest(res.data.manifest);
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/deployments/manifest_preview`,
            values)
            .then(res => {
                setNewManifest(res.data.manifest);
                manifest = res.data.manifest
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })

        setLoading(true);
    }

    const handleOk = () => {
        setLoading(false);

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/deployments/by_manifest/name',
            {
                change_title: changeTitle,
                manifest: newManifest,
                previous_manifest: oldManifest,
                app_name: deployment,
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
        setLoading(false);
    };

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
                            Define Deployment
                        </Divider>
                        <Form.Item name="app_name" id="app_name" label="AppName" initialValue={"ouhavklabu"}
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Deployment name',
                                       }
                                   ]}
                        >
                            <Input placeholder="my-rest-api"/>
                        </Form.Item>
                        <Form.Item name="image_name" label="ImageName"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Image name',
                                       }
                                   ]}
                        >
                            <Input placeholder="registry/my-rest-api:tag"/>
                        </Form.Item>
                        <Form.Item label="Replicas" name="replicas" initialValue={1}>
                            <InputNumber/>
                        </Form.Item>
                        <Form.Item name="namespace" label="Namespace" initialValue="Default"
                                   rules={[
                                       {
                                           message: 'Namespace',
                                       }
                                   ]}
                        >
                            <Input disabled={true}/>
                        </Form.Item>
                        <Form.Item name="kind" label="Kind"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Select artefact kind',
                                       }
                                   ]}
                        >
                            <Select placeholder="Deployment" disabled={true}>
                                <Select.Option value="Deployment">Deployment</Select.Option>
                                <Select.Option value="StatefulSet">StatefulSet</Select.Option>
                                <Select.Option value="Ingress">Ingress</Select.Option>
                                <Select.Option value="DaemonSet">DaemonSet</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="labels" label="Labels">
                            <Form.List name="labels">
                                {(fields, {add, remove}) => (
                                    <>
                                        {fields.map(({key, name, ...restField}) => (
                                            <Space key={key} style={{display: 'flex', marginBottom: 8}}
                                                   align="baseline">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'key']}
                                                    rules={[{required: true, message: 'Missing first name'}]}
                                                >
                                                    <Input placeholder="First Name"/>
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'value']}
                                                    rules={[{required: true, message: 'Missing last name'}]}
                                                >
                                                    <Input placeholder="Last Name"/>
                                                </Form.Item>
                                                <MinusCircleOutlined onClick={() => remove(name)}/>
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button block type="dashed" onClick={() => add()} icon={<PlusOutlined/>}>
                                                Add label
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                        <Form.Item name="environment_variables" label="Environment Variables">
                            <Form.List name="environment_variables">
                                {(fields, {add, remove}) => (
                                    <>
                                        {fields.map(({key, name, ...restField}) => (
                                            <Space key={key} style={{display: 'flex', marginBottom: 8}}
                                                   align="baseline">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'name']}
                                                    rules={[{required: true, message: 'Missing name'}]}
                                                >
                                                    <Input placeholder="Name"/>
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'value']}
                                                    rules={[{required: true, message: 'Missing last name'}]}
                                                >
                                                    <Input placeholder="Last Name"/>
                                                </Form.Item>
                                                <MinusCircleOutlined onClick={() => remove(name)}/>
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined/>}>
                                                Add environment variable
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                        <div style={{textAlign: "right"}}>
                            <Button type="primary" loading={loading} htmlType="submit" name="Save">
                                Save
                            </Button>{' '}
                            <Button htmlType="button" name="Undo" onClick={() => {
                                form.setFieldsValue({
                                    app_name: oldConfig.app_name,
                                    image_name: oldConfig.image_name,
                                    replicas: oldConfig.replicas,
                                    label: oldConfig.app_name,
                                    namespace: oldConfig.namespace,
                                    kind: oldConfig.kind,
                                    labels: oldConfig.labels,
                                    environment_variables: oldConfig.environment_variables,
                                    service_name: "a",
                                    service_label: "a",
                                    port: 8080,
                                    target_port: 8080,
                                    protocol: "a",
                                    service_selector: "a",
                                })
                            }}>
                                Undo
                            </Button> {' '}
                            <Button htmlType="button" onClick={() => history('/list')}>
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

export default Edit;