import { CheckCircleTwoTone } from "@ant-design/icons";
import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";

interface SuccessIconProps {
  style?: CSSProperties;
}

export function SuccessIcon({ style }: SuccessIconProps) {
  const { mode } = useTheme();

  return (
    <CheckCircleTwoTone
      style={style}
      twoToneColor={mode === "light" ? "#52c41a" : ["#52c41a", "#112905"]}
    />
  );
}
