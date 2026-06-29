// FILE: src/components/resume/TemplateCard.jsx
// STYLE: resume.io — tall portrait mockup thumbnail, hover shows "Use template",
//        selected state has blue border + check badge

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye } from "lucide-react";

/* ── Document mockup (portrait) ─────────────────────────────── */
const TemplateMockup = memo(({ color }) => (
  <div style={{
    width: "100%", aspectRatio: "3/4",
    background: "#fff",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
  }}>
    {/* Header accent */}
    <div style={{ height: 30, background: color, flexShrink: 0 }}/>
    {/* Body lines */}
    <div style={{ flex: 1, padding: "10px 9px", display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ height: 6,  width: "58%", background: "#e5e7eb", borderRadius: 2 }}/>
      <div style={{ height: 4,  width: "42%", background: "#f3f4f6", borderRadius: 2, marginBottom: 5 }}/>
      <div style={{ height: 1,  background: `${color}30`, marginBottom: 5 }}/>
      {[78, 62, 70, 50, 66, 44, 55, 48, 38].map((w, i) => (
        <div key={i} style={{
          height: 3.5, width: `${w}%`,
          background: i % 3 === 0 ? "#e5e7eb" : "#f3f4f6",
          borderRadius: 2, opacity: 1 - i * 0.07,
        }}/>
      ))}
    </div>
  </div>
));
TemplateMockup.displayName = "TemplateMockup";

/* ── Template card ───────────────────────────────────────────── */
const TemplateCard = memo(({ template, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const color = template.color || "#1a56db";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => onSelect(template)}
      style={{
        cursor: "pointer",
        borderRadius: 10,
        overflow: "hidden",
        border: selected ? `2px solid ${color}` : "1.5px solid #e5e7eb",
        boxShadow: selected ? `0 0 0 3px ${color}22` : "none",
        background: "#fff",
        transition: "border .15s, box-shadow .15s",
        position: "relative",
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative" }}>
        <TemplateMockup color={color}/>

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,.38)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 8,
              }}
            >
              <button
                onClick={e => { e.stopPropagation(); onSelect(template); }}
                style={{
                  padding: "8px 18px", borderRadius: 7,
                  background: "#fff", border: "none",
                  color: "#111827", fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Use template
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag pill */}
        {template.tag && (
          <div style={{
            position: "absolute", top: 7, left: 7,
            background: color, color: "#fff",
            fontSize: 9, fontWeight: 700,
            borderRadius: 20, padding: "2px 8px",
          }}>
            {template.tag}
          </div>
        )}

        {/* Selected check badge */}
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            style={{
              position: "absolute", top: 7, right: 7,
              width: 20, height: 20, borderRadius: "50%",
              background: color, border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Check size={11} color="#fff" strokeWidth={3}/>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "9px 11px",
        borderTop: "1px solid #f3f4f6",
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{template.name}</div>
        <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>ATS optimised</div>
      </div>
    </motion.div>
  );
});

TemplateCard.displayName = "TemplateCard";
export default TemplateCard;