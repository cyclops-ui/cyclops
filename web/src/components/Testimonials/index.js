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
                            icon={<LinkedinFilled style={{color: "#0072b1"}} />}
                            position={"AWS Container Hero"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            testimonial={<p>Deploying has never been easier: A single interface to manage your workloads on Kubernetes. 🔥 <br/> An easy way to get started on kubernetes👌</p>}
                        />
                    </Col>
                    <Col xs={{span: 20, offset: 2}} md={{span: 6, offset: 0}}>
                        <Testimonial
                            name={"Ken Godoy"}
                            icon={<LinkedinFilled style={{color: "#0072b1"}}/>}
                            position={"VP, DevOps"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            testimonial={"Cyclops utilizes Helm charts for application deployment, making Kubernetes more accessible to users with different levels of expertise."}
                        />
                    </Col>
                    <Col xs={{span: 20, offset: 2}} md={{span: 6, offset: 0}}>
                        <Testimonial
                            name={"Juraj Karadza"}
                            icon={<LinkedinFilled style={{color: "#0072b1"}}/>}
                            position={"CEO of Cyclops"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            testimonial={"super je ovo sve, odlicnosuper je ovo sve, odlicnosuper je ovo sve, odlicnosuper je ovo sve, odlicnosuper je ovo sve, odlicnosuper je ovo sve, odlicnosuper je ovo sve, odlicnosuper je ovo sve, odlicno"}
                        />
                    </Col>
                </Row>
            </div>
        </div>
    );
}

export default Testimonials;
