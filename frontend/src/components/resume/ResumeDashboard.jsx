// FILE: src/components/resume/ResumeDashboard.jsx
// STYLE: pixel-accurate resume.io dashboard —
//   dark shell + 220 px fixed sidebar, white top navbar,
//   step-progress bar, two-col (Progress | Resume card),
//   job matches grid, floating AI coach bubble.
//   All modal logic and handlers kept intact.

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Upload, LayoutGrid, FileSearch, Clock,
  Layers, Sparkles, FileText, Send, Mail,
  Heart, Zap, ChevronRight, Clock3, ChevronDown,
  LayoutDashboard, Briefcase, MessageSquare, DollarSign,
  Share2, BookOpen, Compass, Users, MoreHorizontal,
  ListChecks, BarChart2, Check,
} from "lucide-react";
import ResumeGrid          from "./ResumeGrid";
import ResumeTemplateGallery from "./ResumeTemplateGallery";
import CreateResumeModal   from "./CreateResumeModal";
import UploadResumeModal   from "./UploadResumeModal";
import DeleteResumeDialog  from "./DeleteResumeDialog";

// ─────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────
const T = {
  shellBg:      "#0a0a0a",
  sidebarBg:    "#111111",
  sidebarBorder:"rgba(255,255,255,0.06)",
  contentBg:    "#f5f5f0",
  card:         "#ffffff",
  cardAlt:      "#fdfdf8",
  accent:       "#4F6EF7",
  accentHover:  "#3d5ce5",
  accentLight:  "#eff2ff",
  green:        "#059669",
  greenLight:   "#ecfdf5",
  greenBorder:  "#d1fae5",
  amber:        "#f59e0b",
  border:       "#e8e8e4",
  text1:        "#111827",
  text2:        "#6b7280",
  text3:        "#9ca3af",
  font:         "'Inter', system-ui, -apple-system, sans-serif",
};

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "resumes",   label: "My resumes",  icon: LayoutGrid },
  { id: "templates", label: "Templates",   icon: Layers },
  { id: "analyzed",  label: "Analyzed",    icon: FileSearch },
  { id: "recent",    label: "Recent",      icon: Clock },
];

const STEP_GOALS = [
  { id: "resume",    label: "Resume Building" },
  { id: "search",    label: "Job Search" },
  { id: "interview", label: "Interview Prep" },
  { id: "learning",  label: "Learning" },
];

const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",          icon: LayoutDashboard },
  { id: "documents",    label: "Documents",           icon: FileText,    hasExpand: true },
  { id: "jobs",         label: "Jobs",                icon: Briefcase },
  { id: "tracker",      label: "Job Tracker",         icon: ListChecks },
  { id: "autoapply",    label: "Auto Apply",          icon: Zap },
  { id: "interview",    label: "Interview Prep",      icon: MessageSquare },
  { id: "salary",       label: "Salary Analyzer",     icon: DollarSign },
  { id: "distribution", label: "Resume Distribution", icon: Share2 },
  { id: "learning",     label: "Unlimited Learning",  icon: BookOpen },
  { id: "method",       label: "Job Search Method",   icon: Compass },
  { id: "coaching",     label: "Coaching",            icon: Users },
  { id: "other",        label: "Other",               icon: MoreHorizontal },
];

const DEMO_RESUMES = [
  { id: "1", name: "Software Engineer", role: "Frontend @ Stripe", atsScore: 87, updatedAt: "2 hours ago", color: "#1a56db" },
  { id: "2", name: "Full Stack Dev",    role: "Backend @ Vercel",  atsScore: 73, updatedAt: "Yesterday",   color: "#0e9f6e" },
  { id: "3", name: "Product Lead",      role: "PM @ Linear",       atsScore: 61, updatedAt: "3 days ago",  color: "#9061f9" },
];

