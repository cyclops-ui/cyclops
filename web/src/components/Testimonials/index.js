import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import {Col, Row} from "antd";
import Testimonial from "./Testimonial";
import TestimonialsTitle from "./Title";
import { LinkedinFilled } from '@ant-design/icons';

const Testimonials = () => {
    return (
        <div
            className={styles.featuresroot}
            style={{overflow: "hidden"}}
        >
            <div className={styles.features}>
                <Row align="middle">
                    <TestimonialsTitle/>
                </Row>
                <Row gutter={[16, 16]}>
                    <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 3 }}>
                        <Testimonial
                            name={"Rossana Suarez"}
                            position={"AWS Container Hero"}
                            avatar={"/img/rossana_suarez.jpeg"}
                            testimonial={<p>Deploying has never been easier: A single interface to manage your workloads
                                on Kubernetes. 🔥 <br/> An easy way to get started on <br/> Kubernetes👌</p>}
                        />
                    </Col>
                    <Col xs={{span: 20, offset: 2}} md={{span: 6, offset: 0}}>
                        <Testimonial
                            name={"Kunal Kushwaha"}
                            position={"DevRel manager at Civo"}
                            avatar={"/img/kunal_kushwaha.jpeg"}
                            testimonial={"Cyclops has transformed my Kubernetes management experience. Its intuitive form-based UI and Helm integration make deploying and monitoring applications straightforward and error-free. A must-try tool for anyone looking to simplify their Kubernetes operations!"}
                        />
                    </Col>
                    <Col xs={{span: 20, offset: 2}} md={{span: 6, offset: 0}}>
                        <Testimonial
                            name={"Ken Godoy"}
                            position={"VP, DevOps"}
                            avatar={"/img/ken_godoy.jpeg"}
                            testimonial={"Cyclops utilizes Helm charts for application deployment, making Kubernetes more accessible to users with different levels of expertise."}
                        />
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Testimonials;
