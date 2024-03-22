import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import {Card, ConfigProvider, Form, Input, InputNumber, Select, Switch} from "antd";
import {CheckOutlined, SmileOutlined} from "@ant-design/icons";

const Validations = () => {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [changed, setChanged] = useState(false)
    const [changingReplicas, setChangingReplicas] = useState(false)

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
        console.log("evo me")
        if (isVisible && !changed) {
            setChanged(true)
            setTimeout(() => setChangingReplicas(true), 1900)
            setTimeout(() => form.setFieldValue("Replicas", 7), 2000)
            setTimeout(() => form.setFieldValue("Replicas", 6), 2300)
            setTimeout(() => form.setFieldValue("Replicas", 5), 2500)
            setTimeout(() => form.setFieldValue("Replicas", 4), 2600)
            setTimeout(() => form.setFieldValue("Replicas", 3), 2700)
            setTimeout(() => form.setFieldValue("Replicas", 2), 2900)
            setTimeout(() => form.setFieldValue("Replicas", 1), 3200)
            setTimeout(() => form.setFieldValue("Replicas", 0), 3600)
            setTimeout(() => setChangingReplicas(false), 3650)
            setTimeout(() => form.validateFields(["Replicas"]), 3900)

            setTimeout(() => setChangingReplicas(true), 4150)
            setTimeout(() => form.setFieldValue("Replicas", 1), 4200)
            setTimeout(() => form.setFieldValue("Replicas", 2), 4500)
            setTimeout(() => form.setFieldValue("Replicas", 3), 4700)
            setTimeout(() => form.setFieldValue("Replicas", 4), 4900)
            setTimeout(() => form.setFieldValue("Replicas", 5), 5000)
            setTimeout(() => form.setFieldValue("Replicas", 6), 5100)
            setTimeout(() => form.setFieldValue("Replicas", 7), 5200)
            setTimeout(() => form.setFieldValue("Replicas", 8), 5400)
            setTimeout(() => form.setFieldValue("Replicas", 9), 5600)
            setTimeout(() => form.setFieldValue("Replicas", 10), 5800)
            setTimeout(() => form.setFieldValue("Replicas", 11), 6100)
            setTimeout(() => setChangingReplicas(false), 6150)
            setTimeout(() => form.validateFields(["Replicas"]), 6300)

            setTimeout(() => setChangingReplicas(true), 6450)
            setTimeout(() => form.setFieldValue("Replicas", 10), 6500)
            setTimeout(() => form.setFieldValue("Replicas", 9), 6700)
            setTimeout(() => form.setFieldValue("Replicas", 8), 7000)
            setTimeout(() => setChangingReplicas(true), 7050)
            setTimeout(() => form.validateFields(["Replicas"]), 7200)

            setTimeout(() => form.setFieldValue("Replicas", 100), 7400)
            setTimeout(() => form.validateFields(["Replicas"]), 7500)
        }
    }, [isVisible])

    return (
        <center ref={elementRef} style={{opacity: "0"}} className={isVisible ? styles.wrapper : ''}>
            <Card
                title="Configuration validation"
                style={{
                    zIndex: "100",
                    width: "80%",
                }}
            >
                <ConfigProvider
                    theme={{
                        token: {
                            colorPrimary: '#fe8801',
                        },
                    }}
                >
                    <Form labelCol={{span: '6'}} form={form}>
                        <Form.Item
                            label="Replicas"
                            style={{display: 'block'}}
                            name="Replicas"
                            hasFeedback
                            rules={[
                                {
                                    type: 'number',
                                    min: 1,
                                    message: 'Number of replicas must not be below 0'
                                },
                                {
                                    type: 'number',
                                    max: 10,
                                    message: 'Number of replicas must not exceed 10'
                                }
                            ]}
                        >
                            <InputNumber
                                readOnly={true}
                                className={changingReplicas ? styles.changingReplicas : ''}
                                style={{width: '100%'}}
                                defaultValue={8}
                                controls={false}
                            />
                        </Form.Item>
                    </Form>
                </ConfigProvider>
            </Card>
        </center>
    );
}

export default Validations;
