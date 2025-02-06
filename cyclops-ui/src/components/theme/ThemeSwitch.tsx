import { useTheme } from "./ThemeContext";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";

export function ThemeSwitch() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "1.5rem",
        transition: "transform 0.3s ease",
        marginLeft: "auto",
      }}
    >
      {mode === "dark" ? (
        <MoonOutlined style={{ color: "#fff" }} />
      ) : (
        <SunOutlined style={{ color: "#fff" }} />
      )}
    </button>
  );
}
