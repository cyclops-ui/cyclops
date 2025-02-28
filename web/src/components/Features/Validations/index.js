import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

import Card from "antd/es/card"
import Col from "antd/es/col"
import ConfigProvider from "antd/es/config-provider"
import Form from "antd/es/form"
import Input from "antd/es/input"
import InputNumber from "antd/es/input-number"
import Row from "antd/es/row"

const Validations = () => {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [changed, setChanged] = useState(false)
    const [replicasStyle, setReplicasStyle] = useState("")

    const [form] = Form.useForm();

    useEffect(() => {
        const handleScroll = () => {
            if (elementRef.current) {
                const top = elementRef.current.getBoundingClientRect().top;
                const windowHeight = window.innerHeight;
                setIsVisible(top < windowHeight);
            }
        };

        // Initial check when component mounts
        handleScroll();

        // Event listener for scroll
        window.addEventListener('scroll', handleScroll);

        // Cleanup
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (isVisible && !changed) {
            setChanged(true)
            setTimeout(() => setReplicasStyle(styles.changingReplicas), 2900)
            setTimeout(() => form.setFieldValue("Replicas", 2), 3000)
            setTimeout(() => form.setFieldValue("Replicas", 1), 3300)
            setTimeout(() => form.setFieldValue("Replicas", 0), 3600)
            setTimeout(() => setReplicasStyle(''), 3700)
            setTimeout(() => form.validateFields(["Replicas"]), 3700)

            setTimeout(() => setReplicasStyle(styles.changingReplicas), 4700)
            setTimeout(() => form.setFieldValue("Replicas", 1), 4800)
            setTimeout(() => form.setFieldValue("Replicas", 2), 5100)
            setTimeout(() => form.setFieldValue("Replicas", 3), 5400)
            setTimeout(() => setReplicasStyle(''), 5500)
            setTimeout(() => form.validateFields(["Replicas"]), 5500)

            setTimeout(() => setReplicasStyle(styles.success), 6000)
        }
    }, [isVisible])

    return (
        <Row style={{paddingTop: "50px", opacity: "0" }} ref={elementRef} className={isVisible ? styles.wrapper : ''}>
            <Col xs={{ span: 24, order: 2 }} lg={{ span: 11, offset: 2 }}>
                <Card
                    className={styles.animationcard}
                >
                    <ConfigProvider
                        theme={{
                            token: {
                                colorPrimary: '#fe8801',
                            },
                        }}
                    >
                        <Form labelCol={{span: '4'}} form={form}>
                            <Row>
                                <Col span={20} offset={2}>
                                    <Form.Item
                                        label="Image"
                                        style={{display: 'block', opacity: "0.5", marginTop: "10px"}}
                                        name="Image"
                                    >
                                        <Input
                                            readOnly={true}
                                            style={{width: '100%'}}
                                            defaultValue={"nginx"}
                                            controls={false}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item
                                label={<span style={{fontSize: "16px"}}>Replicas</span>}
                                style={{display: 'block'}}
                                name="Replicas"
                                hasFeedback
                                rules={[
                                    {
                                        type: 'number',
                                        min: 1,
                                        message: 'Number of replicas must be greater than 0'
                                    },
                                ]}
                            >
                                <InputNumber
                                    readOnly={true}
                                    className={replicasStyle}
                                    style={{width: '100%'}}
                                    defaultValue={3}
                                    controls={false}
                                />
                            </Form.Item>
                            <Row>
                                <Col span={20} offset={2}>
                                    <Form.Item
                                        label="Port"
                                        style={{display: 'block', opacity: "0.5", marginBottom: "10px"}}
                                        name="Port"
                                    >
                                        <InputNumber
                                            readOnly={true}
                                            style={{width: '100%'}}
                                            defaultValue={80}
                                            controls={false}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </ConfigProvider>
                </Card>
            </Col>
            <Col xs={{ span: 15, offset: 6 }} lg={{ span: 8, offset: 0, order: 2 }} style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}>
                <h2 style={{color: "#FFF", marginBottom: "10px"}}>
                    <span style={{color: "#fe8801"}}>Validate your configuration</span>
                </h2>
                <ul style={{color: "#FFF"}}>
                    <h3>
                        <li>
                            <span style={{color: "#fe8801"}}>catch misconfiguration</span> before it hits production
                        </li>
                        <li>
                            move faster and be more <span style={{color: "#fe8801"}}>confident</span> in your changes
                        </li>
                    </h3>
                </ul>
            </Col>
        </Row>
    );
}

export default Validations;
