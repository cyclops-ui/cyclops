import React from "react";
import { Button, Menu, MenuProps } from "antd";
import { AppstoreAddOutlined, HddOutlined, BugFilled } from "@ant-design/icons";
import { useLocation } from "react-router";
import PathConstants from "../../routes/PathConstants";
import { Link } from "react-router-dom";

const SideNav = () => {
  const location = useLocation().pathname.split("/")[1];

  const sidebarItems: MenuProps["items"] = [
    {
      label: <Link to={PathConstants.MODULES}> Modules</Link>,
      icon: <AppstoreAddOutlined />,
      key: "modules",
    },
    {
      label: <Link to={PathConstants.NODES}> Nodes</Link>,
      icon: <HddOutlined />,
      key: "nodes",
    },
  ];

  return (
    <div
        style={{display: "flex", flexDirection: "column", minHeight: "100vh"}}
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
          <h2 style={{color: "white", marginTop: "5px"}}>
            <b>Cyclops</b>
          </h2>
          <img
            style={{height: "120%", marginLeft: "6px"}}
            src={require("./KIKLOPcic.png")}
            alt="Cyclops"
          />
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
        style={{margin: "auto 25px 25px 25px"}}
        icon={<BugFilled/>}
        href={
          "https://github.com/cyclops-ui/cyclops/issues/new?assignees=&labels=&projects=&template=bug_report.md&title="
        }
      >
        <b>Report a Bug</b>
      </Button>
      <center style={{
        color: "#FFF",
        margin: "25px",
        marginTop: "0",
      }}>
        {window.__RUNTIME_CONFIG__.REACT_APP_VERSION}
      </center>
    </div>
  );
};
export default SideNav;
