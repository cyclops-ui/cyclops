import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import {Card, Col, ConfigProvider, Form, InputNumber} from "antd";

const Productivity = () => {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

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

    return (
        <Col xs={{ span: 24 }} lg={{ span: 10, offset: 2 }}>
            <center ref={elementRef} style={{opacity: "0"}} className={isVisible ? styles.wrapper : ''}>
                <Card
                    title="Configuration validation"
                    style={{
                        zIndex: "100",
                        width: "80%",
                    }}
                >
                    nekaj
                </Card>
            </center>
        </Col>
    );
}

export default Productivity;
