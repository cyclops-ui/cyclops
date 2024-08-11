import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import styles from "./index.module.css";

import landingCyclops from "/static/img/landing_cyclops.png";
import title from "/static/img/cyclops-title.png";

import yaml from "/static/img/yaml_background.png";

import Comparison from "../components/Comparison";
import Install from "../components/Install";
import Features from "../components/Features";
import Blogs from "../components/Blogs";
import Testimonials from "../components/Testimonials";
import Newsletter from "../components/Newsletter";
import { Button, Col, ConfigProvider, Row } from "antd";

export default function Home() {
  return (
    <Layout
      title={`Developer friendly Kubernetes`}
      description="Deploy your K8s workloads through a UI"
    >
      <main>
        <div className={styles.landing}>
          <img
            style={{
              left: "10%",
              animationIterationCount: "1",
              animationDelay: "-16s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              animationIterationCount: "1",
              animationDelay: "-12s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              left: "-10%",
              animationIterationCount: "1",
              animationDelay: "-8s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              left: "10%",
              animationIterationCount: "1",
              animationDelay: "-4s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />

          <img
            className={styles.backgroundYaml}
            src={yaml}
            style={{
              opacity: 0,
            }}
          />
          <img
            style={{
              left: "10%",
              animationDelay: "4s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              animationDelay: "8s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />
          <img
            style={{
              left: "-10%",
              animationDelay: "12s",
              opacity: 0,
            }}
            className={styles.backgroundYaml}
            src={yaml}
          />

          <img className={styles.cyclopsTitle} src={title} />
          <h2 className={styles.cyclopsDesc}>Developer friendly Kubernetes</h2>
          <img className={styles.landingCyclops} src={landingCyclops} />
          <Row>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#fe8801",
                },
              }}
            >
              <Button
                href={"/docs/installation/install/manifest"}
                shape="round"
                size={"large"}
                className={styles.readTheDocs}
                style={{
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  color: "white",
                }}
              >
                <h3 style={{ margin: 0 }}>Get started</h3>
              </Button>
            </ConfigProvider>
          </Row>
        </div>
        <Comparison />
        <div className={styles.backgroundcolor}>
          <Features />
          <Testimonials />
          <Install />
          <Blogs />
          <Newsletter />
        </div>
      </main>
    </Layout>
  );
}
