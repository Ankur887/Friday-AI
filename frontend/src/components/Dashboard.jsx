import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const CARD  = "#141416";
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

/* ─── Animated count-up ─────────────────────────────────────────────────── */
function CountUp({ target, duration = 1000 }) {
  const [val, setVal] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return <>{val}</>;
}

/* ─── Score color ────────────────────────────────────────────────────────── */
function scoreGradient(score) {
  if (score >= 80) return "linear-gradient(90deg, #22c55e, #4ade80)";
  if (score >= 60) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #ef4444, #f87171)";
}
function scoreColor(score) {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color, suffix, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, boxShadow: `0 8px 32px ${color}22` }}
      style={{
        ...GLASS,
        padding: "22px 20px 18px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        boxShadow: SHADOW,
      }}
    >
      {/* Background glow blob */}
      <div style={{
        position: "absolute", top: -24, right: -24,
        width: 80, height: 80, borderRadius: "50%",
        background: color, opacity: 0.14,
        filter: "blur(24px)", pointerEvents: "none",
      }} />

      {/* Bottom accent line */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
        opacity: 0.5,
      }} />

      <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>

      <div style={{
        fontSize: 34, fontWeight: 900, color, lineHeight: 1,
        fontFamily: FONT, letterSpacing: "-0.5px",
      }}>
        <CountUp target={typeof value === "number" ? value : 0} />
        <span style={{ fontSize: 16, fontWeight: 600, marginLeft: 2 }}>{suffix}</span>
      </div>

      <div style={{
        color: "rgba(255,255,255,0.4)", fontSize: 12,
        fontWeight: 600, marginTop: 8,
        fontFamily: FONT, letterSpacing: 0.3,
      }}>
        {label}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard({ stats = {} }) {
  const {
    problemsSolved  = 0,
    streakDays      = 0,
    hourspracticed  = 0,
    resumeScore     = 0,
    interviewScores = [],
  } = stats;

  // Recent scores (last 5)
  const recentScores = [...interviewScores].reverse().slice(0, 5);

  const cards = [
    {
      label: "Problems Solved", value: problemsSolved,
      icon: "🧩", color: "#818cf8", suffix: "",
    },
    {
      label: "Day Streak", value: streakDays,
      icon: "🔥", color: "#f97316", suffix: "",
    },
    {
      label: "Hours Practiced", value: hourspracticed,
      icon: "⏱️", color: "#00BCD4", suffix: "h",
    },
    {
      label: "Resume Score", value: resumeScore,
      icon: "📄", color: "#a855f7", suffix: "%",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
      }}>
        {cards.map((card, i) => (
          <StatCard key={card.label} delay={i * 0.08} {...card} />
        ))}
      </div>

      {/* ── Recent Interview Scores ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        style={{ ...GLASS, padding: 22, boxShadow: SHADOW }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 18,
        }}>
          <div>
            <div style={{
              color: TEXT, fontWeight: 700, fontSize: 15, fontFamily: FONT,
            }}>
              Recent Interview Scores
            </div>
            <div style={{
              color: MUTED, fontSize: 12, marginTop: 3, fontFamily: FONT,
            }}>
              Your last {recentScores.length} sessions
            </div>
          </div>
          {recentScores.length > 0 && (
            <div style={{
              background: GRAD,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 800, fontSize: 22,
              fontFamily: FONT,
            }}>
              {Math.round(
                recentScores.reduce((a, s) => a + (s.score || 0), 0) /
                recentScores.length
              )}
              <span style={{ fontSize: 13, fontWeight: 600 }}>avg</span>
            </div>
          )}
        </div>

        {recentScores.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center", padding: "36px 0",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 12,
            }}
          >
            <span style={{ fontSize: 40 }}>🎯</span>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, fontFamily: FONT }}>
              Complete your first interview to see scores here
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentScores.map((s, i) => {
              const pct = Math.min(100, Math.max(0, s.score || 0));
              const col = scoreColor(pct);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10, padding: "12px 14px",
                  }}
                >
                  {/* Score badge */}
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                    background: `${col}18`,
                    border: `2px solid ${col}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 13, color: col, fontFamily: FONT,
                  }}>
                    {Math.round(pct)}
                  </div>

                  {/* Meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: TEXT, fontSize: 13, fontWeight: 600,
                      fontFamily: FONT, whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {s.company && s.role ? `${s.company} — ${s.role}` : s.role || s.company || "Interview"}
                    </div>
                    <div style={{
                      color: MUTED, fontSize: 11, marginTop: 3, fontFamily: FONT,
                    }}>
                      {s.date ? new Date(s.date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      }) : "Recent"}
                    </div>
                  </div>

                  {/* Bar */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                      <span style={{ color: col, fontSize: 11, fontWeight: 700, fontFamily: FONT }}>
                        {pct}%
                      </span>
                    </div>
                    <div style={{
                      height: 5, background: "rgba(255,255,255,0.07)",
                      borderRadius: 99, overflow: "hidden",
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 + i * 0.07 }}
                        style={{
                          height: "100%",
                          background: scoreGradient(pct),
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}