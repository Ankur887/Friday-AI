// FILE: src/components/resume/ResumeSidebar.jsx
// STYLE: exact resume.io sidebar — white bg, logo+byline, user avatar with score,
//        full nav (Dashboard, Documents, Jobs, Job Tracker, Auto Apply, Interview Prep,
//        Salary Analyzer, Resume Distribution, Unlimited Learning, Job Search Method,
//        Coaching, Other), expandable children, Auto Apply extension footer

import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FileText, Briefcase, BookmarkCheck,
  Zap, Mic2, BarChart2, Send, GraduationCap, Search,
  ChevronRight, ChevronDown, Settings, User, MoreHorizontal,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard",            icon: LayoutDashboard },
  { id: "documents",   label: "Documents",            icon: FileText,       children: ["Resumes", "Cover Letters"] },
  { id: "jobs",        label: "Jobs",                 icon: Briefcase },
  { id: "job-tracker", label: "Job Tracker",          icon: BookmarkCheck },
  { id: "auto-apply",  label: "Auto Apply",           icon: Zap },
  { id: "interview",   label: "Interview Prep",       icon: Mic2 },
  { id: "salary",      label: "Salary Analyzer",      icon: BarChart2 },
  { id: "distribute",  label: "Resume Distribution",  icon: Send },
  { id: "learning",    label: "Unlimited Learning",   icon: GraduationCap },
  { id: "job-search",  label: "Job Search Method",    icon: Search,         children: ["Strategy", "Resources"] },
  { id: "coaching",    label: "Coaching",             icon: User },
  { id: "other",       label: "Other",                icon: MoreHorizontal, children: ["Help", "Feedback"] },
];

const ResumeSidebar = memo(({ activeId = "dashboard", onNavigate, userName = "Ankur" }) => {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        width: 220,
        flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid #e8e8e4",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0, left: 0,
        zIndex: 100,
        overflowY: "auto",
        overflowX: "hidden",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Logo ─────────────────────────────────────── */}
      <div style={{
        padding: "18px 20px 14px",
        borderBottom: "1px solid #f0f0ec",
        flexShrink: 0,
      }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => onNavigate?.("/")}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "#1a1a2e",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <rect x="2" y="2"    width="13" height="2"   rx="1"   fill="white"/>
              <rect x="2" y="6"    width="9"  height="1.6" rx=".8"  fill="white" opacity=".8"/>
              <rect x="2" y="10"   width="11" height="1.6" rx=".8"  fill="white" opacity=".8"/>
              <rect x="2" y="13.5" width="7"  height="1.6" rx=".8"  fill="white" opacity=".6"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1a2e", lineHeight: 1, letterSpacing: "-.2px" }}>
              resume.io
            </div>
            <div style={{ fontSize: 9, color: "#9ca3af", lineHeight: 1, marginTop: 2 }}>
              by career.io
            </div>
          </div>
        </div>
      </div>

      {/* ── User profile ─────────────────────────────── */}
      <div style={{
        padding: "14px 20px 12px",
        borderBottom: "1px solid #f0f0ec",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar with score badge */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #f97316, #ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 14, color: "#fff",
            }}>
              {(userName?.[0] || "A").toUpperCase()}
            </div>
            <div style={{
              position: "absolute", bottom: -3, right: -3,
              width: 18, height: 18, borderRadius: "50%",
              background: "#f97316",
              border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7, fontWeight: 800, color: "#fff",
            }}>
              5%
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "#1a1a2e",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: "#4f46e5", cursor: "pointer", marginTop: 2 }}>
              Set your target role
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: "6px 0", overflowY: "auto" }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon, children: sub }) => {
          const isActive   = activeId === id;
          const isExpanded = !!expanded[id];
          const hasSub     = sub?.length > 0;

          return (
            <div key={id}>
              <button
                onClick={() => hasSub ? toggle(id) : onNavigate?.(id)}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center",
                  gap: 9, padding: "9px 20px",
                  border: "none",
                  borderLeft: isActive ? "3px solid #4f46e5" : "3px solid transparent",
                  background: isActive ? "#f0f0ff" : "transparent",
                  color: isActive ? "#4f46e5" : "#374151",
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.1s",
                  lineHeight: 1,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#f9f9f7";
                    e.currentTarget.style.color = "#111827";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#374151";
                  }
                }}
              >
                <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {hasSub && (
                  isExpanded
                    ? <ChevronDown size={12} style={{ color: "#9ca3af", flexShrink: 0 }} />
                    : <ChevronRight size={12} style={{ color: "#9ca3af", flexShrink: 0 }} />
                )}
              </button>

              {/* Sub-items */}
              {hasSub && isExpanded && (
                <div style={{ paddingLeft: 44, paddingBottom: 4 }}>
                  {sub.map(child => (
                    <button
                      key={child}
                      style={{
                        width: "100%", padding: "7px 16px",
                        border: "none", background: "none",
                        color: "#6b7280", fontSize: 12,
                        cursor: "pointer", textAlign: "left",
                        borderRadius: 6,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#4f46e5"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#6b7280"; }}
                      onClick={() => onNavigate?.(child.toLowerCase())}
                    >
                      {child}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer: Auto Apply Extension ─────────────── */}
      <div style={{
        padding: "12px 14px",
        borderTop: "1px solid #f0f0ec",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 12px",
          background: "#f9f9f7",
          borderRadius: 8,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#f0f0ff"}
        onMouseLeave={e => e.currentTarget.style.background = "#f9f9f7"}
        >
          <Zap size={13} style={{ color: "#f97316", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>
            Get Auto Apply Extension
          </span>
        </div>
      </div>
    </motion.aside>
  );
});

ResumeSidebar.displayName = "ResumeSidebar";
export default ResumeSidebar;