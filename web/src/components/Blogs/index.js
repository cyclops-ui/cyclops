import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import { Col, Row } from "antd";
import Blog from "./Blog";
import BlogsTitle from "./Title";
import BlogsDescription from "./Description";
import More from "./More";

const Blogs = () => {
  return (
    <div className={styles.featuresroot} style={{ overflow: "hidden" }}>
      <div className={styles.features}>
        <Row align="middle">
          <BlogsTitle />
        </Row>
        <Row>
          <Col span={18} offset={3}>
            <BlogsDescription />
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 3 }}>
            <Blog
              title={"What the Helm?!"}
              description={
                "Kubernetes applications rarely (if ever) consist of a single resource..."
              }
              blogLink={"https://cyclops-ui.com/blog/2024/07/05/what-the-helm"}
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-07-05-what-the-helm/cover.jpg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Why CLIs are STILL important"}
              description={
                "Command Line Interfaces (CLIs) seem old-fashioned in the age of graphical user interfaces (GUIs)..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/06/21/why-cli-important"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-06-21-why-cli-important/cover-image.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"The Easiest Way to Get Started with Kubernetes"}
              description={
                "They say the first step is always the hardest. And when that step is in the direction of Kubernetes, it can feel even more intimidating..."
              }
              blogLink={"https://cyclops-ui.com/blog/2024/06/07/k8s-easy-start"}
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-06-07-k8s-easy-start/k8s-easy-start-cover.png"}
            />
          </Col>
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
