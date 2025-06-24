import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import SyntaxHighlighter from 'react-syntax-highlighter';

import Form from "antd/es/form";

import ConfigProvider from "antd/es/config-provider"
import Input from "antd/es/input"
import InputNumber from "antd/es/input-number"
import Select from "antd/es/select"

const Comparison = () => {
    const [name, setName] = useState("nginx");
    const [replicas, setReplicas] = useState(3);
    const [version, setVersion] = useState("1.14.2");
    const [port, setPort] = useState(80);
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
                    <h1 className={styles.title}>Deploying made easy</h1>
                </div>
                <div style={{paddingTop: "0", paddingBottom: "20px"}}>
                    <h3 className={styles.descriptionitem}>
                        <span style={{color: "#fe8801", fontWeight: "bold"}}>Hide the complexity</span> of Kubernetes under a UI
                        tailored to your needs. Ideal <span style={{color: "#fe8801", fontWeight: "bold"}}>for development teams</span> that interact with Kubernetes regularly.
                    </h3>
                </div>
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#fe8801',
                            borderRadius: 8,
                            fontSize: 16,
                        },
                        components: {
                            Form: {
                                labelFontSize: 16,
                                labelFontWeight: 600,
                                labelColor: '#1a1f4e',
                            },
                        }
                    }}
                >
                    <Form
                        labelCol={{
                            span: 6,
                            xs: 6
                        }}
                        wrapperCol={{
                            span: 18,
                            xs: 15
                        }}
                        form={form}
                    >
                        <Form.Item
                            label={<span style={{fontSize: "18px"}}>Name</span>}
                            name="Name"
                            style={{flexDirection: 'row'}}
                        >
                            <Input defaultValue={name} onChange={onNameChange}/>
                        </Form.Item>
                        <Form.Item
                            label={<span style={{fontSize: "18px"}}>Replicas</span>}
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
                            label={<span style={{fontSize: "18px"}}>Version</span>}
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
                            label={<span style={{fontSize: "18px"}}>Port</span>}
                            style={{display: 'block'}}
                        >
                            <InputNumber style={{width: '100%'}} defaultValue={port} onChange={onPortChange}/>
                        </Form.Item>
                    </Form>
                </ConfigProvider>
            </div>

            <div
                className={styles.yaml}
                style={{
                    borderRadius: "15px",
                    boxShadow: "16px 24px 64px rgba(30, 64, 175, 0.4)"
                }}
            >
                <div
                    style={{
                        background: "linear-gradient(135deg, #1a1f4e 0%, #0a0f2e 100%)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "15px 15px 0px 0px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 1rem",
                    }}
                >
                    <span className={styles.dot} style={{backgroundColor: "#fe5f58", marginLeft: "10px"}}></span>
                    <span className={styles.dot} style={{backgroundColor: "#febc2e"}}></span>
                    <span className={styles.dot} style={{backgroundColor: "#26c940"}}></span>
                </div>
                <SyntaxHighlighter
                    style={{
                        "hljs-attr": {
                            color: "#fe8801"
                        },
                        "hljs-string": {
                            color: "#ffffff"
                        },
                        "hljs-number": {
                            color: "#4ecdc4"
                        },
                        "hljs-keyword": {
                            color: "#ff6b6b"
                        },
                        "react-syntax-highlighter-line-number": {
                            color: "#6c757d",
                            margin: "0"
                        }
                    }}
                    showLineNumbers={true}
                    customStyle={{
                        borderRadius: "0px 0px 15px 15px",
                        background: "linear-gradient(135deg, #1a1f4e 0%, #0a0f2e 100%)",
                        color: "#ffffff",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        padding: "1.5rem",
                        margin: 0,
                    }}
                >
                    {k8sDplString}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}

export default Comparison;
