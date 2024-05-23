import Layout from "@theme/Layout";
import { Card, Button, Typography } from "antd";
import CalendlyWidget from "../components/CalendlyWidget";
import styles from "./index.module.css";
import yaml from "/static/img/yaml_background.png";

const { Title, Paragraph } = Typography;

export default function Pricing() {
  return (
    <Layout>
      <div className={styles.landing} style={{ height: "100%" }}>
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
        <div
          style={{
            padding: "20vh",
            minHeight: "70vh",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "40px",
          }}
        >
          <Card
            bordered={false}
            style={{
              overflow: "visible",
              width: "375px",
              padding: "20px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              textAlign: "center",
              minHeight: "500px",
            }}
          >
            <Title level={4} style={{ fontSize: "1.6rem" }}>
              We are Open Source!
            </Title>
            <Paragraph style={{ fontWeight: "500", fontSize: "1rem" }}>
              <ul
                style={{
                  listStyleType: "circle",
                  textAlign: "left",
                }}
              >
                <li style={{ marginBottom: "10px" }}>Free now and forever</li>
                <li style={{ marginBottom: "10px" }}>
                  Works with the Helm charts you already have
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Integrates smoothly into your workflow with ease
                </li>
              </ul>
            </Paragraph>
            <Button
              href="../../docs/installation/install"
              shape="round"
              size={"large"}
              className={styles.readTheDocs}
              style={{
                color: "white",
                backgroundColor: "#fa8c16",
                fontWeight: "700",
                position: "absolute",
                bottom: "40px",
                right: "27%",
              }}
            >
              Quickstart Guide
            </Button>
          </Card>

          <Card
            bordered={false}
            style={{
              width: "375px",
              padding: "20px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              textAlign: "center",
              minHeight: "500px",
            }}
          >
            <Title level={4} style={{ fontSize: "1.6rem" }}>
              Need onboarding?
            </Title>
            <Paragraph
              style={{ fontWeight: "500", fontSize: "1rem", flex: "1" }}
            >
              <span style={{ fontSize: "1.2rem" }}>
                We can get you started:
              </span>
              <ul
                style={{
                  listStyleType: "circle",
                  textAlign: "left",
                  marginTop: "10px",
                }}
              >
                <li style={{ marginBottom: "10px" }}>
                  Integrating Cyclops into your existing workflow
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Creating custom templates for your use cases
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Onboarding your developer teams
                </li>
              </ul>
            </Paragraph>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                position: "absolute",
                bottom: "40px",
                right: "0%",
              }}
            >
              <CalendlyWidget />
            </div>
          </Card>

          <Card
            bordered={false}
            style={{
              width: "375px",
              padding: "20px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              display: "flex",
              flexDirection: "column",
              textAlign: "center",
              minHeight: "500px",
            }}
          >
            <Title level={4} style={{ fontSize: "1.6rem" }}>
              Looking for something more?
            </Title>
            <Paragraph style={{ fontWeight: "500", fontSize: "1rem" }}>
              <ul
                style={{
                  listStyleType: "circle",
                  textAlign: "left",
                }}
              >
                <li style={{ marginBottom: "10px" }}>
                  Don't want to host it on your own?
                </li>
                <li style={{ marginBottom: "10px" }}>
                  Interested in additional features?
                </li>
              </ul>
            </Paragraph>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                position: "absolute",
                bottom: "40px",
                right: "0%",
              }}
            >
              <CalendlyWidget />
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
