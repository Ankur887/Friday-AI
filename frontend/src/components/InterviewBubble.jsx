import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
import useInterview from "../hooks/useInterview";
import useVoice from "../hooks/useVoice";
import useInterviewStore, { ROUND_LABELS, STATUS } from "../store/interviewStore";
import useAudioStore from "../store/audioStore";

const PHASE_META = {
  listening: {
    label: "Listening",
    dot: "#ef4444",
    glow: "rgba(239,68,68,0.4)",
    bg: "rgba(239,68,68,0.08)",
    text: "#fca5a5",
  },
  thinking: {
    label: "Thinking…",
    dot: "#6366f1",
    glow: "rgba(99,102,241,0.4)",
    bg: "rgba(99,102,241,0.08)",
    text: "#a5b4fc",
  },
  speaking: {
    label: "Speaking",
    dot: "#00BCD4",
    glow: "rgba(0,188,212,0.4)",
    bg: "rgba(0,188,212,0.08)",
    text: "#67e8f9",
  },
  ready: {
    label: "Ready",
    dot: "#6b7280",
    glow: "rgba(107,114,128,0.2)",
    bg: "rgba(107,114,128,0.06)",
    text: "#9ca3af",
  },
};

export default function InterviewBubble() {
  const status      = useInterviewStore((s) => s.status);
  const currentRound= useInterviewStore((s) => s.currentRound);
  const roundNumber = useInterviewStore((s) => s.roundNumber);
  const totalRounds = useInterviewStore((s) => s.totalRounds);
  const config      = useInterviewStore((s) => s.config);

  const { isThinking, submitAnswer } = useInterview();

  const {
    isSupported,
    isListening,
    transcript,
    silenceCountdown,
    startListening,
    stopListening,
    speakerEnabled,
  } = useVoice({
    lang: config?.language || "en",
    onAutoSend: (text) => {
      if (text?.trim()) submitAnswer(text.trim());
    },
  });

  const audioStore  = useAudioStore();
  const toggleSpeaker = () => {
    if (typeof audioStore.toggleSpeaker === "function") {
      audioStore.toggleSpeaker();
    }
  };

  const [isSpeaking, setIsSpeaking] = useState(false);
  useEffect(() => {
    if (!speakerEnabled) { setIsSpeaking(false); return; }
    const id = setInterval(() => {
      setIsSpeaking(Boolean(window?.speechSynthesis?.speaking));
    }, 150);
    return () => clearInterval(id);
  }, [speakerEnabled]);

  const [expanded, setExpanded] = useState(true);

  const isVisible =
    status === STATUS.ACTIVE ||
    status === STATUS.THINKING ||
    status === STATUS.ROUND_END;

  if (!isVisible) return null;

  const phase = isThinking ? "thinking" : isListening ? "listening" : isSpeaking ? "speaking" : "ready";
  const meta  = PHASE_META[phase];
  const roundLabel = ROUND_LABELS[currentRound] || currentRound || "—";
  const progress = (roundNumber / Math.max(totalRounds, 1)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 28, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, fontFamily: "Outfit, sans-serif" }}
    >
      <div style={{
        width: 280,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(22,23,24,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset",
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "12px 14px",
            background: "transparent", border: "none", cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {/* Status dot with pulse */}
            <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: meta.dot,
                boxShadow: `0 0 6px ${meta.glow}`,
              }} />
              {(phase === "listening" || phase === "thinking") && (
                <motion.div
                  style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: meta.dot,
                  }}
                  animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e3e3e3", letterSpacing: "0.01em" }}>
              {meta.label}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Round badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              padding: "2px 7px", borderRadius: 6,
              background: "rgba(0,188,212,0.12)",
              color: "#00BCD4", textTransform: "uppercase",
            }}>
              {roundNumber}/{totalRounds}
            </span>
            <span style={{ color: "#4b5563" }}>
              {expanded
                ? <ChevronDown size={14} />
                : <ChevronUp size={14} />}
            </span>
          </div>
        </button>

        {/* ── Expandable body ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}
            >
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

                {/* Round label + progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{roundLabel}</span>
                    <span style={{ fontSize: 11, color: "#4b5563" }}>Round {roundNumber} of {totalRounds}</span>
                  </div>
                  <div style={{
                    height: 3, borderRadius: 99, width: "100%",
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}>
                    <motion.div
                      style={{
                        height: "100%", borderRadius: 99,
                        background: "linear-gradient(90deg, #6366f1, #00BCD4)",
                      }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Live transcript */}
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      borderRadius: 10, padding: "8px 11px",
                      background: "rgba(239,68,68,0.09)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <p style={{
                      fontSize: 12, color: "#fca5a5", margin: 0,
                      lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {transcript || "Listening for your answer…"}
                    </p>
                    {typeof silenceCountdown === "number" && silenceCountdown > 0 && (
                      <p style={{ fontSize: 10, color: "rgba(252,165,165,0.6)", margin: "4px 0 0" }}>
                        Auto-sending in {silenceCountdown}s
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Speaking waveform */}
                {phase === "speaking" && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 3, padding: "8px 0",
                    borderRadius: 10,
                    background: "rgba(0,188,212,0.07)",
                    border: "1px solid rgba(0,188,212,0.15)",
                  }}>
                    {[0.6, 1.0, 0.7, 1.4, 0.8, 1.2, 0.6].map((amp, i) => (
                      <motion.div
                        key={i}
                        style={{ width: 3, borderRadius: 99, background: "#00BCD4" }}
                        animate={{ height: [4, 4 + amp * 12, 4] }}
                        transition={{
                          duration: 0.7 + i * 0.05,
                          repeat: Infinity,
                          delay: i * 0.07,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Thinking dots */}
                {phase === "thinking" && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 5, padding: "8px 0",
                    borderRadius: 10,
                    background: "rgba(99,102,241,0.07)",
                    border: "1px solid rgba(99,102,241,0.15)",
                  }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }}
                        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                )}

                {/* Controls */}
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Mic button */}
                  <button
                    disabled={!isSupported}
                    onClick={() => isListening ? stopListening() : startListening()}
                    title={isSupported ? "Toggle microphone" : "Voice input not supported"}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 7, height: 36, borderRadius: 10, border: "none",
                      cursor: isSupported ? "pointer" : "not-allowed",
                      fontFamily: "Outfit, sans-serif", fontSize: 13, fontWeight: 600,
                      transition: "background 0.15s, box-shadow 0.15s",
                      background: isListening
                        ? "rgba(239,68,68,0.85)"
                        : "rgba(255,255,255,0.07)",
                      color: isListening ? "#fff" : "#9ca3af",
                      boxShadow: isListening ? "0 0 12px rgba(239,68,68,0.35)" : "none",
                      opacity: isSupported ? 1 : 0.4,
                    }}
                  >
                    {isListening
                      ? <Mic size={14} />
                      : <MicOff size={14} />}
                    {isListening ? "Stop" : "Speak"}
                  </button>

                  {/* Speaker toggle */}
                  <button
                    onClick={toggleSpeaker}
                    title={speakerEnabled ? "Mute interviewer" : "Unmute interviewer"}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: "none",
                      cursor: "pointer", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: speakerEnabled
                        ? "rgba(0,188,212,0.15)"
                        : "rgba(255,255,255,0.07)",
                      color: speakerEnabled ? "#00BCD4" : "#6b7280",
                      transition: "background 0.15s",
                    }}
                  >
                    {speakerEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}