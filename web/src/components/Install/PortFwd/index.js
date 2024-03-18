import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

import CodeBlockString from "@docusaurus/theme-classic/lib/theme/CodeBlock/Content/String";


const FwdCmd = () => {
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
        <center ref={elementRef} style={{opacity: 0}} className={isVisible ? styles.command : ''}>
            <h2 className={styles.commandDesc}>
                Port forward your <span style={{color: "#fe8801"}}>Cyclops</span> instance
            </h2>
            <CodeBlockString>
                kubectl port-forward svc/cyclops-ui 3000:3000 -n cyclops
            </CodeBlockString>
        </center>
    );
}

export default FwdCmd;
