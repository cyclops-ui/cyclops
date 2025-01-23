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
              title={"Why we’re betting on Kubernetes (and you should too"}
              description={
                "We are literally all in, and I want to tell you why we feel comfortable with that decision..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/01/23/betting-on-k8s"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-01-23-betting-on-k8s/cover.jpg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"DevOps vs Platform Engineering"}
              description={
                "If you are confused about what DevOps or Platform Engineering even is, you are not alone..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/12/19/devops-vs-platform"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-12-19-devops-vs-platform/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
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
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
