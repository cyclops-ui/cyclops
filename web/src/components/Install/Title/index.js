import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

import k8s from '/static/img/Kubernetes.png';

const InstallTitle = () => {
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
        <center ref={elementRef} style={{opacity: "0"}} className={isVisible ? styles.wrapper : ''}>
            <div className={styles.installTitle}>
                <h1 className={styles.titleText}>
                    Install into a Kubernetes cluster
                </h1>
                <img className={styles.k8sImg} src={k8s} />
            </div>
        </center>
    );
}

export default InstallTitle;
