import { CloseSquareTwoTone } from "@ant-design/icons";
import React, { CSSProperties } from "react";
import { useTheme } from "../../theme/ThemeContext";

interface ErrorIconProps {
  style?: CSSProperties;
}

export function ErrorIcon({ style }: ErrorIconProps) {
  const { mode } = useTheme();

  return (
    <CloseSquareTwoTone
      style={style}
      twoToneColor={mode === "light" ? "#ff0000" : ["#ff0000", "#3d0101"]}
    />
  );
}
