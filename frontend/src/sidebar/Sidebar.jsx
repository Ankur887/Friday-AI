import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import SignIn from "../Auth/Signin";
import SignUp from "../Auth/Signup";
import SidebarPanels from "./SidebarPanels";

const API = "http://127.0.0.1:8000";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconChat = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconIDE = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IconVisualizer = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    <polyline points="7 10 10 7 13 10 17 6"/>
  </svg>
);
const IconInterview = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IconResume = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="18" y="3" width="4" height="18" rx="1"/>
    <rect x="10" y="8" width="4" height="13" rx="1"/>
    <rect x="2" y="13" width="4" height="8" rx="1"/>
  </svg>
);
const IconRoadmap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/>
    <line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);
const IconChevron = ({ up }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
    style={{ transform: up ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
    <path d="M7 10l5 5 5-5z"/>
  </svg>
);
const IconPersonalization = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
  </svg>
);
const IconProfile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconSettings = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconHelpSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconAboutSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ── Conversations dropdown (hovers under "New chat") ──────────────────────────
function ConversationsDropdown({
  conversations, selectedConversationId,
  onSelectConversation, onConversationDeleted, onNewChat, navigate,
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const t = localStorage.getItem("access_token");
      const res = await fetch(`${API}/conversation/${id}`, {
        method: "DELETE",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (res.ok) onConversationDeleted?.(id);
    } catch (err) { console.error(err); }
    setDeletingId(null);
  };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", left: 0,
      width: 260,
      background: "#1a1b1c",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)",
      overflow: "hidden",
      zIndex: 400,
      animation: "dropIn 0.18s cubic-bezier(0.34,1.2,0.64,1)",
    }}>
      {/* New chat button inside dropdown */}
      <button
        onClick={() => { navigate("/"); onNewChat(); }}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "11px 14px",
          background: "transparent", border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          color: "#00F5D4", fontSize: 13, cursor: "pointer",
          fontFamily: "inherit", textAlign: "left",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,245,212,0.06)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <IconPlus />
        <span style={{ fontWeight: 600 }}>New chat</span>
      </button>

      {/* List */}
      <div style={{ maxHeight: 320, overflowY: "auto", padding: "6px 0",
        scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}>
        {conversations.length === 0 && (
          <p style={{ fontSize: 12, color: "#4a4d52", padding: "10px 14px", margin: 0, fontStyle: "italic" }}>
            No conversations yet
          </p>
        )}
        {conversations.length > 0 && (
          <p style={{ fontSize: 10, fontWeight: 600, color: "#4a4d52", padding: "4px 14px 6px",
            letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Recent</p>
        )}
        {conversations.map((conv) => {
          const sel = conv.id === selectedConversationId;
          const hov = hoveredId === conv.id;
          const del = deletingId === conv.id;
          return (
            <div
              key={conv.id}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: "flex", alignItems: "center",
                margin: "1px 6px", borderRadius: 8,
                background: sel ? "rgba(255,255,255,0.08)" : hov ? "rgba(255,255,255,0.04)" : "transparent",
                transition: "background 0.1s",
              }}
            >
              <button
                onClick={() => { navigate("/"); onSelectConversation(conv.id); }}
                style={{
                  flex: 1, textAlign: "left", background: "transparent",
                  color: sel ? "#e8eaed" : "#9aa0a6",
                  border: "none", borderRadius: 8,
                  padding: "8px 6px 8px 10px", fontSize: 13,
                  cursor: "pointer", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                  fontFamily: "inherit",
                }}
              >
                {conv.title}
              </button>
              {(hov || sel) && (
                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  disabled={del}
                  style={{
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    width: 24, height: 24, borderRadius: 6, border: "none",
                    background: "transparent", color: "#6b6f76",
                    cursor: del ? "not-allowed" : "pointer", marginRight: 4,
                    transition: "color 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e57373"}
                  onMouseLeave={e => e.currentTarget.style.color = "#6b6f76"}
                >
                  <IconTrash />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── User dropdown menu ────────────────────────────────────────────────────────
function UserDropdown({ user, initials, onOpenPanel, onLogout }) {
  const menuItems = [
    { icon: <IconPersonalization />, label: "Personalization", key: "personalization" },
    { icon: <IconProfile />,         label: "Profile",          key: "profile" },
    { icon: <IconSettings />,        label: "Settings",         key: "settings" },
    { icon: <IconHelpSmall />,       label: "Help",             key: "help" },
    { icon: <IconAboutSmall />,      label: "About",            key: "about" },
  ];

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0,
      width: 220,
      background: "#1a1b1c",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3)",
      overflow: "hidden",
      zIndex: 400,
      animation: "dropIn 0.18s cubic-bezier(0.34,1.2,0.64,1)",
    }}>
      {/* User header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "#141516",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden",
          }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} />
              : initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#e3e3e3",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                padding: "1px 5px", borderRadius: 4,
                background: user?.subscription_type === "pro" ? "rgba(124,77,255,0.2)" : "rgba(34,197,94,0.15)",
                color: user?.subscription_type === "pro" ? "#b39ddb" : "#4ade80",
                textTransform: "uppercase",
              }}>
                {user?.subscription_type === "pro" ? "Pro" : "Free"}
              </span>
              <span style={{ fontSize: 11, color: "#6b6f76" }}>@{user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: "4px 0" }}>
        {menuItems.map(({ icon, label, key }) => (
          <button
            key={key}
            onClick={() => onOpenPanel(key)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "9px 14px",
              background: "transparent", border: "none",
              color: "#c9cace", fontSize: 13.5,
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              transition: "background 0.1s, color 0.1s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#252627"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#c9cace"; }}
          >
            <span style={{ color: "#8b8f96", flexShrink: 0 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />

      <div style={{ padding: "4px 0 6px" }}>
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "9px 14px",
            background: "transparent", border: "none",
            color: "#e57373", fontSize: 13.5,
            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            transition: "background 0.1s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#252627"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ color: "#e57373", flexShrink: 0 }}><IconLogout /></span>
          Log out
        </button>
      </div>
    </div>
  );
}

// ── Individual nav pill ───────────────────────────────────────────────────────
function NavPill({ icon, label, active, onClick, badge }) {
  const [hov, setHov] = useState(false);
  const isActive = active;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px",
        background: isActive
          ? "rgba(255,255,255,0.1)"
          : hov ? "rgba(255,255,255,0.06)" : "transparent",
        border: "none",
        borderRadius: 8,
        color: isActive ? "#e8eaed" : hov ? "#c9cace" : "#8b8f96",
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.15s, color 0.15s",
        whiteSpace: "nowrap",
        position: "relative",
      }}
    >
      <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.8 }}>{icon}</span>
      {label}
      {/* Active underline dot */}
      {isActive && (
        <span style={{
          position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
          width: 16, height: 2, borderRadius: 1,
          background: "linear-gradient(90deg, #6366f1, #a855f7)",
        }} />
      )}
      {badge && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#00F5D4", flexShrink: 0,
        }} />
      )}
    </button>
  );
}

// ── Divider between nav groups ────────────────────────────────────────────────
function NavDivider() {
  return <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)", margin: "0 4px", flexShrink: 0 }} />;
}

