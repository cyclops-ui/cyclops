import React from "react";
import Layout from "@theme/Layout";
import { Card, Button } from "antd";

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
            justifyContent: "left",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            filter:
              "drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06))",
          }}
        >
          <ul>
            <li>free now and forever</li>
            <li>host it yourself</li>
          </ul>
          <Button
            href="../../docs/installation/install"
            style={{ marginTop: "250px", marginLeft: "60px" }}
          >
            Quickstart Guide
          </Button>
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
            justifyContent: "left",
            fontSize: "1rem",
            lineHeight: "1.5rem",
            filter:
              "drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07)) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.06))",
          }}
        >
          <ul>
            <li>sads</li>
            <li>sdadsad</li>
            <li>sdasdhjklsdas</li>
            <li>sdsdasdasdas</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}
