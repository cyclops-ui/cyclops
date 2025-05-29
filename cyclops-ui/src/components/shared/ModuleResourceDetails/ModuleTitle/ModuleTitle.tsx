import { Typography, Divider, Tooltip } from "antd";
import React, { ReactElement, useEffect, useState } from "react";
import classNames from "classnames";
import "./custom.css";
import { useTheme } from "../../../theme/ThemeContext";

const { Title } = Typography;

export interface ModuleTitleProps {
  moduleName: string;
  appIconURL: string;
  statusIcon: ReactElement;
}

const ModuleTitle = ({
  moduleName,
  appIconURL,
  statusIcon,
}: ModuleTitleProps) => {
  const { mode } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (!prev && y > 40) return true;
        if (prev && y < 20) return false;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={classNames("page-title-container", { scrolled })}
      style={{
        background: mode === "light" ? "#fff" : "#141414",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {appIconURL ? (
          <img
            alt=""
            style={{ height: scrolled ? "38px" : "57px", marginRight: "8px" }}
            src={appIconURL}
          />
        ) : (
          <></>
        )}
        <Title className="page-title" style={{ margin: 0 }}>
          <Tooltip title={"Copy module name to clipboard"} trigger="hover">
            <span
              onClick={() => navigator.clipboard.writeText(moduleName)}
              style={{ cursor: "pointer" }}
            >
              {moduleName}
            </span>
          </Tooltip>
        </Title>
        {scrolled && statusIcon}
      </div>
      {scrolled && <Divider style={{ marginTop: 8, marginBottom: 0 }} />}
    </div>
  );
};

export default ModuleTitle;
