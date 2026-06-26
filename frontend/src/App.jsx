// FILE: src/App.jsx
// PROJECT: Friday AI — Career OS
// PURPOSE: Root app component with auth gate.
//          If user is not logged in → show LoginPage (Claude-style).
//          If logged in → render full app unchanged.
//          Logout from sidebar → returns to LoginPage.
// UPDATED: 2026-06-26

import { useState, useCallback, useRef, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { usePrefs } from "./Auth/PrefsContext";
import { useAuth } from "./Auth/AuthContext";

import RobotScene from "./components/RobotScene";
import Sidebar from "./sidebar/Sidebar";
import IDEPage from "./ide/IDEPage";
import CodeVisualizer from "./visualizers/codeVisualizer";
import ChatPanel from "./components/ChatPanel";
import ChatInput from "./components/ChatInput";
import useRobotStore from "./robot/robotStore";
import useAudioStore, { speakText, stopSpeaking } from "./store/audioStore";
import InterviewPage from "./features/InterviewPage";
import ResumePage from "./features/ResumePage";
import DashboardPage from "./features/DashboardPage";
import RoadmapPage from "./features/RoadmapPage";
import LoginPage from "./Auth/LoginPage";

const API = "http://127.0.0.1:8000";

function fmt() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
let uid = 0;

function authHeaders(extra = {}) {
  const t = localStorage.getItem("access_token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

function greeting(lang = "en") {
  const h = new Date().getHours();
  const greetings = {
    en: h < 12 ? "Good morning. I'm Friday — how can I help you today?"
      : h < 17 ? "Good afternoon. I'm Friday — what can I do for you?"
        : "Good evening. I'm Friday — ready when you are.",
    hi: h < 12 ? "सुप्रभात! मैं Friday हूँ — आज मैं आपकी कैसे मदद कर सकती हूँ?"
      : h < 17 ? "नमस्ते! मैं Friday हूँ — मैं आपके लिए क्या कर सकती हूँ?"
        : "शुभ संध्या! मैं Friday हूँ — जब चाहें शुरू करें।",
    es: h < 12 ? "Buenos días. Soy Friday — ¿en qué puedo ayudarte hoy?"
      : h < 17 ? "Buenas tardes. Soy Friday — ¿qué puedo hacer por ti?"
        : "Buenas noches. Soy Friday — lista cuando quieras.",
    fr: h < 12 ? "Bonjour. Je suis Friday — comment puis-je vous aider aujourd'hui?"
      : h < 17 ? "Bonjour. Je suis Friday — que puis-je faire pour vous?"
        : "Bonsoir. Je suis Friday — prête quand vous voulez.",
    de: h < 12 ? "Guten Morgen. Ich bin Friday — wie kann ich Ihnen heute helfen?"
      : h < 17 ? "Guten Tag. Ich bin Friday — was kann ich für Sie tun?"
        : "Guten Abend. Ich bin Friday — bereit, wenn Sie möchten.",
  };
  return greetings[lang] || greetings.en;
}

// ── Loading splash (shown while AuthContext checks token) ─────────────────────
function LoadingSplash() {
  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#0f0f10",
      gap: 20,
    }}>
      {/* Logo mark */}
      <div style={{
        width: 48, height: 48,
        background: "linear-gradient(135deg, #6366f1, #a855f7)",
        borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "splashPulse 1.6s ease-in-out infinite",
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <span style={{
        fontFamily: "Outfit, sans-serif",
        fontSize: 16, fontWeight: 600,
        color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.08em",
      }}>
        FRIDAY AI
      </span>
      <style>{`
        @keyframes splashPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}

// ── Main app (rendered only when user is logged in) ───────────────────────────
function MainApp() {
  const { prefs, chatFontSize, bgColor, chatBg } = usePrefs();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const isThinking = useRobotStore((s) => s.isThinking);
  const isReacting = useRobotStore((s) => s.isReacting);
  const setThinking = useRobotStore((s) => s.setThinking);
  const setIdle = useRobotStore((s) => s.setIdle);
  const setTalking = useRobotStore((s) => s.setTalking);
  const setError = useRobotStore((s) => s.setError);
  const setSuccess = useRobotStore((s) => s.setSuccess);

  const speakerEnabled = useAudioStore((s) => s.speakerEnabled);

  useEffect(() => () => stopSpeaking(), []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/conversations`, { headers: authHeaders() });
      setConversations(await res.json());
    } catch (err) { console.error("Failed to load conversations:", err); }
  }, []);

  const loadMessages = useCallback(async (id) => {
    try {
      const res = await fetch(`${API}/conversation/${id}/messages`, { headers: authHeaders() });
      setMessages(await res.json());
    } catch { setMessages([]); }
  }, []);

  const handleSelectConversation = useCallback(async (id) => {
    setSelectedConversationId(id);
    await loadMessages(id);
  }, [loadMessages]);

  const handleNewChat = useCallback(() => {
    setSelectedConversationId(null);
    setMessages([]);
    robotConvId.current = null;
    const lang = prefs?.language || "en";
    setRobotMessages([{ id: ++uid, role: "assistant", text: greeting(lang), time: fmt() }]);
  }, [prefs?.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAutoCreate = useCallback(async (title) => {
    const cleanTitle = title
      .replace(/\*\*/g, "").replace(/\*/g, "").replace(/📎/g, "")
      .replace(/I've uploaded.*$/i, "").replace(/Please analyze it.*$/i, "")
      .split("\n")[0].trim().slice(0, 60) || "New Chat";
    try {
      const res = await fetch(`${API}/conversation`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ title: cleanTitle }),
      });
      const newConv = await res.json();
      setSelectedConversationId(newConv.id);
      setConversations((prev) => [newConv, ...prev]);
      return newConv.id;
    } catch { return null; }
  }, []);

  const handleDeleteConversation = useCallback((deletedId) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== deletedId);
      if (deletedId === selectedConversationId) {
        if (remaining.length > 0) {
          setSelectedConversationId(remaining[0].id);
          fetch(`${API}/conversation/${remaining[0].id}/messages`, { headers: authHeaders() })
            .then((r) => r.json()).then(setMessages).catch(() => setMessages([]));
        } else {
          setSelectedConversationId(null);
          setMessages([]);
        }
      }
      return remaining;
    });
  }, [selectedConversationId]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const [robotMessages, setRobotMessages] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const robotConvId = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [robotMessages, isThinking]);

  useEffect(() => {
    const lang = prefs?.language || "en";
    const t = setTimeout(() => {
      setRobotMessages([{ id: ++uid, role: "assistant", text: greeting(lang), time: fmt() }]);
    }, robotMessages.length === 0 ? 1100 : 0);
    return () => clearTimeout(t);
  }, [prefs?.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const ensureRobotConv = useCallback(async (firstMessage) => {
    if (robotConvId.current) return robotConvId.current;
    const title = firstMessage.slice(0, 60) || "Friday Chat";
    try {
      const res = await fetch(`${API}/conversation`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ title }),
      });
      const conv = await res.json();
      if (conv.id) {
        robotConvId.current = conv.id;
        setConversations((prev) => [conv, ...prev]);
        return conv.id;
      }
    } catch (err) { console.error("Failed to create robot conversation:", err); }
    return null;
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUploadedFile({ name: file.name, content: data.content, type: data.file_type });
    } catch (err) { console.warn("Upload failed:", err); }
    finally { setUploadLoading(false); e.target.value = ""; }
  };

  const handleSend = useCallback(async (text) => {
    const file = uploadedFile;
    setUploadedFile(null);

    const lang = prefs?.language || "en";

    const userDisplay = file
      ? (file.content ? `${text}\n\n📎 **${file.name}**` : `📎 **${file.name}**`)
      : text;

    setRobotMessages((prev) => [...prev, { id: ++uid, role: "user", text: userDisplay, time: fmt() }]);
    setThinking();

    const convId = await ensureRobotConv(text || file?.name || "Chat");
    if (!convId) {
      setError();
      setTimeout(() => setIdle(), 2000);
      setRobotMessages((prev) => [...prev, {
        id: ++uid, role: "assistant", time: fmt(),
        text: "⚠️ Couldn't create a conversation. Please sign in or check the server.",
      }]);
      return;
    }

    try {
      const body = {
        conversation_id: convId,
        message: text,
        language: lang,
        ...(file?.content && {
          file_content: file.content,
          file_name: file.name,
          file_type: file.type,
        }),
      };
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const reply = data.response || data.message || "⚠️ No response from server.";

      setRobotMessages((prev) => [...prev, { id: ++uid, role: "assistant", text: reply, time: fmt() }]);

      if (speakerEnabled) speakText(reply, lang);

      setTalking();
      setSuccess();
      setTimeout(() => setIdle(), 2500);

    } catch (err) {
      console.error("Chat error:", err);
      setError();
      setTimeout(() => setIdle(), 2000);
      setRobotMessages((prev) => [...prev, {
        id: ++uid, role: "assistant", time: fmt(),
        text: "⚠️ Server unreachable. Please check the backend is running.",
      }]);
    }
  }, [
    uploadedFile, ensureRobotConv,
    setThinking, setTalking, setIdle, setError, setSuccess,
    prefs?.language, speakerEnabled,
  ]);

  const handleRetry = useCallback(async (assistantIndex) => {
    const userMsg = robotMessages.slice(0, assistantIndex).reverse().find((m) => m.role === "user");
    if (!userMsg || isThinking) return;
    setRobotMessages((prev) => { const next = [...prev]; next.splice(assistantIndex, 1); return next; });
    await handleSend(userMsg.text);
  }, [robotMessages, isThinking, handleSend]);

  const handleDeleteMessage = useCallback((index) => {
    setRobotMessages((prev) => {
      const next = [...prev];
      const count = next[index + 1]?.role === "assistant" ? 2 : 1;
      next.splice(index, count);
      return next;
    });
  }, []);

  return (
    <>
      <input
        type="file" ref={fileInputRef} onChange={handleFileChange}
        accept=".pdf,.txt,.py,.js,.ts,.csv,.md" style={{ display: "none" }}
      />

      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", flexDirection: "row",
        overflow: "hidden", position: "relative",
        background: isHome
          ? "linear-gradient(160deg, #dceefb 0%, #f0f8ff 50%, #e4f2fc 100%)"
          : bgColor,
        fontSize: chatFontSize,
      }}>

        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onConversationDeleted={handleDeleteConversation}
        />

        <Routes>
          <Route
            path="/"
            element={
              <div style={{
                flex: 1, height: "100vh",
                display: "flex", flexDirection: "row",
                overflow: "hidden", position: "relative",
              }}>
                <motion.div
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: 620, minWidth: 570, maxWidth: 610,
                    height: "100vh", flexShrink: 0,
                    display: "flex", flexDirection: "column",
                    padding: "16px 0 16px 16px",
                    position: "relative", zIndex: 10,
                  }}
                >
                  <div style={{
                    flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
                    background: "rgba(255,255,255,0.62)",
                    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.85)", borderRadius: 20,
                    boxShadow: "0 4px 24px rgba(100,160,220,0.13), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}>
                    {/* Chat header */}
                    <div style={{
                      padding: "14px 16px 12px",
                      borderBottom: "1px solid rgba(0,188,212,0.12)",
                      display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                        background: "rgba(0,188,212,0.1)",
                        border: "1.5px solid rgba(0,188,212,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,188,212,0.12)",
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="9" r="4" stroke="#00BCD4" strokeWidth="1.8" />
                          <rect x="6" y="15" width="12" height="7" rx="2" stroke="#00BCD4" strokeWidth="1.8" />
                          <circle cx="9.5" cy="17.5" r="0.9" fill="#00BCD4" />
                          <circle cx="14.5" cy="17.5" r="0.9" fill="#00BCD4" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 15.5, color: "#0e2233", letterSpacing: "0.01em", lineHeight: 1.2 }}>Friday</p>
                        <p style={{ fontSize: 9.5, color: "rgba(0,100,130,0.55)", fontFamily: "Outfit, sans-serif", letterSpacing: "0.14em", fontWeight: 500 }}>AI COMPANION</p>
                      </div>
                      <div style={{
                        marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                        background: "rgba(0,188,212,0.08)",
                        border: "1px solid rgba(0,188,212,0.25)",
                        borderRadius: 20, padding: "3px 10px",
                      }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: isThinking ? "#FF8C00" : "#00BCD4",
                          boxShadow: isThinking ? "0 0 5px #FF8C00" : "0 0 5px rgba(0,188,212,0.6)",
                        }} />
                        <span style={{
                          fontSize: 9.5, fontFamily: "Outfit, sans-serif",
                          letterSpacing: "0.12em", fontWeight: 600,
                          color: isThinking ? "#b06000" : "#007a90",
                        }}>
                          {isThinking ? "THINKING" : "ONLINE"}
                        </span>
                      </div>
                    </div>

                    {/* Message count bar */}
                    <div style={{
                      padding: "9px 16px 8px",
                      borderBottom: "1px solid rgba(0,188,212,0.08)",
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#00BCD4",
                        boxShadow: "0 0 5px rgba(0,188,212,0.4)",
                      }} />
                      <span style={{
                        fontFamily: "Outfit, sans-serif", fontWeight: 600,
                        fontSize: 10.5, color: "rgba(0,70,100,0.7)", letterSpacing: "0.16em",
                      }}>CONVERSATION</span>
                      <span style={{
                        marginLeft: "auto", fontSize: 10.5,
                        color: "rgba(0,70,100,0.38)", fontFamily: "Inter, sans-serif",
                      }}>
                        {robotMessages.length} message{robotMessages.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <ChatPanel messages={robotMessages} isTyping={isThinking} />
                    <ChatInput onSend={handleSend} isThinking={isThinking} />
                  </div>
                </motion.div>

                <div style={{
                  flex: 1, height: "100vh",
                  position: "relative", overflow: "hidden", minWidth: 0,
                }}>
                  <RobotScene isThinking={isThinking} isReacting={isReacting} onHoverChange={() => { }} />
                </div>
              </div>
            }
          />

          <Route
            path="*"
            element={
              <div style={{
                flex: 1, height: "100vh",
                display: "flex", flexDirection: "column",
                backgroundColor: chatBg, overflow: "hidden",
              }}>
                <Routes>
                  <Route path="/ide" element={<IDEPage />} />
                  <Route path="/visualize" element={<CodeVisualizer />} />
                  <Route path="/interview" element={<InterviewPage />} />
                  <Route path="/resume/*" element={<ResumePage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                </Routes>
              </div>
            }
          />
        </Routes>
      </div>

      {/* Corner decorations */}
      {[
        { top: 12, left: 12 }, { top: 12, right: 12 },
        { bottom: 12, left: 12 }, { bottom: 12, right: 12 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "fixed", ...pos,
          width: 20, height: 20,
          pointerEvents: "none", zIndex: 9999,
          borderTop: i < 2 ? "2px solid rgba(0,188,212,0.2)" : "none",
          borderBottom: i >= 2 ? "2px solid rgba(0,188,212,0.2)" : "none",
          borderLeft: i % 2 === 0 ? "2px solid rgba(0,188,212,0.2)" : "none",
          borderRight: i % 2 === 1 ? "2px solid rgba(0,188,212,0.2)" : "none",
        }} />
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT — auth gate lives here
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const { user, loading } = useAuth();

  // 1. Still checking token / refreshing → show splash
  if (loading) return <LoadingSplash />;

  // 2. No user → show Claude-style login page
  if (!user) return <LoginPage />;

  // 3. Logged in → render full app, completely unchanged
  return <MainApp />;
}