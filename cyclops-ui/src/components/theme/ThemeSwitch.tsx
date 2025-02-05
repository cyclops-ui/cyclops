import { useTheme } from "./ThemeContext";
import { Switch } from "antd";

export function ThemeSwitch() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Switch
      checked={isDarkMode}
      onChange={toggleTheme}
      checkedChildren="☀️ Light"
      unCheckedChildren="🌙 Dark"
      style={{ width: "80px" }}
    />
  );
}
