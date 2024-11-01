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
              title={"Custom AWS Cloud Platforms"}
              description={
                "But should we use Kubernetes as just a container orchestrator, or is there more to it..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/10/31/custom-aws-cloud-platforms"
              }
              avatar={"https://github.com/petar-cvit.png"}
              banner={"/img/2024-10-31-custom-aws-cloud-platforms/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"5 Internal Developer Platforms you need to know about!"}
              description={
                "Gartner predicts that by 2026, 80% of software companies will have established platform engineering teams..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2024/10/24/five-idps"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2024-10-24-five-idps/cover.jpg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
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
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
