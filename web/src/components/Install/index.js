import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import InstallTitle from "./Title";
import InstallCmd from "./Install";
import FwdCmd from "./PortFwd";

const Install = () => {
    return (
        <div className={styles.install}>
            <InstallTitle/>
            <InstallCmd/>
            <FwdCmd/>
        </div>
    );
}

export default Install;
