// FILE: src/components/resume/ResumeCard.jsx
// STYLE: resume.io — tall portrait document thumbnail, colored accent bar,
//        name + last edited below, hover reveals action buttons

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, BarChart2, Copy, Download, Trash2, MoreVertical } from "lucide-react";

/* ── ATS pill ────────────────────────────────────────────────── */
const ATSPill = memo(({ score }) => {
  const bg    = score >= 80 ? "#d1fae5" : score >= 60 ? "#fef3c7" : "#fee2e2";
  const color = score >= 80 ? "#065f46" : score >= 60 ? "#92400e" : "#991b1b";
  return (
    <span style={{
      background: bg, color, fontSize: 10, fontWeight: 700,
      borderRadius: 20, padding: "3px 8px", letterSpacing: ".02em",
    }}>
      {score}% ATS
    </span>
  );
});
ATSPill.displayName = "ATSPill";

/* ── Document mockup thumbnail ───────────────────────────────── */
const DocThumbnail = memo(({ color = "#1a56db" }) => (
  <div style={{
    width: "100%", aspectRatio: "3/4",
    background: "#fff",
    borderRadius: 4,
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,.10)",
    display: "flex", flexDirection: "column",
    position: "relative",
  }}>
    {/* Colored top accent bar (like resume.io's template header) */}
    <div style={{ height: 28, background: color, flexShrink: 0 }}/>
    {/* Mock content lines */}
    <div style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
      {/* "Name" block */}
      <div style={{ height: 7, width: "55%", background: "#e5e7eb", borderRadius: 3 }}/>
      <div style={{ height: 5, width: "40%", background: "#f3f4f6", borderRadius: 3, marginBottom: 6 }}/>
      {/* Divider */}
      <div style={{ height: 1, background: `${color}30`, marginBottom: 6 }}/>
      {/* Content lines */}
      {[80, 65, 72, 55, 68, 45, 60, 50, 40, 58].map((w, i) => (
        <div key={i} style={{
          height: 4, width: `${w}%`,
          background: i % 3 === 0 ? "#e5e7eb" : "#f3f4f6",
          borderRadius: 2, opacity: 1 - i * 0.055,
        }}/>
      ))}
    </div>
    {/* Subtle page shadow on right edge */}
    <div style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: 3,
      background: "linear-gradient(to right, transparent, rgba(0,0,0,.06))",
    }}/>
  </div>
));
DocThumbnail.displayName = "DocThumbnail";

/* ── Resume card ─────────────────────────────────────────────── */
const ResumeCard = memo(({ resume, onEdit, onAnalyze, onDuplicate, onDownload, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered,  setHovered]  = useState(false);

  const color = resume.color || "#1a56db";

  const menuItems = [
    { icon: Edit3,    label: "Edit",      action: () => onEdit(resume) },
    { icon: BarChart2,label: "Analyze",   action: () => onAnalyze(resume) },
    { icon: Copy,     label: "Duplicate", action: () => onDuplicate(resume) },
    { icon: Download, label: "Download",  action: () => onDownload(resume) },
    { icon: Trash2,   label: "Delete",    action: () => onDelete(resume), danger: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{ position: "relative", cursor: "pointer" }}
    >
      {/* Thumbnail wrapper */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={() => onEdit(resume)}
        style={{ position: "relative", marginBottom: 12 }}
      >
        <DocThumbnail color={color} />

        {/* Hover overlay with Edit button */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,.32)",
                borderRadius: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8,
              }}
            >
              <button
                onClick={e => { e.stopPropagation(); onEdit(resume); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 8,
                  background: "#fff", border: "none",
                  color: "#111827", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Edit3 size={13}/> Edit
              </button>
              <button
                onClick={e => { e.stopPropagation(); onAnalyze(resume); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 8,
                  background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.4)",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <BarChart2 size={13}/> Analyze
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ATS pill pinned to top-right of card */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <ATSPill score={resume.atsScore ?? 72}/>
        </div>
      </motion.div>

      {/* Card footer: name + meta + menu */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#111827",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {resume.name}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            Edited {resume.updatedAt || "just now"}
          </div>
        </div>

        {/* 3-dot menu */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: menuOpen ? "#f3f4f6" : "transparent",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6b7280",
            }}
          >
            <MoreVertical size={15}/>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: -4 }}
                transition={{ duration: 0.13 }}
                style={{
                  position: "absolute", right: 0, top: 32,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,.10)",
                  minWidth: 148,
                  zIndex: 100,
                  overflow: "hidden",
                  padding: "4px 0",
                }}
              >
                {menuItems.map(({ icon: Icon, label, action, danger }) => (
                  <button
                    key={label}
                    onClick={e => { e.stopPropagation(); setMenuOpen(false); action(); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 9,
                      padding: "9px 14px", border: "none", background: "none",
                      fontSize: 13, fontWeight: 500,
                      color: danger ? "#ef4444" : "#374151",
                      cursor: "pointer", textAlign: "left",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = danger ? "#fef2f2" : "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                  >
                    <Icon size={13}/> {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {menuOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </motion.div>
  );
});

ResumeCard.displayName = "ResumeCard";
export default ResumeCard;