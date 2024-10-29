import React from "react";
import { Button, Menu, MenuProps } from "antd";
import {
  AppstoreAddOutlined,
  HddOutlined,
  BugFilled,
  SnippetsOutlined,
  GithubFilled,
  ThunderboltFilled,
} from "@ant-design/icons";
import { useLocation } from "react-router";
import PathConstants from "../../routes/PathConstants";
import { Link } from "react-router-dom";
import styles from "./styles.module.css";
import helmLogo from "../../static/img/helm_white.png";

const SideNav = () => {
  const location = useLocation().pathname.split("/")[1];

  const sidebarItems: MenuProps["items"] = [
    {
      label: <a href={PathConstants.MODULES}>Modules</a>,
      icon: <AppstoreAddOutlined />,
      key: "modules",
    },
    {
      label: <a href={PathConstants.TEMPLATES}>Templates</a>,
      icon: <SnippetsOutlined />,
      key: "templates",
    },
    {
      label: <a href={PathConstants.NODES}>Nodes</a>,
      icon: <HddOutlined />,
      key: "nodes",
    },
    {
      label: (
        <a href={PathConstants.HELM_RELEASES}>
          Helm releases <ThunderboltFilled style={{ color: "#ffcc66" }} />
        </a>
      ),
      icon: <img alt="" style={{ height: "14px" }} src={helmLogo} />,
      key: "helm",
    },
  ];

  const tagChangelogLink = (tag: string) => {
    if (tag === "v0.0.0") {
      return "https://github.com/cyclops-ui/cyclops/releases";
    }

    return "https://github.com/cyclops-ui/cyclops/releases/tag/" + tag;
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
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
      <Button
        ghost
        style={{ margin: "auto 25px 25px 25px" }}
        icon={<BugFilled />}
        href={
          "https://github.com/cyclops-ui/cyclops/issues/new?assignees=&labels=&projects=&template=bug_report.md&title="
        }
      >
        <b>Report a Bug</b>
      </Button>
      <center
        style={{
          color: "#FFF",
          margin: "25px",
          marginTop: "0",
        }}
      >
        <Link
          className={styles.taglink}
          to={tagChangelogLink(window.__RUNTIME_CONFIG__.REACT_APP_VERSION)}
        >
          <GithubFilled /> {window.__RUNTIME_CONFIG__.REACT_APP_VERSION}
        </Link>
      </center>
    </div>
  );
};
export default SideNav;
