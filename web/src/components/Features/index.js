import React, {useEffect, useRef} from 'react';
import styles from './styles.module.css';
import FeaturesTitle from "./Title";
import Validations from "./Validations";
import {Col, Row} from "antd";
import Productivity from "./Productivity";
import Customizable from "./Customizable";

const Features = () => {
    const featRoot = useRef(null);
    const vertLine = useRef(null);

    useEffect(() => {
        vertLine.current.style.height = featRoot.current.offsetHeight + "px";
    }, [])

    return (
        <div
            className={styles.featuresroot}
            ref={featRoot}
            style={{overflow: "hidden"}}
        >
            <div
                className={styles.verticalline}
                ref={vertLine}
            />
            <div className={styles.features}>
                <Row style={{paddingBottom: "32px"}}>
                    <Col xs={{span: 24, offset: 6}} lg={{span: 10, offset: 6}}>
                        <FeaturesTitle/>
                    </Col>
                </Row>
                <Customizable/>
                <Validations/>
                <Productivity/>
                <Validations/>
            </div>
        </div>
    );
}

export default Features;
