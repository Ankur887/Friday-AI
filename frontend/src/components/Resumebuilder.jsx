import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://127.0.0.1:8000";

const SECTIONS = [
  { key: "summary", label: "Professional Summary", placeholder: "e.g. Full-stack engineer with 3 years React/Node..." },
  { key: "experience", label: "Experience Bullets", placeholder: "e.g. Built payment module at Razorpay, improved latency by 40%..." },
  { key: "projects", label: "Projects", placeholder: "e.g. Chat app using WebSockets, Redis pub/sub, deployed on AWS..." },
  { key: "skills", label: "Skills", placeholder: "e.g. React, Node.js, Python, PostgreSQL, Docker, Kubernetes..." },
];

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#e3e3e3",
  fontFamily: "Outfit, sans-serif",
  fontSize: 14,
  padding: "10px 14px",
  outline: "none",
  resize: "vertical",
  minHeight: 90,
  boxSizing: "border-box",
};

const labelStyle = {
  color: "rgba(255,255,255,0.5)",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1,
  marginBottom: 6,
  display: "block",
};

export default function ResumeBuilder() {
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [sections, setSections] = useState({ summary: "", experience: "", projects: "", skills: "" });
  const [loading, setLoading] = useState({});
  const [copied, setCopied] = useState(false);

  const handleAIMagic = async (sectionKey) => {
    const userInput = sections[sectionKey];
    if (!userInput.trim()) return;
    setLoading((l) => ({ ...l, [sectionKey]: true }));
    try {
      const res = await fetch(`${API}/resume/generate-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_type: sectionKey,
          user_info: userInput,
          target_role: targetRole,
          target_company: targetCompany,
        }),
      });
      const data = await res.json();
      if (data.content) {
        setSections((s) => ({ ...s, [sectionKey]: data.content }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading((l) => ({ ...l, [sectionKey]: false }));
    }
  };

  const fullResume = `
TARGET ROLE: ${targetRole || "—"}   COMPANY: ${targetCompany || "—"}

PROFESSIONAL SUMMARY
${sections.summary || "—"}

EXPERIENCE
${sections.experience || "—"}

PROJECTS
${sections.projects || "—"}

SKILLS
${sections.skills || "—"}
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", gap: 24, height: "100%", minHeight: 0 }}>
      {/* LEFT — Form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", paddingRight: 4 }}>
        {/* Role & Company */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: "Target Role", val: targetRole, set: setTargetRole, ph: "e.g. Software Engineer" },
            { label: "Target Company", val: targetCompany, set: setTargetCompany, ph: "e.g. Google" },
          ].map(({ label, val, set, ph }) => (
            <div key={label}>
              <span style={labelStyle}>{label}</span>
              <input
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={ph}
                style={{
                  ...inputStyle,
                  minHeight: "unset",
                  height: 40,
                  padding: "0 14px",
                  resize: "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* AI Sections */}
        {SECTIONS.map(({ key, label, placeholder }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "#e3e3e3", fontWeight: 600, fontSize: 14 }}>{label}</span>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAIMagic(key)}
                disabled={loading[key] || !sections[key].trim()}
                style={{
                  background: loading[key]
                    ? "rgba(99,102,241,0.3)"
                    : "linear-gradient(135deg, #6366f1, #00BCD4)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 14px",
                  cursor: loading[key] || !sections[key].trim() ? "not-allowed" : "pointer",
                  opacity: !sections[key].trim() ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {loading[key] ? (
                  <>
                    <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Writing...
                  </>
                ) : (
                  <>✨ AI Magic</>
                )}
              </motion.button>
            </div>
            <textarea
              value={sections[key]}
              onChange={(e) => setSections((s) => ({ ...s, [key]: e.target.value }))}
              placeholder={placeholder}
              style={inputStyle}
            />
          </motion.div>
        ))}
      </div>

      {/* RIGHT — Preview */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#e3e3e3", fontWeight: 700, fontSize: 14 }}>Live Preview</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            style={{
              background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 8,
              color: copied ? "#4ade80" : "rgba(255,255,255,0.6)",
              fontSize: 12,
              padding: "5px 12px",
              cursor: "pointer",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </motion.button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {targetRole && (
            <div>
              <span style={labelStyle}>Applying For</span>
              <p style={{ color: "#00BCD4", fontSize: 13, margin: 0, fontWeight: 600 }}>
                {targetRole}{targetCompany ? ` @ ${targetCompany}` : ""}
              </p>
            </div>
          )}
          {SECTIONS.map(({ key, label }) =>
            sections[key] ? (
              <div key={key}>
                <span style={labelStyle}>{label}</span>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12.5, margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {sections[key]}
                </p>
              </div>
            ) : null
          )}
          {!targetRole && !Object.values(sections).some(Boolean) && (
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center", marginTop: 40 }}>
              Fill in the form to see your resume preview here.
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}