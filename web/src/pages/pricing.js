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
              width: "350px",
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
            <Title
              level={4}
              style={{ fontStyle: "italic", fontSize: "1.5rem" }}
            >
              We are Open Source!
            </Title>
            <Paragraph style={{ fontSize: "1rem", flex: "1" }}>
              <ul
                style={{
                  listStyleType: "circle",
                  padding: 0,
                  textAlign: "left",
                  margin: 0,
                }}
              >
                <li>Free now and forever</li>
                <li>Host it yourself</li>
              </ul>
            </Paragraph>
            <Button
              href="../../docs/installation/install"
              style={{
                backgroundColor: "#fa8c16",
                borderColor: "#fa8c16",
                color: "#fff",
                alignSelf: "center",
                marginTop: "auto", // Ensure the button is at the bottom
              }}
            >
              Quickstart Guide
            </Button>
          </Card>

          <Card
            bordered={false}
            style={{
              width: "350px",
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
            <Title
              level={4}
              style={{ fontStyle: "italic", fontSize: "1.5rem" }}
            >
              Need onboarding?
            </Title>
            <Paragraph style={{ fontSize: "1rem", flex: "1" }}>
              <span>We can help you get started with:</span>
              <ul
                style={{
                  listStyleType: "circle",
                  padding: 0,
                  textAlign: "left",
                  margin: 0,
                }}
              >
                <li>Integrating Cyclops into your existing workflow</li>
                <li>Creating custom templates for your use cases</li>
                <li>Onboarding your developer teams</li>
              </ul>
            </Paragraph>
            <div style={{ flexGrow: 1 }}></div> {/* Spacer */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                marginTop: "auto",
              }}
            >
              <CalendlyWidget />
            </div>
          </Card>

          <Card
            bordered={false}
            style={{
              width: "350px",
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
            <Title
              level={4}
              style={{ fontStyle: "italic", fontSize: "1.5rem" }}
            >
              Looking for something more?
            </Title>
            <Paragraph style={{ fontSize: "1rem", flex: "1" }}>
              <ul
                style={{
                  listStyleType: "circle",
                  padding: 0,
                  textAlign: "left",
                  margin: 0,
                }}
              >
                <li>Don't want to host it on your own?</li>
                <li>Interested in additional features?</li>
              </ul>
            </Paragraph>
            <div style={{ flexGrow: 1 }}></div> {/* Spacer */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                marginTop: "auto",
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
