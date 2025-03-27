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
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Internal Developer Portals vs Platforms"}
              description={
                "TL;DR: The Internal Developer Portal is the interface to the Internal Developer Platform. That's it. You can go now."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/03/13/portal-vs-platform"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-03-13-portal-vs-platform/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"How We Took GitOps a Step Further"}
              description={
                "GitOps has changed how teams manage infrastructure and deployments, making..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/03/06/how-we-took-gitops-further"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-03-06-how-we-took-gitops-further/cover.jpeg"}
            />
          </Col>
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
