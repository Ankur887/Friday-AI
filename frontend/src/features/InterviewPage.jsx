import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════════
   TOKENS — same identity as before (dark, one signal-blue accent used
   only for state), refined: one consistent radius scale, slightly
   warmer ink so long full-screen reading doesn't feel clinical.
══════════════════════════════════════════════════════════════════════ */
const T = {
  void: "#08090C",
  surface: "#101218",
  surfaceRaised: "#15171F",
  line: "rgba(255,255,255,0.07)",
  lineActive: "rgba(255,255,255,0.18)",
  ink: "#EDEEF0",
  inkDim: "#75798A",
  inkFaint: "#3E4048",
  signal: "#4F7CFF",
  signalDim: "rgba(79,124,255,0.12)",
  signalLine: "rgba(79,124,255,0.4)",
  good: "#5FBF7A",
  font: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
};

const RADIUS = { sm: 8, md: 12, lg: 18 };

const DIFFICULTY_COLOR = {
  "Warm-Up": "#5FBF7A",
  "Easy": "#5FBF7A",
  "Medium": "#D9A441",
  "Hard": "#E0654B",
  "FAANG-Level": "#B47EE0",
  "Research-Level": "#E0699A",
};

/* ══════════════════════════════════════════════════════════════════════
   DATA — unchanged from the source file.
══════════════════════════════════════════════════════════════════════ */
const COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix", "NVIDIA", "OpenAI",
  "Anthropic", "DeepMind", "Tesla", "SpaceX", "Uber", "Airbnb", "Stripe", "Coinbase",
  "Databricks", "Snowflake", "Palantir", "Figma", "Canva", "Notion", "Linear", "Vercel",
  "Flipkart", "Swiggy", "Zomato", "Razorpay", "PhonePe", "Paytm", "CRED", "Groww",
];

const ROLES = [
  "Software Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Engineer",
  "AI Engineer", "ML Engineer", "Data Scientist", "Research Engineer",
  "DevOps Engineer", "SRE / Site Reliability Engineer", "Security Engineer",
  "Product Manager", "UX Designer", "Engineering Manager",
];

const INTERVIEW_TYPES = ["Role-Based", "Company-Based", "JD-Based", "Resume-Based", "Custom"];

const ROUNDS = [
  "Warm-Up", "HR / Screening", "Technical Screening", "Behavioral (STAR)", "Coding Round",
  "Machine Coding", "Low Level Design (LLD)", "High Level Design (HLD)", "System Design",
  "Domain / Technical Deep Dive", "Bar Raiser / Final Round", "Full Loop Simulation",
];

const DIFFICULTIES = ["Warm-Up", "Easy", "Medium", "Hard", "FAANG-Level", "Research-Level"];
const DURATIONS = ["15 min", "30 min", "45 min", "60 min", "90 min"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Chinese", "Japanese"];

const PERSONAS = [
  { label: "Neutral", desc: "Balanced, calm, minimal reaction" },
  { label: "Supportive", desc: "Warmer, occasional encouragement" },
  { label: "Challenging", desc: "Pushes back, asks \u201cWhy?\u201d repeatedly" },
  { label: "FAANG Strict", desc: "No hints, follows rubric precisely" },
  { label: "Startup Direct", desc: "Informal, fast, values practicality" },
  { label: "Research Academic", desc: "First-principles, nuance, uncertainty" },
];

const EXPERIENCE_LEVELS = ["Intern", "Fresher", "SDE-1", "SDE-2", "SDE-3", "Senior", "Staff", "Principal"];
const FOCUS_AREAS = ["DSA", "System Design", "Behavioral", "LLD", "HLD", "Leadership", "Communication", "Product Sense"];

// How long a selection visibly "settles" before auto-advancing. Long
// enough to register as confirmation, short enough not to feel like a
// delay \u2014 this is what makes forward-only auto-advance feel safe
// rather than abrupt, since there's no way back to fix a mis-tap.
const CONFIRM_HOLD = 420;

/* ══════════════════════════════════════════════════════════════════════
   PRIMITIVES
══════════════════════════════════════════════════════════════════════ */
function FieldLabel({ children }) {
  return (
    <label style={{
      display: "block", fontFamily: T.font, fontSize: 12, fontWeight: 500,
      color: T.inkDim, letterSpacing: "0.06em", textTransform: "uppercase",
      marginBottom: 10,
    }}>
      {children}
    </label>
  );
}

const inputBase = {
  width: "100%", background: "rgba(255,255,255,0.025)",
  border: `1px solid ${T.line}`, borderRadius: RADIUS.sm, color: T.ink,
  fontFamily: T.font, fontSize: 15, padding: "13px 15px",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s ease, background 0.15s ease",
};

function Input(props) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...(props.style || {}) }}
      onFocus={(e) => { e.target.style.borderColor = T.lineActive; e.target.style.background = "rgba(255,255,255,0.04)"; props.onFocus?.(e); }}
      onBlur={(e) => { e.target.style.borderColor = T.line; e.target.style.background = "rgba(255,255,255,0.025)"; props.onBlur?.(e); }}
    />
  );
}

