import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Spin, Alert } from "antd";
import Title from "antd/es/typography/Title";
import { useTheme } from "../../theme/ThemeContext";
import remarkGfm from "remark-gfm";

const MarkdownViewer = ({ url }: { url: string }) => {
  const { mode } = useTheme();

  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch markdown");
        const text = await response.text();
        setMarkdown(text);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [url]);

  if (loading) return <Spin />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ node, ...props }) => (
          <table
            style={{
              border: "1px solid #bbb",
              padding: "8px",
            }}
            {...props}
          />
        ),
        th: ({ node, ...props }) => (
          <th
            style={{
              fontWeight: "bold",
              border: "1px solid #bbb",
            }}
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td
            style={{
              padding: "8px",
              border: "1px solid #bbb",
            }}
            {...props}
          />
        ),
        h1: ({ children }) => (
          <div style={{ display: "block", width: "100%", marginTop: 32 }}>
            <Title level={1}>{children}</Title>
          </div>
        ),
        h2: ({ children }) => (
          <div style={{ display: "block", width: "100%", marginTop: 24 }}>
            <Title level={2}>{children}</Title>
          </div>
        ),
        h3: ({ children }) => (
          <div style={{ display: "block", width: "100%", marginTop: 16 }}>
            <Title level={3}>{children}</Title>
          </div>
        ),
        code: ({ children }) => (
          <code
            style={{
              color: mode === "dark" ? "#4c8cff" : "#000080",
            }}
          >
            {children}
          </code>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
};

export default MarkdownViewer;
