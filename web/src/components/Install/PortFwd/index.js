import React from 'react';
import styles from './styles.module.css';

import CodeBlockString from "@docusaurus/theme-classic/lib/theme/CodeBlock/Content/String";


const FwdCmd = () => {
    return (
        <center className={styles.command}>
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
