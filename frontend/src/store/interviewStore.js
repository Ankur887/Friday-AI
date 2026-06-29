import { create } from "zustand";

// ── Round labels ───────────────────────────────────────────────────────────────
export const ROUND_LABELS = {
  resume_screening: "Resume Screening",
  recruiter:        "Recruiter Screen",
  behavioral:       "Behavioral",
  technical_screen: "Technical Screen",
  coding:           "Coding Round",
  debugging:        "Debugging",
  project_deepdive: "Project Deep Dive",
  system_design:    "System Design",
  ai_ml:            "AI / ML Round",
  leadership:       "Leadership",
  hr:               "HR Round",
  final_eval:       "Final Evaluation",
};

// ── Status constants ───────────────────────────────────────────────────────────
export const STATUS = {
  IDLE:         "idle",
  SETUP:        "setup",
  ACTIVE:       "active",
  THINKING:     "thinking",
  LISTENING:    "listening",
  ROUND_END:    "round_end",
  COMPLETE:     "complete",
};

const useInterviewStore = create((set, get) => ({
  // ── Session config ──────────────────────────────────────────────────────────
  config: {
    company:       "Google",
    role:          "Software Engineer",
    level:         "Mid-level",
    stack:         "",
    difficulty:    "Medium",
    language:      "en",
    resume_text:   "",
    github_url:    "",
    linkedin_url:  "",
    portfolio_url: "",
  },

  // ── Active session state ────────────────────────────────────────────────────
  status:         STATUS.IDLE,
  session:        null,      // full session object from backend
  messages:       [],        // { role, content, score?, voice_metrics? }
  currentRound:   "",
  rounds:         [],
  roundNumber:    1,
  totalRounds:    1,
  isThinking:     false,
  isListening:    false,
  isSpeaking:     false,

  // ── Round tracking ──────────────────────────────────────────────────────────
  roundScores:      {},       // { round_key: [score, score, ...] }
  voiceMetrics:     [],       // accumulated per-answer voice analysis
  answerCount:      0,

  // ── Final report ────────────────────────────────────────────────────────────
  report:           null,

  // ── Setters ─────────────────────────────────────────────────────────────────
  setConfig: (patch) =>
    set((s) => ({ config: { ...s.config, ...patch } })),

  setStatus: (status) => set({ status }),

  setSession: (session) => set({ session }),

  startSession: (data) => set({
    session:      data.session,
    rounds:       data.rounds,
    currentRound: data.current_round,
    roundNumber:  data.round_number,
    totalRounds:  data.total_rounds,
    status:       STATUS.ACTIVE,
    messages:     [{ role: "assistant", content: data.first_message }],
    roundScores:  {},
    voiceMetrics: [],
    answerCount:  0,
    report:       null,
  }),

  addUserMessage: (content) =>
    set((s) => ({
      messages:    [...s.messages, { role: "user", content }],
      answerCount: s.answerCount + 1,
    })),

  addAssistantMessage: (content, score, voice_metrics) =>
    set((s) => ({
      messages: [...s.messages, { role: "assistant", content, score, voice_metrics }],
    })),

  updateAfterAnswer: (data) =>
    set((s) => {
      const round = s.currentRound;
      const prev  = s.roundScores[round] || [];
      return {
        session:      data.session,
        roundScores:  { ...s.roundScores, [round]: [...prev, data.score] },
        voiceMetrics: [...s.voiceMetrics, data.voice_metrics],
        isThinking:   false,
      };
    }),

  advanceRound: (data) => set({
    session:      data.session,
    currentRound: data.current_round,
    roundNumber:  data.round_number,
    totalRounds:  data.total_rounds,
    status:       STATUS.ACTIVE,
  }),

  setReport: (report) => set({ report, status: STATUS.COMPLETE }),

  setThinking: (v) => set({ isThinking: v }),
  setListening: (v) => set({ isListening: v }),
  setSpeaking:  (v) => set({ isSpeaking: v }),

  reset: () => set({
    status:       STATUS.IDLE,
    session:      null,
    messages:     [],
    currentRound: "",
    rounds:       [],
    roundNumber:  1,
    totalRounds:  1,
    isThinking:   false,
    isListening:  false,
    isSpeaking:   false,
    roundScores:  {},
    voiceMetrics: [],
    answerCount:  0,
    report:       null,
  }),

  // ── Computed helpers ─────────────────────────────────────────────────────────
  getAverageScore: () => {
    const { roundScores } = get();
    const all = Object.values(roundScores).flat();
    return all.length ? Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10 : 0;
  },

  getAverageVoiceScore: () => {
    const { voiceMetrics } = get();
    if (!voiceMetrics.length) return 0;
    const scores = voiceMetrics.map((v) => v?.overall || 0).filter(Boolean);
    return scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
  },
}));

export default useInterviewStore;
