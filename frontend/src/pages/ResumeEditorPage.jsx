import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Eye, Sparkles } from "lucide-react";
import ResumeEditor from "../components/resume/ResumeEditor";
import ResumeTopbar from "../components/resume/ResumeTopbar";

const EMPTY_RESUME = {
  personal: {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    website: "",
  },
  summary: "",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
  languages: [],
  links: [],
};

const ResumeEditorPage = ({ resumeId, onBack }) => {
  const [data, setData] = useState(EMPTY_RESUME);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [template, setTemplate] = useState("modern");

  // Autosave on change (debounced in real app)
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => {
      // resumeService.save(resumeId, data) in real app
      setSaved(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [data]);

  const handleChange = useCallback((next) => {
    setData(next);
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
  }, []);

  const handleDownload = useCallback(() => {
    console.log("Download resume:", resumeId);
    // Hook into existing download API
  }, [resumeId]);

  return (
    <div className="editor-page">
      {/* Top bar */}
      <div className="editor-page__topbar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>
          <ArrowLeft size={14} />
          Dashboard
        </button>

        <div className="editor-page__topbar-center">
          <span className="editor-page__resume-name">
            {data?.personal?.name || "Untitled Resume"}
          </span>
          {saved && (
            <motion.span
              className="editor-page__saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Saved
            </motion.span>
          )}
        </div>

        <div className="editor-page__topbar-right">
          {/* Template switcher */}
          <select
            className="editor-page__template-select"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            {["modern", "classic", "startup", "professional", "minimal", "ats"].map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <button className="btn btn--ghost btn--sm">
            <Sparkles size={13} />
            AI Improve
          </button>

          <button className="btn btn--primary btn--sm" onClick={handleDownload}>
            <Download size={13} />
            Download
          </button>
        </div>
      </div>

      {/* Editor */}
      <ResumeEditor
        data={data}
        onChange={handleChange}
        onSave={handleSave}
        template={template}
        saving={saving}
      />
    </div>
  );
};

export default ResumeEditorPage;