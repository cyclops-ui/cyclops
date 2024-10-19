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
              title={"What is Platform Engineering?"}
              description={
                "Modern software engineering is becoming more and more complicated, especially in cloud-native environments like Kubernetes..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/10/17/platform-engineering"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-10-17-platform-engineering/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"A Kubernetes Setup Speedrun 🏃💨"}
              description={
                "Whether you are new to Kubernetes or maybe you're part of a startup that's always short on time, this guide is for you..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/09/17/civo-x-cyclops"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-09-17-civo-x-cyclops/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"How we manage secrets, the Kubernetes way"}
              description={
                "In this article, I will showcase how Cyclops manages your secrets, the Kubernetes way..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/07/24/how-we-manage-secrets"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-07-24-how-we-manage-secrets/cover.jpg"}
            />
          </Col>
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
