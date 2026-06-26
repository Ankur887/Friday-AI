import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const GLASS = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
};
const FONT   = "Outfit, sans-serif";
const TEXT   = "#f0f0f0";
const MUTED  = "#888";
const SHADOW = "0 4px 24px rgba(0,0,0,0.4)";
const GRAD   = "linear-gradient(135deg, #6c63ff, #00d4ff)";
const API    = "http://127.0.0.1:8000";

const TRACKS = [
  { key: "internship", label: "Internship",  icon: "🎓", color: "#818cf8" },
  { key: "sde1",       label: "SDE-1",       icon: "💼", color: "#00BCD4" },
  { key: "sde2",       label: "SDE-2",       icon: "🚀", color: "#a855f7" },
  { key: "faang",      label: "FAANG",       icon: "🏆", color: "#f97316" },
  { key: "startup",    label: "Startup",     icon: "⚡", color: "#22c55e" },
  { key: "dsa",        label: "DSA",         icon: "🧩", color: "#ec4899" },
  { key: "frontend",   label: "Frontend",    icon: "🎨", color: "#f59e0b" },
  { key: "backend",    label: "Backend",     icon: "🖥️", color: "#06b6d4" },
];

/* ─── Bar color ──────────────────────────────────────────────────────────── */
function barColor(pct) {
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

/* ─── Skeleton loader ────────────────────────────────────────────────────── */
function Skeleton({ style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      borderRadius: 8, overflow: "hidden",
      position: "relative",
      ...style,
    }}>
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        }}
      />
    </div>
  );
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 13, height: 13,
      border: "2px solid rgba(255,255,255,0.25)",
      borderTop: "2px solid #fff",
      borderRadius: "50%",
      animation: "jrSpin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   JOB READINESS COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function JobReadiness({ profile = {} }) {
  const [scores,   setScores]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [error,    setError]    = useState("");

  const fetchReadiness = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/career/readiness`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setScores(data.scores || data);
    } catch {
      setError("Could not fetch readiness. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...GLASS, padding: 22, boxShadow: SHADOW,
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{
            color: TEXT, fontWeight: 700, fontSize: 15, fontFamily: FONT,
          }}>
            Job Readiness
          </div>
          <div style={{ color: MUTED, fontSize: 12, marginTop: 3, fontFamily: FONT }}>
            How ready you are across different career tracks
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 20px rgba(108,99,255,0.35)" }}
          whileTap={{ scale: 0.96 }}
          onClick={fetchReadiness}
          disabled={loading}
          style={{
            background: loading ? "rgba(108,99,255,0.3)" : GRAD,
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 13, fontWeight: 700, padding: "9px 18px",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: FONT,
            display: "flex", alignItems: "center", gap: 8,
            transition: "all 0.2s ease",
          }}
        >
          {loading ? <><Spinner /> Analyzing…</> : "↻ Refresh Readiness"}
        </motion.button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10, padding: "10px 14px",
          color: "#f87171", fontSize: 12, fontFamily: FONT,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Track list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {TRACKS.map(({ key, label, icon, color }, i) => {
          const pct = scores?.[key] ?? null;
          const bar = pct !== null ? barColor(pct) : color;
          const isOpen = expanded === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => setExpanded(isOpen ? null : key)}
              whileHover={{ scale: 1.005 }}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: `1px solid ${isOpen ? color + "40" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                transition: "border-color 0.2s ease",
              }}
            >
              {/* Track row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${color}18`,
                  border: `1.5px solid ${color}35`,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 17, flexShrink: 0,
                }}>
                  {icon}
                </div>

                {/* Label */}
                <span style={{
                  color: TEXT, fontWeight: 600, fontSize: 13,
                  fontFamily: FONT, flex: 1,
                }}>
                  {label}
                </span>

                {/* Score badge */}
                {loading ? (
                  <Skeleton style={{ width: 44, height: 22 }} />
                ) : (
                  <span style={{
                    fontWeight: 800, fontSize: 14, fontFamily: FONT,
                    color: pct !== null ? bar : "rgba(255,255,255,0.2)",
                    minWidth: 46, textAlign: "right",
                  }}>
                    {pct !== null ? `${pct}%` : "—"}
                  </span>
                )}

                <span style={{
                  color: "rgba(255,255,255,0.3)", fontSize: 14,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  flexShrink: 0,
                }}>
                  ▾
                </span>
              </div>

              {/* Progress bar */}
              <div style={{
                marginTop: 10, height: 5,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 99, overflow: "hidden",
              }}>
                {loading ? (
                  <Skeleton style={{ width: "100%", height: "100%", borderRadius: 99 }} />
                ) : (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: pct !== null ? `${pct}%` : "0%" }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.05 }}
                    style={{
                      height: "100%",
                      background: pct !== null
                        ? `linear-gradient(90deg, ${bar}, ${bar}aa)`
                        : "transparent",
                      borderRadius: 99,
                    }}
                  />
                )}
              </div>

              {/* Color legend */}
              {pct !== null && (
                <div style={{
                  display: "flex", gap: 6, marginTop: 6, alignItems: "center",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: bar, flexShrink: 0,
                  }} />
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: FONT }}>
                    {pct >= 70 ? "Ready" : pct >= 40 ? "Developing" : "Needs Work"}
                  </span>
                </div>
              )}

              {/* Expanded recommendations */}
              <AnimatePresence>
                {isOpen && scores?.recommendations?.[key] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      marginTop: 14, paddingTop: 14,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{
                        color: "rgba(255,255,255,0.4)", fontSize: 10,
                        fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: 1.2, marginBottom: 8, fontFamily: FONT,
                      }}>
                        Top Recommendations
                      </div>
                      {scores.recommendations[key].map((rec, ri) => (
                        <div key={ri} style={{
                          display: "flex", gap: 8, marginBottom: 6,
                        }}>
                          <span style={{ color, fontSize: 12, flexShrink: 0 }}>→</span>
                          <span style={{
                            color: "rgba(255,255,255,0.6)", fontSize: 12.5, fontFamily: FONT,
                            lineHeight: 1.5,
                          }}>
                            {rec}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Prompt to refresh */}
      {!scores && !loading && (
        <p style={{
          color: "rgba(255,255,255,0.18)", fontSize: 12,
          textAlign: "center", marginTop: 4, fontFamily: FONT,
        }}>
          Click "Refresh Readiness" to calculate your scores
        </p>
      )}

      <style>{`@keyframes jrSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}