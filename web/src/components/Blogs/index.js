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
              title={"MCP Servers for Agentic Dev Platforms"}
              description={
                "For the past couple of months, the concept of MCP has been booming..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/05/22/agentic-platform-for-mcps"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-05-22-agentic-platform-for-mcps/cover.png"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Signs You Might Need a Developer Platform"}
              description={
                "We put together a lighthearted guide, told through memes, to help you spot the signs early..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/05/15/idp-signs"
              }
              avatar={"https://github.com/KaradzaJuraj.png"}
              banner={"/img/2025-05-15-idp-signs/cover.png"}
            />
          </Col>
          <Col xs={{ span: 20, offset: 2 }} md={{ span: 6, offset: 0 }}>
            <Blog
              title={"Vibe Coding on Kubernetes with Cyclops MCP"}
              description={
                "You want your infrastructure to be stable, and vibe coding isn't exactly known for stability..."
              }
              blogLink={
                "https://cyclops-ui.com/blog/2025/05/08/cyclops-mcp"
              }
              avatar={"https://github.com/petar-cvit.png"}
              banner={"/img/2025-05-08-cyclops-mcp/cover.png"}
            />
          </Col>
        </Row>
        <More />
      </div>
    </div>
  );
};

export default Blogs;
