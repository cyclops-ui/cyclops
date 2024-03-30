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
                            title={"Contributing to Open Source"}
                            description={"Have you ever thought of contributing to open source?"}
                            blogLink={"https://cyclops-ui.com/blog/2024/02/23/contributing-to-OS"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            banner={'/img/2024-02-23-contributing-to-OS/contributing-to-OS.jpeg'}
                        />
                    </Col>
                    <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
                        <Blog
                            title={"How Promoting Open-Source Can Become Problematic"}
                            description={"If you have been in the open-source community lately, you know what I am talking about. The story goes something like this: There were loads of videos/blogs/events hyping up open-source contributions, mainly as a good gateway to land your dream software engineering job. And to some extent, it is true."}
                            blogLink={"https://cyclops-ui.com/blog/2024/02/08/OS-problematic"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            banner={'/img/2024-02-08-OS-problematic/OS-problematic.jpeg'}
                        />
                    </Col>
                    <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
                        <Blog
                            title={"Coexistence of containers and Helm charts - OCI based registries"}
                            description={"If you are using Kubernetes, there's a fair chance you are using Helm or at least considered to. This article will guide you on how to publish your Helm charts in a less conventional way - using OCI-based registries."}
                            blogLink={"https://cyclops-ui.com/blog/2024/01/29/OCI-based-registries"}
                            avatar={"https://github.com/KaradzaJuraj.png"}
                            banner={'/img/2024-01-29-OCI-based-registries/oci_helm_docker.jpeg'}
                        />
                    </Col>
                </Row>
                <More/>
            </div>
        </div>
    );
}

export default Blogs;
