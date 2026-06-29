// FILE: src/components/interview/ConversationBubble.jsx
// PROJECT: Friday AI — Career OS
// PURPOSE: Chat bubble with Framer Motion animation + inline code-block rendering
//          for Coding / DSA rounds. Parses triple-backtick fences into styled <pre> blocks.
// LAST UPDATED: 2026-06-25

import { motion } from "framer-motion";

// ── Code block parser ─────────────────────────────────────────────────────────
// Returns an array of { type: 'text'|'code', content: string, lang?: string }
function parseMessage(text) {
  const parts = [];
  const fence = /```(\w*)\n?([\s\S]*?)```/g;
  let cursor = 0;
  let match;

  while ((match = fence.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push({ type: "text", content: text.slice(cursor, match.index) });
    }
    parts.push({
      type: "code",
      lang: match[1] || "text",
      content: match[2].trimEnd(),
    });
    cursor = fence.lastIndex;
  }

  if (cursor < text.length) {
    parts.push({ type: "text", content: text.slice(cursor) });
  }

  return parts.length ? parts : [{ type: "text", content: text }];
}

// ── Inline code block (dark pre) ─────────────────────────────────────────────
function CodeBlock({ lang, content }) {
  return (
    <div style={{ position: "relative", margin: "8px 0" }}>
      {/* Language badge */}
      {lang && lang !== "text" && (
        <div style={{
          position: "absolute",
          top: 8,
          right: 10,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "Inter, monospace",
          textTransform: "uppercase",
        }}>
          {lang}
        </div>
      )}
      <pre style={{
        margin: 0,
        padding: "14px 16px",
        paddingRight: lang ? 56 : 16,
        background: "#0D1117",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        overflowX: "auto",
        fontSize: 12.5,
        lineHeight: 1.7,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        color: "#E6EDF3",
        whiteSpace: "pre",
        boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
      }}>
        <code style={{ fontFamily: "inherit" }}>{content}</code>
      </pre>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * ConversationBubble
 * @param {string}           props.message   - Raw text (may contain ```code``` fences)
 * @param {'ai'|'user'}      props.role      - Speaker
 * @param {Date|null}        props.timestamp - Message time
 * @param {string|null}      props.quality   - Answer quality label (user bubbles only)
 */
export default function ConversationBubble({ message, role, timestamp, quality }) {
  const isAI = role === "ai";
  const parts = isAI ? parseMessage(message) : null;

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  // Quality badge color
  const qualityColor = {
    excellent: "#22C55E",
    good:      "#4ADE80",
    average:   "#F59E0B",
    weak:      "#F97316",
    no_answer: "#EF4444",
  }[quality] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1],
        scale: { type: "spring", damping: 22, stiffness: 300 },
      }}
      style={{
        display: "flex",
        flexDirection: isAI ? "row" : "row-reverse",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 12,
        paddingLeft: isAI ? 0 : 28,
        paddingRight: isAI ? 28 : 0,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        flexShrink: 0,
        marginTop: 2,
        background: isAI
          ? "radial-gradient(circle at 35% 35%, #818CF8, #4F46E5)"
          : "radial-gradient(circle at 35% 35%, #67E8F9, #0891B2)",
        boxShadow: isAI
          ? "0 0 12px rgba(79,70,229,0.5)"
          : "0 0 12px rgba(8,145,178,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 800,
        color: "#fff",
        fontFamily: "Outfit, sans-serif",
        letterSpacing: "-0.02em",
      }}>
        {isAI ? "AI" : "U"}
      </div>

      {/* Bubble + metadata */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        maxWidth: "78%",
        alignItems: isAI ? "flex-start" : "flex-end",
      }}>
        {/* Bubble */}
        <div style={{
          padding: isAI ? "11px 14px" : "11px 16px",
          borderRadius: isAI ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
          background: isAI ? "#1E293B" : "#3730A3",
          boxShadow: isAI
            ? "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), 4px 4px 16px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 4px 4px 16px rgba(55,48,163,0.4)",
          border: isAI
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(99,102,241,0.3)",
          fontSize: 13.5,
          lineHeight: 1.65,
          color: "#E2E8F0",
          fontFamily: "Outfit, Inter, sans-serif",
          wordBreak: "break-word",
          letterSpacing: "0.01em",
        }}>
          {isAI ? (
            /* AI bubbles: render parsed parts (text + code blocks) */
            parts.map((part, i) =>
              part.type === "code" ? (
                <CodeBlock key={i} lang={part.lang} content={part.content} />
              ) : (
                <span key={i} style={{ whiteSpace: "pre-wrap" }}>
                  {part.content}
                </span>
              )
            )
          ) : (
            /* User bubbles: plain text */
            <span style={{ whiteSpace: "pre-wrap" }}>{message}</span>
          )}
        </div>

        {/* Bottom row: timestamp + quality badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexDirection: isAI ? "row" : "row-reverse",
        }}>
          {formattedTime && (
            <span style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.18)",
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.04em",
            }}>
              {formattedTime}
            </span>
          )}
          {!isAI && quality && qualityColor && (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: qualityColor,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.8,
            }}>
              {quality}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
