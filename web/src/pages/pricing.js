import React from "react";
import Layout from "@theme/Layout";
import { Card, Button, Input } from "antd";

export default function Pricing() {
  return (
    <Layout>
      <div
        style={{
          paddingLeft: "15vw",
          paddingRight: "15vw",
          minHeight: "75vh",
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          marginTop: "5vh",
        }}
      >
        <Card
          title="We are Open Source !"
          bordered={false}
          style={{
            minWidth: "40vh",
            width: "40vh",
            height: "60vh",
            backgroundColor: "#F9FAFB",
            margin: "25px",
            padding: "30px",
            display: "flex",
            flexDirection: "column",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            filter:
              "drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06))",
          }}
        >
          <ul style={{ marginBottom: "20px" }}>
            <li>free now and forever</li>
            <li>host it yourself</li>
            <li>show us your supirt by giving us star</li>
          </ul>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end", // Align the button to the bottom
              flexGrow: 1, // Take all remaining space
            }}
          >
            <Button href="../../docs/installation/install">
              Quickstart Guide
            </Button>
          </div>
        </Card>
        <Card
          title="Looking for something more ?"
          bordered={false}
          style={{
            minWidth: "40vh",
            width: "40vh",
            height: "60vh",
            backgroundColor: "#F9FAFB",
            margin: "25px",
            padding: "30px",
            display: "flex",
            flexDirection: "column",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            filter:
              "drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06))",
          }}
        >
          <ul>
            <li>Need onboarding?</li>
            <li>Interested in Cross Cluster support?</li>
            <li>RBAC?</li>
          </ul>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              style={{ marginBottom: "20px" }}
            />
            <Button>Submit</Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