// Chip \u2014 gains a brief "confirmed" ring right before the step advances,
// so a tap reads as "heard" rather than the screen just vanishing.
function Chip({ active, confirmed, onClick, children, small }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      animate={confirmed ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        padding: small ? "6px 13px" : "9px 16px",
        borderRadius: RADIUS.sm,
        border: `1px solid ${active ? T.signalLine : T.line}`,
        background: active ? T.signalDim : "transparent",
        color: active ? T.signal : T.inkDim,
        fontFamily: T.font, fontWeight: 500, fontSize: small ? 12.5 : 13.5,
        cursor: "pointer", transition: "border-color 0.15s ease, background 0.15s ease, color 0.15s ease",
        whiteSpace: "nowrap",
        boxShadow: confirmed ? `0 0 0 3px ${T.signalDim}` : "none",
      }}
    >
      {children}
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP CHROME \u2014 shared frame every full-screen step sits inside:
   position ("3 of 6"), title, and generous centered content well.
   The numbering is load-bearing here in a way it wasn't in the scroll
   version \u2014 with one step visible at a time, "where am I" is the one
   thing chrome must answer, so it's set larger and given real weight.
══════════════════════════════════════════════════════════════════════ */
function StepFrame({ index, total, eyebrow, title, subtitle, children }) {
  return (
    <div style={{
      width: "100%", maxWidth: 560, margin: "0 auto",
      display: "flex", flexDirection: "column", flex: 1,
      padding: "0 28px",
    }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 18,
        }}>
          <span style={{
            fontFamily: T.mono, fontSize: 12.5, color: T.signal,
            fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em",
          }}>
            {String(index).padStart(2, "0")}
          </span>
          <span style={{
            fontFamily: T.mono, fontSize: 12.5, color: T.inkFaint,
          }}>
            / {String(total).padStart(2, "0")}
          </span>
          {eyebrow && (
            <span style={{
              fontFamily: T.font, fontSize: 11, fontWeight: 600,
              color: T.inkFaint, letterSpacing: "0.08em", textTransform: "uppercase",
              marginLeft: 4,
            }}>
              {eyebrow}
            </span>
          )}
        </div>
        <h1 style={{
          fontFamily: T.font, fontWeight: 600, fontSize: "clamp(24px, 4vw, 30px)",
          color: T.ink, margin: 0, letterSpacing: "-0.015em", lineHeight: 1.2,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontFamily: T.font, fontSize: 14.5, color: T.inkDim,
            margin: "10px 0 0", lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   STEP TRANSITION \u2014 every step enters/exits the same considered way.
   Reduced-motion users get a plain crossfade at the same timing.
══════════════════════════════════════════════════════════════════════ */
function useStepMotion() {
  const reduced = useReducedMotion();
  return reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25 },
      }
    : {
        initial: { opacity: 0, y: 18, filter: "blur(5px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -12, filter: "blur(4px)" },
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      };
}

/* ══════════════════════════════════════════════════════════════════════
   SETUP WIZARD \u2014 PAGED
   Step index is the single source of truth for what's on screen. Every
   step is forward-only (no back control, per brief) and auto-advances a
   fixed beat after the answer registers, so the flow never waits on an
   explicit "Continue" tap for chip-based steps. Free-text steps (name,
   years of experience) advance on Enter, since auto-advancing on every
   keystroke isn't meaningful for typed input.
══════════════════════════════════════════════════════════════════════ */
const STEPS = ["name", "company", "role", "roundConfig", "difficulty", "session", "persona", "experience", "optional"];
const TOTAL_STEPS = STEPS.length;

export default function SetupWizard() {
  const [config, setConfig] = useState({
    name: "", company: "", role: "",
    interview_type: "Company-Based", round: "Coding Round",
    difficulty: "Medium", duration: "45 min", language: "English",
    persona: "Neutral", level: "SDE-1", years_exp: "",
    resume_name: "", focus_areas: [], jd: "",
  });
  const set = (k, v) => setConfig((c) => ({ ...c, [k]: v }));

  const [stepIndex, setStepIndex] = useState(0);
  const [companySearch, setCompanySearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [confirmedKey, setConfirmedKey] = useState(null);
  const advanceTimer = useRef(null);
  const stepMotion = useStepMotion();

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, TOTAL_STEPS - 1));
  }, []);

  // Select a chip-style value, show the brief confirm state, then
  // advance. This is the one interaction pattern reused by every
  // single-choice step (company, role, round, difficulty, etc).
  const selectAndAdvance = useCallback((key, value) => {
    set(key, value);
    setConfirmedKey(value);
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      setConfirmedKey(null);
      goNext();
    }, CONFIRM_HOLD);
  }, [goNext]);

  const filteredCompanies = useMemo(
    () => COMPANIES.filter((c) => c.toLowerCase().includes(companySearch.toLowerCase())),
    [companySearch]
  );
  const filteredRoles = useMemo(
    () => ROLES.filter((r) => r.toLowerCase().includes(roleSearch.toLowerCase())),
    [roleSearch]
  );

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const canFinish = !!config.name.trim() && !!config.company && !!config.role;

  return (
    <div style={{
      minHeight: "100vh", background: T.void, fontFamily: T.font,
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: rgba(79,124,255,0.3); }
        button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid ${T.signal}; outline-offset: 2px;
        }
      `}</style>

      {/* ── Progress \u2014 fixed hairline row, one segment per step. This
           replaces the old 5-dot "required steps" thread: with every
           step full-screen now, the thread is the only persistent view
           of the whole journey, so it needs to show all steps, not just
           the required ones. ── */}
      <div style={{ padding: "22px 28px 0", flexShrink: 0 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 5 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < stepIndex ? T.signal : i === stepIndex ? T.signalLine : T.line,
              transition: "background 0.4s ease",
            }} />
          ))}
        </div>
      </div>

      {/* ── Stage \u2014 exactly one step fills this at a time. ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "24px 0 40px", position: "relative",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            {...stepMotion}
            style={{ display: "flex", flexDirection: "column", flex: 1 }}
          >

            {currentStep === "name" && (
              <StepFrame index={1} total={TOTAL_STEPS} eyebrow="Start here" title="What should we call you?">
                <Input
                  autoFocus
                  value={config.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && config.name.trim()) goNext(); }}
                  placeholder="Your full name"
                  style={{ fontSize: 18, padding: "16px 18px" }}
                />
                <p style={{
                  fontFamily: T.font, fontSize: 13, color: T.inkFaint,
                  marginTop: 14, lineHeight: 1.5,
                }}>
                  Press Enter to continue.
                </p>
              </StepFrame>
            )}

            {currentStep === "company" && (
              <StepFrame index={2} total={TOTAL_STEPS} title="Which company are you preparing for?">
                <Input
                  autoFocus
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search 200+ companies\u2026"
                  style={{ marginBottom: 16 }}
                />
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 8,
                  maxHeight: 220, overflowY: "auto", paddingRight: 2,
                }}>
                  {(companySearch ? filteredCompanies : COMPANIES.slice(0, 20)).map((c) => (
                    <Chip
                      key={c}
                      active={config.company === c}
                      confirmed={confirmedKey === c}
                      onClick={() => selectAndAdvance("company", c)}
                    >
                      {c}
                    </Chip>
                  ))}
                </div>
              </StepFrame>
            )}

            {currentStep === "role" && (
              <StepFrame index={3} total={TOTAL_STEPS} title="What role are you aiming for?">
                <Input
                  autoFocus
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search 3000+ roles\u2026"
                  style={{ marginBottom: 16 }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(roleSearch ? filteredRoles : ROLES).map((r) => (
                    <Chip
                      key={r}
                      active={config.role === r}
                      confirmed={confirmedKey === r}
                      onClick={() => selectAndAdvance("role", r)}
                    >
                      {r}
                    </Chip>
                  ))}
                </div>
              </StepFrame>
            )}

            {currentStep === "roundConfig" && (
              <StepFrame index={4} total={TOTAL_STEPS} title="What kind of round is this?">
                <FieldLabel>Interview type</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
                  {INTERVIEW_TYPES.map((t) => (
                    <Chip key={t} active={config.interview_type === t} onClick={() => set("interview_type", t)}>
                      {t}
                    </Chip>
                  ))}
                </div>
                <FieldLabel>Round</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
                  {ROUNDS.map((r) => (
                    <Chip
                      key={r}
                      small
                      active={config.round === r}
                      confirmed={confirmedKey === r}
                      onClick={() => selectAndAdvance("round", r)}
                    >
                      {r}
                    </Chip>
                  ))}
                </div>
              </StepFrame>
            )}

            {currentStep === "difficulty" && (
              <StepFrame index={5} total={TOTAL_STEPS} title="How hard should it be?">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {DIFFICULTIES.map((d) => {
                    const active = config.difficulty === d;
                    const confirmed = confirmedKey === d;
                    const color = DIFFICULTY_COLOR[d];
                    return (
                      <motion.button
                        key={d}
                        onClick={() => selectAndAdvance("difficulty", d)}
                        whileTap={{ scale: 0.97 }}
                        animate={confirmed ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          padding: "18px 14px", borderRadius: RADIUS.md, textAlign: "center",
                          border: `1px solid ${active ? color : T.line}`,
                          background: active ? `${color}17` : "transparent",
                          color: active ? color : T.inkDim,
                          fontFamily: T.font, fontWeight: 600, fontSize: 14,
                          cursor: "pointer", transition: "all 0.18s ease",
                          boxShadow: confirmed ? `0 0 0 3px ${color}22` : active ? `0 4px 14px ${color}18` : "none",
                        }}
                      >
                        {d}
                      </motion.button>
                    );
                  })}
                </div>
              </StepFrame>
            )}

            {currentStep === "session" && (
              <StepFrame index={6} total={TOTAL_STEPS} title="How long, and in what language?">
                <FieldLabel>Duration</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
                  {DURATIONS.map((d) => (
                    <Chip
                      key={d}
                      active={config.duration === d}
                      confirmed={confirmedKey === d}
                      onClick={() => selectAndAdvance("duration", d)}
                    >
                      {d}
                    </Chip>
                  ))}
                </div>
                <FieldLabel>Language</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {LANGUAGES.map((l) => (
                    <Chip key={l} active={config.language === l} onClick={() => set("language", l)}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </StepFrame>
            )}

            {currentStep === "persona" && (
              <StepFrame index={7} total={TOTAL_STEPS} title="Who's interviewing you?">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {PERSONAS.map(({ label, desc }) => {
                    const active = config.persona === label;
                    const confirmed = confirmedKey === label;
                    return (
                      <motion.button
                        key={label}
                        onClick={() => selectAndAdvance("persona", label)}
                        whileTap={{ scale: 0.985 }}
                        animate={confirmed ? { scale: [1, 1.015, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          padding: "16px 18px", borderRadius: RADIUS.md, textAlign: "left",
                          border: `1px solid ${active ? T.signalLine : T.line}`,
                          background: active ? T.signalDim : "rgba(255,255,255,0.02)",
                          cursor: "pointer", transition: "border-color 0.18s ease, background 0.18s ease",
                          boxShadow: confirmed ? `0 0 0 3px ${T.signalDim}` : "none",
                        }}
                      >
                        <div style={{
                          color: active ? T.signal : T.ink, fontWeight: 600, fontSize: 14,
                          fontFamily: T.font, marginBottom: 4,
                        }}>
                          {label}
                        </div>
                        <div style={{
                          color: active ? "rgba(79,124,255,0.75)" : T.inkFaint,
                          fontSize: 12.5, fontFamily: T.font, lineHeight: 1.5,
                        }}>
                          {desc}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </StepFrame>
            )}

            {currentStep === "experience" && (
              <StepFrame index={8} total={TOTAL_STEPS} title="Where are you today?">
                <FieldLabel>Experience level</FieldLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <Chip
                      key={l}
                      active={config.level === l}
                      confirmed={confirmedKey === l}
                      onClick={() => selectAndAdvance("level", l)}
                    >
                      {l}
                    </Chip>
                  ))}
                </div>
                <FieldLabel>Years of experience (optional)</FieldLabel>
                <Input
                  type="number" min={0} max={30}
                  value={config.years_exp}
                  onChange={(e) => set("years_exp", e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") goNext(); }}
                  placeholder="e.g. 3"
                  style={{ maxWidth: 160 }}
                />
              </StepFrame>
            )}

            {currentStep === "optional" && (
              <StepFrame
                index={9} total={TOTAL_STEPS} eyebrow="Last step \u00b7 optional"
                title="Sharpen the simulation"
                subtitle="Add a resume or job description to tailor questions \u2014 or skip straight to your session."
              >
                <div style={{ marginBottom: 22 }}>
                  <FieldLabel>Resume</FieldLabel>
                  <label style={{
                    display: "flex", alignItems: "center", gap: 10,
                    border: `1px dashed ${T.line}`, borderRadius: RADIUS.sm,
                    padding: "15px 17px", cursor: "pointer",
                    transition: "border-color 0.15s ease",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.lineActive)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.line)}
                  >
                    <span style={{ color: T.inkFaint, fontSize: 13.5 }}>
                      {config.resume_name || "Drop a PDF or DOCX, or click to browse"}
                    </span>
                    <input
                      type="file" accept=".pdf,.docx" style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files[0]; if (f) set("resume_name", f.name); }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <FieldLabel>Focus areas</FieldLabel>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {FOCUS_AREAS.map((f) => {
                      const arr = config.focus_areas;
                      const active = arr.includes(f);
                      return (
                        <Chip
                          key={f} active={active} small
                          onClick={() => set("focus_areas", active ? arr.filter((x) => x !== f) : [...arr, f])}
                        >
                          {f}
                        </Chip>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <FieldLabel>Job description</FieldLabel>
                  <textarea
                    value={config.jd}
                    onChange={(e) => set("jd", e.target.value)}
                    placeholder="Paste it here to enable JD-matched questioning\u2026"
                    rows={3}
                    style={{ ...inputBase, resize: "vertical", lineHeight: 1.55, fontSize: 13.5 }}
                    onFocus={(e) => (e.target.style.borderColor = T.lineActive)}
                    onBlur={(e) => (e.target.style.borderColor = T.line)}
                  />
                </div>

                <motion.button
                  disabled={!canFinish}
                  whileHover={canFinish ? { background: "#5B85FF" } : {}}
                  whileTap={canFinish ? { scale: 0.985 } : {}}
                  style={{
                    width: "100%", background: canFinish ? T.signal : T.surfaceRaised,
                    border: canFinish ? "none" : `1px solid ${T.line}`,
                    borderRadius: RADIUS.sm, color: canFinish ? "#fff" : T.inkFaint,
                    fontFamily: T.font, fontWeight: 600, fontSize: 15, padding: "16px 0",
                    cursor: canFinish ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: canFinish ? "0 8px 24px rgba(79,124,255,0.25)" : "none",
                    transition: "background 0.2s ease",
                  }}
                >
                  Continue to environment check
                  <span style={{ fontFamily: T.mono, fontSize: 13 }}>\u2192</span>
                </motion.button>
              </StepFrame>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}