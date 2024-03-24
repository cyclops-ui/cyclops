import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import FeaturesTitle from "./Title";
import Validations from "./Validations";
import {Col, Row} from "antd";
import Productivity from "./Productivity";

const Features = () => {
    return (
        <div style={{backgroundColor: "#000830"}}>
            <div className={styles.features}>
                <div className={styles.verticalline}></div>
                <Row>
                    <Col xs={{ span: 24, offset: 6 }} lg={{ span: 10, offset: 6 }}>
                        <FeaturesTitle/>
                    </Col>
                </Row>
                <Validations/>
                <Validations/>
                <Validations/>
                <Validations/>
                <Row style={{paddingTop: "50px"}}>
                    <Productivity/>
                </Row>
            </div>
        </div>
    );
}

export default Features;
