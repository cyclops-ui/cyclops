import { Outlet } from "react-router-dom";
import SideNav from "./Sidebar";
import React, { Suspense } from "react";
import Sider from "antd/es/layout/Sider";
import { Content, Header } from "antd/es/layout/layout";
import { ConfigProvider, Layout, theme } from "antd";
import { useTheme } from "../theme/ThemeContext";
import { ThemeSwitch } from "../theme/ThemeSwitch";

export default function AppLayout() {
  const { mode } = useTheme();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#fe8801",
          },
          algorithm:
            mode === "light" ? theme.defaultAlgorithm : theme.darkAlgorithm,
        }}
      >
        <Sider
          width={200}
          style={{
            position: "fixed",
            height: "100%",
          }}
        >
          <SideNav />
        </Sider>
        <Layout style={{ marginLeft: 200 }}>
          <Header
            style={{
              position: "fixed",
              top: 0,
              left: 200,
              right: 0,
              zIndex: 100,
              display: "flex",
              padding: "0 16px",
              height: 64,
            }}
          >
            <ThemeSwitch />
          </Header>

          <Content
            style={{
              marginTop: 64,
              padding: 24,
              minHeight: "calc(100vh - 112px)",
              background: mode === "light" ? "#fff" : "#141414",
            }}
          >
            <Suspense
              fallback={<h1 style={{ textAlign: "center" }}>Loading...</h1>}
            >
              <Outlet />
            </Suspense>
          </Content>
        </Layout>
      </ConfigProvider>
    </Layout>
  );
}
