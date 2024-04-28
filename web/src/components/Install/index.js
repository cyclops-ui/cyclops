import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import InstallTitle from "./Title";
import InstallCmd from "./Install";
import FwdCmd from "./PortFwd";
import InstallDemo from "./Demo";

const Install = () => {
    return (
        <div className={styles.install}>
            <InstallTitle/>
            <InstallCmd/>
            <FwdCmd/>
            <InstallDemo/>
        </div>
    );
}

export default Install;
