import { ClockCircleTwoTone } from "@ant-design/icons";
import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";

interface PendingIconProps {
  style?: CSSProperties;
}

export function PendingIcon({ style }: PendingIconProps) {
  const { mode } = useTheme();

  return (
    <ClockCircleTwoTone
      style={style}
      twoToneColor={mode === "light" ? "#ffcc00" : ["#ffcc00", "#4f4002"]}
    />
  );
}