const PROGRESS_ITEMS = [
  { icon: FileText,   label: "Resume Building",      value: 45, hasBar: true  },
  { icon: FileSearch, label: "Resume Tailoring",      value: 0,  hasBar: false },
  { icon: Send,       label: "Resume Distribution",   value: 0,  hasBar: false },
  { icon: Mail,       label: "Cover Letter Crafting", value: 0,  hasBar: false },
];

const JOB_MATCHES = [
  { title: "Full Stack Developer", company: "Weekday AI", initials: "W",   avatarBg: "#3b82f6", location: "Gurgaon, Uttar Pradesh, India",   posted: "15 days ago",     autoApply: true },
  { title: "Software Developer",   company: "IBM",        initials: "IBM", avatarBg: "#1e40af", location: "Lucknow, Uttar Pradesh, India",   posted: "over 1 year ago", autoApply: true },
  { title: "Full Stack Developer", company: "Infosys",    initials: "INF", avatarBg: "#16a34a", location: "Pune, Maharashtra, India",        posted: "3 days ago",      autoApply: true },
  { title: "React Developer",      company: "TCS",        initials: "TCS", avatarBg: "#dc2626", location: "Bangalore, Karnataka, India",     posted: "1 week ago",      autoApply: true },
];

// ─────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────
const Sidebar = memo(({ activeItem, onNavClick, userName }) => {
  const [docsExpanded, setDocsExpanded] = useState(false);

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{
        width: 220,
        height: "100vh",
        background: T.sidebarBg,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRight: `1px solid ${T.sidebarBorder}`,
        overflowY: "auto",
        fontFamily: T.font,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      {/* ── Logo ────────────────────────────────── */}
      <div style={{ padding: "22px 20px 16px", flexShrink: 0 }}>
        <span style={{
          fontSize: 20, fontWeight: 900, letterSpacing: "-0.5px",
          background: "linear-gradient(130deg, #4F6EF7 0%, #7c3aed 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          ResumAI
        </span>
      </div>

      {/* ── User info ────────────────────────────── */}
      <div style={{
        padding: "0 16px 16px",
        borderBottom: `1px solid ${T.sidebarBorder}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #4F6EF7 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "#f9fafb",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
              Set your target role
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const Icon     = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.hasExpand) setDocsExpanded(v => !v);
                onNavClick(item.id);
              }}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                marginBottom: 2,
                background: isActive ? "rgba(79,110,247,0.18)" : "transparent",
                color: isActive ? T.accent : "#9ca3af",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: T.font,
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.055)";
                  e.currentTarget.style.color = "#d1d5db";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9ca3af";
                }
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{
                flex: 1, overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {item.label}
              </span>
              {item.hasExpand && (
                <ChevronDown
                  size={13}
                  style={{
                    flexShrink: 0,
                    transform: docsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Extension link ───────────────────────── */}
      <div style={{
        padding: "14px 20px",
        borderTop: `1px solid ${T.sidebarBorder}`,
        flexShrink: 0,
      }}>
        <button
          style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: 11, color: "#6b7280",
            background: "none", border: "none",
            cursor: "pointer", padding: 0,
            fontFamily: T.font,
            transition: "color 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#6b7280"; }}
        >
          <Zap size={11} />
          Get Auto Apply Extension
        </button>
      </div>
    </motion.aside>
  );
});
Sidebar.displayName = "Sidebar";

// ─────────────────────────────────────────────────────────────────
// Top Navbar
// ─────────────────────────────────────────────────────────────────
const TopNavbar = memo(() => (
  <div style={{
    height: 56,
    background: T.card,
    borderBottom: `1px solid ${T.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0 28px",
    gap: 10,
    flexShrink: 0,
    fontFamily: T.font,
  }}>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 15px",
        border: `1.5px solid ${T.accent}`,
        borderRadius: 8,
        background: "transparent",
        color: T.accent,
        fontSize: 12, fontWeight: 600,
        cursor: "pointer", fontFamily: T.font,
      }}
    >
      <Zap size={12} /> Auto Apply
    </motion.button>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 15px",
        border: "none",
        borderRadius: 8,
        background: T.amber,
        color: "#fff",
        fontSize: 12, fontWeight: 700,
        cursor: "pointer", fontFamily: T.font,
      }}
    >
      ⚡ Upgrade Now
    </motion.button>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 15px",
        border: `1.5px solid ${T.border}`,
        borderRadius: 8,
        background: "transparent",
        color: T.text2,
        fontSize: 12, fontWeight: 600,
        cursor: "pointer", fontFamily: T.font,
      }}
    >
      <BookOpen size={12} /> Unlimited Learning
    </motion.button>
  </div>
));
TopNavbar.displayName = "TopNavbar";

