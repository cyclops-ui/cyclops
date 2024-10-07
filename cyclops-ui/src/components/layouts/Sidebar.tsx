import React from "react";
import { Button, Menu, MenuProps } from "antd";
import {
  AppstoreAddOutlined,
  HddOutlined,
  BugFilled,
  LogoutOutlined,
  SnippetsOutlined,
  GithubFilled,
} from "@ant-design/icons";
import { useLocation } from "react-router";
import PathConstants from "../../routes/PathConstants";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./styles.module.css";

const SideNav = () => {
  const location = useLocation().pathname.split("/")[1];
  const { logout } = useAuth();

  const sidebarItems: MenuProps["items"] = [
    {
      label: <a href={PathConstants.MODULES}>Modules</a>,
      icon: <AppstoreAddOutlined />,
      key: "modules",
    },
    {
      label: <a href={PathConstants.NODES}>Nodes</a>,
      icon: <HddOutlined />,
      key: "nodes",
    },
    {
      label: <a href={PathConstants.TEMPLATES}>Templates</a>,
      icon: <SnippetsOutlined />,
      key: "templates",
    },
  ];

  const tagChangelogLink = (tag: string) => {
    if (tag === "v0.0.0") {
      return "https://github.com/cyclops-ui/cyclops/releases";
    }

    return "https://github.com/cyclops-ui/cyclops/releases/tag/" + tag;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <a href={PathConstants.MODULES}>
        <div
          style={{
            height: "32px",
            width: "70%",
            margin: "0.9rem 1rem 0.6rem 2rem",
            display: "inline-flex",
          }}
        >
          <img src={require("./cyclops_logo.png")} alt="Cyclops" />
        </div>
      </a>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location]}
        items={sidebarItems}
      />

      <div style={{ marginTop: "auto" }}>
        {window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_AUTHORIZATION ===
          "enabled" && (
          <Button
            ghost
            style={{ margin: "10px 25px", width: "calc(100% - 50px)" }}
            icon={<LogoutOutlined />}
            onClick={logout}
          >
            <b>Logout</b>
          </Button>
        )}

        <Button
          ghost
          style={{ margin: "10px 25px", width: "calc(100% - 50px)" }}
          icon={<BugFilled />}
          href="https://github.com/cyclops-ui/cyclops/issues/new?assignees=&labels=&projects=&template=bug_report.md&title="
        >
          <b>Report a Bug</b>
        </Button>

        <center style={{ color: "#FFF", margin: "15px 25px" }}>
          <Link
            className={styles.taglink}
            to={tagChangelogLink(window.__RUNTIME_CONFIG__.REACT_APP_VERSION)}
          >
            <GithubFilled /> {window.__RUNTIME_CONFIG__.REACT_APP_VERSION}
          </Link>
        </center>
      </div>
    </div>
  );
};
export default SideNav;
