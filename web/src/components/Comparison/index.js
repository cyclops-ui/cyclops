import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import SyntaxHighlighter from 'react-syntax-highlighter';

import {ConfigProvider, Form, Input, InputNumber, Select, Switch} from "antd";

const Comparison = () => {
    const [name, setName] = useState("nginx");
    const [replicas, setReplicas] = useState(3);
    const [version, setVersion] = useState("1.14.2");
    const [port, setPort] = useState(80);
    // const [expose, setExpose] = useState(false);
    const [intervalId, setIntervalId] = useState(null);

    const [form] = Form.useForm();

    const typeName = (name) => {
        setName(name);
        form.setFieldValue("Name", name)
    }

    useEffect(() => {
        if (intervalId === null) {
            const iId = setInterval(() => {
                if (form.getFieldValue("Name") === "my-app") {
                    setTimeout(() => typeName("my-ap"), 0)
                    setTimeout(() => typeName("my-a"), 50)
                    setTimeout(() => typeName("my-"), 100)
                    setTimeout(() => typeName("my"), 150)
                    setTimeout(() => typeName("m"), 200)

                    setTimeout(() => typeName("n"), 500)
                    setTimeout(() => typeName("ng"), 600)
                    setTimeout(() => typeName("ngi"), 700)
                    setTimeout(() => typeName("ngin"), 800)
                    setTimeout(() => typeName("nginx"), 900)
                } else {
                    setTimeout(() => typeName("ngin"), 0)
                    setTimeout(() => typeName("ngi"), 50)
                    setTimeout(() => typeName("ng"), 100)
                    setTimeout(() => typeName("n"), 150)

                    setTimeout(() => typeName("m"), 500)
                    setTimeout(() => typeName("my"), 600)
                    setTimeout(() => typeName("my-"), 700)
                    setTimeout(() => typeName("my-a"), 800)
                    setTimeout(() => typeName("my-ap"), 900)
                    setTimeout(() => typeName("my-app"), 1000)
                }
            }, 3000);

            setIntervalId(iId)
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [])

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

    const onNameChange = (event) => {
        setIntervalId(null);
        console.log(intervalId)
        clearInterval(intervalId)
        setName(event.target.value)
    }

    const onReplicasChange = (replicas) => {
        setReplicas(replicas)
    }

    const onVersionChange = (version) => {
        setVersion(version)
    }

    const onPortChange = (port) => {
        setPort(port)
    }

    return (
        <div className={styles.all}>
            <div className={styles.ui}>
                <div>
                    <h1 className={styles.title}>Deploying made <span style={{color: "orange"}}>easy</span></h1>
                </div>
                <div style={{paddingTop: "10px", paddingBottom: "20px"}}>
                    <h3 className={styles.descriptionitem}>
                        Cyclops enables you to build custom UIs on top of Kubernetes tailored to your needs in minutes.
                    </h3>

                    <h3 className={styles.descriptionitem}>
                        You can easily plug in your already existing Helm charts into UIs, thus making custom Internal developer platforms and making your developers lives easier.
                    </h3>
                </div>
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#fe8801',
                        },
                    }}
                >
                    <Form
                        labelCol={{
                            span: 6,
                            xs: 6
                        }}
                        wrapperCol={{
                            span: 18,
                            xs: 18
                        }}
                        form={form}
                    >
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
                            <Select
                                defaultValue={version}
                                options={[
                                    {value: '1.14.1', label: "1.14.1"},
                                    {value: '1.14.2', label: "1.14.2"},
                                    {value: '1.15.0', label: "1.15.0"}
                                ]}
                                onChange={onVersionChange}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Port"
                            style={{display: 'block'}}
                        >
                            <InputNumber style={{width: '100%'}} defaultValue={port} onChange={onPortChange}/>
                        </Form.Item>
                    </Form>
                </ConfigProvider>
            </div>

            <div className={styles.yaml}>
                <div
                    style={{
                        backgroundColor: "#000830",
                        borderBottom: "1px solid #a7a7a7",
                        borderRadius: "10px 10px 0px 0px",
                        height: "30px"
                    }}
                >
                    <span className={styles.dot} style={{backgroundColor: "#fe5f58", marginLeft: "10px"}}></span>
                    <span className={styles.dot} style={{backgroundColor: "#febc2e"}}></span>
                    <span className={styles.dot} style={{backgroundColor: "#26c940"}}></span>
                </div>
                <SyntaxHighlighter
                    style={{
                        "hljs-attr": {
                            color: "#FFF"
                        },
                        "react-syntax-highlighter-line-number": {
                            color: "#a7a7a7",
                            margin: "0"
                        }
                    }}
                    showLineNumbers={true}
                    customStyle={{
                        "borderRadius": "0px 0px 10px 10px",
                        backgroundColor: "#000830",
                        color: "#fe8801",
                    }}
                >
                    {k8sDplString}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}

export default Comparison;
