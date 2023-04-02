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

const {TextArea} = Input;

const {Title} = Typography;
const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};

const FormApp = () => {
    const [loading, setLoading] = useState(false);
    const [dplName, setName] = useState("");
    const [manifest, setManifest] = useState("");
    const [namespacesState, setNamespacesState] = useState([]);
    const history = useNavigate();

    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces`).then(res => {
            console.log(res.data)
            setNamespacesState(res.data.namespaces)
        });
    }, []);

    const handleSubmit = (values: any) => {
        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/deployments/manifest_preview`,
            values)
            .then(res => {
                console.log(res);
                setManifest(res.data.manifest)
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

        console.log(manifest);

        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/deployments/by_manifest/name',
            {
                manifest: manifest,
                app_name: "name",
            }
        )
            .then(function (response) {
                console.log(response)
                window.location.href = "/ns/default/d/" + dplName
            })
            .catch(function (error) {
                console.log(error)
                window.location.href = "/form"
            })
    };

    const handleCancel = () => {
        setLoading(false);
    };

    const namespaces: {} | any = [];
    namespacesState.map((namespace: any) => {
        namespaces.push(<Select.Option key={namespace.name}>{namespace.name}</Select.Option>)
    })

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        Define application
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Form {...layout} autoComplete={"off"} onFinish={handleSubmit}>
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
                            <Input/>
                        </Form.Item>
                        <Divider orientation="left" orientationMargin="0">
                            Define Deployment
                        </Divider>
                        <Form.Item name="app_name" id="app_name" label="AppName"
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
                        <Form.Item name="namespace" label="Namespace"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Select a namespace',
                                       }
                                   ]}
                        >
                            <Select placeholder="default">
                                {namespaces}
                            </Select>
                        </Form.Item>
                        <Form.Item name="kind" label="Kind"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Select artefact kind',
                                       }
                                   ]}
                        >
                            <Select placeholder="Deployment">
                                <Select.Option value="Deployment">Deployment</Select.Option>
                                <Select.Option value="StatefulSet">StatefulSet</Select.Option>
                                <Select.Option value="Ingress">Ingress</Select.Option>
                                <Select.Option value="DaemonSet">DaemonSet</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="labels" label="Labels">
                            <Form.List name="labels">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'key']}
                                                    rules={[{ required: true, message: 'Missing first name' }]}
                                                >
                                                    <Input placeholder="First Name" />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'value']}
                                                    rules={[{ required: true, message: 'Missing last name' }]}
                                                >
                                                    <Input placeholder="Last Name" />
                                                </Form.Item>
                                                <MinusCircleOutlined onClick={() => remove(name)} />
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
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
                            <Button type="ghost" htmlType="button" onClick={() => history('/list')}>
                                Back
                            </Button>
                            <Modal title="Staging area" visible={loading} onOk={handleOk} onCancel={handleCancel}
                                   width={'40%'}>
                                <AceEditor
                                    style={{width: '100%'}}
                                    mode="sass"
                                    theme="github"
                                    onChange={(value) => setManifest(value)}
                                    editorProps={{ $blockScrolling: true }}
                                    value={manifest}
                                />
                            </Modal>
                        </div>
                    </Form>
                </Col>
            </Row>
        </div>
    );
}
export default FormApp;