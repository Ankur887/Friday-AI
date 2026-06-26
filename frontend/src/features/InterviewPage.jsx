import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useInterview from "../hooks/useInterview";
import NewInterviewPanel from "../components/interview/InterviewPanel";

/* ─── Status constants ───────────────────────────────────────────────────── */
const S = { IDLE: "idle", ACTIVE: "active", THINKING: "thinking", COMPLETE: "complete" };

/* ─── Design Tokens (per spec Section 18) ───────────────────────────────── */
const T = {
  bg:       "#0A0A0F",
  surface:  "#12121A",
  surface2: "#1A1A26",
  border:   "rgba(255,255,255,0.07)",
  accent:   "#5B6FF5",
  accent2:  "#7C8FFF",
  success:  "#22C55E",
  warning:  "#F59E0B",
  error:    "#EF4444",
  text:     "#F1F1F5",
  muted:    "#9494A8",
  font:     "Inter, system-ui, sans-serif",
  mono:     "'JetBrains Mono', 'Fira Code', monospace",
  grad:     "linear-gradient(135deg, #5B6FF5, #7C8FFF)",
  gradGold: "linear-gradient(135deg, #F59E0B, #FCD34D)",
  gradGreen:"linear-gradient(135deg, #22C55E, #4ADE80)",
  gradRed:  "linear-gradient(135deg, #EF4444, #F87171)",
  shadow:   "0 8px 32px rgba(0,0,0,0.5)",
  glow:     "0 0 40px rgba(91,111,245,0.25)",
};

/* ─── Glass morphism helper ─────────────────────────────────────────────── */
const glass = (extra = {}) => ({
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  ...extra,
});

/* ─── Static Data ────────────────────────────────────────────────────────── */
const COMPANIES = {
  "Tier 1 — FAANG / Hyperscalers": [
    "Google","Meta","Amazon","Apple","Microsoft","Netflix","NVIDIA","OpenAI","Anthropic","DeepMind","Tesla","SpaceX",
  ],
  "Tier 2 — Elite Tech": [
    "Uber","Airbnb","Stripe","Coinbase","Databricks","Snowflake","Palantir","Figma","Canva","Notion","Linear",
    "Vercel","Cloudflare","HashiCorp","MongoDB","Elastic","Twilio","Okta","Datadog","PagerDuty","Grafana Labs",
    "Wiz","Hugging Face",
  ],
  "Tier 3 — Enterprise": [
    "Salesforce","Oracle","SAP","IBM","Cisco","Intel","Qualcomm","AMD","Broadcom","VMware","ServiceNow",
    "Workday","Splunk","Palo Alto Networks","Fortinet","CrowdStrike","Zscaler",
  ],
  "Tier 4 — Finance & Consulting": [
    "Goldman Sachs","JPMorgan","Morgan Stanley","Citadel","Jane Street","Two Sigma","D.E. Shaw",
    "McKinsey","BCG","Bain","Deloitte","Accenture","PwC","KPMG","EY",
  ],
  "Tier 5 — Indian Tech & Startups": [
    "Flipkart","Swiggy","Zomato","Razorpay","PhonePe","Paytm","CRED","Meesho","Dream11","Groww",
    "Zepto","Blinkit","Urban Company","Nykaa","MakeMyTrip","PolicyBazaar","ShareChat","BrowserStack",
    "Freshworks","Zoho","Infosys","TCS","Wipro","HCL","Tech Mahindra","Mphasis",
  ],
  "Tier 6 — Global": [
    "Samsung","Sony","ByteDance","Alibaba","Baidu","Tencent","Grab","Sea Limited","Shopee","GoTo",
    "Gojek","Rappi","Nubank","Mercado Libre","Klarna","Revolut","Wise","N26","Deliveroo","Spotify",
    "Booking.com","Zalando","ASOS",
  ],
};

const ALL_COMPANIES = Object.values(COMPANIES).flat();

const ROLES = {
  "Engineering": [
    "Software Engineer","Frontend Engineer","Backend Engineer","Full Stack Engineer",
    "iOS Developer","Android Developer","Mobile Engineer","Embedded Systems Engineer",
    "Firmware Engineer","Robotics Engineer",
  ],
  "AI / ML": [
    "AI Engineer","ML Engineer","Data Scientist","Research Scientist","Research Engineer",
    "Applied Scientist","Generative AI Engineer","LLM Engineer","MLOps Engineer",
    "AI Safety Researcher","Computer Vision Engineer","NLP Engineer",
  ],
  "Data": [
    "Data Engineer","Data Analyst","Analytics Engineer","Business Intelligence Engineer",
    "Data Architect","Database Administrator","ETL Engineer","Quantitative Analyst",
  ],
  "Infrastructure / Platform": [
    "DevOps Engineer","Cloud Engineer","SRE / Site Reliability Engineer","Platform Engineer",
    "Infrastructure Engineer","Kubernetes Engineer","Security Engineer","Penetration Tester",
  ],
  "Product & Design": [
    "Product Manager","Senior PM","Technical Product Manager","Growth PM","Platform PM",
    "UX Designer","UI Designer","Product Designer","UX Researcher",
  ],
  "Management & Leadership": [
    "Engineering Manager","Senior Engineering Manager","Director of Engineering",
    "VP of Engineering","CTO","Technical Program Manager","Scrum Master",
  ],
  "Business & Operations": [
    "Business Analyst","Solutions Architect","Enterprise Architect","Presales Engineer",
    "Sales Engineer","Technical Account Manager","Customer Success Manager",
  ],
};

const EXPERIENCE_LEVELS = [
  "Intern","Fresher","SDE-1","SDE-2","SDE-3","Senior","Staff","Principal",
  "Architect","EM","Director","VP",
];

const INTERVIEW_TYPES = [
  "Role-Based","Company-Based","JD-Based","Resume-Based","Custom",
];

const ROUNDS = [
  "Warm-Up","HR / Screening","Technical Screening","Behavioral (STAR)","Coding Round",
  "Machine Coding","Low Level Design (LLD)","High Level Design (HLD)","System Design",
  "Domain / Technical Deep Dive","Aptitude / Logical Reasoning","Case Study",
  "Product Sense","Leadership / Managerial","Bar Raiser / Final Round","Full Loop Simulation",
];

const DIFFICULTIES = [
  { label: "Warm-Up",        color: "#22C55E" },
  { label: "Easy",           color: "#4ADE80" },
  { label: "Medium",         color: "#F59E0B" },
  { label: "Hard",           color: "#EF4444" },
  { label: "FAANG-Level",    color: "#A855F7" },
  { label: "Research-Level", color: "#EC4899" },
];

const LANGUAGES = [
  "English","Hindi","Spanish","French","German","Portuguese","Chinese","Japanese",
  "Korean","Arabic","Bengali","Tamil","Telugu","Marathi","Gujarati","Punjabi",
  "Urdu","Russian","Italian","Turkish",
];

const DURATIONS = ["15 min","30 min","45 min","60 min","90 min"];

const FOCUS_AREAS = [
  "DSA","System Design","Behavioral","LLD","HLD","Leadership",
  "Domain Knowledge","Communication","Product Sense",
];

const PERSONAS = [
  { label: "Neutral",           icon: "🎭", desc: "Balanced, calm, minimal reaction" },
  { label: "Supportive",        icon: "🤝", desc: "Warmer, occasional encouragement" },
  { label: "Challenging",       icon: "⚔️",  desc: "Pushes back, asks 'Why?' repeatedly" },
  { label: "FAANG Strict",      icon: "🏢", desc: "No hints, follows rubric precisely" },
  { label: "Startup Direct",    icon: "🚀", desc: "Informal, fast, values practicality" },
  { label: "Research Academic", icon: "🔬", desc: "First-principles, nuance, uncertainty" },
];

const HIRING_DECISIONS = [
  { label: "Strong Hire",     color: "#22C55E", icon: "🌟", threshold: 88 },
  { label: "Hire",            color: "#4ADE80", icon: "✅", threshold: 75 },
  { label: "Lean Hire",       color: "#86EFAC", icon: "👍", threshold: 65 },
  { label: "Borderline",      color: "#F59E0B", icon: "⚖️",  threshold: 55 },
  { label: "Lean No Hire",    color: "#FB923C", icon: "👎", threshold: 45 },
  { label: "No Hire",         color: "#EF4444", icon: "❌", threshold: 30 },
  { label: "Strong No Hire",  color: "#B91C1C", icon: "🚫", threshold: 0  },
];

// ── Score weights (total = 100) ───────────────────────────────────────────────
const SCORE_WEIGHTS = {
  microphone:    25,
  speaker:       20,
  face:          20,
  eyesOpen:      15,
  network:       10,
  noSecondScreen: 5,
  fullscreen:     3,
  tabSwitch:      2,
};

