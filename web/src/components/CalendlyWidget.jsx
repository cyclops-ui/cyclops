import React, { useEffect } from "react";
import { Button } from "antd";

export default function CalendlyWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.type = "text/javascript";
    script.async = true;
    document.body.appendChild(script);

    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      // Cleanup if the component is unmounted
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  const handleClick = () => {
    window.Calendly.initPopupWidget({
      url: "https://calendly.com/juraj-cyclops/cyclops-discovery-call",
    });
    https: return false;
  };

  return (
    <Button
      onClick={handleClick}
      style={{
        width: "40%",
        backgroundColor: "#fa8c16",
        borderColor: "#fa8c16",
        color: "#fff",
      }}
    >
      Book a call
    </Button>
  );
}
