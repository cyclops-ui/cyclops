import Layout from "@theme/Layout";
import { Card, Button, Typography, Row, Col, ConfigProvider } from "antd";
import CalendlyWidget from "../components/CalendlyWidget";
import styles from "./index.module.css";
import yaml from "/static/img/yaml_background.png";
import AdoptersPlanSignup from "../components/AdoptersPlanSignup/AdoptersPlanSignup";

const { Paragraph } = Typography;

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
            color: "white",
            padding: "15vh 5vw 0vh 5vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginBottom: "5px" }}>Open Source Software</h1>
          <h2>with Professional Support</h2>
        </div>
        <Row
          gutter={[40, 40]}
          style={{ padding: "16px", paddingTop: "24px", paddingBottom: "10vh" }}
        >
          <Col
            xs={24}
            sm={24}
            md={24}
            lg={{ span: 10, offset: 2 }}
            xl={{ span: 10, offset: 2 }}
          >
            <Card bordered={false} className={styles.pricingCard}>
              <h4 style={{ fontSize: "1.6rem", color: "#FFF" }}>
                We are Open Source!
              </h4>
              <hr
                style={{
                  opacity: 0.5,
                  marginTop: "28px",
                  marginBottom: "16px",
                }}
              />
              <Paragraph
                style={{
                  color: "#FFFFFF",
                  fontWeight: "500",
                  fontSize: "1rem",
                }}
              >
                <ul
                  className={styles.paragraphlist}
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
                    Integrates smoothly into your existing workflow
                  </li>
                </ul>
              </Paragraph>
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  bottom: "20px",
                  width: "100%",
                }}
              >
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: "#FFF",
                    },
                  }}
                >
                  <Button
                    href="../../docs/installation/install"
                    shape="round"
                    size={"large"}
                    className={styles.pricingButton}
                  >
                    <h2 style={{ margin: 0 }}>Quickstart Guide</h2>
                  </Button>
                </ConfigProvider>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={24} lg={10} xl={10}>
            <Card className={styles.pricingCardSupport}>
              <h4 style={{ fontSize: "1.6rem", color: "#FFF" }}>
                Onboarding and support
              </h4>
              <hr
                style={{
                  opacity: 0.5,
                  marginTop: "24px",
                  marginBottom: "16px",
                }}
              />
              <Paragraph
                style={{
                  color: "#FFFFFF",
                  fontWeight: "500",
                  fontSize: "1rem",
                  flex: "1",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    paddingBottom: "12px",
                  }}
                >
                  Get support from our team to customize Cyclops to your use
                  case
                </div>
                <ul
                  className={styles.paragraphlist}
                  style={{
                    listStyleType: "circle",
                    textAlign: "left",
                    marginTop: "10px",
                  }}
                >
                  <li style={{ marginBottom: "10px" }}>
                    Setting up your Cyclops instance
                  </li>
                  <li style={{ marginBottom: "10px" }}>Creating templates</li>
                  <li style={{ marginBottom: "10px" }}>
                    Onboarding your developer teams
                  </li>
                  <li style={{ marginBottom: "10px" }}>
                    Support maintaining Cyclops through upgrades
                  </li>
                </ul>
                <div
                  style={{
                    paddingTop: "24px",
                    fontSize: "1.2rem",
                  }}
                >
                  Leave your email, and our team will reach out to you in the
                  next 24 hours -{" "}
                  <span style={{ color: "#ff8803" }}>no commitment</span>
                </div>
              </Paragraph>
              <div
                style={{
                  marginTop: "24px",
                  textAlign: "center",
                }}
              >
                <AdoptersPlanSignup />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}
