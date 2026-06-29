// FILE: src/components/interview/useInterviewLogic.js
// PROJECT: Friday AI — Career OS
// PURPOSE: Custom hook — STT, TTS, AI turn management, integrity scoring.
//
// FIXES (2026-06-25):
//   FIX-D: speakerEnabled read via a ref (speakerEnabledRef) inside speakIfEnabled()
//           so TTS callbacks inside startSession / submitUserAnswer never capture a stale value.
//   FIX-E: onFinalResult passed to useSpeechRecognition is a stable wrapper (never recreated)
//           that calls a ref. resetTranscript is stored in a ref AFTER the hook returns it,
//           so the callback never references it before initialization (fixes TDZ crash at line 326).
//   FIX-F: startListening has no isSpeakingAI gate — always works, stopSpeaking() cuts AI audio first.

import { useCallback, useRef, useState, useEffect } from "react";
import { speakText, stopSpeaking } from "../../store/audioStore";
import useAudioStore from "../../store/audioStore";
import useSpeechRecognition from "../../hooks/useSpeechRecognition";

const API = "http://127.0.0.1:8000";

// ── Company tier lookup ───────────────────────────────────────────────────────
const FAANG_SET = new Set([
  "google", "meta", "facebook", "amazon", "apple", "microsoft", "netflix",
]);
const TIER1_MNC_SET = new Set([
  "nvidia", "adobe", "salesforce", "oracle", "intel", "qualcomm",
  "openai", "anthropic", "deepmind", "tesla", "spacex",
]);
const TIER2_SET = new Set([
  "uber", "airbnb", "stripe", "coinbase", "databricks", "snowflake", "palantir",
  "figma", "canva", "notion", "linear", "vercel", "cloudflare", "mongodb",
  "twilio", "okta", "datadog", "wiz", "shopify", "flipkart", "razorpay",
  "paytm", "zomato", "swiggy", "cred", "meesho", "groww", "phonepe",
  "freshworks", "zoho", "browserstack", "hugging face",
]);

const COMPANY_MULTIPLIERS = { faang: 0.5, tier1_mnc: 0.6, tier2: 0.75, startup: 1.0 };

function inferCompanyTier(name = "") {
  const l = name.toLowerCase().trim();
  if (FAANG_SET.has(l))     return "faang";
  if (TIER1_MNC_SET.has(l)) return "tier1_mnc";
  if (TIER2_SET.has(l))     return "tier2";
  return "startup";
}

const POSITION_MULTIPLIERS = {
  intern: 1.0, junior: 0.85, mid: 0.70,
  senior: 0.55, staff: 0.40, director: 0.30,
};

function inferPositionLevel(levelStr = "") {
  const l = levelStr.toLowerCase();
  if (l.includes("intern") || l.includes("fresher"))                      return "intern";
  if (l.includes("sde-1") || l.includes("sde1") || l.includes("junior"))  return "junior";
  if (l.includes("sde-2") || l.includes("sde2") || l.includes("mid"))     return "mid";
  if (l.includes("senior") || l.includes("sde-3") || l.includes("sde3"))  return "senior";
  if (l.includes("staff") || l.includes("principal") || l.includes("lead")) return "staff";
  if (l.includes("director") || l.includes("vp") || l.includes(" em"))    return "director";
  return "mid";
}

const QUALITY_MULTIPLIERS = {
  excellent: 1.0, good: 0.75, average: 0.50, weak: 0.25, no_answer: 0.0,
};
const BASE_POINTS = 10;

function computeGain(companyName, levelStr, quality = "average") {
  const tier  = inferCompanyTier(companyName);
  const level = inferPositionLevel(levelStr);
  const cm    = COMPANY_MULTIPLIERS[tier]    ?? 1.0;
  const pm    = POSITION_MULTIPLIERS[level]  ?? 0.7;
  const qm    = QUALITY_MULTIPLIERS[quality] ?? 0.5;
  return parseFloat((BASE_POINTS * cm * pm * qm).toFixed(2));
}

function computeBreakdown(qualityLog) {
  const bd = { excellent: 0, good: 0, average: 0, weak: 0, no_answer: 0 };
  for (const entry of qualityLog) {
    if (entry.quality in bd) bd[entry.quality]++;
  }
  return bd;
}

