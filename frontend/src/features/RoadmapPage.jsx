import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useCareerStore from "../store/careerStore";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const BG      = "#0d0d0f";
const CARD    = "#141416";
const INPUT   = "#1a1a1e";
const ACCENT  = "#6c63ff";
const ACCENT2 = "#00d4ff";
const BORDER  = "rgba(255,255,255,0.07)";
const MUTED   = "#888";
const TEXT    = "#f0f0f0";
const GRAD    = "linear-gradient(135deg, #6c63ff, #00d4ff)";
const FONT    = "Outfit, sans-serif";
const SHADOW  = "0 4px 24px rgba(0,0,0,0.4)";
const GLASS   = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: `1px solid rgba(255,255,255,0.08)`,
  borderRadius: 14,
};

const API     = "http://127.0.0.1:8000";
const LEVELS  = ["Intern", "SDE-1", "SDE-2", "Senior", "Staff"];
const COMPANIES = ["Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix", "Startup", "Generic"];

/* ─── Phase color palette ────────────────────────────────────────────────── */
function phaseStyle(index) {
  const PHASES = [
    { color: "#60a5fa", label: "Foundation",     glow: "rgba(96,165,250,0.2)"  },
    { color: "#a78bfa", label: "Core Skills",    glow: "rgba(167,139,250,0.2)" },
    { color: "#fb923c", label: "Advanced",       glow: "rgba(251,146,60,0.2)"  },
    { color: "#4ade80", label: "Interview Prep", glow: "rgba(74,222,128,0.2)"  },
  ];
  return PHASES[index % PHASES.length];
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */
function Spinner({ size = 14 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      border: "2px solid rgba(255,255,255,0.25)",
      borderTop: "2px solid #fff",
      borderRadius: "50%",
      animation: "rmSpin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

/* ─── Skeleton card ──────────────────────────────────────────────────────── */
function SkeletonCard({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, delay }}
      style={{
        display: "flex", gap: 20, alignItems: "flex-start",
        marginBottom: 28,
      }}
    >
      {/* Left dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          width: 2, height: 80,
          background: "rgba(255,255,255,0.04)",
          marginTop: 4,
        }} />
      </div>
      {/* Card */}
      <div style={{
        flex: 1,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: 20,
        overflow: "hidden", position: "relative",
      }}>
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay }}
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
          }}
        />
        <div style={{ background: "rgba(255,255,255,0.08)", height: 16, width: "55%", borderRadius: 6, marginBottom: 12 }} />
        <div style={{ background: "rgba(255,255,255,0.05)", height: 10, width: "80%", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ background: "rgba(255,255,255,0.05)", height: 10, width: "65%", borderRadius: 6 }} />
      </div>
    </motion.div>
  );
}

