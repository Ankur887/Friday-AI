import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../Auth/AuthContext";
import { usePrefs } from "../Auth/PrefsContext";
import ChatPanel from "../components/ChatPanel";
import FloatingChatPanel from "../components/FloatingChatPanel";
import { useRobotStore } from "../robot/robotStore";
import useAudioStore, { speakText, stopSpeaking } from "../store/audioStore";

const API = "http://127.0.0.1:8000";

// Speech helpers (speakText / stopSpeaking) are provided by ../store/audioStore

// ─────────────────────────────────────────────────────────────────────────────
// Speaker toggle button
// ─────────────────────────────────────────────────────────────────────────────

function SpeakerButton({ enabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={enabled ? "Voice ON — click to mute" : "Voice OFF — click to enable"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: enabled ? "1px solid #00D9FF" : "1px solid rgba(255,255,255,0.15)",
        background: enabled
          ? "rgba(0, 217, 255, 0.15)"
          : "rgba(255,255,255,0.05)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.2s ease",
        padding: 0,
        outline: "none",
        boxShadow: enabled ? "0 0 10px rgba(0,217,255,0.35)" : "none",
      }}
    >
      {enabled ? (
        // Active: sound waves visible, glowing cyan
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(0,217,255,0.2)" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      ) : (
        // Muted: speaker with X
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mic button
// ─────────────────────────────────────────────────────────────────────────────

const SILENCE_TIMEOUT_MS = 5000;

function MicButton({ onTranscript, onInterim, onStopListening, onListenStart, onListenStop }) {
  const [listening, setListening] = useState(false);
  const recognitionRef  = useRef(null);
  const silenceTimerRef = useRef(null);
  const accumulatedRef  = useRef("");

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      const text = accumulatedRef.current.trim();
      if (text) { accumulatedRef.current = ""; onStopListening(text); }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer, onStopListening]);

  const stopMic = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current._shouldRestart = false;
      recognitionRef.current.stop();
    }
    accumulatedRef.current = "";
    setListening(false);
    onListenStop?.();
    onStopListening(null);
  }, [clearSilenceTimer, onStopListening, onListenStop]);

  const startMic = useCallback(() => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported. Please use Chrome or Edge.");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (interim) onInterim(interim);
      if (final) {
        accumulatedRef.current = accumulatedRef.current
          ? `${accumulatedRef.current} ${final}` : final;
        onTranscript(final);
        resetSilenceTimer();
      }
    };
    recognition.onerror = (e) => { if (e.error !== "no-speech") console.error("Speech error:", e.error); };
    recognition.onend = () => {
      if (recognitionRef.current?._shouldRestart) { try { recognition.start(); } catch {} }
      else setListening(false);
    };

    recognition._shouldRestart = true;
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    onListenStart?.();
  }, [onInterim, onTranscript, resetSilenceTimer, onListenStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current._shouldRestart = false;
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [clearSilenceTimer]);

  return (
    <button
      type="button"
      onClick={listening ? stopMic : startMic}
      title={listening ? "Stop listening" : "Voice input (auto-sends after 5s silence)"}
      style={{
        background: listening ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
        border: listening ? "1px solid rgba(252,165,165,0.6)" : "1px solid rgba(255,255,255,0.15)",
        borderRadius: "50%",
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.2s",
        padding: 0,
        outline: "none",
        boxShadow: listening ? "0 0 10px rgba(239,68,68,0.3)" : "none",
      }}
    >
      {listening ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444">
          <circle cx="12" cy="12" r="6">
            <animate attributeName="r" values="6;9;6" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <line x1="9" y1="21" x2="15" y2="21" />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File upload helpers
// ─────────────────────────────────────────────────────────────────────────────

function fileIcon(type) {
  if (type === "pdf")   return "📄";
  if (type === "image") return "🖼️";
  return "📝";
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main SearchApp component
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchApp({
  conversationId,
  messages: rawMessages,
  setMessages: setRawMessages,
  onConversationUpdated,
  onAutoCreateConversation,
}) {
  const { token }  = useAuth();
  const { prefs }  = usePrefs();
  const { pulseState, setRobotState } = useRobotStore();

  // ── Speaker state — shared Zustand store (persisted in localStorage) ────────
  const speakerEnabled = useAudioStore((s) => s.speakerEnabled);
  const toggleSpeaker  = useAudioStore((s) => s.toggleSpeaker);

  // Stop speech on unmount
  useEffect(() => () => stopSpeaking(), []);

  // ── Input / UI state ──────────────────────────────────────────────────────
  const [prompt,        setPrompt]        = useState("");
  const [interimText,   setInterimText]   = useState("");
  const [loading,       setLoading]       = useState(false);
  const [uploadedFile,  setUploadedFile]  = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fileInputRef = useRef(null);
  const inputElRef   = useRef(null);

  // ── Robot reacts to loading state ─────────────────────────────────────────
  useEffect(() => {
    if (loading) setRobotState("thinking");
  }, [loading, setRobotState]);

  // ── Convert raw messages to ChatPanel format ──────────────────────────────
  // ChatPanel expects: { id, role, text, time }
  const messages = (rawMessages || []).map((m, i) => ({
    id: m.id ?? i,
    role: m.role,
    text: m.content,
    time: m.time ?? "",
  }));

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res  = await fetch(`${API}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUploadedFile({ name: file.name, content: data.content, type: data.file_type });
    } catch (err) { console.error("Upload failed:", err); }
    finally { setUploadLoading(false); e.target.value = ""; }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (overridePrompt) => {
    const textToSend = (overridePrompt ?? prompt).trim();
    if (!textToSend && !uploadedFile) return;
    if (loading) return;

    let userPrompt = textToSend;
    if (uploadedFile) {
      userPrompt = userPrompt
        ? `${userPrompt}\n\n📎 **${uploadedFile.name}**:\n\n${uploadedFile.content}`
        : `I've uploaded **"${uploadedFile.name}"**. Please analyze it:\n\n${uploadedFile.content}`;
      setUploadedFile(null);
    }

    const now = new Date();
    setRawMessages((prev) => [...prev, { role: "user", content: userPrompt, time: formatTime(now) }]);
    setPrompt("");
    setInterimText("");
    setLoading(true);
    setRobotState("thinking");

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId && onAutoCreateConversation) {
        activeConversationId = await onAutoCreateConversation(userPrompt.slice(0, 60));
      }
      if (!activeConversationId) {
        setRawMessages((prev) => [...prev, {
          role: "assistant",
          content: "Please sign in to start chatting.",
          time: formatTime(new Date()),
        }]);
        setLoading(false);
        pulseState("error", 1800);
        return;
      }

      const t = localStorage.getItem("access_token");
      const headers = { "Content-Type": "application/json" };
      if (t) headers["Authorization"] = `Bearer ${t}`;

      const res  = await fetch(`${API}/chat`, {
        method: "POST", headers, credentials: "include",
        body: JSON.stringify({
          conversation_id: activeConversationId,
          message: userPrompt,
          response_style: prefs?.responseStyle,
        }),
      });
      const data    = await res.json();
      const aiReply = data.response;

      setRawMessages((prev) => [...prev, {
        role: "assistant",
        content: aiReply,
        time: formatTime(new Date()),
      }]);

      // ── Speak if speaker is enabled (pass active language for correct TTS voice) ──
      if (speakerEnabled) speakText(aiReply, prefs?.language || "en");

      pulseState("success", 1400);
      if (onConversationUpdated) onConversationUpdated();
    } catch (error) {
      console.error(error);
      setRawMessages((prev) => [...prev, {
        role: "assistant",
        content: "Failed to connect to backend.",
        time: formatTime(new Date()),
      }]);
      pulseState("error", 1800);
    }

    setLoading(false);
  }, [
    prompt, uploadedFile, loading, conversationId,
    onAutoCreateConversation, onConversationUpdated,
    setRawMessages, prefs?.responseStyle,
    setRobotState, pulseState, speakerEnabled,
  ]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleTranscript = useCallback((text) => {
    setInterimText("");
    setPrompt((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  const handleMicStop = useCallback((text) => {
    setInterimText("");
    if (text) { setPrompt(""); handleSubmit(text); }
  }, [handleSubmit]);

  // ── Computed styles ───────────────────────────────────────────────────────
  const inputBg     = "rgba(13, 17, 23, 0.5)";
  const inputBorder = speakerEnabled
    ? "rgba(0, 217, 255, 0.3)"
    : "rgba(124, 99, 255, 0.25)";
  const inputTextC  = "#E2E8F0";
  const placeholderC= "#7B8AA8";

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "transparent",
      overflow: "hidden",
      position: "relative",
    }}>
      <FloatingChatPanel style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>

        {/* ── Empty state ──────────────────────────────────────────────── */}
        {messages.length === 0 && !loading && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: "8vh",
            pointerEvents: "none",
          }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#E2E8F0",
              margin: 0,
              textAlign: "center",
              textShadow: "0 0 24px rgba(0,217,255,0.25)",
            }}>
              Meet Friday — Your AI Companion
            </h1>
            <p style={{ marginTop: 10, color: "#7DF9FF", fontSize: 14, opacity: 0.8 }}>
              Ask anything. Friday is listening.
            </p>
          </div>
        )}

        {/* ── Chat messages ─────────────────────────────────────────────── */}
        {(messages.length > 0 || loading) && (
          <ChatPanel messages={messages} isTyping={loading} />
        )}

        {/* ── File input (hidden) ───────────────────────────────────────── */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.py,.js,.ts,.csv,.md"
          style={{ display: "none" }}
        />

        {/* ── Input bar ────────────────────────────────────────────────── */}
        <div style={{
          padding: "12px 20px 20px",
          background: "transparent",
          borderTop: messages.length > 0 ? "1px solid rgba(124,99,255,0.12)" : "none",
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>

            {/* Uploaded file chip */}
            {uploadedFile && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: inputBg, borderRadius: 10,
                padding: "8px 14px", marginBottom: 8,
                border: `1px solid ${inputBorder}`,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{fileIcon(uploadedFile.type)}</span>
                <span style={{ flex: 1, fontSize: 13, color: inputTextC, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {uploadedFile.name}
                </span>
                <button
                  onClick={() => setUploadedFile(null)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#999", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}
                >✕</button>
              </div>
            )}

            {/* Upload loading */}
            {uploadLoading && !uploadedFile && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: inputBg, borderRadius: 10,
                padding: "8px 14px", marginBottom: 8,
                border: `1px solid ${inputBorder}`,
              }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #6366f1", borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                <span style={{ fontSize: 13, color: placeholderC }}>Reading file…</span>
              </div>
            )}

            {/* Input row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: inputBg,
              borderRadius: 999,
              border: `1px solid ${inputBorder}`,
              boxShadow: speakerEnabled
                ? "0 0 16px rgba(0,217,255,0.12)"
                : "0 1px 6px rgba(0,0,0,0.2)",
              transition: "border-color 0.25s, box-shadow 0.25s",
            }}>

              {/* Attach file */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload file"
                style={{
                  background: "transparent", border: "none",
                  cursor: "pointer",
                  color: uploadedFile ? "#6366f1" : "rgba(255,255,255,0.4)",
                  fontSize: 22, padding: 0, flexShrink: 0, lineHeight: 1,
                  transition: "color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#6366f1"}
                onMouseLeave={e => e.currentTarget.style.color = uploadedFile ? "#6366f1" : "rgba(255,255,255,0.4)"}
              >+</button>

              {/* Text input */}
              <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
                <input
                  ref={inputElRef}
                  type="text"
                  placeholder={uploadedFile ? "Ask something about the file…" : "Ask Friday..."}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 15,
                    color: inputTextC,
                    fontFamily: "Inter, sans-serif",
                    boxSizing: "border-box",
                  }}
                />
                {interimText && (
                  <span style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: `${Math.min(prompt.length * 8.8, 200)}px`,
                    fontSize: 15,
                    color: placeholderC,
                    fontFamily: "Inter, sans-serif",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  }}>
                    {interimText}
                  </span>
                )}
              </div>

              {/* Friday label */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c4dff" }} />
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>Friday 2.0</span>
              </div>

              {/* Speaker toggle */}
              <SpeakerButton enabled={speakerEnabled} onToggle={toggleSpeaker} />

              {/* Mic */}
              <MicButton
                onTranscript={handleTranscript}
                onInterim={(text) => setInterimText(text)}
                onStopListening={handleMicStop}
                onListenStart={() => setRobotState("listening")}
                onListenStop={() => setRobotState("idle")}
              />

              {/* Send */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading || uploadLoading || (!prompt.trim() && !uploadedFile)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: loading || uploadLoading || (!prompt.trim() && !uploadedFile) ? "not-allowed" : "pointer",
                  color: (prompt.trim() || uploadedFile) ? "#00D9FF" : "rgba(255,255,255,0.25)",
                  fontSize: 18,
                  padding: 0,
                  flexShrink: 0,
                  transition: "color 0.15s",
                  lineHeight: 1,
                }}
              >➤</button>
            </div>
          </div>
        </div>

      </FloatingChatPanel>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: ${placeholderC}; }
      `}</style>
    </div>
  );
}