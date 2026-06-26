// FILE: src/components/interview/InterviewPanel.jsx
// PROJECT: Friday AI — Career OS
// PURPOSE: Live interview room — AI sphere, conversation, mic/speaker controls,
//          conditional CodePanel for coding rounds, camera overlay.
//
// FIXES CARRIED FORWARD:
//   FIX-G: SpeakerButton component wired to useAudioStore.toggleSpeaker()
//   FIX-H: SPEAK disabled only when isThinking && !isSpeaking && !isListening
//          When AI is speaking the button shows INTERRUPT and always works.

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
//  CameraPanel — live webcam + MediaPipe FaceMesh (CDN, no npm install)
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
      ctx.strokeStyle = "rgba(239,68,68,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(239,68,68,0.85)";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No face detected", canvas.width / 2, canvas.height / 2);
      setFaceInfo({ detected: false, eyesOpen: false, lookingAt: false, expression: "none", attention: 0 });
      return;
    }

    const lms   = results.multiFaceLandmarks[0];
    const count = results.multiFaceLandmarks.length;
    const xs = lms.map((l) => l.x * canvas.width);
    const ys = lms.map((l) => l.y * canvas.height);
    const minX = Math.min(...xs) - 12;
    const minY = Math.min(...ys) - 12;
    const maxX = Math.max(...xs) + 12;
    const maxY = Math.max(...ys) + 12;

    ctx.strokeStyle = count > 1 ? "rgba(239,68,68,0.8)" : "rgba(74,222,128,0.8)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

    const keyPoints = [10, 152, 234, 454, 33, 263, 1, 61, 291, 199, 4];
    ctx.fillStyle = "rgba(129,140,248,0.9)";
    keyPoints.forEach((idx) => {
      ctx.beginPath();
      ctx.arc(lms[idx].x * canvas.width, lms[idx].y * canvas.height, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const leftEyeIdx  = [33, 160, 158, 133, 153, 144];
    const rightEyeIdx = [362, 385, 387, 263, 373, 380];
    [leftEyeIdx, rightEyeIdx].forEach((indices) => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(96,165,250,0.85)";
      ctx.lineWidth = 1.2;
      indices.forEach((idx, i) => {
        const x = lms[idx].x * canvas.width;
        const y = lms[idx].y * canvas.height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    });

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

    ctx.fillStyle = count > 1 ? "rgba(239,68,68,0.9)" : "rgba(74,222,128,0.9)";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "left";
    ctx.fillText(count > 1 ? "⚠ Multiple faces" : "● You", minX, minY - 5);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 1. Start camera
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

      // 2. Load MediaPipe FaceMesh from CDN
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
        // MediaPipe failed — fallback to a simple "LIVE" canvas indicator
        console.warn("[CameraPanel] MediaPipe unavailable:", mpErr);
        const fallbackLoop = () => {
          if (cancelled || !videoRef.current || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const ctx    = canvas.getContext("2d");
          canvas.width  = videoRef.current.videoWidth  || 320;
          canvas.height = videoRef.current.videoHeight || 240;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "rgba(74,222,128,0.5)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(74,222,128,0.8)";
          ctx.font = "11px Arial";
          ctx.textAlign = "center";
          ctx.fillText("● Live  (basic detection)", canvas.width / 2, canvas.height - 10);
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

  const attColor =
    faceInfo.attention >= 70 ? "#4ADE80"
    : faceInfo.attention >= 40 ? "#FACC15"
    : "#F87171";

  return (
    <div style={{
      position: "absolute", top: 80, right: 20, zIndex: 15,
      width: collapsed ? 42 : 220,
      transition: "width 0.3s ease",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Show camera" : "Hide camera"}
        style={{
          alignSelf: "flex-end", width: 28, height: 28, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)", flexShrink: 0,
        }}
      >
        {collapsed ? "📷" : "✕"}
      </button>

      {!collapsed && (
        <>
          {/* Video container */}
          <div
            aria-label="Camera preview with face tracking"
            style={{
              position: "relative", width: 220, height: 165, borderRadius: 14,
              overflow: "hidden",
              border: `1.5px solid ${faceInfo.detected ? "rgba(74,222,128,0.4)" : "rgba(239,68,68,0.4)"}`,
              background: "#050510",
              boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            {cameraError ? (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6, padding: 12,
              }}>
                <span style={{ fontSize: 22 }}>📵</span>
                <span style={{ fontSize: 11, color: "#F87171", textAlign: "center", fontFamily: "Outfit, sans-serif" }}>
                  {cameraError}
                </span>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay muted playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />
                <canvas ref={canvasRef} style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  transform: "scaleX(-1)", pointerEvents: "none",
                }} />
                {/* LIVE badge */}
                <div style={{
                  position: "absolute", top: 6, left: 6,
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                  borderRadius: 99, padding: "2px 8px",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: cameraReady ? "#4ADE80" : "#FACC15",
                    animation: "ivBreathe 2s ease-in-out infinite",
                  }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.1em" }}>
                    {cameraReady ? "LIVE" : "STARTING"}
                  </span>
                </div>
                {/* Attention score */}
                <div style={{
                  position: "absolute", bottom: 6, right: 6,
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                  borderRadius: 99, padding: "2px 8px",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: attColor }}>
                    {faceInfo.attention}% focus
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Face status mini-list */}
          {!cameraError && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "8px 10px",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              {[
                [faceInfo.detected,  "Face detected",     "No face detected"],
                [faceInfo.eyesOpen,  "Eyes open",         "Eyes closed"],
                [faceInfo.lookingAt, "Looking at screen", "Not looking at screen"],
              ].map(([ok, yes, no], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: ok ? "#4ADE80" : "#F87171" }}>{ok ? "✓" : "✗"}</span>
                  <span style={{
                    fontSize: 10,
                    color: ok ? "rgba(255,255,255,0.65)" : "rgba(248,113,113,0.7)",
                    fontFamily: "Outfit, sans-serif",
                  }}>
                    {ok ? yes : no}
                  </span>
                </div>
              ))}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                marginTop: 2, paddingTop: 4,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontSize: 10, color: "#818CF8" }}>◎</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "Outfit, sans-serif" }}>
                  {faceInfo.expression}
                </span>
              </div>
            </div>
          )}
        </>
      )}
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
          transition={{ duration: 0.25 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, marginTop: 4 }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 22 }}>
            {[0.7, 1.3, 1.0, 1.5, 0.8].map((amp, i) => (
              <div key={i} style={{
                width: 4, borderRadius: 99, background: "#22D3EE",
                height: `${Math.round(amp * 9)}px`,
                boxShadow: "0 0 6px rgba(34,211,238,0.5)",
                animation: `listeningBounce ${0.48 + i * 0.06}s ${i * 0.08}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
          <span style={{ fontFamily: "Outfit, sans-serif", fontSize: 11, color: "#94A3B8", letterSpacing: "0.1em" }}>
            Listening…
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#818CF8",
          animation: `ivSpinDot 1s ${i * 0.2}s ease-in-out infinite`,
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
        <motion.div
          key={display}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            textAlign: "center", maxWidth: "70%", margin: "0 auto",
            fontSize: 15, fontStyle: "italic", color: "#94A3B8",
            fontFamily: "Outfit, Inter, sans-serif",
            lineHeight: 1.65, letterSpacing: "0.01em",
          }}
        >
          "{display}"
        </motion.div>
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
        padding: "8px 10px 4px",
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)",
        maxHeight: "30vh",
      }}
    >
      {conversationHistory.length === 0 && !isThinking && (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          height: "100%", gap: 8, opacity: 0.4, padding: 20,
        }}>
          <span style={{ fontSize: 22 }}>🎙️</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Outfit, sans-serif" }}>
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
        display:        "flex",
        alignItems:     "center",
        gap:            8,
        padding:        "12px 20px",
        borderRadius:   99,
        border: speakerEnabled
          ? "1.5px solid rgba(74,222,128,0.4)"
          : "1.5px solid rgba(255,255,255,0.12)",
        background: speakerEnabled
          ? "rgba(74,222,128,0.1)"
          : "rgba(255,255,255,0.04)",
        color:          speakerEnabled ? "#4ADE80" : "rgba(255,255,255,0.25)",
        fontFamily:     "Outfit, sans-serif",
        fontWeight:     700,
        fontSize:       13,
        letterSpacing:  "0.05em",
        cursor:         "pointer",
        transition:     "all 0.2s ease",
        backdropFilter: "blur(12px)",
        boxShadow:      speakerEnabled ? "0 0 14px rgba(74,222,128,0.15)" : "none",
      }}
    >
      <span style={{ fontSize: 16 }}>{speakerEnabled ? "🔊" : "🔇"}</span>
      <span>{speakerEnabled ? "AI VOICE ON" : "AI VOICE OFF"}</span>
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
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, color: "rgba(255,255,255,0.3)",
      letterSpacing: "0.08em",
    }}>
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

  // Detect if current question needs code panel (even in non-coding rounds)
  const [showCodePanel, setShowCodePanel] = useState(isCodeRound);

  useEffect(() => {
    if (isCodeRound) { setShowCodePanel(true); return; }
    if (lastAIMessage && questionRequiresCode(lastAIMessage)) {
      setShowCodePanel(true);
    }
  }, [lastAIMessage, isCodeRound]);

  // Start session once
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && sessionConfig) {
      startedRef.current = true;
      startSession(sessionConfig);
    }
  }, [sessionConfig, startSession]);

  // Auto-scroll conversation
  const transcriptEndRef = useRef(null);
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, isThinking]);

  // Focus SPEAK button after AI finishes speaking
  const speakBtnRef = useRef(null);
  useEffect(() => {
    if (!isSpeaking && !isThinking && speakBtnRef.current) {
      speakBtnRef.current.focus();
    }
  }, [isSpeaking, isThinking]);

  // Text fallback (when STT not supported)
  const [textAnswer, setTextAnswer] = useState("");
  const handleTextSubmit = useCallback(() => {
    if (!textAnswer.trim()) return;
    submitUserAnswer(textAnswer.trim());
    setTextAnswer("");
  }, [textAnswer, submitUserAnswer]);

  // Code panel submit handler
  const handleCodeSubmit = useCallback((formattedCode, language) => {
    submitUserAnswer(formattedCode);
  }, [submitUserAnswer]);

  // FIX-H: SPEAK only disabled while AI processing AND not yet speaking/listening
  const speakBtnDisabled = isThinking && !isSpeaking && !isListening;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", width: "100%",
      background: "linear-gradient(160deg, #050510 0%, #0A0A18 50%, #060612 100%)",
      position: "relative", overflow: "hidden",
      fontFamily: "Outfit, Inter, sans-serif",
    }}>
      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes ivSpinDot {
          0%,100% { transform:translateY(0); opacity:0.4; }
          50%      { transform:translateY(-6px); opacity:1; }
        }
        @keyframes listeningBounce {
          from { transform:scaleY(0.55); opacity:0.7; }
          to   { transform:scaleY(1.2);  opacity:1; }
        }
        @keyframes ivBreathe {
          0%,100% { box-shadow:0 0 0 0 rgba(239,68,68,0.5),0 0 0 6px rgba(239,68,68,0.2); }
          50%     { box-shadow:0 0 0 10px rgba(239,68,68,0.15),0 0 0 22px rgba(239,68,68,0.06); }
        }
        @keyframes waveStrokeDash { to { stroke-dashoffset: -40; } }
      `}</style>

      {/* ── Camera overlay (top-right) ── */}
      <CameraPanel />

      {/* ── Integrity Ring (top-right area, left of camera) ── */}
      <div style={{ position: "absolute", top: 20, right: 254, zIndex: 20 }}>
        <IntegrityRing score={integrityScore} gainAnimation={lastGain} />
      </div>

      {/* ── Session badge (top-left) ── */}
      {sessionConfig?.company && (
        <div style={{
          position: "absolute", top: 22, left: 24, zIndex: 20,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(91,111,245,0.12)",
            border: "1px solid rgba(91,111,245,0.25)",
            borderRadius: 99, padding: "4px 12px",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: "#4ADE80",
              boxShadow: "0 0 8px rgba(74,222,128,0.6)",
              animation: "ivBreathe 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#C7D2FE", letterSpacing: "0.08em" }}>
              {sessionConfig.company} · {role}
            </span>
            <SessionTimer />
          </div>
          {sessionConfig.round && (
            <span style={{
              fontSize: 9, color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.14em", paddingLeft: 14, textTransform: "uppercase",
            }}>
              {sessionConfig.round} · {sessionConfig.difficulty || ""}
            </span>
          )}
        </div>
      )}

      {/* ── Main layout ── */}
      {showCodePanel ? (
        /* CODING LAYOUT: left sphere (35%) + right code panel (65%) */
        <div style={{
          flex: 1, display: "flex", flexDirection: "row",
          paddingTop: 72, paddingBottom: 80,
          gap: 0, minHeight: 0,
        }}>
          {/* Left: sphere + conversation */}
          <div style={{
            width: "35%", flexShrink: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-start",
            paddingTop: 20, paddingLeft: 20, paddingRight: 10,
            gap: 14, minHeight: 0,
          }}>
            {/* Thinking label */}
            {isThinking && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 24 }}>
                <ThinkingDots />
                <span style={{ fontSize: 11, color: "#818CF8", fontWeight: 600, letterSpacing: "0.1em" }}>
                  AI is thinking…
                </span>
              </div>
            )}

            <SpeakerSphere isSpeaking={isSpeaking} isThinking={isThinking && !isSpeaking} />
            <ListeningIndicator visible={isListening && !isSpeaking} />

            {liveTranscript && isListening && (
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.35)",
                maxWidth: "90%", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center",
              }}>
                "{liveTranscript}"
              </div>
            )}
            {silenceCountdown != null && silenceCountdown > 0 && isListening && (
              <div style={{ fontSize: 10, color: "#22D3EE", fontWeight: 700, letterSpacing: "0.1em" }}>
                Auto-sending in {silenceCountdown}s…
              </div>
            )}

            {/* Conversation scroll (compact) */}
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
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10, padding: "6px 12px",
                fontSize: 11, color: "#FCA5A5", textAlign: "center",
              }}>
                ⚠️ {micError}
              </div>
            )}
          </div>

          {/* Right: Code panel */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            paddingTop: 12, paddingRight: 20, paddingBottom: 4, minHeight: 0,
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
        /* VOICE LAYOUT: centered sphere + live caption */
        <>
          {/* Sphere area */}
          <div style={{
            flex: "0 0 70%",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            {/* Ambient glow */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400, height: 300,
              background: "radial-gradient(ellipse, rgba(79,70,229,0.14) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {isThinking && (
              <div style={{
                position: "absolute", top: 28,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <ThinkingDots />
                <span style={{ fontSize: 11, color: "#818CF8", fontWeight: 600, letterSpacing: "0.1em" }}>
                  AI is thinking…
                </span>
              </div>
            )}

            <SpeakerSphere isSpeaking={isSpeaking} isThinking={isThinking && !isSpeaking} />
            <ListeningIndicator visible={isListening && !isSpeaking} />

            {silenceCountdown != null && silenceCountdown > 0 && isListening && (
              <div style={{ marginTop: 8, fontSize: 10, color: "#22D3EE", fontWeight: 700, letterSpacing: "0.1em" }}>
                Auto-sending in {silenceCountdown}s…
              </div>
            )}
          </div>

          {/* Live caption area */}
          <div style={{
            flex: "0 0 20%",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "0 24px", gap: 8,
          }}>
            <LiveCaption text={lastAIMessage} />

            {/* Text input fallback when STT not supported */}
            {!isSupported && (
              <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 500 }}>
                <input
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
                  }}
                  placeholder="Type your answer (mic not available)…"
                  disabled={isThinking}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "9px 12px",
                    fontSize: 13, color: "#D1D5DB",
                    fontFamily: "Outfit, sans-serif", outline: "none",
                    opacity: isThinking ? 0.5 : 1,
                  }}
                />
                <button
                  onClick={handleTextSubmit}
                  disabled={!textAnswer.trim() || isThinking}
                  style={{
                    padding: "9px 16px", borderRadius: 10, border: "none",
                    background: textAnswer.trim() && !isThinking ? "rgba(79,70,229,0.8)" : "rgba(255,255,255,0.06)",
                    color: textAnswer.trim() && !isThinking ? "#fff" : "#6B7280",
                    fontSize: 12, fontWeight: 700, cursor: textAnswer.trim() && !isThinking ? "pointer" : "not-allowed",
                    fontFamily: "Outfit, sans-serif",
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
        gap: 12, padding: "12px 24px 16px",
        background: "linear-gradient(to top, rgba(5,5,16,0.95) 0%, rgba(5,5,16,0.7) 70%, transparent 100%)",
        zIndex: 20,
      }}>
        {/* FIX-G: Speaker toggle */}
        <SpeakerButton />

        {/* Toggle code panel button (always available) */}
        {!isCodeRound && (
          <button
            onClick={() => setShowCodePanel((v) => !v)}
            aria-label={showCodePanel ? "Hide code panel" : "Show code panel"}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "12px 18px", borderRadius: 99,
              border: showCodePanel
                ? "1.5px solid rgba(251,191,36,0.4)"
                : "1.5px solid rgba(255,255,255,0.12)",
              background: showCodePanel
                ? "rgba(251,191,36,0.1)"
                : "rgba(255,255,255,0.04)",
              color: showCodePanel ? "#FCD34D" : "rgba(255,255,255,0.4)",
              fontFamily: "Outfit, sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: "0.05em", cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <span>{ showCodePanel ? "💬" : "💻" }</span>
            <span>{ showCodePanel ? "VOICE" : "CODE" }</span>
          </button>
        )}

        {/* SPEAK / mic button — FIX-H */}
        {isSupported && (
          <button
            ref={speakBtnRef}
            id="iv-speak-btn"
            aria-label={isListening ? "Stop listening" : isSpeaking ? "Interrupt AI" : "Start speaking"}
            onClick={isListening ? stopListening : startListening}
            disabled={speakBtnDisabled}
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            10,
              padding:        "12px 28px",
              borderRadius:   99,
              border: isListening
                ? "1.5px solid rgba(239,68,68,0.6)"
                : isSpeaking
                ? "1.5px solid rgba(34,211,238,0.5)"
                : speakBtnDisabled
                ? "1.5px solid rgba(255,255,255,0.08)"
                : "1.5px solid rgba(255,255,255,0.15)",
              background: isListening
                ? "rgba(239,68,68,0.18)"
                : isSpeaking
                ? "rgba(34,211,238,0.1)"
                : speakBtnDisabled
                ? "rgba(255,255,255,0.03)"
                : "rgba(79,70,229,0.18)",
              color: isListening
                ? "#FCA5A5"
                : isSpeaking
                ? "#67E8F9"
                : speakBtnDisabled
                ? "#374151"
                : "#C7D2FE",
              fontFamily:     "Outfit, sans-serif",
              fontWeight:     700,
              fontSize:       14,
              letterSpacing:  "0.05em",
              cursor:         speakBtnDisabled ? "not-allowed" : "pointer",
              transition:     "all 0.2s ease",
              backdropFilter: "blur(12px)",
              boxShadow: isListening
                ? "0 0 0 0 rgba(239,68,68,0.5), 0 0 0 6px rgba(239,68,68,0.2)"
                : isSpeaking
                ? "0 0 16px rgba(34,211,238,0.2)"
                : !speakBtnDisabled
                ? "0 0 20px rgba(79,70,229,0.25)"
                : "none",
              animation: isListening ? "ivBreathe 1.8s ease-in-out infinite" : "none",
            }}
          >
            <span style={{ fontSize: 18 }}>
              {isListening ? "🔴" : isSpeaking ? "✋" : "🎤"}
            </span>
            <span>
              {isListening ? "LISTENING…" : isSpeaking ? "INTERRUPT" : "SPEAK"}
            </span>
          </button>
        )}

        {/* END INTERVIEW */}
        <button
          id="iv-end-btn"
          aria-label="End interview"
          onClick={endInterview}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 28px", borderRadius: 99,
            border: "1.5px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.08)",
            color: "#FCA5A5", fontFamily: "Outfit, sans-serif",
            fontWeight: 700, fontSize: 14, letterSpacing: "0.05em",
            cursor: "pointer", transition: "all 0.2s ease",
            backdropFilter: "blur(12px)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background  = "rgba(239,68,68,0.18)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background  = "rgba(239,68,68,0.08)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          }}
        >
          <span style={{ fontSize: 18 }}>⏹</span>
          <span>END INTERVIEW</span>
        </button>
      </div>
    </div>
  );
}