import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

import Row from "antd/es/row";

import cyclopsTitle from '/static/img/cyclops-title.png';

const FeaturesTitle = () => {
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
        <div ref={elementRef} style={{opacity: "0"}} className={isVisible ? styles.wrapper : ''}>
            <div className={styles.installTitle}>
                <Row>
                    <h1 className={styles.titleText}>
                        Why
                    </h1>
                </Row>
                <Row>
                    <img style={{height: "64px"}} src={cyclopsTitle}/>
                </Row>
            </div>
        </div>
    );
}

export default FeaturesTitle;
