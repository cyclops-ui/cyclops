import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

import CodeBlockString from "@docusaurus/theme-classic/lib/theme/CodeBlock/Content/String";
import CodeBlockJSX from "@docusaurus/theme-classic/lib/theme/CodeBlock/Content/Element";

const InstallCmd = () => {
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
                Install it with a single command
            </h2>
            <CodeBlockString language={"sh"}>
                {"kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/template-ref-crd/install/cyclops-install.yaml && \\\n" +
                "kubectl apply -f https://raw.githubusercontent.com/cyclops-ui/cyclops/template-ref-crd/install/demo-templates.yaml"}
            </CodeBlockString>
        </center>
    );
}

export default InstallCmd;
