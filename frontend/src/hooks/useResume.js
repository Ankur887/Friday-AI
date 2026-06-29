import { useCallback, useEffect, useRef } from "react";
import useResumeStore from "../store/resumeStore";
import resumeService from "../services/resumeService";

const AUTOSAVE_DELAY = 1500; // ms

export function useResume() {
  const store = useResumeStore();
  const autosaveTimer = useRef(null);

  // ── Load all resumes on mount ─────────────────────────────────────────────
  const loadResumes = useCallback(async () => {
    store.setLoading(true);
    try {
      const data = await resumeService.list();
      store.setResumes(data);
    } catch {
      // If backend isn't connected yet keep existing localStorage data
    } finally {
      store.setLoading(false);
    }
  }, []); // eslint-disable-line

  // ── Load a single resume into editor ─────────────────────────────────────
  const openResume = useCallback(async (id) => {
    store.setLoading(true);
    try {
      const data = await resumeService.get(id);
      store.setCurrentResume(data);
    } catch {
      const local = store.resumes.find((r) => r.id === id);
      if (local) store.setCurrentResume(local);
    } finally {
      store.setLoading(false);
    }
  }, []); // eslint-disable-line

  // ── Create ────────────────────────────────────────────────────────────────
  const createResume = useCallback(async (payload) => {
    store.setLoading(true);
    try {
      // Try backend first; fall back to local-only object
      let created;
      try {
        created = await resumeService.create(payload);
      } catch {
        created = {
          id: crypto.randomUUID(),
          ...payload,
          atsScore: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      store.addResume(created);
      store.setCurrentResume(created);
      return created;
    } finally {
      store.setLoading(false);
    }
  }, []); // eslint-disable-line

  // ── Autosave ──────────────────────────────────────────────────────────────
  const scheduleAutosave = useCallback(() => {
    store.setAutosaveStatus("saving");
    clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const { currentResume } = useResumeStore.getState();
      if (!currentResume) return;
      try {
        await resumeService.update(currentResume.id, currentResume);
        store.updateResume(currentResume.id, currentResume);
        store.setAutosaveStatus("saved");
      } catch {
        // Keep local data; mark saved anyway for UX
        store.updateResume(currentResume.id, currentResume);
        store.setAutosaveStatus("saved");
      }
      setTimeout(() => store.setAutosaveStatus("idle"), 2000);
    }, AUTOSAVE_DELAY);
  }, []); // eslint-disable-line

  // ── Update a section and trigger autosave ─────────────────────────────────
  const updateSection = useCallback(
    (section, data) => {
      store.updateCurrentSection(section, data);
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteResume = useCallback(async (id) => {
    try {
      await resumeService.delete(id);
    } catch {
      // continue with local delete
    }
    store.deleteResume(id);
  }, []); // eslint-disable-line

  // ── Duplicate ─────────────────────────────────────────────────────────────
  const duplicateResume = useCallback((id) => {
    return store.duplicateResume(id);
  }, []); // eslint-disable-line

  // ── Download ──────────────────────────────────────────────────────────────
  const downloadResume = useCallback(async (id, filename) => {
    try {
      await resumeService.downloadPDF(id, filename);
    } catch (err) {
      console.error("Download failed:", err);
    }
  }, []);

  // ── ATS Analysis ──────────────────────────────────────────────────────────
  const analyzeATS = useCallback(async (id) => {
    try {
      const result = await resumeService.analyzeATS(id);
      store.setAtsScore(result.score);
      store.updateResume(id, { atsScore: result.score });
      return result;
    } catch {
      return null;
    }
  }, []); // eslint-disable-line

  // ── AI improve section ────────────────────────────────────────────────────
  const improveSection = useCallback(async (id, section, action, content) => {
    try {
      return await resumeService.improveSection(id, section, action, content);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => () => clearTimeout(autosaveTimer.current), []);

  return {
    // state
    resumes: store.resumes,
    currentResume: store.currentResume,
    selectedTemplate: store.selectedTemplate,
    uploadProgress: store.uploadProgress,
    uploadStage: store.uploadStage,
    atsScore: store.atsScore,
    isLoading: store.isLoading,
    autosaveStatus: store.autosaveStatus,
    activeTab: store.activeTab,
    // actions
    loadResumes,
    openResume,
    createResume,
    updateSection,
    deleteResume,
    duplicateResume,
    downloadResume,
    analyzeATS,
    improveSection,
    setSelectedTemplate: store.setSelectedTemplate,
    setUploadProgress: store.setUploadProgress,
    setActiveTab: store.setActiveTab,
    setCurrentResume: store.setCurrentResume,
  };
}

export default useResume;