// ── Main top nav bar ──────────────────────────────────────────────────────────
export default function Sidebar({
  // Keep same prop interface so the rest of the app needs zero changes
  isSidebarOpen, setIsSidebarOpen,
  conversations, selectedConversationId,
  onSelectConversation, onNewChat, onConversationDeleted,
}) {
  const { user, logout }      = useAuth();
  const navigate               = useNavigate();
  const location               = useLocation();
  const [visible, setVisible]  = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const barRef   = useRef(null);
  const triggerRef = useRef(null);
  const hideTimer  = useRef(null);

  const initials = user
    ? (`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`).toUpperCase() || user.username?.[0]?.toUpperCase()
    : "";

  // ── Hover zone: invisible 8px strip at very top ───────────────────────────
  const showBar  = useCallback(() => {
    clearTimeout(hideTimer.current);
    setVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setChatOpen(false);
      setUserOpen(false);
    }, 280);
  }, []);

  const cancelHide = useCallback(() => {
    clearTimeout(hideTimer.current);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setChatOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Route helpers
  const is = (p) => location.pathname === p;

  const navItems = [
    { icon: <IconChat />,       label: "Chat",       path: "/" },
    { icon: <IconVisualizer />, label: "Visualizer", path: "/visualize" },
    { icon: <IconIDE />,        label: "IDE",         path: "/ide" },
  ];
  const careerItems = [
    { icon: <IconInterview />, label: "Interview",  path: "/interview" },
    { icon: <IconResume />,    label: "Resume",     path: "/resume" },
    { icon: <IconDashboard />, label: "Dashboard",  path: "/dashboard" },
    { icon: <IconRoadmap />,   label: "Roadmap",    path: "/roadmap" },
  ];

  return (
    <>
      {/* ── Invisible hover trigger at very top of screen ── */}
      <div
        ref={triggerRef}
        onMouseEnter={showBar}
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: 8,
          zIndex: 599,
          cursor: "default",
        }}
      />

      {/* ── The actual nav bar ── */}
      <div
        ref={barRef}
        onMouseEnter={cancelHide}
        onMouseLeave={scheduleHide}
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 600,
          height: 52,
          background: "rgba(14,14,18,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center",
          padding: "0 16px",
          gap: 4,
          // Slide in from top
          transform: visible ? "translateY(0)" : "translateY(-100%)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease",
          boxShadow: visible ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Logo mark */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginRight: 12, flexShrink: 0,
          padding: "4px 8px 4px 4px",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            width: 26, height: 26,
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="#6366f1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="rgba(99,102,241,0.4)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Syne', 'Inter', sans-serif",
            fontSize: 13, fontWeight: 700, color: "#c9cace",
            letterSpacing: "-0.02em",
          }}>Friday</span>
        </div>

        {/* ── Chat (with dropdown) ── */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => { setChatOpen(v => !v); setUserOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px",
              background: chatOpen || is("/")
                ? "rgba(255,255,255,0.08)"
                : "transparent",
              border: "none", borderRadius: 8,
              color: chatOpen || is("/") ? "#e8eaed" : "#8b8f96",
              fontSize: 13, fontWeight: chatOpen || is("/") ? 500 : 400,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.15s, color 0.15s",
              position: "relative",
            }}
            onMouseEnter={e => { if (!chatOpen && !is("/")) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#c9cace"; }}}
            onMouseLeave={e => { if (!chatOpen && !is("/")) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b8f96"; }}}
          >
            <IconChat />
            Chat
            <IconChevron up={chatOpen} />
            {(chatOpen || is("/")) && (
              <span style={{
                position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)",
                width: 16, height: 2, borderRadius: 1,
                background: "linear-gradient(90deg, #6366f1, #a855f7)",
              }} />
            )}
          </button>

          {chatOpen && (
            <ConversationsDropdown
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={(id) => { onSelectConversation(id); setChatOpen(false); }}
              onConversationDeleted={onConversationDeleted}
              onNewChat={() => { onNewChat(); setChatOpen(false); }}
              navigate={navigate}
            />
          )}
        </div>

        {/* Main nav items */}
        {navItems.slice(1).map(({ icon, label, path }) => (
          <NavPill
            key={path}
            icon={icon}
            label={label}
            active={is(path)}
            onClick={() => navigate(path)}
          />
        ))}

        {/* Career OS divider */}
        <NavDivider />

        {/* Career OS label */}
        <span style={{
          fontSize: 9.5, fontWeight: 600, color: "#4a4d52",
          letterSpacing: "0.08em", textTransform: "uppercase",
          marginRight: 2, flexShrink: 0,
          userSelect: "none",
        }}>Career OS</span>

        {/* Career items */}
        {careerItems.map(({ icon, label, path }) => (
          <NavPill
            key={path}
            icon={icon}
            label={label}
            active={is(path)}
            onClick={() => navigate(path)}
          />
        ))}

        {/* Right side spacer */}
        <div style={{ flex: 1 }} />

        {/* ── Auth / User section ── */}
        {!user && (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setShowSignIn(true)}
              style={{
                padding: "6px 14px", background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8, color: "#c9cace", fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#c9cace"; }}
            >Sign in</button>
            <button
              onClick={() => setShowSignUp(true)}
              style={{
                padding: "6px 14px", background: "#6366f1",
                border: "none", borderRadius: 8, color: "#fff", fontSize: 13,
                fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#5153cc"}
              onMouseLeave={e => e.currentTarget.style.background = "#6366f1"}
            >Sign up</button>
          </div>
        )}

        {user && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => { setUserOpen(v => !v); setChatOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "4px 10px 4px 4px",
                background: userOpen ? "rgba(255,255,255,0.08)" : "transparent",
                border: "1px solid",
                borderColor: userOpen ? "rgba(255,255,255,0.12)" : "transparent",
                borderRadius: 10, cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { if (!userOpen) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}}
              onMouseLeave={e => { if (!userOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden",
              }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                  : initials}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#e3e3e3", lineHeight: 1.2 }}>
                  {user?.first_name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.4px",
                    padding: "0px 4px", borderRadius: 3,
                    background: user?.subscription_type === "pro" ? "rgba(124,77,255,0.2)" : "rgba(34,197,94,0.15)",
                    color: user?.subscription_type === "pro" ? "#b39ddb" : "#4ade80",
                    textTransform: "uppercase",
                  }}>
                    {user?.subscription_type === "pro" ? "Pro" : "Free"}
                  </span>
                </div>
              </div>
              <IconChevron up={userOpen} />
            </button>

            {userOpen && (
              <UserDropdown
                user={user}
                initials={initials}
                onOpenPanel={(key) => { setActivePanel(key); setUserOpen(false); }}
                onLogout={async () => { setUserOpen(false); await logout(); }}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showSignIn && (
        <SignIn
          onClose={() => setShowSignIn(false)}
          onSwitchToSignUp={() => { setShowSignIn(false); setShowSignUp(true); }}
        />
      )}
      {showSignUp && (
        <SignUp
          onClose={() => setShowSignUp(false)}
          onSwitchToLogin={() => { setShowSignUp(false); setShowSignIn(true); }}
        />
      )}
      <SidebarPanels activePanel={activePanel} onClose={() => setActivePanel(null)} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&display=swap');

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes menuSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3a3b3c; border-radius: 4px; }
      `}</style>
    </>
  );
}