import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

import Row from "antd/es/row";

import cyclopsTitle from '/static/img/cyclops-title.png';

const FeaturesTitle = () => {
    return (
        <div className={styles.wrapper}>
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
