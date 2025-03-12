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
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Cyclops Launch Week #2"}
              description={
                "Cyclops is having its second-ever Launch Week, starting on March 10th!"
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/03/04/launch-week-2"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-03-04-launch-week-2/lw-cover.png"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
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
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
