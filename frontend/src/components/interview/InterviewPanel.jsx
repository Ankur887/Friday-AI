// FILE: src/components/interview/InterviewPanel.jsx
// PROJECT: Friday AI — Career OS
// PURPOSE: Live interview room — AI sphere, conversation, mic/speaker controls,
//          conditional CodePanel for coding rounds, camera overlay.
//
// FIXES CARRIED FORWARD:
//   FIX-G: SpeakerButton component wired to useAudioStore.toggleSpeaker()
//   FIX-H: SPEAK disabled only when isThinking && !isSpeaking && !isListening
//          When AI is speaking the button shows INTERRUPT and always works.
//
// REDESIGN (2026-07-01):
//   Visual pass only — no changes to state shape, hook contracts, sibling
//   props, or the CODE_ROUNDS / questionRequiresCode classifier logic below.
//   Single accent (#FF5A36, "signal") replaces the prior indigo/cyan/amber/red
//   four-way split. Floating glass badges consolidated into one instrument
//   rail. Emoji icons replaced with inline SVG. See design notes at bottom
//   of file for the token system if this needs to be extended later.

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SpeakerSphere      from "./SpeakerSphere";
import ConversationBubble from "./ConversationBubble";
import IntegrityRing      from "./IntegrityRing";
import CodePanel          from "./CodePanel";
import useInterviewLogic  from "./useInterviewLogic";
import useAudioStore      from "../../store/audioStore";
import styles             from "./sphere.module.css";

// ── Coding round classifier ───────────────────────────────────────────────────
const CODE_ROUNDS = new Set([
  "Coding Round", "DSA Round", "Machine Coding",
  "System Design", "Low Level Design (LLD)", "High Level Design (HLD)","Core Subjects",
]);

const CODING_KEYWORDS = [
  "write a function", "implement", "algorithm", "data structure",
  "time complexity", "space complexity", "write a program", "define a class",
  "return the", "given an array", "given a string", "binary search",
  "linked list", "tree", "graph", "dynamic programming", "recursion",
  "sort", "find the", "compute", "calculate",
];

function questionRequiresCode(message = "") {
  const lower = message.toLowerCase();
  return CODING_KEYWORDS.some((kw) => lower.includes(kw));
}

// ═════════════════════════════════════════════════════════════════════════════
//  DESIGN TOKENS — one accent, disciplined neutrals
// ═════════════════════════════════════════════════════════════════════════════
const T = {
  void:      "#050507",
  panel:     "#0B0B10",
  panelUp:   "#111117",
  line:      "rgba(255,255,255,0.08)",
  lineFaint: "rgba(255,255,255,0.05)",
  text:      "#EDEDF2",
  textDim:   "#8A8A96",
  textFaint: "#54545F",
  signal:    "#FF5A36",   // the ONE accent — live/recording/danger/selected
  signalDim: "rgba(255,90,54,0.14)",
  signalMid: "rgba(255,90,54,0.32)",
  good:      "#3DD68C",   // status-only, never decorative
  warn:      "#E8B84B",
  mono:      "'JetBrains Mono', ui-monospace, monospace",
  sans:      "Outfit, Inter, sans-serif",
};

// ── Inline icon set (replaces emoji) ──────────────────────────────────────────
const Icon = {
  Mic: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  ),
  Square: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
  ),
  Hand: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
      <path d="M6 14v-1a2 2 0 0 0-4 0v3a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8v-3a2 2 0 0 0-4 0v1"/>
    </svg>
  ),
  Stop: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="10"/><line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>
    </svg>
  ),
  Speaker: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>
    </svg>
  ),
  SpeakerOff: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  ),
  Code: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  Chat: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Camera: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  X: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  CameraOff: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/>
    </svg>
  ),
  Check: (p) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Alert: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

