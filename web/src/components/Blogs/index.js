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
              title={"My Love-Hate Relationship with Helm"}
              description={
                "If you have been looking for a tool to deploy your applications into a Kubernetes cluster, you have definitely stumbled upon Helm."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/02/20/helm-love-hate-relationship"
              }
              avatar={"https://github.com/petar-cvit.png"}
              banner={"/img/2025-02-20-helm-love-hate-relationship/cover.png"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"What are Internal Developer Platforms?"}
              description={
                "A lot of the motivation behind building internal developer platforms is centered around the idea of self-service..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/02/13/what-are-dev-platforms"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-02-13-what-are-dev-platforms/cover.jpeg"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Cyclops: Platform Engineering for the Rest of Us"}
              description={
                "Platform engineering is possibly the biggest concept to take hold in infrastructure over the last 5+ years, and there’s a big reason why...."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/02/03/PE-for-the-rest-of-us"
              }
              avatar={"https://github.com/richburroughs.png"}
              banner={"/img/2025-02-03-PE-for-the-rest-of-us/cover.png"}
            />
          </Col>
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
