import React from "react";
import { motion } from "framer-motion";
import { FileText, Upload, Sparkles } from "lucide-react";

export default function EmptyResumeState({ onCreate, onUpload }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "72px 24px", gap: 32,
      }}
    >
      {/* Illustration */}
      <div style={{ position: "relative" }}>
        <div style={{
          width: 96, height: 96, borderRadius: 24,
          background: "rgba(99,102,241,0.1)",
          border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileText size={40} color="#6366F1" />
        </div>
        <div style={{
          position: "absolute", bottom: -6, right: -6,
          width: 28, height: 28, borderRadius: "50%",
          background: "#6366F1",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={14} color="#fff" />
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600, color: "#FAFAFA" }}>
          No resumes yet
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: "#A1A1AA", lineHeight: 1.6 }}>
          Create your first AI-powered resume or upload an existing one to get started.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onCreate}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "#6366F1", border: "none",
            color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#818CF8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#6366F1")}
        >
          <Sparkles size={15} />
          Create Resume
        </button>
        <button
          onClick={onUpload}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#A1A1AA", fontSize: 14, fontWeight: 500,
            cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)";
            e.currentTarget.style.color = "#FAFAFA";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color = "#A1A1AA";
          }}
        >
          <Upload size={15} />
          Upload Resume
        </button>
      </div>
    </motion.div>
  );
}