function authHeaders(extra = {}) {
  const t = localStorage.getItem("access_token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function useInterviewLogic({
  jobRole       = "Software Engineer",
  sessionConfig = null,
  onEnd         = null,
} = {}) {

  // Conversation history: state for rendering + ref for callbacks
  const [conversationHistory, setConversationHistory] = useState([]);
  const historyRef = useRef([]);

  const [integrityScore, setIntegrityScore] = useState(0);
  const [lastGain,       setLastGain]       = useState(null);
  const [isSpeakingAI,   setIsSpeakingAI]  = useState(false);
  const [isThinking,     setIsThinking]     = useState(false);
  const [lastAIMessage,  setLastAIMessage]  = useState("");
  const [qualityLog,     setQualityLog]     = useState([]);

  const sessionRef     = useRef(null);
  const gainAnimTimer  = useRef(null);
  const tabViolations  = useRef(0);
  const sessionStarted = useRef(false);

  // FIX-D: keep a ref to speakerEnabled so TTS callbacks always see current value
  const speakerEnabled    = useAudioStore((s) => s.speakerEnabled);
  const speakerEnabledRef = useRef(speakerEnabled);
  useEffect(() => { speakerEnabledRef.current = speakerEnabled; }, [speakerEnabled]);

  // Stable helper — reads ref so it's never stale inside async callbacks
  const speakIfEnabled = useCallback((text, lang = "en") => {
    if (speakerEnabledRef.current) speakText(text, lang);
  }, []);

  // Tab-switch detection
  useEffect(() => {
    const handler = () => { if (document.hidden) tabViolations.current += 1; };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Poll speechSynthesis.speaking for AI speaking state
  useEffect(() => {
    const id = setInterval(() => {
      setIsSpeakingAI(Boolean(window?.speechSynthesis?.speaking));
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Push a message into history
  const pushMessage = useCallback((role, content, extra = {}) => {
    const msg = { role, content, timestamp: new Date(), ...extra };
    historyRef.current = [...historyRef.current, msg];
    setConversationHistory([...historyRef.current]);
  }, []);

  // Tag last user message with a quality label
  const tagLastUserMessage = useCallback((quality) => {
    const copy = [...historyRef.current];
    for (let i = copy.length - 1; i >= 0; i--) {
      if (copy[i].role === "user" && !copy[i].quality) {
        copy[i] = { ...copy[i], quality };
        break;
      }
    }
    historyRef.current = copy;
    setConversationHistory([...copy]);
  }, []);

  // Award integrity points
  const awardPoints = useCallback((gain) => {
    if (!gain || gain <= 0) return;
    clearTimeout(gainAnimTimer.current);
    setLastGain(gain);
    setIntegrityScore((prev) => Math.min(parseFloat((prev + gain).toFixed(2)), 100));
    gainAnimTimer.current = setTimeout(() => setLastGain(null), 1500);
  }, []);

  // Start session — guarded so it only fires once
  const startSession = useCallback(async (config) => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;

    setIsThinking(true);
    try {
      const res = await fetch(`${API}/interview/start`, {
        method:  "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body:    JSON.stringify(config),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      sessionRef.current = data.session;
      const msg = data.first_message;
      pushMessage("ai", msg);
      setLastAIMessage(msg);
      speakIfEnabled(msg, config.language || "en");
    } catch (err) {
      console.error("[useInterviewLogic] startSession:", err);
      const fallback = "Welcome! Let's begin your interview. Please tell me about yourself.";
      pushMessage("ai", fallback);
      setLastAIMessage(fallback);
      speakIfEnabled(fallback, config?.language || "en");
    } finally {
      setIsThinking(false);
    }
  }, [pushMessage, speakIfEnabled]);

  // ── FIX-E: submitUserAnswer kept in a ref so the STT onFinalResult callback
  //    always calls the latest version without requiring re-registration.
  const submitUserAnswerImpl = useCallback(async (answer) => {
    if (!answer?.trim() || isThinking) return;

    const lastAIQ = [...historyRef.current]
      .reverse()
      .find((m) => m.role === "ai")?.content || "";

    pushMessage("user", answer);
    setIsThinking(true);
    stopSpeaking();

    try {
      const session = sessionRef.current || {
        company:          sessionConfig?.company    || "Google",
        role:             jobRole,
        level:            sessionConfig?.level      || "Mid-level",
        difficulty:       sessionConfig?.difficulty || "Medium",
        language:         sessionConfig?.language   || "en",
        messages:         historyRef.current.map((m) => ({
          role:    m.role === "ai" ? "assistant" : "user",
          content: m.content,
        })),
        current_round:    sessionConfig?.round  || "behavioral",
        rounds:           [sessionConfig?.round || "behavioral"],
        round_index:      0,
        round_scores:     {},
        completed_rounds: [],
      };

      session.messages = [
        ...(session.messages || []),
        { role: "user", content: answer },
      ];

      const [answerSettled, evalSettled] = await Promise.allSettled([
        fetch(`${API}/interview/answer`, {
          method:  "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body:    JSON.stringify({
            session_id:          "local",
            answer,
            session,
            answer_duration_sec: 30,
          }),
        }),
        fetch(`${API}/interview/evaluate-answer`, {
          method:  "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body:    JSON.stringify({ question: lastAIQ, answer }),
        }),
      ]);

      let aiMessage = "Thank you. Let's continue.";
      if (answerSettled.status === "fulfilled" && answerSettled.value.ok) {
        const data = await answerSettled.value.json();
        sessionRef.current = data.session;
        aiMessage = data.next_message || aiMessage;
      } else {
        console.warn("[useInterviewLogic] /interview/answer failed");
      }

      pushMessage("ai", aiMessage);
      setLastAIMessage(aiMessage);
      speakIfEnabled(aiMessage, sessionConfig?.language || "en");

      let quality = "average";
      if (evalSettled.status === "fulfilled" && evalSettled.value.ok) {
        const evalData = await evalSettled.value.json();
        quality = evalData.quality || "average";
      }

      const gain = computeGain(
        sessionConfig?.company || "",
        sessionConfig?.level   || "",
        quality
      );
      awardPoints(gain);
      tagLastUserMessage(quality);
      setQualityLog((prev) => [...prev, { question: lastAIQ, answer, quality, gain }]);

    } catch (err) {
      console.error("[useInterviewLogic] submitUserAnswer:", err);
      const fallback = "Thank you for your answer. Let's continue.";
      pushMessage("ai", fallback);
      setLastAIMessage(fallback);
      awardPoints(computeGain(sessionConfig?.company || "", sessionConfig?.level || "", "average"));
    } finally {
      setIsThinking(false);
    }
  }, [
    isThinking, pushMessage, tagLastUserMessage,
    speakIfEnabled, jobRole, sessionConfig, awardPoints,
  ]);

  // FIX-E: stable ref — always points to the latest submitUserAnswerImpl
  const submitUserAnswerRef = useRef(submitUserAnswerImpl);
  useEffect(() => { submitUserAnswerRef.current = submitUserAnswerImpl; }, [submitUserAnswerImpl]);

  // FIX-E: stable wrapper whose identity never changes, so useSpeechRecognition
  // never needs to re-register the recognition instance.
  const stableOnFinalResult = useRef((transcript) => {
    submitUserAnswerRef.current(transcript);
  }).current;

  // FIX-E (TDZ fix): resetTranscript is returned by useSpeechRecognition below,
  // so it cannot be referenced inside the callback passed INTO that hook — doing
  // so causes "Cannot access 'resetTranscript' before initialization".
  // Solution: store resetTranscript in a ref after the hook returns it, then call
  // it via the ref inside the callback. The ref is always populated before the
  // callback can fire (callbacks only fire after the hook has fully initialized).
  const resetTranscriptRef = useRef(null);

  const {
    isSupported,
    isListening,
    transcript: liveTranscript,
    silenceCountdown,
    error: micError,
    startListening: startSTT,
    stopListening:  stopSTT,
    resetTranscript,
  } = useSpeechRecognition(
    sessionConfig?.language || "en",
    // FIX-E: stable wrapper with NO reference to resetTranscript (avoids TDZ)
    useCallback((finalTranscript) => {
      if (finalTranscript?.trim()) {
        stableOnFinalResult(finalTranscript.trim());
        // Safe: resetTranscriptRef.current is always set before this fires
        resetTranscriptRef.current?.();
      }
    }, [stableOnFinalResult])
  );

  // Store resetTranscript in the ref now that the hook has returned it.
  // This runs synchronously after the hook call, before any callbacks fire.
  resetTranscriptRef.current = resetTranscript;

  // FIX-F: startListening always works (no isSpeakingAI gate).
  // stopSpeaking() cuts any AI audio immediately, then mic starts.
  const startListening = useCallback(() => {
    if (isListening) return;
    stopSpeaking();
    startSTT();
  }, [isListening, startSTT]);

  const stopListening = useCallback(() => {
    if (isListening) stopSTT();
  }, [isListening, stopSTT]);

  const endInterview = useCallback(() => {
    stopSpeaking();
    stopSTT();
    if (!onEnd) return;

    const qualityBreakdown = computeBreakdown(qualityLog);
    const totalQuestions   = qualityLog.length;
    const avgGain = totalQuestions > 0
      ? parseFloat((qualityLog.reduce((s, e) => s + e.gain, 0) / totalQuestions).toFixed(2))
      : 0;

    onEnd({
      integrityScore,
      qualityLog,
      qualityBreakdown,
      totalQuestions,
      avgGain,
      tabViolations: tabViolations.current,
      company: sessionConfig?.company || "",
      role:    jobRole,
      level:   sessionConfig?.level   || "",
      round:   sessionConfig?.round   || "",
    });
  }, [stopSTT, onEnd, integrityScore, qualityLog, sessionConfig, jobRole]);

  return {
    conversationHistory,
    integrityScore,
    lastGain,
    lastAIMessage,
    qualityLog,
    isSpeaking:       isSpeakingAI,
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
    submitUserAnswer: submitUserAnswerImpl,
    tabViolations:    tabViolations.current,
  };
}