import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../Auth/AuthContext";
import { usePrefs } from "../Auth/PrefsContext";

const API = "http://127.0.0.1:8000";

// ── Nav icons ─────────────────────────────────────────────────────────────────
const IGeneral        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IAccount        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IPrivacy        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IBilling        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const INotifications  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IHelp           = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></svg>;
const IAbout          = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const ISearch         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IClose          = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ── Reusable form components ──────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb", margin: "0 0 24px", letterSpacing: "-0.3px" }}>
      {children}
    </h2>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#2a2b2c", margin: "8px 0" }} />;
}

function FieldRow({ label, desc, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", borderBottom: "1px solid #232425" }}>
      <div style={{ flex: 1, paddingRight: 24 }}>
        <div style={{ fontSize: 14.5, color: "#e5e7eb", fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? "#7c3aed" : "#374151", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: "#2a2b2c", color: "#e5e7eb", border: "1px solid #3a3b3c", borderRadius: 8, padding: "7px 12px", fontSize: 13.5, cursor: "pointer", outline: "none", fontFamily: "inherit" }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function InputField({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ background: "#2a2b2c", color: "#f9fafb", border: "1px solid #3a3b3c", borderRadius: 8, padding: "9px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", width: 220, boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#6366f1"}
      onBlur={e => e.target.style.borderColor = "#3a3b3c"}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", background: "#2a2b2c", color: "#f9fafb", border: "1px solid #3a3b3c", borderRadius: 10, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = "#6366f1"}
      onBlur={e => e.target.style.borderColor = "#3a3b3c"}
    />
  );
}

function SaveBtn({ onClick, saved, label = "Save changes" }) {
  return (
    <button onClick={onClick}
      style={{ padding: "10px 22px", background: saved ? "#16a34a" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s", fontFamily: "inherit" }}
      onMouseEnter={e => { if (!saved) e.currentTarget.style.background = "#5153cc"; }}
      onMouseLeave={e => { if (!saved) e.currentTarget.style.background = saved ? "#16a34a" : "#6366f1"; }}>
      {saved ? "✓ Saved!" : label}
    </button>
  );
}

// ── Appearance toggle (System / Light / Dark) ─────────────────────────────────
function AppearanceToggle({ value, onChange }) {
  const opts = [
    { val: "system", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { val: "light",  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
    { val: "dark",   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
  ];
  return (
    <div style={{ display: "flex", background: "#1a1b1c", border: "1px solid #333", borderRadius: 10, overflow: "hidden" }}>
      {opts.map(o => (
        <button key={o.val} onClick={() => onChange(o.val)}
          title={o.val}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 34, border: "none", background: value === o.val ? "#2e2f30" : "transparent", color: value === o.val ? "#e5e7eb" : "#6b7280", cursor: "pointer", transition: "background 0.15s, color 0.15s" }}>
          {o.icon}
        </button>
      ))}
    </div>
  );
}

// ── CONTENT PANELS ────────────────────────────────────────────────────────────

function GeneralContent() {
  const { prefs, savePrefs } = usePrefs();
  const [local, setLocal] = useState({ ...prefs });
  const [saved, setSaved] = useState(false);

  // keep local in sync if prefs change externally
  useEffect(() => { setLocal({ ...prefs }); }, [prefs]);

  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    savePrefs(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SectionHeading>General</SectionHeading>

      <FieldRow label="Appearance" desc="Choose your interface theme">
        <AppearanceToggle value={local.theme} onChange={v => set("theme", v)} />
      </FieldRow>

      <FieldRow label="Chat font size" desc="Adjust the size of text in conversations">
        <Select value={local.fontSize} onChange={v => set("fontSize", v)} options={[
          { value: "small",  label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large",  label: "Large" },
        ]} />
      </FieldRow>

      <FieldRow label="Compact mode" desc="Reduce spacing between messages">
        <Toggle value={!!local.compactMode} onChange={v => set("compactMode", v)} />
      </FieldRow>

      <FieldRow label="Animations" desc="Enable smooth UI transitions and effects">
        <Toggle value={!!local.animations} onChange={v => set("animations", v)} />
      </FieldRow>

      <FieldRow label="Show timestamps" desc="Display time on each message">
        <Toggle value={!!local.timestamps} onChange={v => set("timestamps", v)} />
      </FieldRow>

      <FieldRow label="Response style" desc="How Friday structures its answers">
        <Select value={local.responseStyle} onChange={v => set("responseStyle", v)} options={[
          { value: "concise",  label: "Concise" },
          { value: "balanced", label: "Balanced" },
          { value: "detailed", label: "Detailed" },
        ]} />
      </FieldRow>

      <FieldRow label="Code theme" desc="Syntax highlighting style for code blocks">
        <Select value={local.codeTheme} onChange={v => set("codeTheme", v)} options={[
          { value: "oneDark", label: "One Dark" },
          { value: "github",  label: "GitHub" },
          { value: "dracula", label: "Dracula" },
          { value: "monokai", label: "Monokai" },
        ]} />
      </FieldRow>

      <FieldRow label="Language" desc="Display language for the interface">
        <Select value={local.language} onChange={v => set("language", v)} options={[
          { value: "en", label: "English" },
          { value: "hi", label: "Hindi" },
          { value: "es", label: "Spanish" },
          { value: "fr", label: "French" },
          { value: "de", label: "German" },
        ]} />
      </FieldRow>

      <div style={{ marginTop: 28 }}>
        <SaveBtn onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

function AccountContent() {
  const { user, token } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName,  setLastName]  = useState(user?.last_name  || "");
  const [nickname,  setNickname]  = useState(user?.first_name || "");
  const [bio,       setBio]       = useState(() => localStorage.getItem("friday_bio") || "");
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  // keep fields in sync if user loads after mount
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name   || "");
      setNickname(user.first_name  || "");
    }
  }, [user]);

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";

  const handleSave = async () => {
    setError("");
    // Save bio locally always
    localStorage.setItem("friday_bio", bio);

    // Try to save name to backend if token available
    if (token) {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ first_name: firstName, last_name: lastName }),
        });
        if (!res.ok) throw new Error("Failed to save");
      } catch {
        // Silent fail — profile update is non-critical
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SectionHeading>Account</SectionHeading>

      <FieldRow label="Avatar" desc="">
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", overflow: "hidden" }}>
          {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: 40, height: 40, objectFit: "cover" }} /> : initials}
        </div>
      </FieldRow>

      <FieldRow label="Full name" desc="">
        <div style={{ display: "flex", gap: 8 }}>
          <InputField value={firstName} onChange={setFirstName} placeholder="First" />
          <InputField value={lastName}  onChange={setLastName}  placeholder="Last" />
        </div>
      </FieldRow>

      <FieldRow label="What should Friday call you?" desc="">
        <InputField value={nickname} onChange={setNickname} placeholder="Nickname" />
      </FieldRow>

      <FieldRow label="Username" desc="">
        <span style={{ fontSize: 14, color: "#9ca3af" }}>@{user?.username}</span>
      </FieldRow>

      <FieldRow label="Email" desc="">
        <span style={{ fontSize: 14, color: "#9ca3af" }}>{user?.email}</span>
      </FieldRow>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 14.5, color: "#e5e7eb", fontWeight: 500, marginBottom: 10 }}>
          Instructions for Friday
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10, lineHeight: 1.5 }}>
          Friday will keep these in mind across all your conversations.
        </div>
        <TextArea value={bio} onChange={setBio} placeholder="e.g. keep explanations brief and to the point" />
      </div>

      {error && <div style={{ marginTop: 8, fontSize: 13, color: "#ef4444" }}>{error}</div>}

      <div style={{ marginTop: 24 }}>
        <SaveBtn onClick={handleSave} saved={saved} />
      </div>

      <Divider />
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 12 }}>Danger zone</div>
        <button style={{ padding: "9px 18px", background: "transparent", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 8, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          Delete account
        </button>
      </div>
    </div>
  );
}