/* ─── Timeline card ──────────────────────────────────────────────────────── */
function TimelineCard({ week, index, isLast }) {
  const [open, setOpen] = useState(index === 0);
  const [checked, setChecked] = useState({});
  const phase = phaseStyle(index);
  const tasks = Array.isArray(week.tasks) ? week.tasks : [];
  const doneCount = tasks.filter((_, ti) => checked[ti]).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const toggle = (ti) => setChecked((c) => ({ ...c, [ti]: !c[ti] }));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", gap: 20, alignItems: "flex-start" }}
    >
      {/* ── Left: dot + vertical line ─────────────────────────────── */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", flexShrink: 0,
        position: "relative",
      }}>
        {/* Dot */}
        <motion.div
          whileHover={{ scale: 1.15 }}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            background: `${phase.color}20`,
            border: `2px solid ${phase.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 12, color: phase.color,
            fontFamily: FONT, zIndex: 1, position: "relative",
            boxShadow: `0 0 16px ${phase.glow}`,
            cursor: "default",
          }}
        >
          W{index + 1}
        </motion.div>

        {/* Vertical connector */}
        {!isLast && (
          <div style={{
            width: 2,
            flex: 1,
            minHeight: 40,
            background: `linear-gradient(to bottom, ${phase.color}60, ${phaseStyle(index + 1).color}30)`,
            marginTop: 4, marginBottom: -4,
          }} />
        )}
      </div>

      {/* ── Right: card ────────────────────────────────────────────── */}
      <div style={{
        flex: 1, marginBottom: isLast ? 0 : 24, minWidth: 0,
      }}>
        <div
          onClick={() => setOpen((o) => !o)}
          style={{
            background: `${phase.color}08`,
            border: `1px solid ${open ? phase.color + "40" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 14,
            padding: "16px 18px",
            cursor: "pointer",
            transition: "border-color 0.2s, background 0.2s",
          }}
        >
          {/* Card header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            {/* Phase badge */}
            <span style={{
              background: `${phase.color}22`,
              border: `1px solid ${phase.color}55`,
              borderRadius: 99, padding: "2px 10px",
              fontSize: 10, fontWeight: 700, color: phase.color,
              fontFamily: FONT, letterSpacing: 0.8,
              textTransform: "uppercase", flexShrink: 0,
            }}>
              {phase.label}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: TEXT, fontWeight: 700, fontSize: 14,
                fontFamily: FONT, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {week.theme || `Week ${index + 1}`}
              </div>
            </div>

            {/* Progress pill */}
            <div style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: 99, padding: "3px 10px",
              fontSize: 11, color: MUTED, fontFamily: FONT,
              flexShrink: 0,
            }}>
              {doneCount}/{tasks.length}
            </div>

            <span style={{
              color: "rgba(255,255,255,0.3)", fontSize: 14,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease", flexShrink: 0,
            }}>
              ▾
            </span>
          </div>

          {/* Milestone */}
          {week.milestone && (
            <div style={{ color: MUTED, fontSize: 12, fontFamily: FONT, marginBottom: 8 }}>
              🎯 {week.milestone}
            </div>
          )}

          {/* Progress bar */}
          <div style={{
            height: 3, background: "rgba(255,255,255,0.06)",
            borderRadius: 99, overflow: "hidden",
          }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${phase.color}, ${phase.color}88)`,
                borderRadius: 99,
              }}
            />
          </div>
        </div>

        {/* Expanded tasks */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                padding: "14px 0 0 0",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                {tasks.map((task, ti) => {
                  const done = !!checked[ti];
                  const taskText = typeof task === "string" ? task : (task.title || task.task || "");
                  const taskDur  = typeof task === "object" ? task.duration : null;
                  return (
                    <motion.div
                      key={ti}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: ti * 0.04 }}
                      onClick={() => toggle(ti)}
                      style={{
                        display: "flex", gap: 12, alignItems: "flex-start",
                        background: done ? `${phase.color}08` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${done ? phase.color + "30" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 10, padding: "10px 14px",
                        cursor: "pointer", transition: "all 0.15s ease",
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: `2px solid ${done ? phase.color : "rgba(255,255,255,0.2)"}`,
                        background: done ? phase.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, marginTop: 1, transition: "all 0.15s ease",
                      }}>
                        {done && (
                          <span style={{ color: "#000", fontSize: 11, fontWeight: 800 }}>✓</span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: done ? "rgba(255,255,255,0.3)" : TEXT,
                          fontSize: 13, fontFamily: FONT, fontWeight: 500,
                          textDecoration: done ? "line-through" : "none",
                          lineHeight: 1.5, transition: "color 0.15s",
                        }}>
                          {taskText}
                        </div>
                        {taskDur && (
                          <div style={{ color: MUTED, fontSize: 11, marginTop: 3, fontFamily: FONT }}>
                            ⏱ {taskDur}
                          </div>
                        )}
                      </div>

                      {/* Resource link */}
                      {typeof task === "object" && task.resource && (
                        <a
                          href={task.resource}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: ACCENT2, fontSize: 11, fontFamily: FONT,
                            textDecoration: "none", flexShrink: 0, marginTop: 2,
                            fontWeight: 600,
                          }}
                        >
                          →&nbsp;Link
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ROADMAP PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function RoadmapPage() {
  const targetRole    = useCareerStore((s) => s.targetRole);
  const targetCompany = useCareerStore((s) => s.targetCompany);
  const setRoadmap    = useCareerStore((s) => s.setRoadmap);
  const setRoadmapLoading = useCareerStore((s) => s.setRoadmapLoading);
  const setRoadmapError   = useCareerStore((s) => s.setRoadmapError);

  const [form, setForm] = useState({
    role:    targetRole    || "Software Engineer",
    company: targetCompany || "Google",
    level:   "SDE-1",
    skills:  "",
    weeks:   8,
  });

  const [roadmapData, setRoadmapData] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setRoadmapLoading(true);

    try {
      const res = await fetch(`${API}/career/roadmap`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          role:            form.role,
          company:         form.company,
          level:           form.level,
          current_skills:  form.skills,
          timeline_weeks:  form.weeks,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRoadmapData(data);
      setRoadmap(data);
    } catch (e) {
      const msg = "Could not generate roadmap. Make sure the backend is running.";
      setError(msg);
      setRoadmapError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* Resolve weeks array from various API response shapes */
  const weeks = roadmapData
    ? Array.isArray(roadmapData.weeks)
      ? roadmapData.weeks
      : Array.isArray(roadmapData.roadmap)
      ? roadmapData.roadmap
      : []
    : [];

  return (
    <div style={{
      height: "100%", minHeight: 0,
      display: "flex", flexDirection: "column",
      padding: "28px 32px",
      fontFamily: FONT,
      overflowY: "auto",
      background: BG,
      gap: 28,
    }}>

      {/* ── Page header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ flexShrink: 0 }}
      >
        <h1 style={{
          fontSize: 28, fontWeight: 900, color: TEXT,
          margin: 0, fontFamily: FONT, letterSpacing: "-0.3px",
        }}>
          Career Roadmap
        </h1>
        <p style={{ color: MUTED, fontSize: 14, margin: "6px 0 0", fontFamily: FONT }}>
          Generate a personalised week-by-week preparation plan powered by AI
        </p>
      </motion.div>

      {/* ── Config card ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{
          ...GLASS,
          padding: 22,
          display: "flex", flexDirection: "column", gap: 18,
          boxShadow: SHADOW, flexShrink: 0,
        }}
      >
        {/* Row 1: Role, Company, Level */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Target Role</label>
            <input
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="Software Engineer"
              style={inputStyle}
              onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
              onBlur={(e)  => (e.target.style.boxShadow = "none")}
            />
          </div>
          <div>
            <label style={labelStyle}>Target Company</label>
            <select
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              style={selectStyle}
            >
              {COMPANIES.map((c) => (
                <option key={c} value={c} style={{ background: CARD }}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Level</label>
            <select
              value={form.level}
              onChange={(e) => set("level", e.target.value)}
              style={selectStyle}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l} style={{ background: CARD }}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Skills + Timeline */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Skills</label>
            <textarea
              value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="e.g. React, Node.js, basic DSA, SQL, Python..."
              rows={2}
              style={{
                ...inputStyle,
                resize: "none",
                minHeight: 52,
                lineHeight: 1.6,
              }}
              onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
              onBlur={(e)  => (e.target.style.boxShadow = "none")}
            />
          </div>
          <div>
            <label style={labelStyle}>Timeline</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[4, 8, 12, 16].map((w) => (
                <motion.button
                  key={w}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => set("weeks", w)}
                  style={{
                    flex: 1, height: 44,
                    border: `1px solid ${form.weeks === w ? ACCENT : BORDER}`,
                    borderRadius: 10,
                    background: form.weeks === w
                      ? "rgba(108,99,255,0.2)"
                      : "rgba(255,255,255,0.03)",
                    color: form.weeks === w ? "#a78bfa" : MUTED,
                    fontFamily: FONT, fontWeight: 700, fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    minWidth: 48,
                  }}
                >
                  {w}w
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "10px 14px",
            color: "#f87171", fontSize: 13, fontFamily: FONT,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{error}</span>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleGenerate}
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 7, color: "#f87171",
                fontFamily: FONT, fontWeight: 700,
                fontSize: 12, padding: "5px 12px",
                cursor: "pointer",
              }}
            >
              Retry
            </motion.button>
          </div>
        )}

        {/* Generate button */}
        <motion.button
          whileHover={!loading ? { scale: 1.01, boxShadow: "0 0 30px rgba(108,99,255,0.4)" } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          onClick={handleGenerate}
          disabled={loading}
          style={{
            background: loading ? "rgba(108,99,255,0.35)" : GRAD,
            border: "none", borderRadius: 11, color: "#fff",
            fontFamily: FONT, fontWeight: 700, fontSize: 15,
            padding: "14px 0", cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.2s ease",
          }}
        >
          {loading
            ? <><Spinner size={16} /> Generating your roadmap…</>
            : <>🗺️ Generate Roadmap</>
          }
        </motion.button>
      </motion.div>

      {/* ── Roadmap output ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Skeleton loading state */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} delay={i * 0.15} />
            ))}
          </motion.div>
        )}

        {/* Roadmap timeline */}
        {!loading && roadmapData && weeks.length > 0 && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ paddingBottom: 32 }}
          >
            {/* Roadmap title card */}
            {(roadmapData.title || roadmapData.summary) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "linear-gradient(135deg, rgba(108,99,255,0.12), rgba(0,212,255,0.08))",
                  border: "1px solid rgba(108,99,255,0.2)",
                  borderRadius: 14, padding: "18px 22px",
                  marginBottom: 28,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <div>
                  {roadmapData.title && (
                    <div style={{
                      color: TEXT, fontWeight: 800, fontSize: 17,
                      fontFamily: FONT, marginBottom: 4,
                    }}>
                      {roadmapData.title}
                    </div>
                  )}
                  {roadmapData.summary && (
                    <div style={{ color: MUTED, fontSize: 13, fontFamily: FONT, maxWidth: 520 }}>
                      {roadmapData.summary}
                    </div>
                  )}
                </div>
                <div style={{
                  textAlign: "right", flexShrink: 0,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10, padding: "10px 18px",
                }}>
                  <div style={{
                    fontSize: 28, fontWeight: 900,
                    background: GRAD, WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent", fontFamily: FONT,
                  }}>
                    {weeks.length}
                  </div>
                  <div style={{ color: MUTED, fontSize: 11, fontFamily: FONT }}>
                    weeks
                  </div>
                </div>
              </motion.div>
            )}

            {/* Phase legend */}
            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap",
              marginBottom: 24,
            }}>
              {["Foundation", "Core Skills", "Advanced", "Interview Prep"].map((name, i) => {
                const { color } = phaseStyle(i);
                return (
                  <div key={name} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: `${color}10`,
                    border: `1px solid ${color}35`,
                    borderRadius: 99, padding: "4px 12px",
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                    <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: FONT }}>
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timeline */}
            <div style={{ paddingLeft: 4 }}>
              {weeks.map((week, i) => (
                <TimelineCard
                  key={i}
                  week={week}
                  index={i}
                  isLast={i === weeks.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Raw data fallback (if backend returns unexpected shape) */}
        {!loading && roadmapData && weeks.length === 0 && (
          <motion.div
            key="raw"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              ...GLASS,
              padding: 24,
            }}
          >
            <div style={{ color: MUTED, fontSize: 13, fontFamily: FONT, marginBottom: 12 }}>
              Roadmap generated. Raw data:
            </div>
            <pre style={{
              color: "rgba(255,255,255,0.6)", fontSize: 12,
              fontFamily: "monospace", lineHeight: 1.6,
              overflow: "auto", maxHeight: 400,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {JSON.stringify(roadmapData, null, 2)}
            </pre>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && !roadmapData && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "48px 0", gap: 14,
            }}
          >
            <span style={{ fontSize: 52 }}>🗺️</span>
            <div style={{
              color: "rgba(255,255,255,0.2)", fontSize: 15,
              fontFamily: FONT, textAlign: "center",
            }}>
              Fill in your details above and generate<br />your personalised roadmap
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes rmSpin { to { transform: rotate(360deg); } }
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        input::placeholder, textarea::placeholder { color: #555; }
        select option { background: #141416; color: #f0f0f0; }
      `}</style>
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────────────────────── */
const labelStyle = {
  color: "rgba(255,255,255,0.45)",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  marginBottom: 7,
  display: "block",
  fontFamily: "Outfit, sans-serif",
};

const inputStyle = {
  width: "100%",
  background: "#1a1a1e",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  color: "#f0f0f0",
  fontFamily: "Outfit, sans-serif",
  fontSize: 14,
  padding: "10px 14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
};