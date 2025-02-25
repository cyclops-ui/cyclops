import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

import Card from "antd/es/card"
import Col from "antd/es/col"
import ConfigProvider from "antd/es/config-provider"
import Form from "antd/es/form"
import Input from "antd/es/input"
import InputNumber from "antd/es/input-number"
import Row from "antd/es/row"

const Customizable = () => {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [slideFirst, setSlideFirst] = useState(false);
    const [slideRight, setSlideRight] = useState(false);
    const [slideLeft, setSlideLeft] = useState(false);


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
        if (isVisible && !slideLeft && !slideRight) {
            setTimeout(() => setSlideFirst(true), 0)
            setTimeout(() => setSlideRight(true), 1500)
            setTimeout(() => setSlideLeft(true), 2000)
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
                        <Form labelCol={{span: '4'}}>
                            <Form.Item
                                label="Image"
                                style={{display: 'block', opacity: "0", marginTop: "10px"}}
                                name="Image"
                                className={slideFirst ? styles.inLeft : ''}
                            >
                                <Input
                                    readOnly={true}
                                    style={{width: '100%'}}
                                    defaultValue={"nginx"}
                                    controls={false}
                                />
                            </Form.Item>
                            <Form.Item
                                label="Replicas"
                                style={{display: 'block', opacity: "0"}}
                                name="Replicas"
                                className={slideRight ? styles.inRight : ''}
                            >
                                <InputNumber
                                    readOnly={true}
                                    style={{width: '100%'}}
                                    defaultValue={3}
                                    controls={false}
                                />
                            </Form.Item>
                            <Form.Item
                                label="Port"
                                style={{display: 'block', marginBottom: "10px", opacity: "0"}}
                                name="Port"
                                className={slideLeft ? styles.inLeft : ''}
                            >
                                <InputNumber
                                    readOnly={true}
                                    style={{width: '100%'}}
                                    defaultValue={80}
                                    controls={false}
                                />
                            </Form.Item>
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
                    <span style={{color: "#fe8801"}}>Customizable UI</span>
                </h2>
                <ul style={{color: "#FFF"}}>
                    <h3>
                        <li>
                            Build a <span style={{color: "#fe8801"}}>UI tailored to your needs</span> in minutes
                        </li>
                        <li>
                            Give developers the <span style={{color: "#fe8801"}}>right abstraction</span> of your infrastructure
                        </li>
                    </h3>
                </ul>
            </Col>
        </Row>
    );
}

export default Customizable;
