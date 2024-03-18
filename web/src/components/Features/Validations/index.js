import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import {Card} from "antd";
import {CheckOutlined, SmileOutlined} from "@ant-design/icons";

const Validations = () => {
    const elementRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [check, setCheck] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (elementRef.current) {
                const top = elementRef.current.getBoundingClientRect().top;
                const windowHeight = window.innerHeight;
                setIsVisible(top < windowHeight);
                setTimeout(() => setCheck(true), 2000)
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
        <center ref={elementRef} style={{opacity: "0"}} className={isVisible ? styles.wrapper : ''}>
            <Card
                title="Default size card"
                style={{
                    width: 300,
                }}
            >
                <div>
                    <CheckOutlined style={{opacity: "0"}} className={check ? styles.checkIcon : ''}/>
                </div>
                <p>Card content</p>
                <p>Card content</p>
                <p>Card content</p>
            </Card>
        </center>
    );
}

export default Validations;
