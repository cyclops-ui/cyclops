import Layout from "@theme/Layout";
import { Card, Button, Typography } from "antd";
import CalendlyWidget from "../components/CalendlyWidget";

const { Title, Paragraph } = Typography;

export default function Pricing() {
  return (
    <Layout>
      <div
        style={{
          padding: "5vh 10vw",
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f2f5",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "30px",
          }}
        >
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
              style={{
                backgroundColor: "#fa8c16",
                borderColor: "#fa8c16",
                color: "#fff",
                fontWeight: "700",
                position: "absolute",
                bottom: "20px",
                right: "30%",
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
                bottom: "20px",
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
                bottom: "20px",
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
