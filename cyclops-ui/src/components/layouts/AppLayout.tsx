import React from "react";
import { Outlet } from "react-router-dom";
import SideNav from "./Sidebar";
import { Suspense } from "react";
import { Layout, ConfigProvider, Menu, Dropdown, Avatar, Space } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";

const { Sider, Content, Header } = Layout;

export default function AppLayout() {
  // Replace these with actual user data
  const { userName, userRole, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const dropdownMenu = (
    <Menu>
      <Menu.Item key="logout" onClick={handleLogout} icon={<LogoutOutlined />}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
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
              width: "calc(100% - 200px)",
              zIndex: 1000,
              padding: "0 24px",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Space style={{ color: "white" }}>
              <span>{userName}</span>
              <span>({userRole})</span>
              <Dropdown overlay={dropdownMenu} placement="bottomRight">
                <Avatar
                  style={{ backgroundColor: "#fe8801" }}
                  icon={<UserOutlined />}
                />
              </Dropdown>
            </Space>
          </Header>
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
    </Layout>
  );
}
