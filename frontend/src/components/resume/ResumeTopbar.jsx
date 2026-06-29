// FILE: src/components/resume/ResumeTopbar.jsx
// STYLE: exact resume.io top nav — white bg, right-aligned actions:
//        "Auto Apply / Start onboarding" pill, "⚡ Upgrade Now" purple btn,
//        "🎓 Unlimited learning" btn, settings circle icon

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Settings } from "lucide-react";

const ResumeTopbar = memo(({ onUpgrade, onSettings }) => {
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        height: 56,
        background: "#fff",
        borderBottom: "1px solid #e8e8e4",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 32px",
        gap: 10,
        position: "sticky",
        top: 0,
        zIndex: 90,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Auto Apply pill */}
      <button
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "6px 14px 6px 16px",
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          background: "#fff",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#d1d5db"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
            Auto Apply
          </span>
          <span style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1, marginTop: 2 }}>
            Start onboarding
          </span>
        </div>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <ChevronRight size={12} style={{ color: "#6b7280" }} />
        </div>
      </button>

      {/* Upgrade Now */}
      <button
        onClick={onUpgrade}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 18px",
          background: "#4f46e5",
          border: "none",
          borderRadius: 20,
          color: "#fff",
          fontSize: 13, fontWeight: 700,
          cursor: "pointer",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#4338ca"}
        onMouseLeave={e => e.currentTarget.style.background = "#4f46e5"}
      >
        <span style={{ fontSize: 14 }}>⚡</span>
        Upgrade Now
      </button>

      {/* Unlimited learning */}
      <button
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 18px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          color: "#374151",
          fontSize: 13, fontWeight: 600,
          cursor: "pointer",
          transition: "border-color 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#d1d5db"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
      >
        <span style={{ fontSize: 14 }}>🎓</span>
        Unlimited learning
      </button>

      {/* Settings icon circle */}
      <button
        onClick={onSettings}
        style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "#f5f5f0",
          border: "1px solid #e8e8e4",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#eeeee8"}
        onMouseLeave={e => e.currentTarget.style.background = "#f5f5f0"}
      >
        <Settings size={15} style={{ color: "#6b7280" }} />
      </button>
    </motion.header>
  );
});

ResumeTopbar.displayName = "ResumeTopbar";
export default ResumeTopbar;