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
              title={"Minecraft on Kubernetes: A Dev Platform Example"}
              description={
                "Go on, tell your boss you are researching Dev Platforms and go get those diamonds..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/12/12/minecraft"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-12-12-minecraft/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Where GitOps Meets ClickOps"}
              description={
                "In the DevOps landscape, two paradigms have emerged: GitOps and ClickOps, each offering ..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/11/29/gitops-clickops"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-11-29-gitops-clickops/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Cyclops Launch Week #1"}
              description={
                "For an entire week, we will be unveiling a feature a day - that's five features in total..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/11/22/launch-week-1"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-11-22-launch-week-1/recap.png"}
            />
          </Col>
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
