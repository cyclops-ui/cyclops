import { WarningTwoTone } from "@ant-design/icons";
import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";

interface WarningIconProps {
  style?: CSSProperties;
}

export function WarningIcon({ style }: WarningIconProps) {
  const { mode } = useTheme();

  return (
    <WarningTwoTone
      style={style}
      twoToneColor={mode === "light" ? "#F3801A" : ["#F3801A", "#4a2607"]}
    />
  );
}