// ═════════════════════════════════════════════════════════════════════════════
//  CameraPanel — live webcam + MediaPipe FaceMesh (CDN, no npm install)
//  (detection/canvas logic unchanged — presentation shell only)
// ═════════════════════════════════════════════════════════════════════════════
function CameraPanel() {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const animFrameRef = useRef(null);
  const faceMeshRef  = useRef(null);

  const [collapsed,   setCollapsed]   = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [faceInfo,    setFaceInfo]    = useState({
    detected: false, eyesOpen: false, lookingAt: false,
    expression: "neutral", attention: 0,
  });

  const loadMediaPipe = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.FaceMesh) { resolve(); return; }
      const s1 = document.createElement("script");
      s1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
      s1.crossOrigin = "anonymous";
      s1.onerror = reject;
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
      s2.crossOrigin = "anonymous";
      s2.onload = resolve;
      s2.onerror = reject;
      s1.onload = () => document.head.appendChild(s2);
      document.head.appendChild(s1);
    });
  }, []);

  const calcEAR = (landmarks, indices) => {
    const p = indices.map((i) => landmarks[i]);
    const A = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y);
    const B = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y);
    const C = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y);
    return (A + B) / (2.0 * C);
  };

  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 240;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      ctx.strokeStyle = T.signal;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      ctx.setLineDash([]);
      setFaceInfo({ detected: false, eyesOpen: false, lookingAt: false, expression: "none", attention: 0 });
      return;
    }

    const lms   = results.multiFaceLandmarks[0];
    const count = results.multiFaceLandmarks.length;
    const xs = lms.map((l) => l.x * canvas.width);
    const ys = lms.map((l) => l.y * canvas.height);
    const minX = Math.min(...xs) - 10;
    const minY = Math.min(...ys) - 10;
    const maxX = Math.max(...xs) + 10;
    const maxY = Math.max(...ys) + 10;

    ctx.strokeStyle = count > 1 ? T.signal : "rgba(237,237,242,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    // corner ticks — reads as "targeting reticle" rather than a generic box
    const tick = 8;
    ctx.strokeStyle = count > 1 ? T.signal : "rgba(237,237,242,0.85)";
    ctx.lineWidth = 1.5;
    [[minX, minY, 1, 1], [maxX, minY, -1, 1], [minX, maxY, 1, -1], [maxX, maxY, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + tick * dy); ctx.lineTo(x, y); ctx.lineTo(x + tick * dx, y);
      ctx.stroke();
    });

    const leftEyeIdx  = [33, 160, 158, 133, 153, 144];
    const rightEyeIdx = [362, 385, 387, 263, 373, 380];
    const avgEAR = (calcEAR(lms, leftEyeIdx) + calcEAR(lms, rightEyeIdx)) / 2;
    const eyesOpen = avgEAR > 0.18;
    const nose = lms[1], leftCheek = lms[234], rightCheek = lms[454];
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
    const yaw = (nose.x - (rightCheek.x + leftCheek.x) / 2) / faceWidth;
    const lookingAt = Math.abs(yaw) < 0.22;
    const mouthOpen = Math.abs(lms[13].y - lms[14].y) > 0.018;
    const expression = mouthOpen ? "speaking" : "neutral";
    const attention = Math.round((lookingAt ? 55 : 15) + (eyesOpen ? 30 : 0) + (count === 1 ? 15 : 0));

    setFaceInfo({ detected: true, eyesOpen, lookingAt, expression, attention });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        await new Promise((r) => setTimeout(r, 80));
        if (!videoRef.current || cancelled) return;
        videoRef.current.srcObject   = stream;
        videoRef.current.muted       = true;
        videoRef.current.playsInline = true;
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () =>
            videoRef.current.play().then(resolve).catch(reject);
          setTimeout(reject, 8000);
        });
        if (cancelled) return;
        setCameraReady(true);
      } catch (err) {
        if (cancelled) return;
        if      (err.name === "NotAllowedError")  setCameraError("Camera permission denied");
        else if (err.name === "NotFoundError")    setCameraError("No camera found");
        else if (err.name === "NotReadableError") setCameraError("Camera in use by another app");
        else                                      setCameraError("Camera unavailable");
        return;
      }

      try {
        await loadMediaPipe();
        if (cancelled) return;
        const faceMesh = new window.FaceMesh({
          locateFile: (f) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 2, refineLandmarks: true,
          minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
        });
        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;

        const runDetection = async () => {
          if (cancelled || !videoRef.current || !faceMeshRef.current) return;
          if (videoRef.current.readyState >= 2) {
            try { await faceMeshRef.current.send({ image: videoRef.current }); } catch (_) {}
          }
          animFrameRef.current = requestAnimationFrame(runDetection);
        };
        runDetection();
      } catch (mpErr) {
        console.warn("[CameraPanel] MediaPipe unavailable:", mpErr);
        const fallbackLoop = () => {
          if (cancelled || !videoRef.current || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx    = canvas.getContext("2d");
          canvas.width  = videoRef.current.videoWidth  || 320;
          canvas.height = videoRef.current.videoHeight || 240;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setFaceInfo((prev) => ({ ...prev, detected: true, attention: 70 }));
          animFrameRef.current = requestAnimationFrame(fallbackLoop);
        };
        fallbackLoop();
      }
    };

    init();
    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (faceMeshRef.current) { try { faceMeshRef.current.close(); } catch (_) {} }
      if (streamRef.current)   streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [loadMediaPipe, onResults]);

  const attColor = faceInfo.attention >= 70 ? T.good : faceInfo.attention >= 40 ? T.warn : T.signal;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        position: "relative", width: collapsed ? 0 : 46, height: 34,
        borderRadius: 6, overflow: "hidden",
        border: `1px solid ${faceInfo.detected ? "rgba(255,255,255,0.14)" : T.signalMid}`,
        background: "#000", flexShrink: 0,
        transition: "width 0.25s ease, opacity 0.2s ease",
        opacity: collapsed ? 0 : 1,
      }}>
        {cameraError ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.textFaint }}>
            <Icon.CameraOff width={12} height={12} />
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay muted playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "scaleX(-1)", pointerEvents: "none" }} />
            <div style={{
              position: "absolute", top: 2, left: 2, width: 5, height: 5, borderRadius: "50%",
              background: cameraReady ? T.signal : T.warn,
              boxShadow: cameraReady ? `0 0 5px ${T.signal}` : "none",
            }} />
          </>
        )}
      </div>

      {!collapsed && !cameraError && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 600, color: attColor, letterSpacing: "0.02em" }}>
            {faceInfo.attention}% FOCUS
          </span>
          <span style={{ fontFamily: T.sans, fontSize: 9.5, color: T.textFaint }}>
            {faceInfo.detected ? (faceInfo.lookingAt ? "on screen" : "looking away") : "no face"}
          </span>
        </div>
      )}
      {cameraError && (
        <span style={{ fontFamily: T.sans, fontSize: 10.5, color: T.textFaint }}>{cameraError}</span>
      )}

      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Show camera" : "Hide camera"}
        style={{
          width: 20, height: 20, borderRadius: 5, flexShrink: 0,
          border: `1px solid ${T.line}`, background: "transparent",
          color: T.textFaint, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {collapsed ? <Icon.Camera width={11} height={11} /> : <Icon.X />}
      </button>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ListeningIndicator({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.22 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 6 }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 18 }}>
            {[0.6, 1.1, 0.85, 1.3, 0.7].map((amp, i) => (
              <div key={i} style={{
                width: 3, borderRadius: 2, background: T.signal,
                height: `${Math.round(amp * 8)}px`,
                animation: `barPulse ${0.5 + i * 0.06}s ${i * 0.07}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textDim, letterSpacing: "0.14em" }}>
            LISTENING
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: "50%", background: T.textDim,
          animation: `dotFade 1.1s ${i * 0.16}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function LiveCaption({ text }) {
  const [display, setDisplay] = useState("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!text) return;
    setDisplay(text);
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          key={display}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            textAlign: "center", maxWidth: 560, margin: "0 auto",
            fontSize: 16, color: T.text, fontFamily: T.sans, fontWeight: 400,
            lineHeight: 1.6, letterSpacing: "0.005em",
          }}
        >
          {display}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function ConversationPanel({ conversationHistory, isThinking, transcriptEndRef }) {
  return (
    <div
      className={styles.transcriptScroll}
      style={{
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column",
        padding: "10px 4px 4px",
        maxHeight: "26vh",
      }}
    >
      {conversationHistory.length === 0 && !isThinking && (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          height: "100%", gap: 8, opacity: 0.5, padding: 20,
        }}>
          <Icon.Mic width={18} height={18} style={{ color: T.textFaint }} />
          <span style={{ fontSize: 11.5, color: T.textFaint, fontFamily: T.sans }}>
            Starting your interview…
          </span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {conversationHistory.map((msg, i) => (
          <ConversationBubble
            key={i}
            message={msg.content}
            role={msg.role}
            timestamp={msg.timestamp}
            quality={msg.quality}
          />
        ))}
      </AnimatePresence>

      {isThinking && <ConversationBubble message="…" role="ai" timestamp={null} />}
      <div ref={transcriptEndRef} />
    </div>
  );
}

// ── FIX-G: SpeakerButton — dedicated toggle, wired to useAudioStore ──────────
function SpeakerButton() {
  const speakerEnabled = useAudioStore((s) => s.speakerEnabled);
  const toggleSpeaker  = useAudioStore((s) => s.toggleSpeaker);

  return (
    <button
      onClick={toggleSpeaker}
      aria-label={speakerEnabled ? "Mute AI voice" : "Unmute AI voice"}
      title={speakerEnabled ? "Mute AI voice" : "Unmute AI voice"}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderRadius: 10,
        border: `1px solid ${speakerEnabled ? "rgba(255,255,255,0.16)" : T.line}`,
        background: speakerEnabled ? T.panelUp : "transparent",
        color: speakerEnabled ? T.text : T.textFaint,
        fontFamily: T.sans, fontWeight: 600, fontSize: 12.5, letterSpacing: "0.02em",
        cursor: "pointer", transition: "all 0.15s ease",
      }}
    >
      {speakerEnabled ? <Icon.Speaker /> : <Icon.SpeakerOff />}
      <span>{speakerEnabled ? "Voice on" : "Voice off"}</span>
    </button>
  );
}

// ── Session timer display ─────────────────────────────────────────────────────
function SessionTimer() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return (
    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textDim, letterSpacing: "0.03em" }}>
      {mm}:{ss}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function InterviewPanel({ sessionConfig, jobRole, onEnd }) {
  const role        = jobRole || sessionConfig?.role || "Software Engineer";
  const isCodeRound = CODE_ROUNDS.has(sessionConfig?.round || "");

  const {
    conversationHistory,
    integrityScore,
    lastGain,
    lastAIMessage,
    isSpeaking,
    isListening,
    isThinking,
    liveTranscript,
    silenceCountdown,
    isSupported,
    micError,
    startListening,
    stopListening,
    endInterview,
    startSession,
    submitUserAnswer,
  } = useInterviewLogic({ jobRole: role, sessionConfig, onEnd });

  const [showCodePanel, setShowCodePanel] = useState(isCodeRound);

  useEffect(() => {
    if (isCodeRound) { setShowCodePanel(true); return; }
    if (lastAIMessage && questionRequiresCode(lastAIMessage)) {
      setShowCodePanel(true);
    }
  }, [lastAIMessage, isCodeRound]);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && sessionConfig) {
      startedRef.current = true;
      startSession(sessionConfig);
    }
  }, [sessionConfig, startSession]);

  const transcriptEndRef = useRef(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, isThinking]);

  const speakBtnRef = useRef(null);
  useEffect(() => {
    if (!isSpeaking && !isThinking && speakBtnRef.current) {
      speakBtnRef.current.focus();
    }
  }, [isSpeaking, isThinking]);

  const [textAnswer, setTextAnswer] = useState("");
  const handleTextSubmit = useCallback(() => {
    if (!textAnswer.trim()) return;
    submitUserAnswer(textAnswer.trim());
    setTextAnswer("");
  }, [textAnswer, submitUserAnswer]);

  const handleCodeSubmit = useCallback((formattedCode, language) => {
    submitUserAnswer(formattedCode);
  }, [submitUserAnswer]);

  // FIX-H: SPEAK only disabled while AI processing AND not yet speaking/listening
  const speakBtnDisabled = isThinking && !isSpeaking && !isListening;
  const isLive = isListening || isSpeaking;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", width: "100%",
      background: T.void,
      position: "relative", overflow: "hidden",
      fontFamily: T.sans,
    }}>
      <style>{`
        @keyframes dotFade { 0%,100% { opacity:0.25; } 50% { opacity:0.9; } }
        @keyframes barPulse { from { transform:scaleY(0.5); opacity:0.6; } to { transform:scaleY(1.15); opacity:1; } }
        @keyframes railScan {
          0%   { transform: translateX(-40%); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(140%); opacity: 0; }
        }
        @keyframes ringPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,90,54,0.35); }
          50%     { box-shadow: 0 0 0 5px rgba(255,90,54,0); }
        }
        #iv-speak-btn:focus-visible, #iv-end-btn:focus-visible, button:focus-visible {
          outline: 2px solid ${T.signal}; outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          #iv-scanline, .iv-breathe { animation: none !important; }
        }
      `}</style>

      {/* ═══ INSTRUMENT RAIL — single control surface, replaces floating badges ═══ */}
      <div style={{
        position: "relative", zIndex: 20, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px",
        background: T.panel,
        borderBottom: `1px solid ${T.lineFaint}`,
        overflow: "hidden",
      }}>
        {/* ambient scan-line while live, honestly evokes "being monitored" */}
        {isLive && (
          <div id="iv-scanline" style={{
            position: "absolute", top: 0, bottom: 0, left: 0, width: "30%",
            background: `linear-gradient(90deg, transparent, ${T.signalDim}, transparent)`,
            animation: "railScan 3.2s linear infinite", pointerEvents: "none",
          }} />
        )}

        {/* Left: session identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isLive ? T.signal : T.textFaint,
            flexShrink: 0,
            boxShadow: isLive ? `0 0 8px ${T.signal}` : "none",
            animation: isLive ? "ringPulse 1.8s ease-in-out infinite" : "none",
          }} className="iv-breathe" />
          <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 13.5, fontWeight: 700, color: T.text,
              letterSpacing: "-0.01em", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {sessionConfig?.company ? `${sessionConfig.company} · ${role}` : role}
            </span>
            {sessionConfig?.round && (
              <span style={{
                fontSize: 10, color: T.textFaint, letterSpacing: "0.08em",
                textTransform: "uppercase", whiteSpace: "nowrap",
              }}>
                {sessionConfig.round}{sessionConfig.difficulty ? ` · ${sessionConfig.difficulty}` : ""}
              </span>
            )}
          </div>
          <div style={{ width: 1, height: 22, background: T.line, flexShrink: 0 }} />
          <SessionTimer />
        </div>

        {/* Right: integrity + camera */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <IntegrityRing score={integrityScore} gainAnimation={lastGain} />
          <div style={{ width: 1, height: 22, background: T.line }} />
          <CameraPanel />
        </div>
      </div>

      {/* ── Main layout ── */}
      {showCodePanel ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "row",
          paddingBottom: 76, gap: 0, minHeight: 0,
        }}>
          <div style={{
            width: "34%", flexShrink: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-start",
            padding: "22px 18px 10px 22px",
            gap: 14, minHeight: 0,
            borderRight: `1px solid ${T.lineFaint}`,
          }}>
            {isThinking && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 20 }}>
                <ThinkingDots />
                <span style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, letterSpacing: "0.1em" }}>
                  THINKING
                </span>
              </div>
            )}

            <SpeakerSphere isSpeaking={isSpeaking} isThinking={isThinking && !isSpeaking} />
            <ListeningIndicator visible={isListening && !isSpeaking} />

            {liveTranscript && isListening && (
              <div style={{
                fontSize: 11, color: T.textFaint,
                maxWidth: "90%", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center",
              }}>
                {liveTranscript}
              </div>
            )}
            {silenceCountdown != null && silenceCountdown > 0 && isListening && (
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.signal, fontWeight: 600, letterSpacing: "0.06em" }}>
                Sending in {silenceCountdown}s
              </div>
            )}

            {conversationHistory.length > 0 && (
              <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
                <ConversationPanel
                  conversationHistory={conversationHistory}
                  isThinking={isThinking}
                  transcriptEndRef={transcriptEndRef}
                />
              </div>
            )}

            {micError && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                border: `1px solid ${T.signalMid}`,
                borderRadius: 8, padding: "6px 10px",
                fontSize: 11, color: T.text,
              }}>
                <Icon.Alert style={{ color: T.signal, flexShrink: 0 }} />
                {micError}
              </div>
            )}
          </div>

          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            padding: "18px 22px 8px", minHeight: 0,
          }}>
            <CodePanel
              onSubmit={handleCodeSubmit}
              isDisabled={speakBtnDisabled}
              defaultLanguage="python"
              question={lastAIMessage}
              isThinking={isThinking}
            />
          </div>
        </div>
      ) : (
        <>
          <div style={{
            flex: "0 0 68%",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 420, height: 320,
              background: `radial-gradient(ellipse, ${T.signalDim} 0%, transparent 72%)`,
              pointerEvents: "none", opacity: isLive ? 1 : 0.4,
              transition: "opacity 0.4s ease",
            }} />

            {isThinking && (
              <div style={{ position: "absolute", top: 26, display: "flex", alignItems: "center", gap: 8 }}>
                <ThinkingDots />
                <span style={{ fontSize: 10.5, color: T.textDim, fontWeight: 600, letterSpacing: "0.1em" }}>
                  THINKING
                </span>
              </div>
            )}

            <SpeakerSphere isSpeaking={isSpeaking} isThinking={isThinking && !isSpeaking} />
            <ListeningIndicator visible={isListening && !isSpeaking} />

            {silenceCountdown != null && silenceCountdown > 0 && isListening && (
              <div style={{ marginTop: 10, fontFamily: T.mono, fontSize: 10, color: T.signal, fontWeight: 600, letterSpacing: "0.06em" }}>
                Sending in {silenceCountdown}s
              </div>
            )}
          </div>

          <div style={{
            flex: "0 0 22%",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 28px", gap: 10,
          }}>
            <LiveCaption text={lastAIMessage} />

            {!isSupported && (
              <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 480 }}>
                <input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
                  }}
                  placeholder="Type your answer — mic unavailable"
                  disabled={isThinking}
                  style={{
                    flex: 1, background: T.panel,
                    border: `1px solid ${T.line}`,
                    borderRadius: 8, padding: "10px 13px",
                    fontSize: 13, color: T.text,
                    fontFamily: T.sans, outline: "none",
                    opacity: isThinking ? 0.5 : 1,
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.signalMid}
                  onBlur={(e) => e.target.style.borderColor = T.line}
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim() || isThinking}
                  style={{
                    padding: "10px 18px", borderRadius: 8, border: "none",
                    background: textAnswer.trim() && !isThinking ? T.signal : T.panel,
                    color: textAnswer.trim() && !isThinking ? "#fff" : T.textFaint,
                    fontSize: 12.5, fontWeight: 700,
                    cursor: textAnswer.trim() && !isThinking ? "pointer" : "not-allowed",
                    fontFamily: T.sans,
                  }}
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Bottom control bar ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "16px 24px 20px",
        background: `linear-gradient(to top, ${T.void} 0%, rgba(5,5,7,0.85) 60%, transparent 100%)`,
        zIndex: 20,
      }}>
        <SpeakerButton />

        {!isCodeRound && (
          <button
            onClick={() => setShowCodePanel((v) => !v)}
            aria-label={showCodePanel ? "Hide code panel" : "Show code panel"}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 10,
              border: `1px solid ${showCodePanel ? "rgba(255,255,255,0.16)" : T.line}`,
              background: showCodePanel ? T.panelUp : "transparent",
              color: showCodePanel ? T.text : T.textFaint,
              fontFamily: T.sans, fontWeight: 600, fontSize: 12.5, letterSpacing: "0.02em",
              cursor: "pointer", transition: "all 0.15s ease",
            }}
          >
            {showCodePanel ? <Icon.Chat /> : <Icon.Code />}
            <span>{showCodePanel ? "Voice" : "Code"}</span>
          </button>
        )}

        {isSupported && (
          <button
            ref={speakBtnRef}
            id="iv-speak-btn"
            aria-label={isListening ? "Stop listening" : isSpeaking ? "Interrupt AI" : "Start speaking"}
            onClick={isListening ? stopListening : startListening}
            disabled={speakBtnDisabled}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "13px 30px", borderRadius: 12,
              border: "none",
              background: isListening
                ? T.signal
                : isSpeaking
                ? T.panelUp
                : speakBtnDisabled
                ? T.panel
                : T.signal,
              color: isListening
                ? "#fff"
                : isSpeaking
                ? T.text
                : speakBtnDisabled
                ? T.textFaint
                : "#fff",
              fontFamily: T.sans, fontWeight: 700, fontSize: 14, letterSpacing: "0.01em",
              cursor: speakBtnDisabled ? "not-allowed" : "pointer",
              transition: "all 0.18s ease",
              boxShadow: isListening
                ? `0 0 0 0 rgba(255,90,54,0.5)`
                : !speakBtnDisabled && !isSpeaking
                ? `0 4px 20px rgba(255,90,54,0.35)`
                : "none",
              animation: isListening ? "ringPulse 1.5s ease-in-out infinite" : "none",
            }}
          >
            {isListening ? <Icon.Square /> : isSpeaking ? <Icon.Hand /> : <Icon.Mic />}
            <span>
              {isListening ? "Listening" : isSpeaking ? "Interrupt" : "Speak"}
            </span>
          </button>
        )}

        <button
          id="iv-end-btn"
          aria-label="End interview"
          onClick={endInterview}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "10px 20px", borderRadius: 10,
            border: `1px solid ${T.line}`,
            background: "transparent",
            color: T.textDim, fontFamily: T.sans,
            fontWeight: 600, fontSize: 12.5, letterSpacing: "0.02em",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = T.signalMid;
            e.currentTarget.style.color = T.signal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = T.line;
            e.currentTarget.style.color = T.textDim;
          }}
        >
          <Icon.Stop />
          <span>End</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESIGN NOTES (for future passes on sibling components — not code, just
   reference so the next edit stays consistent with this pass):

   Signature element: the instrument rail's scan-line sweep — the one
   deliberate risk taken here. It reframes "being watched during a proctored
   interview" honestly instead of hiding it behind glassmorphism, and it's
   the single animated flourish; everything else (dots, bars) is quieter and
   shares the same easing/duration family instead of each having its own
   timing.

   One accent discipline: #FF5A36 ("signal") is the ONLY color that means
   something — live mic, camera-live dot, danger-hover on End, silence
   countdown. It does not appear as a decorative border or background tint
   anywhere else. If a new control is added, ask "is this live/recording/
   danger?" — if not, it stays neutral (panelUp/line/textDim), never signal.

   Radius hierarchy: 6px on small chips (camera thumb), 8-10px on buttons/
   inputs, no more full-pill (999px) controls — that was the previous
   file's most repeated tell.

   Not yet touched: SpeakerSphere, ConversationBubble, IntegrityRing,
   CodePanel, sphere.module.css are still the pre-existing sibling files.
   Their internal visuals (sphere material, bubble styling, ring stroke)
   weren't included in this pass since only InterviewPanel.jsx was
   provided — if they still carry the old indigo/cyan accents internally,
   there'll be a visible seam until they're brought into this same token
   system in a follow-up pass.
═══════════════════════════════════════════════════════════════════════════ */