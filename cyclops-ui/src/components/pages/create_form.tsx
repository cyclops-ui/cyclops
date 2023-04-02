import React, {useEffect, useState} from 'react';
import {Button, Col, Collapse, Divider, Form, Input, message, Modal, Row, Select, Space, Typography} from 'antd';
import {useNavigate} from 'react-router';
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import axios from "axios";

const {TextArea} = Input;

const {Title} = Typography;
const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};

type Field = {
    name: string,
    type: string,
    display_name: string,
    initial_value: string,
    value: any,
}

const CreateForm = () => {
    const [loading, setLoading] = useState(false);
    const [dplName, setName] = useState("");
    const [manifest, setManifest] = useState("");
    const [namespacesState, setNamespacesState] = useState([]);
    const history = useNavigate();

    const handleSubmit = (values: any) => {
        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config`,
            values)
            .then(res => {
                window.location.href = "/configurations"
            })
            .catch(error => {
                setLoading(false);
                console.log(error)
            })
    }

    const handleOk = () => {
    };
    const handleCancel = () => {
    };
    const namespaces: {} | any = [];

    const addFields =
        <Form.Item name="fields" label="Fields">
            <Form.List name="fields">
                {(fields, {add, remove}) => (
                    <>
                        {fields.map(({key, name, ...restField}) => (
                            <Collapse>
                                <Collapse.Panel header={key} key=''>
                                    <Space key={key} style={{display: 'block', marginBottom: 8}}
                                           align="baseline">
                                        <Form.Item
                                            {...restField}
                                            label="Name"
                                            style={{display: 'block'}}
                                            name={[name, 'name']}
                                            rules={[{required: true, message: 'Missing name'}]}
                                        >
                                            <Input id={"field_id_" + key}/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            label="Display name"
                                            style={{display: 'block'}}
                                            name={[name, 'display_name']}
                                            rules={[{required: true, message: 'Missing display name'}]}
                                        >
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            label="Manifest key"
                                            style={{display: 'block'}}
                                            name={[name, 'manifest_key']}
                                            rules={[{required: true, message: 'Missing manifest key'}]}
                                        >
                                            <Input/>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            label="Type"
                                            style={{display: 'block'}}
                                            name={[name, 'type']}
                                            rules={[{required: true, message: 'Missing type'}]}
                                        >
                                            <Select placeholder={"string"}>
                                                <Select.Option value="string">string</Select.Option>
                                                <Select.Option value="number">number</Select.Option>
                                                <Select.Option value="boolean">boolean</Select.Option>
                                                <Select.Option value="map">map</Select.Option>
                                            </Select>
                                        </Form.Item>
                                        <MinusCircleOutlined label={"Remove field"} onClick={() => remove(name)}/>
                                    </Space>
                                </Collapse.Panel>
                            </Collapse>
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

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        Define configuration
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={18}>
                    <Form {...layout} autoComplete={"off"} onFinish={handleSubmit}>
                        <Divider orientation="left" orientationMargin="0">
                            Configuration name
                        </Divider>
                        <Form.Item name="name" id="name" label="Name">
                            <Input/>
                        </Form.Item>
                        <Divider orientation="left" orientationMargin="0">
                            Define config fields
                        </Divider>
                        {addFields}
                        <Divider orientation="left" orientationMargin="0">
                            Define yaml template
                        </Divider>
                        <Form.Item label="Manifest template" name="manifest">
                            <AceEditor
                                name="manifest"
                                style={{width: '100%'}}
                                mode="sass"
                                theme="github"
                                editorProps={{$blockScrolling: true}}
                            />
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
                                    name="manifest"
                                    style={{width: '100%'}}
                                    mode="sass"
                                    theme="github"
                                    onChange={(value) => setManifest(value)}
                                    editorProps={{$blockScrolling: true}}
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
export default CreateForm;
