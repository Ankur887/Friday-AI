import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, vs, dracula, okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";
import { usePrefs } from "../Auth/PrefsContext";

// Maps the Settings > "Code theme" dropdown values to highlighter styles.
// This ONLY affects code blocks rendered inside model output — nothing else
// in the chat UI (text, headings, tables, etc.) is touched by this.
const CODE_THEMES = {
  oneDark: oneDark,
  github:  vs,       // closest clean/light match to "GitHub" in this library
  dracula: dracula,
  monokai: okaidia,  // okaidia is the standard Monokai substitute for prism themes
};

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        position: "absolute", top: 8, right: 8,
        background: copied ? "#22c55e" : "#374151",
        color: "#fff", border: "none", borderRadius: 6,
        padding: "3px 10px", fontSize: 12,
        cursor: "pointer", transition: "background 0.2s",
        zIndex: 1
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function MarkdownRenderer({ content }) {
  const { prefs } = usePrefs();
  const activeCodeStyle = CODE_THEMES[prefs?.codeTheme] || oneDark;

  return (
    <div style={{ lineHeight: 1.8, fontSize: 15, color: "inherit" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{

          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            return !inline && match ? (
              <div style={{ position: "relative", margin: "12px 0", borderRadius: 10, overflow: "hidden" }}>
                {/* Language label bar */}
                <div style={{
                  background: "#1e1e2e", padding: "5px 14px",
                  fontSize: 12, color: "#888",
                  borderBottom: "1px solid #2d2d3d",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span>{match[1]}</span>
                  <CopyButton code={codeString} />
                </div>
                <SyntaxHighlighter
                  style={activeCodeStyle}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: 0, fontSize: 14, padding: "14px" }}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              
              <code style={{
                background: "rgba(99,102,241,0.15)",
                color: "#e06c75",
                padding: "1px 7px",
                borderRadius: 5,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                fontSize: "0.88em"
              }} {...props}>
                {children}
              </code>
            );
          },

          h1: ({ children }) => (
            <h1 style={{ fontSize: "1.4em", fontWeight: 700, margin: "20px 0 10px", paddingBottom: 6, borderBottom: "1px solid rgba(128,128,128,0.2)" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: "1.2em", fontWeight: 700, margin: "18px 0 8px" }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: "1.05em", fontWeight: 600, margin: "14px 0 6px" }}>
              {children}
            </h3>
          ),

          p: ({ children }) => (
            <p style={{ margin: "8px 0", lineHeight: 1.8 }}>{children}</p>
          ),

          ul: ({ children }) => (
            <ul style={{ paddingLeft: 22, margin: "8px 0", listStyleType: "disc" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: 22, margin: "8px 0" }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: "5px 0", lineHeight: 1.7 }}>{children}</li>
          ),

          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: "4px solid #6366f1",
              paddingLeft: 14, margin: "12px 0",
              color: "rgba(128,128,128,0.9)",
              fontStyle: "italic"
            }}>
              {children}
            </blockquote>
          ),

         
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "12px 0" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{
              border: "1px solid rgba(128,128,128,0.3)",
              padding: "8px 14px", fontWeight: 600,
              background: "rgba(99,102,241,0.1)", textAlign: "left"
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{ border: "1px solid rgba(128,128,128,0.3)", padding: "8px 14px" }}>
              {children}
            </td>
          ),

          // ✅ Bold & Italic
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700 }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ fontStyle: "italic", opacity: 0.9 }}>{children}</em>
          ),

          // ✅ Links
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer"
              style={{ color: "#6366f1", textDecoration: "underline", textUnderlineOffset: 3 }}>
              {children}
            </a>
          ),

          // ✅ Horizontal rule
          hr: () => (
            <hr style={{ border: "none", borderTop: "1px solid rgba(128,128,128,0.2)", margin: "16px 0" }} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}