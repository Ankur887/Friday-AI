import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useInterview from "../hooks/useInterview";
import useInterviewStore, { ROUND_LABELS } from "../store/interviewStore";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconBot = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="3"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="12"/><circle cx="9" cy="11" r="1" fill="currentColor"/>
    <circle cx="15" cy="11" r="1" fill="currentColor"/>
  </svg>
);
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

// ── Score badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  if (score === undefined || score === null) return null;
  const pct   = Math.min(Math.max(score, 0), 10);
  const color = pct >= 7 ? "#4ade80" : pct >= 5 ? "#facc15" : "#f87171";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6,
      background: `${color}18`, border: `1px solid ${color}40`,
    }}>
      <IconStar />
      <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.03em" }}>
        {pct}/10
      </span>
    </div>
  );
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#00BCD4" }}
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.14, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ msg, index }) {
  const isBot = msg.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: index * 0.03 }}
      style={{
        display: "flex",
        flexDirection: isBot ? "row" : "row-reverse",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 14,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isBot
          ? "rgba(0,188,212,0.15)"
          : "rgba(99,102,241,0.15)",
        border: `1px solid ${isBot ? "rgba(0,188,212,0.3)" : "rgba(99,102,241,0.3)"}`,
        color: isBot ? "#00BCD4" : "#818cf8",
        marginTop: 2,
      }}>
        {isBot ? <IconBot /> : <IconUser />}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 5, alignItems: isBot ? "flex-start" : "flex-end" }}>
        <div style={{
          padding: "10px 13px",
          borderRadius: isBot ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
          background: isBot
            ? "rgba(255,255,255,0.05)"
            : "rgba(99,102,241,0.18)",
          border: `1px solid ${isBot ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.25)"}`,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: "#d1d5db",
          fontFamily: "Outfit, sans-serif",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {msg.content}
        </div>

        {/* Score + feedback row */}
        {isBot && (msg.score !== undefined || msg.feedback) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {msg.score !== undefined && <ScoreBadge score={msg.score} />}
            {msg.feedback && (
              <p style={{ fontSize: 11.5, color: "#6b7280", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                {msg.feedback}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Round divider ─────────────────────────────────────────────────────────────
function RoundDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 16px" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      <span style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em",
        color: "#00BCD4", textTransform: "uppercase",
        padding: "2px 10px", borderRadius: 6,
        background: "rgba(0,188,212,0.1)",
        border: "1px solid rgba(0,188,212,0.2)",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InterviewPanel() {
  const messages    = useInterviewStore((s) => s.messages);
  const isThinking  = useInterviewStore((s) => s.isThinking);
  const currentRound= useInterviewStore((s) => s.currentRound);
  const config      = useInterviewStore((s) => s.config);

  const { submitAnswer } = useInterview();

  const [text, setText]       = useState("");
  const bottomRef             = useRef(null);
  const textareaRef           = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;
    submitAnswer(trimmed);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const roundLabel = ROUND_LABELS[currentRound] || currentRound;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: "rgba(255,255,255,0.03)",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
      fontFamily: "Outfit, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.02)",
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: "rgba(0,188,212,0.1)",
          border: "1px solid rgba(0,188,212,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#00BCD4",
        }}>
          <IconBot />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#e3e3e3" }}>
            {config.company} · {config.role}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#6b7280", marginTop: 1 }}>
            {config.level} · {config.difficulty}
          </p>
        </div>
        {roundLabel && (
          <div style={{ marginLeft: "auto" }}>
            <span style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em",
              padding: "3px 9px", borderRadius: 6, textTransform: "uppercase",
              background: "rgba(0,188,212,0.1)",
              border: "1px solid rgba(0,188,212,0.2)",
              color: "#00BCD4",
            }}>
              {roundLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Message list ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 16px 8px",
        scrollbarWidth: "thin", scrollbarColor: "#2a2b2c transparent",
      }}>
        <RoundDivider label="Interview Started" />

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} index={i} />
        ))}

        {isThinking && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(0,188,212,0.15)",
              border: "1px solid rgba(0,188,212,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#00BCD4", marginTop: 2,
            }}>
              <IconBot />
            </div>
            <div style={{
              padding: "10px 14px",
              borderRadius: "4px 14px 14px 14px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <TypingDots />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: "10px 12px",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", gap: 8, alignItems: "flex-end",
        background: "rgba(255,255,255,0.02)",
        flexShrink: 0,
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer… (or use the mic bubble)"
          disabled={isThinking}
          rows={1}
          style={{
            flex: 1, resize: "none",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 13.5, color: "#d1d5db",
            fontFamily: "Outfit, sans-serif",
            outline: "none",
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: "auto",
            opacity: isThinking ? 0.5 : 1,
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => e.target.style.borderColor = "rgba(0,188,212,0.4)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isThinking}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            border: "none", cursor: (!text.trim() || isThinking) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: (!text.trim() || isThinking)
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,188,212,0.85)",
            color: (!text.trim() || isThinking) ? "#4b5563" : "#fff",
            transition: "background 0.15s",
          }}
        >
          <IconSend />
        </button>
      </div>
    </div>
  );
}