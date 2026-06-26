import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Upload,
  LayoutGrid,
  FileSearch,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import ResumeGrid from "./ResumeGrid";
import ResumeTemplateGallery from "./ResumeTemplateGallery";
import CreateResumeModal from "./CreateResumeModal";
import UploadResumeModal from "./UploadResumeModal";
import DeleteResumeDialog from "./DeleteResumeDialog";

const TABS = [
  { id: "resumes", label: "Resumes", icon: LayoutGrid },
  { id: "templates", label: "Templates", icon: Layers },
  { id: "analyzed", label: "Analyzed", icon: FileSearch },
  { id: "recent", label: "Recent", icon: Clock },
];

// Demo data until connected to store
const DEMO_RESUMES = [
  {
    id: "1",
    name: "Software Engineer",
    role: "Frontend @ Stripe",
    atsScore: 87,
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    name: "Full Stack Dev",
    role: "Backend @ Vercel",
    atsScore: 73,
    updatedAt: "Yesterday",
  },
  {
    id: "3",
    name: "Product Lead",
    role: "PM @ Linear",
    atsScore: 61,
    updatedAt: "3 days ago",
  },
];

const StatsBar = memo(({ resumes }) => {
  const avgATS = resumes.length
    ? Math.round(resumes.reduce((a, r) => a + (r.atsScore || 0), 0) / resumes.length)
    : 0;

  return (
    <div className="dashboard__stats">
      {[
        { label: "Total Resumes", value: resumes.length },
        { label: "Avg ATS Score", value: `${avgATS}%` },
        { label: "AI Optimized", value: resumes.filter((r) => r.atsScore >= 80).length },
      ].map((stat) => (
        <div key={stat.label} className="dashboard__stat">
          <span className="dashboard__stat-value">{stat.value}</span>
          <span className="dashboard__stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  );
});

StatsBar.displayName = "StatsBar";

const ResumeDashboard = memo(({ onNavigateEditor, onNavigateAnalyzer }) => {
  const [activeTab, setActiveTab] = useState("resumes");
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resumes, setResumes] = useState(DEMO_RESUMES);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleEdit = useCallback(
    (resume) => onNavigateEditor?.(resume.id),
    [onNavigateEditor]
  );

  const handleAnalyze = useCallback(
    (resume) => onNavigateAnalyzer?.(resume.id),
    [onNavigateAnalyzer]
  );

  const handleDuplicate = useCallback((resume) => {
    setResumes((prev) => [
      ...prev,
      { ...resume, id: Date.now().toString(), name: `${resume.name} (copy)`, updatedAt: "Just now" },
    ]);
  }, []);

  const handleDownload = useCallback((resume) => {
    console.log("Download:", resume.name);
    // Hook into existing download logic
  }, []);

  const handleDelete = useCallback((resume) => {
    setDeleteTarget(resume);
  }, []);

  const confirmDelete = useCallback((resume) => {
    setResumes((prev) => prev.filter((r) => r.id !== resume.id));
  }, []);

  const handleCreateComplete = useCallback((opts) => {
    setCreateOpen(false);
    const newId = Date.now().toString();
    setResumes((prev) => [
      { id: newId, name: opts.targetRole || "New Resume", role: opts.targetRole, atsScore: 70, updatedAt: "Just now" },
      ...prev,
    ]);
    onNavigateEditor?.(newId);
  }, [onNavigateEditor]);

  const handleUploadComplete = useCallback((opts) => {
    setUploadOpen(false);
    const newId = Date.now().toString();
    setResumes((prev) => [
      { id: newId, name: opts.name || "Uploaded Resume", atsScore: 65, updatedAt: "Just now" },
      ...prev,
    ]);
    onNavigateEditor?.(newId);
  }, [onNavigateEditor]);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div className="dashboard__header-text">
          <h1 className="dashboard__title">Resume Builder</h1>
          <p className="dashboard__subtitle">
            Manage your AI-powered resumes
          </p>
        </div>
        <div className="dashboard__header-actions">
          <button
            className="btn btn--ghost"
            onClick={() => setUploadOpen(true)}
          >
            <Upload size={14} />
            Upload Resume
          </button>
          <button
            className="btn btn--primary"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={14} />
            Create Resume
          </button>
        </div>
      </div>

      <StatsBar resumes={resumes} />

      {/* AI Analyzer CTA */}
      <motion.button
        className="dashboard__ai-banner"
        onClick={onNavigateAnalyzer}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="dashboard__ai-banner-left">
          <div className="dashboard__ai-banner-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="dashboard__ai-banner-title">
              AI Resume Analyzer
            </div>
            <div className="dashboard__ai-banner-sub">
              Get ATS score, grammar check, keyword analysis, and fix suggestions
            </div>
          </div>
        </div>
        <span className="dashboard__ai-banner-cta">Analyze Now →</span>
      </motion.button>

      {/* Tabs */}
      <div className="dashboard__tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`dashboard__tab ${
              activeTab === id ? "dashboard__tab--active" : ""
            }`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={13} />
            {label}
            {id === "resumes" && resumes.length > 0 && (
              <span className="dashboard__tab-badge">{resumes.length}</span>
            )}
            {activeTab === id && (
              <motion.div
                className="dashboard__tab-indicator"
                layoutId="tab-indicator"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="dashboard__content"
        >
          {activeTab === "resumes" && (
            <ResumeGrid
              resumes={resumes}
              onEdit={handleEdit}
              onAnalyze={handleAnalyze}
              onDuplicate={handleDuplicate}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onCreateNew={() => setCreateOpen(true)}
              onUpload={() => setUploadOpen(true)}
            />
          )}

          {activeTab === "templates" && (
            <ResumeTemplateGallery
              selectedId={selectedTemplate?.id}
              onSelectTemplate={(t) => {
                setSelectedTemplate(t);
                setCreateOpen(true);
              }}
            />
          )}

          {activeTab === "analyzed" && (
            <div className="dashboard__empty-tab">
              <FileSearch size={40} className="dashboard__empty-icon" />
              <p>No analyzed resumes yet.</p>
              <button
                className="btn btn--primary"
                onClick={onNavigateAnalyzer}
              >
                <Sparkles size={13} />
                Analyze a Resume
              </button>
            </div>
          )}

          {activeTab === "recent" && (
            <ResumeGrid
              resumes={[...resumes].slice(0, 3)}
              onEdit={handleEdit}
              onAnalyze={handleAnalyze}
              onDuplicate={handleDuplicate}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onCreateNew={() => setCreateOpen(true)}
              onUpload={() => setUploadOpen(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <CreateResumeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onComplete={handleCreateComplete}
      />
      <UploadResumeModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onComplete={handleUploadComplete}
      />
      <DeleteResumeDialog
        open={!!deleteTarget}
        resume={deleteTarget}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
});

ResumeDashboard.displayName = "ResumeDashboard";
export default ResumeDashboard;