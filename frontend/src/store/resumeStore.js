import { create } from "zustand";
import { persist } from "zustand/middleware";

const useResumeStore = create(
  persist(
    (set, get) => ({
      // ── State ──────────────────────────────────────────────────────────────
      resumes: [],
      currentResume: null,
      selectedTemplate: "modern",
      uploadProgress: 0,
      uploadStage: "",
      atsScore: null,
      isLoading: false,
      autosaveStatus: "idle", // 'idle' | 'saving' | 'saved' | 'error'
      activeTab: "resumes",   // 'resumes' | 'templates' | 'analyzed' | 'recent'

      // ── Actions ────────────────────────────────────────────────────────────
      setResumes: (resumes) => set({ resumes }),

      addResume: (resume) =>
        set((s) => ({ resumes: [resume, ...s.resumes] })),

      updateResume: (id, patch) =>
        set((s) => ({
          resumes: s.resumes.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
          ),
          currentResume:
            s.currentResume?.id === id
              ? { ...s.currentResume, ...patch, updatedAt: new Date().toISOString() }
              : s.currentResume,
        })),

      deleteResume: (id) =>
        set((s) => ({
          resumes: s.resumes.filter((r) => r.id !== id),
          currentResume: s.currentResume?.id === id ? null : s.currentResume,
        })),

      duplicateResume: (id) => {
        const original = get().resumes.find((r) => r.id === id);
        if (!original) return;
        const copy = {
          ...original,
          id: crypto.randomUUID(),
          name: `${original.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ resumes: [copy, ...s.resumes] }));
        return copy;
      },

      setCurrentResume: (resume) => set({ currentResume: resume }),

      updateCurrentSection: (section, data) =>
        set((s) => {
          if (!s.currentResume) return {};
          const updated = {
            ...s.currentResume,
            sections: { ...s.currentResume.sections, [section]: data },
            updatedAt: new Date().toISOString(),
          };
          return { currentResume: updated };
        }),

      setSelectedTemplate: (template) => set({ selectedTemplate: template }),

      setUploadProgress: (uploadProgress, uploadStage = "") =>
        set({ uploadProgress, uploadStage }),

      setAtsScore: (atsScore) => set({ atsScore }),

      setLoading: (isLoading) => set({ isLoading }),

      setAutosaveStatus: (autosaveStatus) => set({ autosaveStatus }),

      setActiveTab: (activeTab) => set({ activeTab }),

      // Trigger autosave (debounce happens in the hook)
      triggerAutosave: () => {
        set({ autosaveStatus: "saving" });
      },
    }),
    {
      name: "friday-resume-store",
      partialize: (s) => ({ resumes: s.resumes, selectedTemplate: s.selectedTemplate }),
    }
  )
);

export default useResumeStore;