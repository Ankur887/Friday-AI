import { useCallback, useRef } from "react";
import useInterviewStore, { STATUS } from "../store/interviewStore";
import useCareerStore from "../store/careerStore";
import { speakText, stopSpeaking } from "../store/audioStore";
import useAudioStore from "../store/audioStore";

const API = "http://127.0.0.1:8000";

function authHeaders(extra = {}) {
  const t = localStorage.getItem("access_token");
  return { ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

export default function useInterview() {
  const store         = useInterviewStore();
  const careerStore   = useCareerStore();
  const speakerEnabled = useAudioStore((s) => s.speakerEnabled);
  const answerStartRef = useRef(null);

  // ── Start a new interview session ─────────────────────────────────────────
  const startSession = useCallback(async (config) => {
    store.setStatus(STATUS.THINKING);
    try {
      const res = await fetch(`${API}/interview/start`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      store.startSession(data);

      if (speakerEnabled) {
        speakText(data.first_message, config.language || "en");
      }
    } catch (err) {
      console.error("[useInterview] startSession failed:", err);
      store.setStatus(STATUS.IDLE);
      throw err;
    }
  }, [store, speakerEnabled]);

  // ── Submit an answer ──────────────────────────────────────────────────────
  const submitAnswer = useCallback(async (answer) => {
    const { session, config } = store;
    if (!session || !answer.trim()) return;

    const duration = answerStartRef.current
      ? (Date.now() - answerStartRef.current) / 1000
      : 30;

    store.addUserMessage(answer);
    store.setThinking(true);
    stopSpeaking();

    try {
      const res = await fetch(`${API}/interview/answer`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          session_id:          session.session_id || "local",
          answer,
          session,
          answer_duration_sec: duration,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      store.updateAfterAnswer(data);
      store.addAssistantMessage(data.next_message, data.score, data.voice_metrics);

      if (speakerEnabled) {
        speakText(data.next_message, config.language || "en");
      }

      answerStartRef.current = Date.now();

      return data;
    } catch (err) {
      console.error("[useInterview] submitAnswer failed:", err);
      store.setThinking(false);
      throw err;
    }
  }, [store, speakerEnabled]);

  // ── Advance to next round ─────────────────────────────────────────────────
  const nextRound = useCallback(async () => {
    const { session } = store;
    if (!session) return;

    store.setStatus(STATUS.THINKING);
    stopSpeaking();

    try {
      const res = await fetch(`${API}/interview/next-round`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ session_id: "local", session }),
      });
      const data = await res.json();

      if (data.done) {
        return endSession();
      }

      store.advanceRound(data);
      store.addAssistantMessage(data.next_question);
      if (speakerEnabled) {
        speakText(data.next_question, store.config.language || "en");
      }
    } catch (err) {
      console.error("[useInterview] nextRound failed:", err);
      store.setStatus(STATUS.ACTIVE);
    }
  }, [store, speakerEnabled]);

  // ── End interview and get report ──────────────────────────────────────────
  const endSession = useCallback(async () => {
    const { session } = store;
    if (!session) return;

    store.setStatus(STATUS.THINKING);
    stopSpeaking();

    try {
      const res = await fetch(`${API}/interview/end`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ session_id: "local", session }),
      });
      const data = await res.json();

      store.setReport(data.report);

      // Persist score to career store
      const avgScore = store.getAverageScore();
      if (avgScore > 0) {
        careerStore.recordInterviewScore(
          avgScore * 10, // convert 0-10 → 0-100
          store.config.company,
          store.config.role
        );
      }

      return data.report;
    } catch (err) {
      console.error("[useInterview] endSession failed:", err);
      store.setStatus(STATUS.ACTIVE);
      throw err;
    }
  }, [store, careerStore]);

  // ── Mark when the user starts composing an answer ────────────────────────
  const markAnswerStart = useCallback(() => {
    answerStartRef.current = Date.now();
  }, []);

  return {
    // state
    status:       store.status,
    messages:     store.messages,
    currentRound: store.currentRound,
    rounds:       store.rounds,
    roundNumber:  store.roundNumber,
    totalRounds:  store.totalRounds,
    isThinking:   store.isThinking,
    report:       store.report,
    config:       store.config,
    roundScores:  store.roundScores,
    voiceMetrics: store.voiceMetrics,

    // actions
    startSession,
    submitAnswer,
    nextRound,
    endSession,
    markAnswerStart,
    setConfig: store.setConfig,
    reset:     store.reset,
  };
}