// ─────────────────────────────────────────────────────────────────
// Step Progress Bar
// ─────────────────────────────────────────────────────────────────
const StepProgressBar = memo(({ activeStep, onStepClick }) => (
  <div style={{
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 36,
    fontFamily: T.font,
  }}>
    {STEP_GOALS.map((goal, i) => {
      const isActive   = i === activeStep;
      const isComplete = i < activeStep;
      const isLast     = i === STEP_GOALS.length - 1;

      return (
        <div key={goal.id} style={{ display: "flex", alignItems: "flex-start" }}>
          {/* Step button */}
          <button
            onClick={() => onStepClick(i)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 9, background: "none", border: "none",
              cursor: "pointer", padding: 0, width: 112,
            }}
          >
            {/* Circle */}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: isComplete || isActive ? T.accent : T.card,
              border: `2px solid ${isComplete || isActive ? T.accent : "#d1d5db"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isActive ? `0 0 0 5px rgba(79,110,247,0.14)` : "none",
              transition: "all 0.22s",
            }}>
              {isComplete ? (
                <Check size={14} color="#fff" strokeWidth={2.5} />
              ) : (
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: isActive ? "#fff" : "#d1d5db",
                }} />
              )}
            </div>
            {/* Label */}
            <span style={{
              fontSize: 12,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? T.accent : T.text3,
              textAlign: "center",
              lineHeight: 1.35,
              whiteSpace: "nowrap",
            }}>
              {goal.label}
            </span>
          </button>

          {/* Connector */}
          {!isLast && (
            <div style={{
              width: 64,
              height: 2,
              marginTop: 15,   // aligns with circle centre (32px / 2 = 16, minus 1 for line)
              background: i < activeStep ? T.accent : "#e5e7eb",
              transition: "background 0.3s",
              flexShrink: 0,
            }} />
          )}
        </div>
      );
    })}
  </div>
));
StepProgressBar.displayName = "StepProgressBar";

// ─────────────────────────────────────────────────────────────────
// Mini resume preview (inside resume-building card)
// ─────────────────────────────────────────────────────────────────
const MiniResumePreview = memo(({ score = 45 }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    <div style={{
      width: 90, height: 122,
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 6,
      padding: "8px 7px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    }}>
      <div style={{ height: 8, background: "#e5e7eb", borderRadius: 2, marginBottom: 5, width: "70%" }} />
      <div style={{ height: 5, background: "#f3f4f6", borderRadius: 2, marginBottom: 8, width: "50%" }} />
      {[100, 80, 90, 70, 85, 60, 75, 55].map((w, i) => (
        <div key={i} style={{
          height: 4, background: "#f3f4f6", borderRadius: 2,
          width: `${w}%`, marginBottom: 4,
          opacity: 1 - i * 0.05,
        }} />
      ))}
    </div>
    {/* Score badge */}
    <div style={{
      position: "absolute", top: -10, right: -10,
      width: 38, height: 38, borderRadius: "50%",
      background: "#fef3c7",
      border: "2px solid #fff",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706", lineHeight: 1 }}>{score}%</div>
      <div style={{ fontSize: 6, color: "#d97706", lineHeight: 1.2, textAlign: "center" }}>Resume<br/>Score</div>
    </div>
  </div>
));
MiniResumePreview.displayName = "MiniResumePreview";

// ─────────────────────────────────────────────────────────────────
// Progress row (inside Progress card)
// ─────────────────────────────────────────────────────────────────
const ProgressRow = memo(({ icon: Icon, label, value, hasBar }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12,
    padding: "11px 0",
    borderBottom: "1px solid #f3f4f6",
    fontFamily: T.font,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: "#f5f5f0",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon size={14} style={{ color: T.text2 }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
        marginBottom: hasBar ? 5 : 0,
      }}>
        <span style={{ fontSize: 13, color: T.text1, fontWeight: 500 }}>{label}</span>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: hasBar ? T.accent : "#d1d5db",
        }}>
          {hasBar ? `${value}%` : value}
        </span>
      </div>
      {hasBar && (
        <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            style={{ height: "100%", background: T.accent, borderRadius: 2 }}
          />
        </div>
      )}
    </div>
  </div>
));
ProgressRow.displayName = "ProgressRow";

// ─────────────────────────────────────────────────────────────────
// Job card
// ─────────────────────────────────────────────────────────────────
const JobCard = memo(({ title, company, initials, avatarBg, location, posted, autoApply }) => {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 6px 22px rgba(0,0,0,0.08)" }}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "18px 20px",
        cursor: "pointer",
        fontFamily: T.font,
        transition: "box-shadow 0.15s",
      }}
    >
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 12,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Company avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: `${avatarBg}1a`,
            border: `1.5px solid ${avatarBg}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: avatarBg,
            flexShrink: 0, letterSpacing: "-0.3px",
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 3 }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: T.text2 }}>
              {company} · {location}
            </div>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setLiked(p => !p); }}
          style={{ border: "none", background: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
        >
          <Heart size={16} style={{
            color: liked ? "#ef4444" : "#d1d5db",
            fill:  liked ? "#ef4444" : "none",
            transition: "all 0.18s",
          }} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: T.text3, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock3 size={11} /> Posted {posted}
        </span>
        {autoApply && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 600, color: T.accent,
            background: T.accentLight,
            borderRadius: 20, padding: "2px 9px",
          }}>
            <Zap size={10} /> Auto Apply
          </span>
        )}
      </div>
    </motion.div>
  );
});
JobCard.displayName = "JobCard";

