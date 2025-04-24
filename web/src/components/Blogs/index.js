import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import Blog from "./Blog";
import BlogsTitle from "./Title";
import BlogsDescription from "./Description";
import More from "./More";

import Col from "antd/es/col"
import Row from "antd/es/row"

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
              title={"What are Golden Paths in Platform Engineering?"}
              description={
                "Netflix uses the term Paved Road, and Spotify uses Golden Path, but in the end, they are the same thing..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/04/25/golden-paths"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-04-24-golden-paths/cover.png"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"From Helm Chart to Developer UI in 5 Minutes"}
              description={
                "Helm is great… …until you give it to a developer."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/04/03/helm-to-idp-in-five"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-04-03-helm-to-idp-in-five/cover.png"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"How Platform Engineering Helps You Move Like a Startup Again"}
              description={
                "There's been a quiet shift happening in engineering teams over the last few years. DevOps isn't going away, but it *is* evolving..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/03/27/move-like-a-startup"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-03-27-move-like-a-startup/cover.jpeg"}
            />
          </Col>
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