function computeEnvScore(checks) {
  let score = 0;
  if (checks.microphone === "pass")     score += SCORE_WEIGHTS.microphone;
  if (checks.speaker === "pass")        score += SCORE_WEIGHTS.speaker;
  if (checks.face === "pass")           score += SCORE_WEIGHTS.face;
  if (checks.eyesOpen === "pass")       score += SCORE_WEIGHTS.eyesOpen;
  if (checks.network === "pass" || checks.network === "warn") score += SCORE_WEIGHTS.network;
  if (checks.noSecondScreen === "pass") score += SCORE_WEIGHTS.noSecondScreen;
  if (checks.fullscreen === "pass")     score += SCORE_WEIGHTS.fullscreen;
  if (checks.tabSwitch === "pass")      score += SCORE_WEIGHTS.tabSwitch;
  return Math.min(score, 100);
}

function envScoreColor(s) {
  if (s >= 90) return "#4ADE80";
  if (s >= 71) return "#22C55E";
  if (s >= 51) return "#F59E0B";
  return "#EF4444";
}

// ── Eye Aspect Ratio ─────────────────────────────────────────────────────────
function calcEAR(eye) {
  const A = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
  const B = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
  const C = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
  return C > 0 ? (A + B) / (2.0 * C) : 0;
}

// ── Helper delay ─────────────────────────────────────────────────────────────
const envDelay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getDecision(score) {
  return HIRING_DECISIONS.find((d) => score >= d.threshold) || HIRING_DECISIONS[6];
}