function PrivacyContent() {
  // Load from localStorage on mount
  const load = () => {
    try { return JSON.parse(localStorage.getItem("friday_privacy") || "{}"); } catch { return {}; }
  };

  const [dataCollection, setDataCollection] = useState(() => load().dataCollection ?? true);
  const [twoFactor,      setTwoFactor]      = useState(() => load().twoFactor      ?? false);
  const [sessionTimeout, setSessionTimeout] = useState(() => load().sessionTimeout ?? "7d");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("friday_privacy", JSON.stringify({ dataCollection, twoFactor, sessionTimeout }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const t = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API}/conversations`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a"); a.href = url; a.download = "friday_conversations.json"; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Export failed. Make sure you are signed in."); }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Delete ALL conversations? This cannot be undone.")) return;
    const t = localStorage.getItem("access_token");
    try {
      await fetch(`${API}/conversations/all`, { method: "DELETE", headers: t ? { Authorization: `Bearer ${t}` } : {} });
      alert("All conversations deleted.");
    } catch { alert("Failed to clear history."); }
  };

  return (
    <div>
      <SectionHeading>Privacy & Security</SectionHeading>

      <FieldRow label="Data collection" desc="Help improve Friday with anonymous usage data">
        <Toggle value={dataCollection} onChange={setDataCollection} />
      </FieldRow>

      <FieldRow label="Two-factor authentication" desc="Add an extra layer of security to your account">
        <Toggle value={twoFactor} onChange={setTwoFactor} />
      </FieldRow>

      <FieldRow label="Session timeout" desc="Automatically log out after a period of inactivity">
        <Select value={sessionTimeout} onChange={setSessionTimeout} options={[
          { value: "1d",    label: "1 day" },
          { value: "7d",    label: "7 days" },
          { value: "30d",   label: "30 days" },
          { value: "never", label: "Never" },
        ]} />
      </FieldRow>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={handleExport}
          style={{ padding: "10px 18px", background: "#2a2b2c", color: "#e5e7eb", border: "1px solid #3a3b3c", borderRadius: 8, fontSize: 13.5, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "#333"}
          onMouseLeave={e => e.currentTarget.style.background = "#2a2b2c"}>
          📥 Export all my data
        </button>
        <button onClick={handleClearHistory}
          style={{ padding: "10px 18px", background: "#2a2b2c", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13.5, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "#2a2b2c"}>
          🗑 Clear all chat history
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <SaveBtn onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

function BillingContent() {
  const { user } = useAuth();
  const isPro = user?.subscription_type === "pro";

  return (
    <div>
      <SectionHeading>Billing</SectionHeading>

      <div style={{ background: isPro ? "rgba(124,58,237,0.12)" : "rgba(99,102,241,0.08)", border: `1px solid ${isPro ? "rgba(167,139,250,0.3)" : "rgba(99,102,241,0.25)"}`, borderRadius: 14, padding: "20px 22px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{isPro ? "Pro Plan" : "Free Plan"}</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>
              {isPro ? "Unlimited conversations, priority support" : "Basic access to ARIA"}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: isPro ? "rgba(167,139,250,0.2)" : "rgba(99,102,241,0.15)", color: isPro ? "#c4b5fd" : "#818cf8", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {isPro ? "Active" : "Free"}
          </span>
        </div>
        {!isPro && (
          <button style={{ marginTop: 16, width: "100%", padding: "11px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#5153cc"}
            onMouseLeave={e => e.currentTarget.style.background = "#6366f1"}>
            Upgrade to Pro
          </button>
        )}
      </div>

      <FieldRow label="Billing email" desc={user?.email || ""}><span /></FieldRow>
      <FieldRow label="Payment method" desc="No payment method on file">
        <button style={{ padding: "6px 14px", background: "#2a2b2c", color: "#e5e7eb", border: "1px solid #3a3b3c", borderRadius: 7, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
      </FieldRow>
    </div>
  );
}

function NotificationsContent() {
  const load = () => {
    try { return JSON.parse(localStorage.getItem("friday_notifications") || "{}"); } catch { return {}; }
  };

  const [push,   setPush]   = useState(() => load().push   ?? true);
  const [sounds, setSounds] = useState(() => load().sounds ?? false);
  const [enter,  setEnter]  = useState(() => load().enter  ?? true);
  const [saved,  setSaved]  = useState(false);

  const handleSave = () => {
    localStorage.setItem("friday_notifications", JSON.stringify({ push, sounds, enter }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <SectionHeading>Notifications</SectionHeading>

      <FieldRow label="Push notifications" desc="Get notified about updates and responses">
        <Toggle value={push} onChange={setPush} />
      </FieldRow>
      <FieldRow label="Sound effects" desc="Play sounds when sending or receiving messages">
        <Toggle value={sounds} onChange={setSounds} />
      </FieldRow>
      <FieldRow label="Enter to send" desc="Press Enter to send, Shift+Enter for a new line">
        <Toggle value={enter} onChange={setEnter} />
      </FieldRow>

      <div style={{ marginTop: 28 }}>
        <SaveBtn onClick={handleSave} saved={saved} />
      </div>
    </div>
  );
}

function HelpContent() {
  const faqs = [
    { q: "How do I start a new conversation?", a: "Click the '+ New chat' button in the top of the sidebar." },
    { q: "Can Friday run Python code?",         a: "Yes! Code blocks have a ▶ Run button. Click it to execute instantly, or ✏ Edit to modify first." },
    { q: "How do I delete a conversation?",     a: "Hover over any conversation in the sidebar and click the trash icon." },
    { q: "Is my data private?",                 a: "Yes. Your conversations are tied to your account only." },
    { q: "What AI model does Friday use?",      a: "Friday is powered by LLaMA 3.3 70B via Groq — one of the fastest inference engines available." },
    { q: "Is Friday free to use?",              a: "Yes, the free tier gives you full access. Pro adds unlimited history and priority responses." },
  ];
  const [open, setOpen] = useState(null);

  return (
    <div>
      <SectionHeading>Help & Support</SectionHeading>

      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        {[
          { icon: "✉", label: "Email support",    sub: "fridayaiassistant5511@gmail.com" },
          { icon: "📞", label: "Phone / WhatsApp", sub: "+91 9956178926" },
        ].map((c, i) => (
          <div key={i} style={{ flex: 1, background: "#232425", borderRadius: 12, padding: "16px", border: "1px solid #2e2f30" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#e5e7eb", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
        FAQ
      </div>
      {faqs.map((f, i) => (
        <div key={i} style={{ borderBottom: "1px solid #232425" }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "#e5e7eb" }}>{f.q}</span>
            <span style={{ color: "#6b7280", fontSize: 18, flexShrink: 0, transform: open === i ? "rotate(45deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>+</span>
          </button>
          {open === i && <div style={{ padding: "0 0 14px", fontSize: 13.5, color: "#9ca3af", lineHeight: 1.6 }}>{f.a}</div>}
        </div>
      ))}
    </div>
  );
}

function AboutContent() {
  return (
    <div>
      <SectionHeading>About</SectionHeading>

      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#2d1b69)", borderRadius: 16, padding: "28px", border: "1px solid rgba(124,58,237,0.3)", marginBottom: 28, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,58,237,0.25),transparent)", pointerEvents: "none" }} />
        <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f9fafb", letterSpacing: "-0.5px" }}>Friday</div>
        <div style={{ fontSize: 13, color: "#a78bfa", marginTop: 4 }}>Version 2.0 · AI Companion</div>
        <div style={{ fontSize: 13.5, color: "#9ca3af", marginTop: 14, lineHeight: 1.7, maxWidth: 400 }}>
          A blazing-fast AI assistant powered by LLaMA 3.3 70B via Groq. Built by Ankur. No subscriptions, no limits — just answers.
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Tech Stack</div>
      {[
        { icon: "⚛️", name: "React + Vite",           desc: "Frontend" },
        { icon: "🐍", name: "FastAPI + Python",        desc: "Backend" },
        { icon: "🗄️", name: "PostgreSQL + SQLAlchemy", desc: "Database" },
        { icon: "🤖", name: "LLaMA 3.3 70B via Groq", desc: "AI model" },
        { icon: "🔐", name: "JWT + HTTP-only cookies", desc: "Auth" },
      ].map((t, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #232425" }}>
          <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{t.icon}</span>
          <div>
            <div style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 500 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{t.desc}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 24, fontSize: 12, color: "#4b5563", textAlign: "center" }}>
        © 2026 Friday · Built with ♥ by Ankur
      </div>
    </div>
  );
}

// ── Nav items config — use component references, NOT JSX instances ────────────
// This is the critical fix: storing <Component /> in an array means React creates
// one frozen instance. Using { component: Comp } and rendering dynamically means
// state works correctly inside each panel.
const NAV = [
  { key: "general",       label: "General",        icon: <IGeneral />,       component: GeneralContent },
  { key: "account",       label: "Account",        icon: <IAccount />,       component: AccountContent },
  { key: "privacy",       label: "Privacy",        icon: <IPrivacy />,       component: PrivacyContent },
  { key: "billing",       label: "Billing",        icon: <IBilling />,       component: BillingContent },
  { key: "notifications", label: "Notifications",  icon: <INotifications />, component: NotificationsContent },
  { key: "help",          label: "Help & Support", icon: <IHelp />,          component: HelpContent },
  { key: "about",         label: "About",          icon: <IAbout />,         component: AboutContent },
];

// Key mapping — old panel keys → new nav keys
const KEY_MAP = {
  personalization: "general",
  profile:         "account",
  settings:        "general",
  help:            "help",
  about:           "about",
};

// ── Main Modal ────────────────────────────────────────────────────────────────
function SettingsModal({ initialKey, onClose }) {
  const mapped  = KEY_MAP[initialKey] || initialKey || "general";
  const [active, setActive] = useState(mapped);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const keyHandler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  // Reset scroll when switching tabs
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [active]);

  const filtered = search.trim()
    ? NAV.filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    : NAV;

  const current = NAV.find(n => n.key === active) || NAV[0];
  const ContentComponent = current.component;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(3px)",
        animation: "fadeIn 0.15s ease",
      }} />

      {/* Modal */}
      <div ref={ref} style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 501,
        width: "min(860px, 94vw)",
        height: "min(620px, 90vh)",
        background: "#1a1b1c",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18,
        boxShadow: "0 32px 96px rgba(0,0,0,0.75)",
        display: "flex",
        overflow: "hidden",
        animation: "scaleIn 0.2s cubic-bezier(0.34,1.2,0.64,1)",
      }}>

        {/* ── Left nav panel ── */}
        <div style={{
          width: 210, flexShrink: 0,
          background: "#141516",
          borderRight: "1px solid #232425",
          display: "flex", flexDirection: "column",
          padding: "20px 0 16px",
          overflowY: "auto",
        }}>
          {/* Search */}
          <div style={{ padding: "0 12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#2a2b2c", border: "1px solid #333", borderRadius: 8, padding: "7px 12px" }}>
              <ISearch />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search"
                style={{ background: "transparent", border: "none", outline: "none", color: "#e5e7eb", fontSize: 13.5, width: "100%", fontFamily: "inherit" }}
              />
            </div>
          </div>

          {/* Label */}
          <div style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 16px 8px" }}>
            Settings
          </div>

          {/* Nav items */}
          {filtered.map(item => (
            <button key={item.key}
              onClick={() => { setActive(item.key); setSearch(""); }}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                width: "100%", padding: "9px 16px",
                background: active === item.key ? "#2a2b2c" : "transparent",
                border: "none", borderRadius: 0,
                color: active === item.key ? "#f9fafb" : "#9ca3af",
                fontSize: 14, cursor: "pointer",
                fontFamily: "inherit", textAlign: "left",
                transition: "background 0.1s, color 0.1s",
              }}
              onMouseEnter={e => { if (active !== item.key) { e.currentTarget.style.background = "#1e1f20"; e.currentTarget.style.color = "#d1d5db"; } }}
              onMouseLeave={e => { if (active !== item.key) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; } }}
            >
              <span style={{ flexShrink: 0, opacity: active === item.key ? 1 : 0.65 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* ── Right content panel ── */}
        <div ref={contentRef} style={{
          flex: 1, overflowY: "auto", padding: "32px 40px 40px",
          scrollbarWidth: "thin", scrollbarColor: "#333 transparent",
          position: "relative",
        }}>
          {/* Close button */}
          <button onClick={onClose}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 32, height: 32, borderRadius: "50%",
              background: "#2a2b2c", border: "1px solid #333",
              color: "#9ca3af", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#3a3b3c"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#2a2b2c"; e.currentTarget.style.color = "#9ca3af"; }}
          >
            <IClose />
          </button>

          {/* Dynamic content — rendered as component so state works correctly */}
          <ContentComponent />
        </div>
      </div>
    </>
  );
}

// ── Exported component ────────────────────────────────────────────────────────
export default function SidebarPanels({ activePanel, onClose }) {
  if (!activePanel) return null;

  return (
    <>
      <SettingsModal initialKey={activePanel} onClose={onClose} />
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.95) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px }
        ::-webkit-scrollbar-track { background: transparent }
      `}</style>
    </>
  );
}