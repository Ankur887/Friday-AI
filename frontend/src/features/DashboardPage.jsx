import { useEffect } from "react";
import { motion } from "framer-motion";
import Dashboard from "../components/Dashboard";
import JobReadiness from "../components/JobReadiness";
import useCareerStore from "../store/careerStore";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const BG   = "#0d0d0f";
const FONT = "Outfit, sans-serif";
const TEXT = "#f0f0f0";
const MUTED = "#888";
const GRAD = "linear-gradient(135deg, #6c63ff, #00d4ff)";

export default function DashboardPage() {
  const problemsSolved  = useCareerStore((s) => s.problemsSolved);
  const streakDays      = useCareerStore((s) => s.streakDays);
  const hourspracticed  = useCareerStore((s) => s.hourspracticed);
  const resumeScore     = useCareerStore((s) => s.resumeScore);
  const interviewScores = useCareerStore((s) => s.interviewScores);
  const targetRole      = useCareerStore((s) => s.targetRole);
  const targetCompany   = useCareerStore((s) => s.targetCompany);
  const skillsProfile   = useCareerStore((s) => s.skillsProfile);
  const experienceYears = useCareerStore((s) => s.experienceYears);
  const readiness       = useCareerStore((s) => s.readiness);
  const updateStreak    = useCareerStore((s) => s.updateStreak);

  useEffect(() => {
    updateStreak();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = {
    problemsSolved,
    streakDays,
    hourspracticed,
    resumeScore,
    interviewScores,
  };

  const profile = {
    targetRole,
    targetCompany,
    skillsProfile,
    experienceYears,
    readiness,
  };

  return (
    <div style={{
      height: "100%",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      padding: "28px 32px",
      fontFamily: FONT,
      overflowY: "auto",
      background: BG,
      gap: 32,
    }}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexShrink: 0,
        }}
      >
        <div>
          {/* Eyebrow */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            marginBottom: 6,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 8px #4ade80",
            }} />
            <span style={{
              color: "#4ade80", fontSize: 10, fontWeight: 700,
              letterSpacing: 1.6, textTransform: "uppercase", fontFamily: FONT,
            }}>
              Live Dashboard
            </span>
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 900, color: TEXT,
            margin: 0, fontFamily: FONT, letterSpacing: "-0.3px", lineHeight: 1.1,
          }}>
            Career Overview
          </h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "8px 0 0", fontFamily: FONT }}>
            {targetRole
              ? `Tracking progress for ${targetRole}${targetCompany ? ` @ ${targetCompany}` : ""}`
              : "Track your preparation progress and career readiness"}
          </p>
        </div>

        {/* Refresh button */}
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: "0 0 18px rgba(108,99,255,0.3)" }}
          whileTap={{ scale: 0.96 }}
          onClick={() => updateStreak()}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, color: "rgba(255,255,255,0.6)",
            fontFamily: FONT, fontSize: 13, fontWeight: 600,
            padding: "9px 18px", cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex", alignItems: "center", gap: 7,
          }}
        >
          ↻ Refresh
        </motion.button>
      </motion.div>

      {/* ── Stats + Scores ───────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Dashboard stats={stats} />
      </motion.section>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        flexShrink: 0,
      }} />

      {/* ── Job Readiness ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <JobReadiness profile={profile} />
      </motion.section>

      {/* ── Bottom padding ────────────────────────────────────────────────── */}
      <div style={{ height: 16, flexShrink: 0 }} />

      <style>{`
        *::-webkit-scrollbar { width: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>
    </div>
  );
}