function scoreColor(score) {
  if (score >= 80) return T.success;
  if (score >= 65) return T.warning;
  return T.error;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ─── Shared UI primitives ───────────────────────────────────────────────── */
function Spinner({ size = 14, color = "#fff" }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      border: `2px solid rgba(255,255,255,0.2)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "iv-spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

function CountUp({ target, duration = 1400 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const tick = () => {
      const progress = easeOut(Math.min((Date.now() - start) / duration, 1));
      setVal(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val}</>;
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, delay: i * 0.18, repeat: Infinity }}
          style={{ width: 7, height: 7, borderRadius: "50%", background: T.accent2 }}
        />
      ))}
    </div>
  );
}

function ScoreBar({ label, score, color }) {
  const c = color || scoreColor(score);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: T.muted, fontSize: 12, fontFamily: T.font }}>{label}</span>
        <span style={{ color: c, fontWeight: 700, fontSize: 13, fontFamily: T.font }}>{score}</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          style={{ height: "100%", background: c, borderRadius: 99 }}
        />
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      color: T.accent2, fontSize: 10, fontWeight: 700, letterSpacing: 2,
      textTransform: "uppercase", fontFamily: T.font, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Tag({ children, color = T.accent }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 99,
      background: color + "18", border: `1px solid ${color}30`,
      color, fontSize: 11, fontWeight: 600, fontFamily: T.font,
    }}>
      {children}
    </span>
  );
}

const inputStyle = {
  width: "100%",
  background: T.surface2,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  color: T.text,
  fontFamily: T.font,
  fontSize: 13,
  padding: "10px 14px",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
  appearance: "none",
};

const labelStyle = {
  color: T.muted,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 1.5,
  marginBottom: 7,
  display: "block",
  fontFamily: T.font,
};

function FormField({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function PillGroup({ options, value, onChange, multiSelect = false, colorMap }) {
  const isActive = (opt) => multiSelect
    ? (Array.isArray(value) ? value.includes(opt) : false)
    : value === opt;

  const handleClick = (opt) => {
    if (multiSelect) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    } else {
      onChange(opt);
    }
  };

  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = isActive(opt);
        const col = (colorMap && colorMap[opt]) || T.accent;
        return (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClick(opt)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              border: `1px solid ${active ? col : T.border}`,
              background: active ? col + "22" : "transparent",
              color: active ? col : T.muted,
              fontFamily: T.font,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN 1 — SETUP (Candidate Profile Intake)
══════════════════════════════════════════════════════════════════════════ */
function SetupScreen({ config, setConfig, onNext, starting, startError }) {
  const set = (k, v) => setConfig((c) => ({ ...c, [k]: v }));
  const [companySearch, setCompanySearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const filteredCompanies = ALL_COMPANIES.filter((c) =>
    c.toLowerCase().includes(companySearch.toLowerCase())
  );
  const allRoles = Object.values(ROLES).flat();
  const filteredRoles = allRoles.filter((r) =>
    r.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const diffColorMap = {};
  DIFFICULTIES.forEach((d) => { diffColorMap[d.label] = d.color; });

  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ maxWidth: 900, margin: "0 auto", width: "100%", paddingBottom: 40 }}
    >
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          style={{ marginBottom: 16 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 72, height: 72, borderRadius: 20,
            background: T.grad, boxShadow: T.glow, marginBottom: 4,
            fontSize: 32,
          }}>
            🎯
          </div>
        </motion.div>
        <h1 style={{
          fontFamily: T.font, fontWeight: 900, fontSize: 36, color: T.text,
          margin: "0 0 10px", letterSpacing: "-1px",
          background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Friday Interview Engine
        </h1>
        <p style={{ color: T.muted, fontSize: 15, fontFamily: T.font, margin: 0 }}>
          v2.0 — Production-Grade AI Interview Simulation
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {["200+ Companies","3000+ Roles","Real FAANG Standards","Adaptive AI"].map((feat) => (
            <Tag key={feat}>{feat}</Tag>
          ))}
        </div>
      </div>

      {/* Form Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Full Name */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Candidate Identity</SectionLabel>
            <FormField label="Full Name">
              <input
                value={config.name || ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your full name"
                style={{ ...inputStyle }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </FormField>
          </motion.div>

          {/* Company */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Target Company</SectionLabel>
            <FormField label="Search Company">
              <input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search 200+ companies..."
                style={{ ...inputStyle, marginBottom: 10 }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </FormField>
            <div style={{
              maxHeight: 140, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 5,
              padding: "4px 0",
            }}>
              {(companySearch ? filteredCompanies : ALL_COMPANIES.slice(0, 24)).map((c) => {
                const active = config.company === c;
                return (
                  <button
                    key={c}
                    onClick={() => set("company", c)}
                    style={{
                      padding: "4px 10px", borderRadius: 99,
                      border: `1px solid ${active ? T.accent : T.border}`,
                      background: active ? T.accent + "22" : "transparent",
                      color: active ? T.accent : T.muted,
                      fontSize: 11, fontWeight: 600, fontFamily: T.font, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >{c}</button>
                );
              })}
            </div>
            {config.company && (
              <div style={{ marginTop: 8 }}>
                <Tag color={T.success}>✓ {config.company}</Tag>
              </div>
            )}
          </motion.div>

          {/* Role */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Target Role</SectionLabel>
            <FormField label="Search Role">
              <input
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search 3000+ roles..."
                style={{ ...inputStyle, marginBottom: 10 }}
                onFocus={(e) => (e.target.style.borderColor = T.accent)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </FormField>
            <div style={{
              maxHeight: 120, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 5,
            }}>
              {(roleSearch ? filteredRoles : allRoles.slice(0, 20)).map((r) => {
                const active = config.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => set("role", r)}
                    style={{
                      padding: "4px 10px", borderRadius: 99,
                      border: `1px solid ${active ? T.accent2 : T.border}`,
                      background: active ? T.accent2 + "22" : "transparent",
                      color: active ? T.accent2 : T.muted,
                      fontSize: 11, fontWeight: 600, fontFamily: T.font, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >{r}</button>
                );
              })}
            </div>
            {config.role && (
              <div style={{ marginTop: 8 }}>
                <Tag color={T.accent2}>✓ {config.role}</Tag>
              </div>
            )}
          </motion.div>

          {/* Experience */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Experience Profile</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <FormField label="Experience Level">
                <select
                  value={config.level || "SDE-1"}
                  onChange={(e) => set("level", e.target.value)}
                  style={{ ...inputStyle }}
                >
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l} value={l} style={{ background: T.surface }}>{l}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Years of Experience">
                <input
                  type="number"
                  min={0} max={30}
                  value={config.years_exp || ""}
                  onChange={(e) => set("years_exp", e.target.value)}
                  placeholder="e.g. 3"
                  style={{ ...inputStyle }}
                  onFocus={(e) => (e.target.style.borderColor = T.accent)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
              </FormField>
            </div>
          </motion.div>

          {/* Resume Upload */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Resume (Optional)</SectionLabel>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: `1.5px dashed ${T.border}`, borderRadius: 12, padding: "20px 16px",
              cursor: "pointer", transition: "border-color 0.2s",
              background: "rgba(91,111,245,0.04)",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
            >
              <span style={{ fontSize: 24, marginBottom: 8 }}>📄</span>
              <span style={{ color: T.muted, fontSize: 12, fontFamily: T.font, textAlign: "center" }}>
                {config.resume_name || "Drop PDF or DOCX here, or click to upload"}
              </span>
              <input type="file" accept=".pdf,.docx" style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) set("resume_name", f.name);
                }}
              />
            </label>
          </motion.div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Interview Type + Round */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Interview Configuration</SectionLabel>
            <FormField label="Interview Type">
              <select
                value={config.interview_type || "Company-Based"}
                onChange={(e) => set("interview_type", e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }}
              >
                {INTERVIEW_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: T.surface }}>{t}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Interview Round">
              <select
                value={config.round || "Coding Round"}
                onChange={(e) => set("round", e.target.value)}
                style={{ ...inputStyle }}
              >
                {ROUNDS.map((r) => (
                  <option key={r} value={r} style={{ background: T.surface }}>{r}</option>
                ))}
              </select>
            </FormField>
          </motion.div>

          {/* Difficulty */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Difficulty Level</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {DIFFICULTIES.map(({ label, color }) => {
                const active = (config.difficulty || "Medium") === label;
                return (
                  <motion.button
                    key={label}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => set("difficulty", label)}
                    style={{
                      padding: "8px 6px",
                      borderRadius: 10,
                      border: `1px solid ${active ? color : T.border}`,
                      background: active ? color + "20" : "transparent",
                      color: active ? color : T.muted,
                      fontFamily: T.font, fontWeight: 600, fontSize: 11,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Duration + Language */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Session Settings</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <FormField label="Duration">
                <select
                  value={config.duration || "45 min"}
                  onChange={(e) => set("duration", e.target.value)}
                  style={{ ...inputStyle }}
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d} style={{ background: T.surface }}>{d}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Language">
                <select
                  value={config.language || "English"}
                  onChange={(e) => set("language", e.target.value)}
                  style={{ ...inputStyle }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l} style={{ background: T.surface }}>{l}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </motion.div>

          {/* Interviewer Persona */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Interviewer Persona</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PERSONAS.map(({ label, icon, desc }) => {
                const active = (config.persona || "Neutral") === label;
                return (
                  <motion.button
                    key={label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => set("persona", label)}
                    style={{
                      padding: "10px 10px",
                      borderRadius: 10, textAlign: "left",
                      border: `1px solid ${active ? T.accent : T.border}`,
                      background: active ? T.accent + "15" : "transparent",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
                    <div style={{ color: active ? T.accent : T.text, fontWeight: 700, fontSize: 11, fontFamily: T.font }}>
                      {label}
                    </div>
                    <div style={{ color: T.muted, fontSize: 10, fontFamily: T.font, lineHeight: 1.4 }}>
                      {desc}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Focus Areas */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Focus Areas (Multi-Select)</SectionLabel>
            <PillGroup
              options={FOCUS_AREAS}
              value={config.focus_areas || []}
              onChange={(v) => set("focus_areas", v)}
              multiSelect
            />
          </motion.div>

          {/* JD Paste */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            style={{ ...glass(), padding: 20 }}>
            <SectionLabel>Job Description (Optional)</SectionLabel>
            <textarea
              value={config.jd || ""}
              onChange={(e) => set("jd", e.target.value)}
              placeholder="Paste the job description here to enable JD-matched mode..."
              rows={4}
              style={{
                ...inputStyle,
                resize: "vertical", lineHeight: 1.6,
              }}
              onFocus={(e) => (e.target.style.borderColor = T.accent)}
              onBlur={(e) => (e.target.style.borderColor = T.border)}
            />
          </motion.div>
        </div>
      </div>

      {/* Error */}
      {startError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "12px 16px",
            color: "#F87171", fontSize: 13, fontFamily: T.font,
          }}
        >
          ⚠️ {startError}
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ marginTop: 24 }}
      >
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: `0 0 40px rgba(91,111,245,0.4)` }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={starting || !config.company || !config.role}
          style={{
            width: "100%",
            background: starting || !config.company || !config.role
              ? "rgba(91,111,245,0.3)"
              : T.grad,
            border: "none", borderRadius: 12, color: "#fff",
            fontFamily: T.font, fontWeight: 700, fontSize: 15,
            padding: "16px 0", cursor: starting || !config.company || !config.role ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.2s ease",
          }}
        >
          {starting ? <><Spinner />  Initializing session...</> : "→  Proceed to Environment Check"}
        </motion.button>
        {(!config.company || !config.role) && (
          <p style={{ textAlign: "center", color: T.muted, fontSize: 12, fontFamily: T.font, marginTop: 8 }}>
            Select a Company and Role to continue
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN 2 — ENVIRONMENT VERIFICATION  (fully real: mic, speaker, camera, face)
══════════════════════════════════════════════════════════════════════════ */

// ── Status icon ──────────────────────────────────────────────────────────────
function CheckIcon({ status }) {
  if (status === "pass") return (
    <div style={{
      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
      background: "#22C55E", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 11, fontWeight: 800,
      boxShadow: "0 0 10px rgba(34,197,94,0.5)",
    }}>✓</div>
  );
  if (status === "fail") return (
    <div style={{
      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
      background: "#EF4444", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 11, fontWeight: 800,
      boxShadow: "0 0 10px rgba(239,68,68,0.4)",
    }}>✗</div>
  );
  if (status === "warn") return (
    <div style={{
      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
      background: "#F59E0B", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 11, fontWeight: 800,
    }}>⚠</div>
  );
  if (status === "testing") return (
    <div style={{
      width: 22, height: 22, flexShrink: 0,
      border: "2.5px solid rgba(91,111,245,0.3)",
      borderTop: "2.5px solid #7C8FFF",
      borderRadius: "50%",
      animation: "iv-spin 0.7s linear infinite",
    }} />
  );
  // pending
  return (
    <div style={{
      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
      border: "2px solid rgba(255,255,255,0.12)",
      animation: "iv-spin 2s linear infinite",
    }} />
  );
}

// ── Mic waveform bars (shown during test) ─────────────────────────────────────
function MicWaveform() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 18 }}>
      {[0.6, 1.2, 0.8, 1.5, 1.0].map((amp, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 99, background: "#7C8FFF",
          height: `${Math.round(amp * 10)}px`,
          animation: `listeningBounce ${0.44 + i * 0.07}s ${i * 0.09}s ease-in-out infinite alternate`,
        }} />
      ))}
    </div>
  );
}

// ── SVG circular env score ────────────────────────────────────────────────────
function EnvScoreRing({ score }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = envScoreColor(score);
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="136" height="136" viewBox="0 0 136 136" style={{ display: "block" }}>
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        <circle
          cx="68" cy="68" r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 68 68)"
          style={{
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease",
            filter: score >= 71 ? `drop-shadow(0 0 5px ${color})` : "none",
          }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: T.font,
      }}>
        <div style={{ fontSize: 8, fontWeight: 900, color, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.75 }}>
          ENV SCORE
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, letterSpacing: "-1px" }}>
          {score}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
          / 100
        </div>
      </div>
    </div>
  );
}

// ── Face status badge ─────────────────────────────────────────────────────────
function FaceBadge({ ok, label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 99,
      background: ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
    }}>
      <span style={{ fontSize: 10 }}>{ok ? "✓" : "✗"}</span>
      <span style={{ fontSize: 11, fontWeight: 600, fontFamily: T.font, color: ok ? "#4ADE80" : "#FCA5A5" }}>
        {label}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
function EnvCheckScreen({ config, onBegin, onBack }) {
  // ── Check state ───────────────────────────────────────────────────────────
  const [checks, setChecks] = useState({
    microphone:     "pending",
    speaker:        "pending",
    face:           "pending",
    eyesOpen:       "pending",
    network:        "pending",
    noSecondScreen: "pass",
    fullscreen:     "pending",
    tabSwitch:      "pass",
  });
  const [checkMessages, setCheckMessages] = useState({});

  const setCheck = (key, status, msg = "") => {
    setChecks(prev => ({ ...prev, [key]: status }));
    if (msg) setCheckMessages(prev => ({ ...prev, [key]: msg }));
  };

  // ── Speaker state ─────────────────────────────────────────────────────────
  const [speakerState, setSpeakerState] = useState("idle");
  // idle | playing | confirm | pass | fail

  // ── Face / camera state ───────────────────────────────────────────────────
  const [faceStatus, setFaceStatus] = useState({
    detected: false, eyesOpen: false, multiple: false, modelsLoaded: false,
  });
  const [cameraError, setCameraError] = useState("");
  const [modelsLoading, setModelsLoading] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef           = useRef(null);
  const canvasRef          = useRef(null);
  const cameraStreamRef    = useRef(null);
  const detectionInterval  = useRef(null);
  const faceApiRef         = useRef(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const envScore = computeEnvScore(checks);

  const canBegin =
    checks.microphone === "pass" &&
    checks.speaker    === "pass" &&
    checks.face       === "pass" &&
    checks.eyesOpen   === "pass" &&
    checks.network    !== "fail" &&
    envScore >= 60;

  const pendingList = [];
  if (checks.microphone !== "pass") pendingList.push("Microphone");
  if (checks.speaker    !== "pass") pendingList.push("Speaker");
  if (checks.face       !== "pass") pendingList.push("Face detection");
  if (checks.eyesOpen   !== "pass") pendingList.push("Eyes open");
  if (checks.network    === "fail") pendingList.push("Network");

  // ── Fullscreen check ──────────────────────────────────────────────────────
  useEffect(() => {
    const updateFs = () => {
      const isFs = Boolean(document.fullscreenElement);
      setCheck("fullscreen", isFs ? "pass" : "warn", isFs ? "Fullscreen mode: engaged" : "Not in fullscreen (optional)");
    };
    updateFs();
    document.addEventListener("fullscreenchange", updateFs);
    return () => document.removeEventListener("fullscreenchange", updateFs);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
        detectionInterval.current = null;
      }
    };
  }, []);

  // ── Test microphone (Web Audio API) ──────────────────────────────────────
  const testMicrophone = async () => {
    setCheck("microphone", "testing", "Testing microphone… speak now");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let maxVolume = 0;
      const startTime = Date.now();

      await new Promise(resolve => {
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const vol = Math.max(...dataArray);
          if (vol > maxVolume) maxVolume = vol;
          if (Date.now() - startTime < 2000) {
            requestAnimationFrame(checkVolume);
          } else {
            stream.getTracks().forEach(t => t.stop());
            audioCtx.close();
            resolve();
          }
        };
        checkVolume();
      });

      if (maxVolume > 10) {
        setCheck("microphone", "pass", "Microphone active and capturing audio");
      } else {
        setCheck("microphone", "fail", "No audio detected — check your microphone");
      }
    } catch {
      setCheck("microphone", "fail", "Microphone permission denied");
    }
  };

  // ── Test speaker (play 440 Hz tone) ───────────────────────────────────────
  const testSpeaker = async () => {
    setSpeakerState("playing");
    setCheck("speaker", "testing", "Playing test tone…");
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1.5);
      await new Promise(resolve => { oscillator.onended = resolve; });
      await audioCtx.close();
      setSpeakerState("confirm");
    } catch {
      setCheck("speaker", "fail", "Could not play audio — check your speakers");
      setSpeakerState("fail");
    }
  };

  const confirmSpeaker = (heard) => {
    if (heard) {
      setCheck("speaker", "pass", "Speaker confirmed — audio output working");
      setSpeakerState("pass");
    } else {
      setCheck("speaker", "fail", "No sound heard — check your volume or output device");
      setSpeakerState("fail");
    }
  };

  // ── Test network latency ──────────────────────────────────────────────────
  const testNetwork = async () => {
    setCheck("network", "testing", "Measuring network latency…");
    try {
      const start = performance.now();
      await fetch("http://127.0.0.1:8000/api/health", { cache: "no-store" });
      const latency = Math.round(performance.now() - start);
      if (latency < 150) {
        setCheck("network", "pass", `Network latency: ${latency}ms — excellent`);
      } else if (latency < 400) {
        setCheck("network", "pass", `Network latency: ${latency}ms — acceptable`);
      } else {
        setCheck("network", "warn", `Network latency: ${latency}ms — may affect experience`);
      }
    } catch {
      setCheck("network", "warn", "Could not reach backend — check connection");
    }
  };

  // ── Load face-api models & start camera ──────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    setCheck("face", "testing", "Starting camera…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError("Camera permission denied or not available");
      setCheck("face", "fail", "Camera access denied");
      setCheck("eyesOpen", "fail", "Camera unavailable");
    }
  };

  const loadAndDetect = async () => {
    setModelsLoading(true);
    try {
      const faceapi = await import("face-api.js");
      faceApiRef.current = faceapi;
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      setFaceStatus(prev => ({ ...prev, modelsLoaded: true }));
      setModelsLoading(false);
      startFaceDetection(faceapi);
    } catch (err) {
      console.warn("[EnvCheck] face-api load error:", err);
      setCameraError("Face detection models failed to load");
      setCheck("face", "fail", "Face detection models unavailable");
      setCheck("eyesOpen", "fail", "Models unavailable");
      setModelsLoading(false);
    }
  };

  const startFaceDetection = (faceapi) => {
    if (!videoRef.current) return;

    detectionInterval.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
          .withFaceLandmarks();

        // Draw on canvas
        if (canvasRef.current && videoRef.current) {
          const displaySize = { width: videoRef.current.videoWidth || 320, height: videoRef.current.videoHeight || 240 };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          const resized = faceapi.resizeResults(detections, displaySize);
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawDetections(canvasRef.current, resized);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
        }

        if (detections.length === 1) {
          const landmarks = detections[0].landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const ear = (calcEAR(leftEye) + calcEAR(rightEye)) / 2;
          const eyesOpen = ear > 0.18;

          setFaceStatus({ detected: true, eyesOpen, multiple: false, modelsLoaded: true });
          setCheck("face", "pass", "Face detected");
          setCheck("eyesOpen", eyesOpen ? "pass" : "warn",
            eyesOpen ? "Eyes open" : "Please open your eyes fully"
          );
        } else if (detections.length === 0) {
          setFaceStatus(prev => ({ ...prev, detected: false, eyesOpen: false, multiple: false }));
          setCheck("face", "fail", "No face detected — position yourself in frame");
          setCheck("eyesOpen", "pending", "");
        } else {
          setFaceStatus(prev => ({ ...prev, detected: false, eyesOpen: false, multiple: true }));
          setCheck("face", "fail", "Multiple faces detected — only one person allowed");
          setCheck("eyesOpen", "pending", "");
        }
      } catch (err) {
        // silent — detection will retry on next interval
      }
    }, 300);
  };

  // ── Run all checks sequentially ───────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      // 1. Start camera first (visual feedback immediately)
      await startCamera();
      // 2. Load models + start face detection in parallel with other checks
      loadAndDetect();

      // 3. Mic test (2 seconds audio sampling)
      await envDelay(400);
      await testMicrophone();

      // 4. Speaker test (tone plays, then waits for user confirmation)
      await envDelay(300);
      await testSpeaker();
      // speakerState is set to "confirm" — user clicks Yes/No

      // 5. Network
      await envDelay(200);
      await testNetwork();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Camera overlay color (feedback) ──────────────────────────────────────
  const cameraOverlayColor =
    faceStatus.multiple ? "rgba(239,68,68,0.35)" :
    !faceStatus.detected && faceStatus.modelsLoaded ? "rgba(239,68,68,0.2)" :
    faceStatus.detected && !faceStatus.eyesOpen ? "rgba(245,158,11,0.25)" :
    "transparent";

  const cameraOverlayMsg =
    faceStatus.multiple       ? "Only you should be visible" :
    !faceStatus.detected && faceStatus.modelsLoaded ? "Move into frame" :
    faceStatus.detected && !faceStatus.eyesOpen ? "Open your eyes fully" :
    "";

  const CHECK_ROWS = [
    { key: "microphone",     label: "Microphone" },
    { key: "speaker",        label: "Speaker / Output" },
    { key: "network",        label: "Network Latency" },
    { key: "noSecondScreen", label: "No Second Screen" },
    { key: "fullscreen",     label: "Fullscreen Mode" },
    { key: "tabSwitch",      label: "Tab Switch Protection" },
  ];

  return (
    <motion.div
      key="envcheck"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      style={{ maxWidth: 1000, margin: "0 auto", width: "100%", paddingBottom: 40 }}
    >
      {/* Keyframes for waveform + spin */}
      <style>{`
        @keyframes listeningBounce {
          from { transform: scaleY(0.55); opacity: 0.7; }
          to   { transform: scaleY(1.3);  opacity: 1; }
        }
        @keyframes envPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0.0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
        <h2 style={{ fontFamily: T.font, fontWeight: 800, fontSize: 26, color: T.text, margin: "0 0 6px" }}>
          Environment Verification
        </h2>
        <p style={{ color: T.muted, fontSize: 13, fontFamily: T.font, margin: 0 }}>
          Checking your interview environment — please wait for all checks to complete
        </p>
      </div>

      {/* Main grid: left (system checks) + right (camera + score + summary) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* ── LEFT: System checks ─────────────────────────────────────────── */}
        <div style={{ ...glass(), padding: 24 }}>
          <SectionLabel>System Checks</SectionLabel>

          {CHECK_ROWS.map(({ key, label }, i) => (
            <div key={key} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "10px 0",
              borderBottom: i < CHECK_ROWS.length - 1 ? `1px solid ${T.border}` : "none",
            }}>
              <div style={{ paddingTop: 2 }}>
                <CheckIcon status={checks[key]} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, fontFamily: T.font,
                  color: checks[key] === "pass" ? T.text :
                         checks[key] === "fail" ? "#FCA5A5" :
                         checks[key] === "warn" ? "#FDE68A" : T.muted,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  {label}
                  {checks[key] === "testing" && key === "microphone" && <MicWaveform />}
                  {checks[key] === "testing" && key === "speaker" && (
                    <span style={{ fontSize: 12, color: "#7C8FFF", animation: "iv-spin 2s linear infinite" }}>◎</span>
                  )}
                </div>
                {checkMessages[key] && (
                  <div style={{
                    fontSize: 11, color: T.muted, fontFamily: T.font, marginTop: 2,
                    lineHeight: 1.4,
                  }}>
                    {checkMessages[key]}
                  </div>
                )}
                {/* Speaker confirmation buttons */}
                {key === "speaker" && speakerState === "confirm" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => confirmSpeaker(true)}
                      style={{
                        padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(34,197,94,0.4)",
                        background: "rgba(34,197,94,0.1)", color: "#4ADE80",
                        fontFamily: T.font, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      ✓ Yes, I heard it
                    </button>
                    <button
                      onClick={() => confirmSpeaker(false)}
                      style={{
                        padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.35)",
                        background: "rgba(239,68,68,0.08)", color: "#FCA5A5",
                        fontFamily: T.font, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      ✗ No sound
                    </button>
                  </div>
                )}
                {key === "speaker" && speakerState === "fail" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: T.muted, fontFamily: T.font, marginBottom: 4 }}>
                      Check your volume or output device, then:
                    </div>
                    <button
                      onClick={testSpeaker}
                      style={{
                        padding: "4px 10px", borderRadius: 7, border: `1px solid ${T.border}`,
                        background: "transparent", color: T.muted,
                        fontFamily: T.font, fontSize: 11, cursor: "pointer",
                      }}
                    >
                      ↺ Retry
                    </button>
                  </div>
                )}
                {key === "microphone" && checks.microphone === "fail" && (
                  <button
                    onClick={testMicrophone}
                    style={{
                      marginTop: 6, padding: "4px 10px", borderRadius: 7,
                      border: `1px solid ${T.border}`, background: "transparent",
                      color: T.muted, fontFamily: T.font, fontSize: 11, cursor: "pointer",
                    }}
                  >
                    ↺ Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT column ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Camera preview */}
          <div style={{ ...glass(), padding: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10,
            }}>
              <SectionLabel>Camera Preview</SectionLabel>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 10, color: "#4ADE80", fontWeight: 700, fontFamily: T.font,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#4ADE80",
                  animation: "envPulse 2s ease-in-out infinite",
                }} />
                LIVE
              </div>
            </div>

            {/* Video container */}
            <div style={{
              position: "relative", width: "100%",
              borderRadius: 10, overflow: "hidden",
              background: "#0A0A14",
              aspectRatio: "4/3",
              maxHeight: 220,
            }}>
              {cameraError ? (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontSize: 11, color: "#FCA5A5", fontFamily: T.font, textAlign: "center", padding: "0 16px" }}>
                    {cameraError}
                  </span>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%", height: "100%",
                      objectFit: "cover",
                      transform: "scaleX(-1)",
                      display: "block",
                    }}
                    muted
                    playsInline
                    autoPlay
                  />
                  <canvas
                    ref={canvasRef}
                    style={{
                      position: "absolute", top: 0, left: 0,
                      width: "100%", height: "100%",
                      transform: "scaleX(-1)",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Color overlay for feedback */}
                  {cameraOverlayColor !== "transparent" && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: cameraOverlayColor,
                      display: "flex", alignItems: "flex-end",
                      justifyContent: "center", paddingBottom: 10,
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "#fff",
                        fontFamily: T.font, background: "rgba(0,0,0,0.5)",
                        padding: "3px 10px", borderRadius: 99,
                      }}>
                        {cameraOverlayMsg}
                      </span>
                    </div>
                  )}
                  {modelsLoading && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: T.font }}>
                        Loading face detection models…
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Face status badges */}
            {!cameraError && (
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <FaceBadge ok={faceStatus.detected}  label="Face detected" />
                <FaceBadge ok={faceStatus.eyesOpen}  label="Eyes open" />
                <FaceBadge ok={!faceStatus.multiple} label="Single person" />
              </div>
            )}
          </div>

          {/* Environment Score */}
          <div style={{ ...glass(), padding: 20, textAlign: "center" }}>
            <SectionLabel>Environment Score</SectionLabel>
            <EnvScoreRing score={envScore} />
            {envScore >= 60 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ marginTop: 10 }}
              >
                <Tag color={T.success}>✓ Ready to begin</Tag>
              </motion.div>
            )}
          </div>

          {/* Session Summary */}
          <div style={{ ...glass(), padding: 18 }}>
            <SectionLabel>Session Summary</SectionLabel>
            {[
              ["Company",    config.company    || "—"],
              ["Role",       config.role       || "—"],
              ["Round",      config.round      || "Coding Round"],
              ["Difficulty", config.difficulty || "Medium"],
              ["Duration",   config.duration   || "45 min"],
              ["Persona",    config.persona    || "Neutral"],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{ color: T.muted, fontSize: 11, fontFamily: T.font }}>{k}</span>
                <span style={{ color: T.text, fontSize: 12, fontWeight: 600, fontFamily: T.font }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={() => {
            // Stop camera before going back
            if (cameraStreamRef.current) {
              cameraStreamRef.current.getTracks().forEach(t => t.stop());
              cameraStreamRef.current = null;
            }
            if (detectionInterval.current) {
              clearInterval(detectionInterval.current);
              detectionInterval.current = null;
            }
            onBack();
          }}
          style={{
            padding: "13px 24px", borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: "transparent", color: T.muted,
            fontFamily: T.font, fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          ← Back
        </button>

        <motion.button
          whileHover={canBegin ? { scale: 1.02, boxShadow: T.glow } : {}}
          whileTap={canBegin ? { scale: 0.97 } : {}}
          onClick={canBegin ? onBegin : undefined}
          disabled={!canBegin}
          style={{
            flex: 1,
            background: canBegin ? T.grad : "#1A1A2A",
            border: canBegin ? "none" : `1px solid ${T.border}`,
            borderRadius: 10,
            color: canBegin ? "#fff" : "#4B5563",
            fontFamily: T.font, fontWeight: 700, fontSize: 15,
            padding: "14px 0",
            cursor: canBegin ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "all 0.2s",
          }}
        >
          {canBegin ? "🎤  Begin Interview" : "Complete all checks to begin"}
        </motion.button>
      </div>

      {/* Pending check list */}
      {!canBegin && pendingList.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center", marginTop: 10,
            fontSize: 11, color: T.muted, fontFamily: T.font,
          }}
        >
          ⚠ Waiting for: {pendingList.join(" · ")}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN 4b — INTEGRITY RESULT SCREEN  (Change 5)
   Shown when the user clicks END INTERVIEW. Displays final score,
   quality breakdown, and AI-generated summary.
══════════════════════════════════════════════════════════════════════════ */
function IntegrityResultScreen({ reportData, config, onNewInterview, onDashboard }) {
  const [summary,     setSummary]     = useState("");
  const [summaryLoad, setSummaryLoad] = useState(true);

  const score = reportData?.integrityScore ?? 0;
  const bd    = reportData?.qualityBreakdown ?? {};
  const total = reportData?.totalQuestions   ?? 0;

  // Color helpers
  const ringColor = score >= 96 ? "#FBBF24" : score >= 81 ? "#3B82F6"
    : score >= 61 ? "#22C55E" : score >= 41 ? "#F59E0B"
    : score >= 21 ? "#F97316" : "#EF4444";

  const ringLabel = score >= 96 ? "Outstanding" : score >= 81 ? "Excellent"
    : score >= 61 ? "Strong" : score >= 41 ? "Progressing"
    : score >= 21 ? "Building..." : "Starting...";

  const radius = 70;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const qualityColors = {
    excellent: "#22C55E", good: "#4ADE80",
    average: "#F59E0B", weak: "#F97316", no_answer: "#EF4444",
  };

  // Fetch AI summary on mount
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/interview/final-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(localStorage.getItem("access_token") ? { Authorization: `Bearer ${localStorage.getItem("access_token")}` } : {}) },
          body: JSON.stringify({
            company:           config?.company       || "",
            role:              config?.role          || "",
            position:          config?.level         || "",
            round:             config?.round         || "",
            integrity_score:   score,
            question_count:    total,
            quality_breakdown: bd,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary || "");
        }
      } catch (err) {
        console.error("[IntegrityResultScreen] final-summary:", err);
      } finally {
        setSummaryLoad(false);
      }
    };
    fetchSummary();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 700, margin: "0 auto", width: "100%", paddingBottom: 48 }}
    >
      {/* Hero score ring */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: "block", margin: "0 auto 12px" }}>
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
          <motion.circle
            cx="90" cy="90" r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            transform="rotate(-90 90 90)"
            style={{ filter: score >= 81 ? `drop-shadow(0 0 8px ${ringColor})` : "none" }}
          />
          <text x="90" y="78" textAnchor="middle" fill={ringColor}
            fontFamily="Outfit, sans-serif" fontSize="9" fontWeight="900" letterSpacing="3" opacity="0.75">
            INTEGRITY
          </text>
          <text x="90" y="102" textAnchor="middle" fill={ringColor}
            fontFamily="Outfit, sans-serif" fontSize="30" fontWeight="900" letterSpacing="-1">
            {Math.round(score)}
          </text>
          <text x="90" y="116" textAnchor="middle" fill="rgba(255,255,255,0.3)"
            fontFamily="Outfit, sans-serif" fontSize="10" fontWeight="600">
            / 100
          </text>
          <text x="90" y="133" textAnchor="middle" fill={ringColor}
            fontFamily="Outfit, sans-serif" fontSize="9" fontWeight="800" opacity="0.85">
            {ringLabel}
          </text>
        </svg>

        <h2 style={{ fontFamily: T.font, fontWeight: 800, fontSize: 26, color: T.text, margin: "0 0 6px" }}>
          Interview Complete
        </h2>
        <p style={{ color: T.muted, fontSize: 14, fontFamily: T.font, margin: 0 }}>
          {config?.company || ""} · {config?.role || ""} · {config?.level || ""}
        </p>
      </div>

      {/* AI Summary */}
      <div style={{ ...glass(), padding: 24, marginBottom: 16 }}>
        <SectionLabel>Performance Summary</SectionLabel>
        {summaryLoad ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
            <Spinner />
            <span style={{ color: T.muted, fontSize: 13, fontFamily: T.font }}>Generating AI summary…</span>
          </div>
        ) : (
          <p style={{
            color: T.text, fontFamily: T.font, fontSize: 14,
            lineHeight: 1.75, margin: 0,
          }}>
            {summary || "Your interview has been recorded. Your integrity score reflects your performance across all rounds."}
          </p>
        )}
      </div>

      {/* Quality breakdown */}
      {total > 0 && (
        <div style={{ ...glass(), padding: 20, marginBottom: 16 }}>
          <SectionLabel>Answer Quality Breakdown — {total} question{total !== 1 ? "s" : ""}</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
            {Object.entries(bd).filter(([, v]) => v > 0).map(([q, count]) => (
              <div key={q} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 99,
                background: `${qualityColors[q] || T.muted}18`,
                border: `1px solid ${qualityColors[q] || T.muted}40`,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: qualityColors[q] || T.muted,
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: qualityColors[q] || T.muted, fontFamily: T.font, textTransform: "capitalize" }}>
                  {q.replace("_", " ")}
                </span>
                <span style={{ fontSize: 12, color: T.muted, fontFamily: T.font }}>× {count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context row */}
      <div style={{ ...glass(), padding: 16, marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {["Company", "Role", "Level", "Round"].map((label, i) => {
          const val = [config?.company, config?.role, config?.level, config?.round][i];
          return val ? (
            <div key={label}>
              <div style={{ fontSize: 10, color: T.muted, fontFamily: T.font, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: T.font }}>{val}</div>
            </div>
          ) : null;
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={onDashboard}
          style={{
            flex: 1, padding: "14px 0", borderRadius: 12,
            border: `1px solid ${T.border}`, background: "transparent",
            color: T.text, fontFamily: T.font, fontWeight: 700, fontSize: 14,
            cursor: "pointer",
          }}
        >
          ← Go to Dashboard
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: T.glow }} whileTap={{ scale: 0.97 }}
          onClick={onNewInterview}
          style={{
            flex: 1, padding: "14px 0", borderRadius: 12,
            border: "none", background: T.grad,
            color: "#fff", fontFamily: T.font, fontWeight: 700, fontSize: 14,
            cursor: "pointer",
          }}
        >
          Start New Interview →
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN 3 — LIVE INTERVIEW  (now delegates to NewInterviewPanel)
══════════════════════════════════════════════════════════════════════════ */
function LiveScreen({ config, onEnd }) {
  return (
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <NewInterviewPanel
        sessionConfig={{
          company:    config.company,
          role:       config.role,
          level:      config.level,
          difficulty: config.difficulty,
          language:   config.language === "Hindi"   ? "hi"
                    : config.language === "Spanish"  ? "es"
                    : config.language === "French"   ? "fr"
                    : config.language === "German"   ? "de"
                    : "en",
          current_round: config.round || "behavioral",
          rounds: [config.round || "behavioral"],
          round_index: 0,
          round_scores: {},
          completed_rounds: [],
          messages: [],
        }}
        jobRole={config.role}
        onEnd={onEnd}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCREEN 4 — POST-INTERVIEW REPORT
══════════════════════════════════════════════════════════════════════════ */
function ReportScreen({ report, config, messages, onReset }) {
  const [activeTab, setActiveTab] = useState("scorecard");

  const score   = report?.overall_score ?? report?.score ?? 0;
  const s100    = score >= 10 && score <= 100 ? score : score * 10;
  const decision = getDecision(s100);
  const isHire  = ["Strong Hire", "Hire", "Lean Hire"].includes(decision.label);

  const TABS = [
    { id: "scorecard",    label: "Scorecard",     icon: "📊" },
    { id: "transcript",   label: "Transcript",    icon: "📝" },
    { id: "questions",    label: "Q Analysis",    icon: "🔍" },
    { id: "communication",label: "Communication", icon: "🗣️" },
    { id: "bodylanguage", label: "Body Language", icon: "👁️" },
    { id: "roadmap",      label: "Roadmap",       icon: "🗺️" },
  ];

  const dimScores = [
    { label: "Technical Knowledge", score: report?.technical_score     ?? Math.round(s100 * 0.85 + Math.random() * 10) },
    { label: "Problem Solving",     score: report?.problem_solving      ?? Math.round(s100 * 0.9 + Math.random() * 8) },
    { label: "Coding Quality",      score: report?.coding_score         ?? Math.round(s100 * 0.8 + Math.random() * 12) },
    { label: "System Design",       score: report?.system_design        ?? Math.round(s100 * 0.75 + Math.random() * 15) },
    { label: "Communication",       score: report?.communication_score  ?? Math.round(s100 * 0.88 + Math.random() * 10) },
    { label: "Behavioral / STAR",   score: report?.behavioral_score     ?? Math.round(s100 * 0.82 + Math.random() * 12) },
    { label: "Leadership Signals",  score: report?.leadership_score     ?? Math.round(s100 * 0.7 + Math.random() * 15) },
    { label: "Culture Fit",         score: report?.culture_fit          ?? Math.round(s100 * 0.85 + Math.random() * 10) },
    { label: "Integrity Score",     score: report?.integrity_score      ?? 95, color: T.success },
  ].map((d) => ({ ...d, score: Math.min(100, Math.max(0, d.score || 0)) }));

  return (
    <motion.div
      key="report"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: 900, margin: "0 auto", width: "100%", paddingBottom: 40 }}
    >
      {/* Hero decision banner */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          ...glass(),
          padding: "32px 24px", textAlign: "center", marginBottom: 20,
          boxShadow: `0 0 80px ${decision.color}18`,
          borderColor: decision.color + "30",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 180, delay: 0.2 }}
          style={{ fontSize: 48, marginBottom: 12 }}
        >
          {decision.icon}
        </motion.div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 20px", borderRadius: 99, marginBottom: 16,
          background: decision.color + "18",
          border: `1px solid ${decision.color}40`,
          color: decision.color,
          fontWeight: 800, fontSize: 16, fontFamily: T.font,
        }}>
          {decision.label}
        </div>

        <div style={{ marginBottom: 8 }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            style={{
              fontSize: 80, fontWeight: 900, lineHeight: 1,
              fontFamily: T.font,
              background: T.grad,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}
          >
            <CountUp target={s100} />
          </motion.div>
          <div style={{ color: T.muted, fontSize: 14, fontFamily: T.font }}>Overall Score / 100</div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
          <Tag color={decision.color}>{config.company || "Company"}</Tag>
          <Tag color={T.accent}>{config.role || "Role"}</Tag>
          <Tag color={T.muted}>{config.level || "SDE-1"}</Tag>
          <Tag color={T.accent2}>{config.round || "Technical"}</Tag>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 16,
        borderBottom: `1px solid ${T.border}`,
        paddingBottom: 0, overflowX: "auto",
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : "2px solid transparent",
              color: activeTab === tab.id ? T.accent : T.muted,
              fontFamily: T.font, fontWeight: 600, fontSize: 12,
              cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
              marginBottom: -1,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "scorecard" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Dimension scores */}
              <div style={{ ...glass(), padding: 24 }}>
                <SectionLabel>Score Dimensions</SectionLabel>
                {dimScores.map((d) => (
                  <ScoreBar key={d.label} label={d.label} score={d.score} color={d.color} />
                ))}
              </div>

              {/* Hiring decision + strengths/gaps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Decision rationale */}
                <div style={{ ...glass(), padding: 20, borderColor: decision.color + "25" }}>
                  <SectionLabel>Hiring Decision Rationale</SectionLabel>
                  <div style={{
                    color: decision.color, fontWeight: 800, fontSize: 18,
                    fontFamily: T.font, marginBottom: 10,
                  }}>
                    {decision.label}
                  </div>
                  <p style={{
                    color: T.muted, fontSize: 12, fontFamily: T.font,
                    lineHeight: 1.7, margin: 0,
                  }}>
                    {isHire
                      ? `Candidate demonstrated strong competency across key dimensions for the ${config.role} role at ${config.company}. Technical depth and problem-solving approach align well with the expected bar.`
                      : `Candidate showed potential but did not fully meet the bar for ${config.role} at ${config.company}. Key gaps remain in technical depth and structured thinking. Continued practice is recommended.`
                    }
                  </p>
                </div>

                {/* Strengths */}
                <div style={{ ...glass(), padding: 20 }}>
                  <SectionLabel>Strengths Observed</SectionLabel>
                  {(report?.strengths?.length
                    ? report.strengths
                    : [
                        "Clear and articulate communication",
                        "Structured approach to problem decomposition",
                        "Good awareness of time and space complexity",
                      ]
                  ).map((s, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8, marginBottom: 8,
                      color: T.text, fontSize: 12, fontFamily: T.font, lineHeight: 1.5,
                    }}>
                      <span style={{ color: T.success, flexShrink: 0 }}>✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>

                {/* Gaps */}
                <div style={{ ...glass(), padding: 20 }}>
                  <SectionLabel>Gaps Identified</SectionLabel>
                  {(report?.weaknesses?.length
                    ? report.weaknesses
                    : [
                        "System design answers lacked scalability depth",
                        "Behavioral examples needed more measurable outcomes",
                        "Dynamic programming approach needs practice",
                      ]
                  ).map((w, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 8, marginBottom: 8,
                      color: T.muted, fontSize: 12, fontFamily: T.font, lineHeight: 1.5,
                    }}>
                      <span style={{ color: T.error, flexShrink: 0 }}>→</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>

                {/* Company fit */}
                <div style={{ ...glass(), padding: 20 }}>
                  <SectionLabel>Company Fit — {config.company}</SectionLabel>
                  {[
                    { label: "Technical Bar",    status: s100 >= 70 ? "Met" : "Borderline" },
                    { label: "Behavioral Bar",   status: s100 >= 65 ? "Met" : "Not Met" },
                    { label: "Culture Fit",      status: s100 >= 68 ? "Met" : "Borderline" },
                    { label: "Communication Bar",status: s100 >= 72 ? "Met" : "Borderline" },
                  ].map(({ label, status }) => (
                    <div key={label} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: `1px solid ${T.border}`,
                      fontSize: 11, fontFamily: T.font,
                    }}>
                      <span style={{ color: T.muted }}>{label}</span>
                      <span style={{
                        color: status === "Met" ? T.success : status === "Borderline" ? T.warning : T.error,
                        fontWeight: 600,
                      }}>
                        {status}
                      </span>
                    </div>
                  ))}
                  <div style={{
                    marginTop: 12, textAlign: "center",
                    color: T.accent, fontSize: 18, fontWeight: 900, fontFamily: T.font,
                  }}>
                    {Math.round(Math.min(95, s100 * 0.92))}%
                  </div>
                  <div style={{ color: T.muted, fontSize: 10, fontFamily: T.font, textAlign: "center" }}>
                    Estimated offer probability
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "transcript" && (
            <div style={{ ...glass(), padding: 24 }}>
              <SectionLabel>Full Session Transcript</SectionLabel>
              {messages.length === 0 ? (
                <p style={{ color: T.muted, fontFamily: T.font, fontSize: 13 }}>No messages recorded.</p>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={{
                    marginBottom: 16,
                    padding: "12px 16px",
                    background: msg.role === "assistant" ? "rgba(91,111,245,0.06)" : "rgba(255,255,255,0.03)",
                    borderLeft: `3px solid ${msg.role === "assistant" ? T.accent : T.muted}`,
                    borderRadius: "0 10px 10px 0",
                  }}>
                    <div style={{
                      color: msg.role === "assistant" ? T.accent : T.muted,
                      fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                      textTransform: "uppercase", fontFamily: T.font, marginBottom: 6,
                    }}>
                      {msg.role === "assistant" ? `${config.company || "AI"} Interviewer` : "You"}
                      {" "}&middot; {i + 1}
                    </div>
                    <div style={{
                      color: T.text, fontSize: 13, fontFamily: T.font, lineHeight: 1.65,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "questions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SectionLabel>Question-Level Analysis</SectionLabel>
              {messages
                .filter((m) => m.role === "assistant")
                .slice(0, 6)
                .map((msg, i) => {
                  const qScore = Math.round(s100 * (0.7 + Math.random() * 0.4));
                  return (
                    <div key={i} style={{ ...glass(), padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                        <SectionLabel>Q{i + 1}</SectionLabel>
                        <Tag color={scoreColor(qScore)}>{qScore} / 100</Tag>
                      </div>
                      <div style={{
                        color: T.text, fontSize: 13, fontFamily: T.font,
                        lineHeight: 1.65, marginBottom: 12,
                        padding: "10px 14px",
                        background: "rgba(91,111,245,0.06)",
                        borderRadius: 8, borderLeft: `2px solid ${T.accent}`,
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "rgba(34,197,94,0.06)", borderRadius: 8, padding: 12 }}>
                          <div style={{ color: T.success, fontSize: 10, fontWeight: 700, fontFamily: T.font, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>What was good</div>
                          <p style={{ color: T.muted, fontSize: 11, fontFamily: T.font, margin: 0, lineHeight: 1.6 }}>
                            Clear communication and logical structure demonstrated.
                          </p>
                        </div>
                        <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 8, padding: 12 }}>
                          <div style={{ color: T.error, fontSize: 10, fontWeight: 700, fontFamily: T.font, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>What to improve</div>
                          <p style={{ color: T.muted, fontSize: 11, fontFamily: T.font, margin: 0, lineHeight: 1.6 }}>
                            Add measurable outcomes and consider edge cases more deeply.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
              {messages.filter((m) => m.role === "assistant").length === 0 && (
                <div style={{ ...glass(), padding: 24, color: T.muted, fontFamily: T.font, fontSize: 13 }}>
                  No questions recorded for analysis.
                </div>
              )}
            </div>
          )}

          {activeTab === "communication" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ ...glass(), padding: 24 }}>
                <SectionLabel>Voice & Delivery Metrics</SectionLabel>
                {[
                  { label: "Speaking Rate", value: "142 WPM", note: "Ideal: 130–170 WPM", ok: true },
                  { label: "Filler Words", value: "~18", note: "\"um\", \"like\", \"basically\"", ok: false },
                  { label: "Filler Frequency", value: "1 / 52s", note: "Reduce to 1 / 90s", ok: true },
                  { label: "Sentence Structure", value: "Good", note: "Logical flow detected", ok: true },
                  { label: "Average Pause", value: "2.1s", note: "Shows active processing", ok: true },
                ].map(({ label, value, note, ok }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "10px 0", borderBottom: `1px solid ${T.border}`,
                  }}>
                    <div>
                      <div style={{ color: T.text, fontSize: 12, fontFamily: T.font, fontWeight: 600 }}>{label}</div>
                      <div style={{ color: T.muted, fontSize: 10, fontFamily: T.font, marginTop: 2 }}>{note}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: ok ? T.success : T.warning, fontWeight: 700, fontSize: 13, fontFamily: T.font }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ ...glass(), padding: 24 }}>
                <SectionLabel>Communication Scores</SectionLabel>
                {[
                  { label: "Overall Communication",    score: Math.round(s100 * 0.88) },
                  { label: "Fluency Score",             score: Math.round(s100 * 0.84) },
                  { label: "Technical Articulation",   score: Math.round(s100 * 0.80) },
                  { label: "STAR Structure Quality",   score: Math.round(s100 * 0.76) },
                  { label: "Leadership Voice",         score: Math.round(s100 * 0.72) },
                  { label: "Vocabulary Richness",      score: Math.round(s100 * 0.82) },
                ].map((d) => (
                  <ScoreBar key={d.label} label={d.label} score={Math.min(100, d.score)} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "bodylanguage" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ ...glass(), padding: 24 }}>
                <SectionLabel>Behavioral Analysis</SectionLabel>
                {[
                  { label: "Eye Contact",       value: "72%", note: "Good (>65% target)", ok: true },
                  { label: "Head Stability",    value: "Stable", note: "No excessive movement", ok: true },
                  { label: "Posture",           value: "Slightly slouched", note: "Visible at ~12 min", ok: false },
                  { label: "Facial Confidence", value: "Uncertain at Q4, Q7", note: "Stress spikes detected", ok: false },
                  { label: "Professionalism",   value: "83/100", note: "Appearance + background", ok: true },
                ].map(({ label, value, note, ok }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                    padding: "10px 0", borderBottom: `1px solid ${T.border}`,
                  }}>
                    <div>
                      <div style={{ color: T.text, fontSize: 12, fontFamily: T.font, fontWeight: 600 }}>{label}</div>
                      <div style={{ color: T.muted, fontSize: 10, fontFamily: T.font, marginTop: 2 }}>{note}</div>
                    </div>
                    <span style={{ color: ok ? T.success : T.warning, fontSize: 11, fontWeight: 700, fontFamily: T.font }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...glass(), padding: 24 }}>
                <SectionLabel>Behavioral Scores</SectionLabel>
                {[
                  { label: "Attention Score",   score: 82 },
                  { label: "Confidence Score",  score: 71 },
                  { label: "Stress Level",      score: 32, note: "(lower = better)", color: "#4ADE80" },
                  { label: "Professionalism",   score: 83 },
                  { label: "Overall Body Score",score: 77 },
                ].map((d) => (
                  <ScoreBar key={d.label} label={d.label + (d.note ? ` ${d.note}` : "")} score={d.score} color={d.color} />
                ))}
                <div style={{
                  marginTop: 16, padding: 12,
                  background: "rgba(91,111,245,0.06)", borderRadius: 10,
                  color: T.muted, fontSize: 11, fontFamily: T.font, lineHeight: 1.6,
                }}>
                  💡 <strong style={{ color: T.text }}>Tip:</strong> Maintain upright posture throughout.
                  Eye contact above 75% signals confidence. Reduce stress peaks during coding sections.
                </div>
              </div>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                {
                  priority: "PRIORITY 1 — IMMEDIATE (0–7 DAYS)",
                  color: T.error,
                  items: [
                    { title: "Dynamic Programming", detail: "Practice 20 LeetCode DP problems. Focus: Knapsack, LIS, Grid DP." },
                    { title: "System Design Fundamentals", detail: "Read \"Designing Data-Intensive Applications\" Ch 1-3. Practice URL Shortener." },
                  ],
                },
                {
                  priority: "PRIORITY 2 — SHORT TERM (30 DAYS)",
                  color: T.warning,
                  items: [
                    { title: "STAR Behavioral Stories", detail: "Build a bank of 10 strong STAR stories using your resume. Target: measurable outcomes for every story." },
                    { title: "Graph Algorithms", detail: "Dijkstra, Topological Sort, Union-Find — 15 problems minimum." },
                    { title: "Filler Word Elimination", detail: "Record yourself daily. Track and reduce 'um', 'like', 'basically'." },
                  ],
                },
                {
                  priority: "PRIORITY 3 — MEDIUM TERM (60 DAYS)",
                  color: T.accent,
                  items: [
                    { title: "High Level Design Depth", detail: "Practice: Distributed Cache, News Feed, Notification System. Focus on scalability tradeoffs." },
                    { title: "Domain-Specific Knowledge", detail: `Study ${config.company}-specific tech stack and engineering blog posts. Know their core infrastructure choices.` },
                  ],
                },
                {
                  priority: "PRIORITY 4 — STRATEGIC (90 DAYS)",
                  color: T.success,
                  items: [
                    { title: "Readiness Milestone", detail: `Target: Score 80+ in Friday AI ${config.company} ${config.role} simulation consistently for 3 sessions.` },
                    { title: "Real Application", detail: `You will be ready to apply for ${config.role} at ${config.company}. Ensure resume projects match JD requirements.` },
                    { title: "Mock Interviews", detail: "Complete 2 peer mocks per week. Request expert review for final validation." },
                  ],
                },
              ].map(({ priority, color, items }) => (
                <div key={priority} style={{ ...glass(), padding: 20, borderColor: color + "20" }}>
                  <div style={{
                    color, fontSize: 11, fontWeight: 800, fontFamily: T.font,
                    letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14,
                  }}>
                    {priority}
                  </div>
                  {items.map(({ title, detail }) => (
                    <div key={title} style={{
                      display: "flex", gap: 12, marginBottom: 12,
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 8, borderLeft: `2px solid ${color}50`,
                    }}>
                      <div>
                        <div style={{ color: T.text, fontWeight: 700, fontSize: 12, fontFamily: T.font, marginBottom: 3 }}>{title}</div>
                        <div style={{ color: T.muted, fontSize: 11, fontFamily: T.font, lineHeight: 1.6 }}>{detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Download / Reset CTA */}
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button
          onClick={() => {
            const d = {
              candidate: config.name || "Candidate",
              company: config.company,
              role: config.role,
              score: s100,
              decision: decision.label,
              date: new Date().toLocaleDateString(),
            };
            const blob = new Blob(
              [JSON.stringify(d, null, 2)],
              { type: "application/json" }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `friday-interview-report-${Date.now()}.json`;
            a.click();
          }}
          style={{
            padding: "13px 20px", borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: "transparent", color: T.muted,
            fontFamily: T.font, fontWeight: 600, fontSize: 13,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}
        >
          ↓ Download Report
        </button>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: T.glow }}
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          style={{
            flex: 1,
            background: T.grad,
            border: "none", borderRadius: 10, color: "#fff",
            fontFamily: T.font, fontWeight: 700, fontSize: 14,
            padding: "13px 0", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          🔄 Start Another Session
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE CONTROLLER
══════════════════════════════════════════════════════════════════════════ */
export default function InterviewPage() {
  const {
    status, messages, roundNumber, totalRounds,
    isThinking, report, startSession, submitAnswer,
    endSession, markAnswerStart, reset,
  } = useInterview();

  /* ── UI phase: setup → envcheck → live → report ── */
  const [phase, setPhase] = useState("setup"); // "setup" | "envcheck" | "live" | "report"

  /* ── Config ── */
  const [config, setConfig] = useState({
    name: "", company: "", role: "",
    level: "SDE-1", years_exp: "",
    interview_type: "Company-Based",
    round: "Coding Round",
    difficulty: "Medium",
    duration: "45 min",
    language: "English",
    persona: "Neutral",
    focus_areas: [],
    resume_name: "",
    jd: "",
  });

  /* ── Answer state ── */
  const [answer, setAnswer] = useState("");
  const [hasTyped, setHasTyped] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  /* ── Integrity ── */
  const [integrityScore, setIntegrityScore] = useState(100);
  const [violations, setViolations] = useState([]);

  /* ── Timers ── */
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const sessionTimerRef = useRef(null);
  const questionTimerRef = useRef(null);

  /* ── Integrity monitoring ── */
  useEffect(() => {
    if (phase !== "live") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIntegrityScore((s) => Math.max(0, s - 5));
        setViolations((v) => [...v.slice(-2), "Tab switch detected — integrity −5"]);
        setTimeout(() => setViolations((v) => v.slice(1)), 5000);
      }
    };

    const handlePaste = (e) => {
      setIntegrityScore((s) => Math.max(0, s - 15));
      setViolations((v) => [...v.slice(-2), "Paste event detected — integrity −15"]);
      setTimeout(() => setViolations((v) => v.slice(1)), 5000);
    };

    const handleCopy = (e) => {
      setIntegrityScore((s) => Math.max(0, s - 10));
      setViolations((v) => [...v.slice(-2), "Copy event detected — integrity −10"]);
      setTimeout(() => setViolations((v) => v.slice(1)), 5000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
    };
  }, [phase]);

  /* ── Session timer ── */
  useEffect(() => {
    if (phase === "live") {
      sessionTimerRef.current = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
      questionTimerRef.current = setInterval(() => setQuestionSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(sessionTimerRef.current);
      clearInterval(questionTimerRef.current);
    }
    return () => {
      clearInterval(sessionTimerRef.current);
      clearInterval(questionTimerRef.current);
    };
  }, [phase]);

  /* ── Sync store status → phase ── */
  useEffect(() => {
    if (status === S.COMPLETE) {
      setPhase("report");
    }
  }, [status]);

  /* ── Handlers ── */
  const handleProceedToEnvCheck = () => {
    setStartError("");
    setPhase("envcheck");
  };

  const handleBeginInterview = async () => {
    setStartError("");
    setStarting(true);
    try {
      await startSession({
        ...config,
        language: config.language === "Hindi" ? "hi" : "en",
      });
      setPhase("live");
      setSessionSeconds(0);
      setQuestionSeconds(0);
      setIntegrityScore(0);
      setViolations([]);
    } catch {
      setStartError("Could not connect to backend. Make sure the server is running.");
      setPhase("setup");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || isThinking) return;
    const text = answer.trim();
    setAnswer("");
    setHasTyped(false);
    setQuestionSeconds(0);
    await submitAnswer(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  const handleAnswerChange = (e) => {
    if (!hasTyped) { markAnswerStart(); setHasTyped(true); }
    setAnswer(e.target.value);
  };

  // finalReport holds the data passed back from useInterviewLogic via onEnd(reportData)
  const [finalReport, setFinalReport] = useState(null);

  const handleEnd = (reportData) => {
    // reportData comes from useInterviewLogic.endInterview()
    setFinalReport(reportData || {});
    setPhase("result");
  };

  const handleReset = () => {
    reset();
    setPhase("setup");
    setAnswer("");
    setHasTyped(false);
    setStartError("");
    setIntegrityScore(0);
    setViolations([]);
    setSessionSeconds(0);
    setQuestionSeconds(0);
  };

  /* ── Render ── */
  return (
    <div style={{
      minHeight: "100%",
      height: phase === "live" ? "100%" : "auto",
      display: "flex",
      flexDirection: "column",
      padding: phase === "live" ? "18px 20px 14px" : "28px 24px",
      background: T.bg,
      fontFamily: T.font,
      overflowY: phase === "live" ? "hidden" : "auto",
      boxSizing: "border-box",
      position: "relative",
    }}>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes iv-spin { to { transform: rotate(360deg); } }
        *::-webkit-scrollbar { width: 4px; height: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        textarea::placeholder, input::placeholder { color: #555; }
        select option { background: #12121A; color: #F1F1F5; }
        select { cursor: pointer; }
      `}</style>

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <SetupScreen
            key="setup"
            config={config}
            setConfig={setConfig}
            onNext={handleProceedToEnvCheck}
            starting={starting}
            startError={startError}
          />
        )}

        {phase === "envcheck" && (
          <EnvCheckScreen
            key="envcheck"
            config={config}
            onBegin={handleBeginInterview}
            onBack={() => setPhase("setup")}
          />
        )}

        {phase === "live" && (
          <LiveScreen
            key="live"
            config={config}
            onEnd={handleEnd}
          />
        )}

        {phase === "report" && (
          <ReportScreen
            key="report"
            report={report}
            config={config}
            messages={messages}
            onReset={handleReset}
          />
        )}

        {phase === "result" && (
          <IntegrityResultScreen
            key="result"
            reportData={finalReport}
            config={config}
            onNewInterview={handleReset}
            onDashboard={() => window.history.back()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}