// ─────────────────────────────────────────────────────────────────
// Stats bar (documents view only)
// ─────────────────────────────────────────────────────────────────
const StatsBar = memo(({ resumes }) => {
  const avg = resumes.length
    ? Math.round(resumes.reduce((a, r) => a + (r.atsScore || 0), 0) / resumes.length)
    : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
      {[
        { label: "Total resumes", value: resumes.length,                               emoji: "📄" },
        { label: "Avg ATS score", value: `${avg}%`,                                    emoji: "🎯" },
        { label: "AI optimized",  value: resumes.filter(r => r.atsScore >= 80).length, emoji: "✨" },
      ].map(s => (
        <div key={s.label} style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 14,
          fontFamily: T.font,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#f0f7ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>{s.emoji}</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.text1, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
});
StatsBar.displayName = "StatsBar";

// ─────────────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────────────
const ResumeDashboard = memo(({
  onNavigateEditor,
  onNavigateAnalyzer,
  initialOpenCreate = false,
  initialOpenUpload = false,
  userName = "Ankur",
}) => {
  const [activeItem,   setActiveItem]   = useState("dashboard");
  const [activeStep,   setActiveStep]   = useState(0);
  const [activeTab,    setActiveTab]    = useState("resumes");
  const [createOpen,   setCreateOpen]   = useState(initialOpenCreate);
  const [uploadOpen,   setUploadOpen]   = useState(initialOpenUpload);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resumes,      setResumes]      = useState(DEMO_RESUMES);
  const [selectedTpl,  setSelectedTpl]  = useState(null);

  // "documents" sidebar item → show docs view; anything else → dashboard home
  const showDashboard = activeItem !== "documents";

  const handleNavClick = useCallback((id) => setActiveItem(id), []);

  const handleEdit      = useCallback(r => onNavigateEditor?.(r.id),   [onNavigateEditor]);
  const handleAnalyze   = useCallback(r => onNavigateAnalyzer?.(r.id), [onNavigateAnalyzer]);
  const handleDuplicate = useCallback(r => setResumes(p => [
    ...p,
    { ...r, id: Date.now().toString(), name: `${r.name} (copy)`, updatedAt: "Just now" },
  ]), []);
  const handleDownload  = useCallback(r => console.log("Download:", r.name), []);
  const handleDelete    = useCallback(r => setDeleteTarget(r), []);
  const confirmDelete   = useCallback(r => setResumes(p => p.filter(x => x.id !== r.id)), []);

  const handleCreateComplete = useCallback(opts => {
    setCreateOpen(false);
    const id = Date.now().toString();
    setResumes(p => [
      { id, name: opts.targetRole || "New Resume", role: opts.targetRole, atsScore: 70, updatedAt: "Just now", color: "#1a56db" },
      ...p,
    ]);
    onNavigateEditor?.(id);
  }, [onNavigateEditor]);

  const handleUploadComplete = useCallback(opts => {
    setUploadOpen(false);
    const id = Date.now().toString();
    setResumes(p => [
      { id, name: opts.name || "Uploaded Resume", atsScore: 65, updatedAt: "Just now", color: "#0e9f6e" },
      ...p,
    ]);
    onNavigateEditor?.(id);
  }, [onNavigateEditor]);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: T.shellBg,
      fontFamily: T.font,
    }}>

      {/* ════════════════════════════════════
          SIDEBAR
          ════════════════════════════════════ */}
      <Sidebar
        activeItem={activeItem}
        onNavClick={handleNavClick}
        userName={userName}
      />

      {/* ════════════════════════════════════
          MAIN AREA
          ════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}>
        {/* Top navbar */}
        <TopNavbar />

        {/* Scrollable content */}
        <main style={{
          flex: 1,
          overflowY: "auto",
          background: T.contentBg,
        }}>
          <AnimatePresence mode="wait">

            {/* ─────────── DASHBOARD HOME ─────────── */}
            {showDashboard ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{ maxWidth: 900, margin: "0 auto", padding: "44px 36px 80px" }}
              >
                {/* Greeting */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  style={{ textAlign: "center", marginBottom: 32 }}
                >
                  <h1 style={{
                    fontSize: 30, fontWeight: 800,
                    color: T.text1, margin: "0 0 6px",
                    letterSpacing: "-0.6px",
                  }}>
                    Hi {userName}!
                  </h1>
                  <p style={{ fontSize: 14, color: T.text3, margin: 0 }}>
                    What's your goal today?
                  </p>
                </motion.div>

                {/* Step progress bar */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 }}
                >
                  <StepProgressBar activeStep={activeStep} onStepClick={setActiveStep} />
                </motion.div>

                {/* Two-column cards */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.35fr",
                    gap: 18,
                    marginBottom: 36,
                    alignItems: "stretch",
                  }}
                >
                  {/* LEFT: Progress card */}
                  <div style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    padding: "22px 24px",
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700,
                      color: T.text3, letterSpacing: "0.10em",
                      textTransform: "uppercase", marginBottom: 6,
                    }}>
                      PROGRESS
                    </div>
                    {PROGRESS_ITEMS.map((item, i) => (
                      <ProgressRow key={i} {...item} />
                    ))}
                  </div>

                  {/* RIGHT: Resume building card */}
                  <div style={{
                    background: T.cardAlt,
                    border: `1px solid ${T.border}`,
                    borderRadius: 16,
                    padding: "22px 24px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}>
                    {/* + icon top-right */}
                    <button
                      onClick={() => setCreateOpen(true)}
                      style={{
                        position: "absolute", top: 16, right: 16,
                        width: 30, height: 30, borderRadius: 8,
                        background: T.accentLight,
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: T.accent,
                      }}
                      title="New resume"
                    >
                      <Plus size={15} />
                    </button>

                    {/* Pill label */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: T.accentLight,
                      borderRadius: 20, padding: "4px 11px",
                      alignSelf: "flex-start", marginBottom: 16,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: T.accent,
                      }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>
                        Resume building
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flex: 1 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 17, fontWeight: 800,
                          color: T.text1, marginBottom: 8, lineHeight: 1.3,
                        }}>
                          Make your resume even better
                        </div>
                        <div style={{
                          fontSize: 13, color: T.text2,
                          lineHeight: 1.65, marginBottom: 22,
                        }}>
                          One small upgrade could lead to an interview.
                          Give it a quick boost before you send it.
                        </div>

                        {/* CTA */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onNavigateEditor?.("current")}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 10,
                            background: T.greenLight,
                            border: `1px solid ${T.greenBorder}`,
                            borderRadius: 10, padding: "9px 14px",
                            cursor: "pointer", fontFamily: T.font,
                          }}
                        >
                          <Plus size={13} style={{ color: T.green }} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.green }}>
                            Add employment history
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 700, color: "#fff",
                            background: T.green, borderRadius: 20, padding: "2px 8px",
                          }}>
                            +25%
                          </span>
                        </motion.button>
                      </div>

                      <MiniResumePreview score={45} />
                    </div>
                  </div>
                </motion.div>

                {/* Job matches */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 18,
                  }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text1, margin: 0 }}>
                      Your job matches
                    </h2>
                    <span style={{ fontSize: 13, color: T.text2 }}>
                      Not right?{" "}
                      <span style={{ color: T.accent, fontWeight: 600, cursor: "pointer" }}>
                        Update your Profile
                      </span>
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {JOB_MATCHES.map((job, i) => (
                      <JobCard key={i} {...job} />
                    ))}
                  </div>
                </motion.div>

                {/* View documents link */}
                <div style={{ textAlign: "center", marginTop: 36 }}>
                  <button
                    onClick={() => setActiveItem("documents")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 24px",
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: 20,
                      fontSize: 13, fontWeight: 600, color: T.text2,
                      cursor: "pointer", fontFamily: T.font,
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                  >
                    View My Resumes <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>

            ) : (

              /* ─────────── DOCUMENTS VIEW ─────────── */
              <motion.div
                key="docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{ maxWidth: 1140, margin: "0 auto", padding: "36px 36px 60px" }}
              >
                {/* Heading */}
                <div style={{ marginBottom: 24 }}>
                  <button
                    onClick={() => setActiveItem("dashboard")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 13, color: T.text2, fontWeight: 500,
                      background: "none", border: "none",
                      cursor: "pointer", padding: "0 0 14px",
                      fontFamily: T.font,
                    }}
                  >
                    ← Dashboard
                  </button>
                  <h1 style={{
                    fontSize: 24, fontWeight: 800,
                    color: T.text1, margin: "0 0 4px",
                    letterSpacing: "-.5px",
                  }}>
                    My documents
                  </h1>
                  <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>
                    Manage and optimize your AI-powered resumes
                  </p>
                </div>

                <StatsBar resumes={resumes} />

                {/* AI Analyzer CTA */}
                <motion.button
                  onClick={onNavigateAnalyzer}
                  whileHover={{ scale: 1.004 }}
                  whileTap={{ scale: 0.998 }}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 22px", marginBottom: 24, borderRadius: 12,
                    background: "linear-gradient(135deg, #1e3a8a 0%, #4f46e5 60%, #7c3aed 100%)",
                    border: "none", cursor: "pointer", textAlign: "left",
                    fontFamily: T.font,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: "rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Sparkles size={17} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                        AI Resume Analyzer
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.70)", marginTop: 2 }}>
                        Get ATS score, keyword analysis, grammar check and fix suggestions
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: "#fff",
                    background: "rgba(255,255,255,.15)",
                    borderRadius: 20, padding: "6px 16px", whiteSpace: "nowrap",
                  }}>
                    Analyze now →
                  </span>
                </motion.button>

                {/* Tabs */}
                <div style={{
                  display: "flex", gap: 0,
                  borderBottom: `1.5px solid ${T.border}`,
                  marginBottom: 28,
                }}>
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 7,
                          padding: "11px 20px", border: "none",
                          borderBottom: active ? `2.5px solid ${T.accent}` : "2.5px solid transparent",
                          background: "none",
                          color: active ? T.accent : T.text2,
                          fontSize: 13, fontWeight: active ? 700 : 500,
                          cursor: "pointer", marginBottom: -1.5,
                          fontFamily: T.font,
                          transition: "color .12s",
                        }}
                      >
                        <Icon size={13} /> {label}
                        {id === "resumes" && resumes.length > 0 && (
                          <span style={{
                            background: active ? T.accent : "#e5e7eb",
                            color: active ? "#fff" : T.text2,
                            fontSize: 10, fontWeight: 700,
                            borderRadius: 20, padding: "1px 7px",
                          }}>
                            {resumes.length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeTab === "resumes" && (
                      <ResumeGrid
                        resumes={resumes}
                        onEdit={handleEdit}
                        onAnalyze={handleAnalyze}
                        onDuplicate={handleDuplicate}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onCreateNew={() => setCreateOpen(true)}
                        onUpload={() => setUploadOpen(true)}
                      />
                    )}

                    {activeTab === "templates" && (
                      <ResumeTemplateGallery
                        selectedId={selectedTpl?.id}
                        onSelectTemplate={t => { setSelectedTpl(t); setCreateOpen(true); }}
                      />
                    )}

                    {activeTab === "analyzed" && (
                      <div style={{
                        textAlign: "center", padding: "72px 24px",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 16,
                      }}>
                        <div style={{
                          width: 68, height: 68, borderRadius: 18,
                          background: "#f0f7ff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <FileSearch size={30} color={T.accent} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text1, margin: "0 0 5px" }}>
                            No analyzed resumes yet
                          </h3>
                          <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>
                            Run the AI analyzer on any resume to see results here.
                          </p>
                        </div>
                        <button
                          onClick={onNavigateAnalyzer}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 22px", borderRadius: 8,
                            background: T.accent, border: "none",
                            color: "#fff", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", fontFamily: T.font,
                          }}
                        >
                          <Sparkles size={14} /> Analyze a resume
                        </button>
                      </div>
                    )}

                    {activeTab === "recent" && (
                      <ResumeGrid
                        resumes={[...resumes].slice(0, 3)}
                        onEdit={handleEdit}
                        onAnalyze={handleAnalyze}
                        onDuplicate={handleDuplicate}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onCreateNew={() => setCreateOpen(true)}
                        onUpload={() => setUploadOpen(true)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ════════════════════════════════════
          FLOATING AI COACH BUBBLE
          ════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.3 }}
        style={{
          position: "fixed", bottom: 24, right: 28,
          zIndex: 200,
        }}
      >
        <div style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: "11px 18px",
          display: "flex", alignItems: "center", gap: 11,
          boxShadow: "0 8px 28px rgba(0,0,0,0.11)",
          cursor: "text",
          fontFamily: T.font,
        }}>
          {/* Spinning logo icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Sparkles size={13} color="#fff" />
          </motion.div>
          <span style={{ fontSize: 13, color: T.text2, whiteSpace: "nowrap", fontWeight: 500 }}>
            Ask AI coach anything.
          </span>
        </div>
      </motion.div>

      {/* ════════════════════════════════════
          MODALS (unchanged)
          ════════════════════════════════════ */}
      <CreateResumeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onComplete={handleCreateComplete}
      />
      <UploadResumeModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={handleUploadComplete}
      />
      <DeleteResumeDialog
        open={!!deleteTarget}
        resume={deleteTarget}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
});

ResumeDashboard.displayName = "ResumeDashboard";
export default ResumeDashboard;