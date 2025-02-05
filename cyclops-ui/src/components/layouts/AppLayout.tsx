import { Outlet } from "react-router-dom";
import SideNav from "./Sidebar";
import { Suspense } from "react";
import Sider from "antd/es/layout/Sider";
import { Content, Header } from "antd/es/layout/layout";
import { ConfigProvider, Layout } from "antd";
import { ThemeProvider } from "../theme/ThemeContext";

export default function AppLayout() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <ThemeProvider>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#fe8801",
            },
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
                width: "100%",
                zIndex: 1000,
              }}
            />
            <Content
              style={{
                marginTop: 64,
                padding: 24,
                minHeight: "calc(100vh - 112px)",
                background: "#fff",
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
      </ThemeProvider>
    </Layout>
  );
}
