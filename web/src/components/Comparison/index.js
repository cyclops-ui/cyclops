import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import SyntaxHighlighter from 'react-syntax-highlighter';

import {ConfigProvider, Form, Input, InputNumber, Switch} from "antd";

const Comparison = () => {
    const [name, setName] = useState("nginx");
    const [replicas, setReplicas] = useState(3);
    const [version, setVersion] = useState("1.14.2");
    const [port, setPort] = useState(80);
    const [expose, setExpose] = useState(false);

    const [form] = Form.useForm();

    const typeName = (name) => {
        setName(name);
        form.setFieldValue("Name", name)
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            console.log(name)

            if (name === "nginx") {
                setTimeout(() => typeName("ngin"), 0)
                setTimeout(() => typeName("ngi"), 50)
                setTimeout(() => typeName("ng"), 100)
                setTimeout(() => typeName("n"), 150)
                setTimeout(() => typeName(""), 200)

                setTimeout(() => typeName("m"), 500)
                setTimeout(() => typeName("my"), 600)
                setTimeout(() => typeName("my-"), 700)
                setTimeout(() => typeName("my-a"), 800)
                setTimeout(() => typeName("my-ap"), 900)
                setTimeout(() => typeName("my-app"), 1000)
            } else {
                setTimeout(() => typeName("my-ap"), 0)
                setTimeout(() => typeName("my-a"), 50)
                setTimeout(() => typeName("my-"), 100)
                setTimeout(() => typeName("my"), 150)
                setTimeout(() => typeName("m"), 200)
                setTimeout(() => typeName(""), 250)

                setTimeout(() => typeName("n"), 500)
                setTimeout(() => typeName("ng"), 600)
                setTimeout(() => typeName("ngi"), 700)
                setTimeout(() => typeName("ngin"), 800)
                setTimeout(() => typeName("nginx"), 900)
            }
        }, 2000);

        return () => clearInterval(intervalId);
    }, [name])

    const mapReplicas = (n) => {
        if (n === null || n === undefined) {
            return 0
        }

        if (n > 5) {
            return 5;
        }

        if (n < 0) {
            return 0;
        }

        return n;
    }

    const mapPort = (n) => {
        if (n === null || n === undefined) {
            return 80
        }

        return n;
    }

    const k8sDplString = 'apiVersion: apps/v1\n' +
        'kind: Deployment\n' +
        'metadata:\n' +
        '  name: ' + name + '\n' +
        '  labels:\n' +
        '    app: ' + name + '\n' +
        'spec:\n' +
        '  replicas: ' + mapReplicas(replicas) + '\n' +
        '  selector:\n' +
        '    matchLabels:\n' +
        '      app: ' + name + '\n' +
        '  template:\n' +
        '    metadata:\n' +
        '      labels:\n' +
        '        app: ' + name + '\n' +
        '    spec:\n' +
        '      containers:\n' +
        '      - name: ' + name + '\n' +
        '        image: ' + name + ':' + version + '\n' +
        '        ports:\n' +
        '        - containerPort: ' + mapPort(port)

    const k8sSvcString = '---\n' +
        'apiVersion: v1\n' +
        'kind: Service\n' +
        'metadata:\n' +
        '  name: ' + name + '\n' +
        'spec:\n' +
        '  selector:\n' +
        '    app: ' + name + '\n' +
        '  ports:\n' +
        '    - protocol: TCP\n' +
        '      port: ' + mapPort(port) + '\n' +
        '      targetPort: 9376'

    const onNameChange = (event) => {
        setName(event.target.value)
    }

    const onReplicasChange = (replicas) => {
        setReplicas(replicas)
    }

    const onVersionChange = (event) => {
        setVersion(event.target.value)
    }

    const onPortChange = (port) => {
        setPort(port)
    }

    const onNeedService = (service) => {
        setExpose(service)
    }

    const getManifest = () => {
        var manifest = k8sDplString;

        if (expose) {
            manifest += '\n' + k8sSvcString;
        }

        return manifest
    }

    return (
        <div className={styles.all}>
            <div className={styles.ui}>
                <div>
                    <h1 className={styles.title}>Deploying made <span style={{color: "orange"}}>easy</span></h1>
                </div>
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#fe8801',
                        },
                    }}
                >
                    <Form labelCol={{span: '6'}} form={form}>
                        <Form.Item
                            label="Name"
                            name="Name"
                            style={{flexDirection: 'row'}}
                        >
                            <Input defaultValue={name} onChange={onNameChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Replicas"
                            style={{display: 'block'}}
                            name="Replicas"
                            rules={[
                                {
                                    type: 'number',
                                    min: 0,
                                    message: 'Number of replicas must not be below 0'
                                },
                                {
                                    type: 'number',
                                    max: 5,
                                    message: 'Number of replicas must not exceed 5'
                                }
                            ]}
                        >
                            <InputNumber style={{width: '100%'}} defaultValue={replicas} onChange={onReplicasChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Version"
                            style={{display: 'block'}}
                        >
                            <Input defaultValue={version} onChange={onVersionChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Port"
                            style={{display: 'block'}}
                        >
                            <InputNumber style={{width: '100%'}} defaultValue={port} onChange={onPortChange}/>
                        </Form.Item>
                        <Form.Item
                            label="Expose"
                            style={{display: 'block', textAlign: 'left'}}
                        >
                            <Switch defaultValue={expose} onChange={onNeedService}/>
                        </Form.Item>
                    </Form>
                </ConfigProvider>
            </div>
            <div className={styles.yaml}>
                <SyntaxHighlighter
                    language="yaml"
                    style={{
                        "hljs-attr": {
                            color: "#FFF"
                        },
                        "react-syntax-highlighter-line-number": {
                            color: "#a7a7a7"
                        }
                    }}
                    showLineNumbers={true}
                    customStyle={{
                        backgroundColor: "#000830",
                        color: "#fe8801"
                    }}
                >
                    {getManifest()}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}

export default Comparison;
