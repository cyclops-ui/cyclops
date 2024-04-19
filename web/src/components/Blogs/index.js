import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';
import {Col, Row} from "antd";
import Blog from "./Blog";
import BlogsTitle from "./Title";
import BlogsDescription from "./Description";
import More from "./More"

const Blogs = () => {
    return (
        <div
            className={styles.featuresroot}
            style={{overflow: "hidden"}}
        >
            <div className={styles.features}>
                <Row align="middle">
                    <BlogsTitle/>
                </Row>
                <Row>
                    <Col span={18} offset={3}>
                        <BlogsDescription/>
                    </Col>
                </Row>
                <Row gutter={[16, 16]}>
                    <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 3 }}>
                        <Blog
                            title={"How Telemetry Saved my Open-Source Platform"}
                            description={"What started as a frustration with not being able to get in touch with our users, quickly developed into a redesign of the flow of our platform"}
                            blogLink={"https://cyclops-ui.com/blog/2024/04/12/telemetry"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            banner={'/img/2024-04-12-telemetry/telemetry-cover.png'}
                        />
                    </Col>
                    <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
                        <Blog
                            title={"Kubernetes Through the Developer's Perspective"}
                            description={"We perceive things by the way we interact with and understand them"}
                            blogLink={"https://cyclops-ui.com/blog/2024/03/26/devs-perspective"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            banner={'/img/2024-03-26-devs-perspective/devs-perspective.webp'}
                        />
                    </Col>
                    <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
                        <Blog
                            title={"Contributing to Open Source"}
                            description={"Have you ever thought of contributing to open source?"}
                            blogLink={"https://cyclops-ui.com/blog/2024/02/23/contributing-to-OS"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            banner={'/img/2024-02-23-contributing-to-OS/contributing-to-OS.jpeg'}
                        />
                    </Col>
                </Row>
                <More/>
            </div>
        </div>
    );
}

export default Blogs;
