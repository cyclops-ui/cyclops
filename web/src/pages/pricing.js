import Layout from "@theme/Layout";
import { Card, Button, Typography, Row, Col, ConfigProvider } from "antd";
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
        <Row
          gutter={[40, 40]}
          style={{ minHeight: "80vh", padding: "15vh 5vh" }}
        >
          <Col xs={24} sm={24} md={16} lg={16} xl={8}>
              <Card bordered={false} className={styles.pricingCard}>
                  <h4 style={{fontSize: "1.6rem", color: "#FFF"}}>
                      We are Open Source!
                  </h4>
                  <Paragraph style={{color: "#FFFFFF", fontWeight: "500", fontSize: "1rem"}}>
                      <ul
                          className={styles.paragraphlist}
                          style={{
                              listStyleType: "circle",
                              textAlign: "left",
                          }}
                      >
                          <li style={{marginBottom: "10px"}}>Free now and forever</li>
                          <li style={{marginBottom: "10px"}}>
                              Works with the Helm charts you already have
                          </li>
                          <li style={{marginBottom: "10px"}}>
                              Integrates smoothly into your workflow with ease
                          </li>
                      </ul>
                  </Paragraph>
                  <div style={{position: "absolute", left: "0", bottom: "20px", width: "100%"}}>
                      <Button
                          href="../../docs/installation/install"
                          shape="round"
                          size={"large"}
                          className={styles.pricingButton}
                      >
                          <h2 style={{margin: 0}}>Quickstart Guide</h2>
                      </Button>
                  </div>
              </Card>
          </Col>
            <Col xs={24} sm={24} md={16} lg={16} xl={8}>
                <Card bordered={false} className={styles.pricingCard}>
                <h4 style={{fontSize: "1.6rem", color: "#FFF"}}>
                    Need onboarding?
                </h4>
                <Paragraph
                    style={{color: "#FFFFFF", fontWeight: "500", fontSize: "1rem", flex: "1" }}
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
                <div style={{position: "absolute", left: "0", bottom: "20px", width: "100%"}}>
                    <CalendlyWidget />
                </div>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={16} lg={16} xl={8}>
              <Card bordered={false} className={styles.pricingCard}>
                  <h4 style={{fontSize: "1.6rem", color: "#FFF"}}>
                      Looking for something more?
                  </h4>
                  <Paragraph style={{color: "#FFFFFF", fontWeight: "500", fontSize: "1rem"}}>
                      <ul
                          style={{
                              listStyleType: "circle",
                              textAlign: "left",
                          }}
                      >
                          <li style={{marginBottom: "10px"}}>
                              Don't want to host it on your own?
                          </li>
                          <li style={{marginBottom: "10px"}}>
                              Interested in additional features?
                          </li>
                      </ul>
                  </Paragraph>
                  <div style={{position: "absolute", left: "0", bottom: "20px", width: "100%"}}>
                      <CalendlyWidget/>
                  </div>
              </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
}
