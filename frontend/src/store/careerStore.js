import { create } from "zustand";

const STORAGE_KEY = "friday_career_data";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function save(patch) {
  try {
    const existing = load();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...patch }));
  } catch { /* ignore */ }
}

const useCareerStore = create((set, get) => {
  const persisted = load();

  return {
    // ── Dashboard stats (persisted) ─────────────────────────────────────────
    problemsSolved:   persisted.problemsSolved   ?? 0,
    streakDays:       persisted.streakDays       ?? 0,
    hourspracticed:   persisted.hourspracticed    ?? 0,
    resumeScore:      persisted.resumeScore      ?? 0,
    interviewScores:  persisted.interviewScores  ?? [],  // [{date, score, company, role}]
    skillsProfile:    persisted.skillsProfile    ?? [],  // ["React", "Python", ...]
    experienceYears:  persisted.experienceYears  ?? 0,
    projectsCount:    persisted.projectsCount    ?? 0,
    targetRole:       persisted.targetRole       ?? "Software Engineer",
    targetCompany:    persisted.targetCompany    ?? "",

    // ── Roadmap (session — not persisted) ──────────────────────────────────
    roadmap:          null,
    roadmapLoading:   false,
    roadmapError:     null,

    // ── Readiness (session) ─────────────────────────────────────────────────
    readiness:        persisted.readiness ?? null,
    readinessLoading: false,

    // ── Insights ────────────────────────────────────────────────────────────
    insights:         null,

    // ── Setters ─────────────────────────────────────────────────────────────
    setTargetRole: (role) => {
      save({ targetRole: role });
      set({ targetRole: role });
    },
    setTargetCompany: (company) => {
      save({ targetCompany: company });
      set({ targetCompany: company });
    },
    setSkillsProfile: (skills) => {
      save({ skillsProfile: skills });
      set({ skillsProfile: skills });
    },
    setExperienceYears: (yrs) => {
      save({ experienceYears: yrs });
      set({ experienceYears: yrs });
    },
    setProjectsCount: (n) => {
      save({ projectsCount: n });
      set({ projectsCount: n });
    },

    recordInterviewScore: (score, company, role) => {
      const entry  = { date: new Date().toISOString(), score, company, role };
      const scores = [...get().interviewScores, entry].slice(-50); // keep last 50
      save({ interviewScores: scores });
      set({ interviewScores: scores });
    },

    setResumeScore: (score) => {
      save({ resumeScore: score });
      set({ resumeScore: score });
    },

    incrementProblems: (n = 1) => {
      const next = get().problemsSolved + n;
      save({ problemsSolved: next });
      set({ problemsSolved: next });
    },

    addHours: (h) => {
      const next = Math.round((get().hoursracted + h) * 10) / 10;
      save({ hoursracticed: next });
      set({ hoursracticed: next });
    },

    updateStreak: () => {
      const today = new Date().toDateString();
      const lastKey = "friday_last_active";
      const last  = localStorage.getItem(lastKey);
      let streak = get().streakDays;
      if (last !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        streak = last === yesterday ? streak + 1 : 1;
        localStorage.setItem(lastKey, today);
        save({ streakDays: streak });
        set({ streakDays: streak });
      }
    },

    // ── Roadmap ─────────────────────────────────────────────────────────────
    setRoadmap: (data) => set({ roadmap: data, roadmapLoading: false, roadmapError: null }),
    setRoadmapLoading: (v) => set({ roadmapLoading: v }),
    setRoadmapError: (e) => set({ roadmapError: e, roadmapLoading: false }),

    // ── Readiness ───────────────────────────────────────────────────────────
    setReadiness: (data) => {
      save({ readiness: data });
      set({ readiness: data, readinessLoading: false });
    },
    setReadinessLoading: (v) => set({ readinessLoading: v }),

    // ── Insights ────────────────────────────────────────────────────────────
    setInsights: (data) => set({ insights: data }),

    // ── Computed ────────────────────────────────────────────────────────────
    getAverageInterviewScore: () => {
      const scores = get().interviewScores.map((s) => s.score).filter(Boolean);
      if (!scores.length) return 0;
      return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    },

    getRecentScores: (n = 5) => get().interviewScores.slice(-n),
  };
});

export default useCareerStore;
