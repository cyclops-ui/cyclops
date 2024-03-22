import React, {useEffect, useState} from 'react';
import styles from './styles.module.css';
import FeaturesTitle from "./Title";
import Validations from "./Validations";
import {Col, Row} from "antd";

const Features = () => {
    return (
        <div className={styles.install}>
            <div>
                <FeaturesTitle/>
                <Row>
                    <Col xs={{ span: 24 }} lg={{span: 10, offset: 2}}>
                        <Validations/>
                    </Col>
                </Row>
                <Row>
                    <Col xs={{ span: 24 }} lg={{span: 10, offset: 12}}>
                        <Validations/>
                    </Col>
                </Row>
            </div>

        </div>
    );
}

export default Features;
