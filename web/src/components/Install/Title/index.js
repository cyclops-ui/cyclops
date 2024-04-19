import React from 'react';
import styles from './styles.module.css';

import k8s from '/static/img/Kubernetes.png';

const InstallTitle = () => {
    return (
        <center className={styles.wrapper}>
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
