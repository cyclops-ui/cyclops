import React from "react";
import styles from "../pages/index.module.css";
import { Helmet } from "react-helmet";

import Button from "antd/es/button"
import ConfigProvider from "antd/es/config-provider"

export default function CalendlyWidget() {
  return (
    <>
      <Helmet>
        <script
          src="https://assets.calendly.com/assets/external/widget.js"
          type="text/javascript"
          async
        />
      </Helmet>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#FFF",
          },
        }}
      >
        <Button
          onClick={() =>
            Calendly.initPopupWidget({
              url: "https://calendly.com/cyclops-ui/cyclops",
            })
          }
          shape="round"
          size={"large"}
          className={styles.pricingButton}
        >
          <h2 style={{ margin: 0 }}>Book a call</h2>
        </Button>
      </ConfigProvider>
    </>
  );
}
