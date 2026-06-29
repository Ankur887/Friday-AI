import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target,
  Zap,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import ResumeSidebar from "../components/resume/ResumeSidebar";
import ResumeTopbar from "../components/resume/ResumeTopbar";

const ScoreRing = ({ score, size = 120 }) => {
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring__center">
        <motion.span
          className="score-ring__value"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="score-ring__label">ATS Score</span>
      </div>
    </div>
  );
};

const CheckItem = ({ label, status }) => (
  <div className={`check-item check-item--${status}`}>
    {status === "pass" ? (
      <CheckCircle size={14} />
    ) : status === "warn" ? (
      <AlertTriangle size={14} />
    ) : (
      <X size={14} />
    )}
    <span>{label}</span>
  </div>
);

const DEMO_RESULTS = {
  atsScore: 74,
  grammar: { score: 88, issues: ["Passive voice in bullet 3", "Typo: 'acheived'"] },
  formatting: { score: 92, issues: [] },
  keywords: {
    found: ["React", "TypeScript", "Node.js", "API Design", "CI/CD"],
    missing: ["GraphQL", "Docker", "AWS", "System Design"],
  },
  weakBullets: [
    "Worked on various features",
    "Helped team with tasks",
    "Did backend work",
  ],
  suggestions: [
    "Add quantified metrics to your experience bullets",
    "Include more cloud technology keywords",
    "Strengthen your summary with a target role statement",
    "Add a Projects section to showcase work",
  ],
};

const ResumeAnalyzerPage = ({ onBack }) => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    setResults(null);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    await new Promise((r) => setTimeout(r, 2400));
    setAnalyzing(false);
    setResults(DEMO_RESULTS);
  };

  return (
    <div className="resume-layout">
      <ResumeSidebar activeId="analyze" onNavigate={onBack} />

      <div className="resume-layout__main">
        <ResumeTopbar title="AI Resume Analyzer" subtitle="ATS & quality check" />

        <main className="resume-layout__content">
          <div className="analyzer-page">
            <div className="analyzer-page__header">
              <button className="btn btn--ghost btn--sm" onClick={onBack}>
                <ArrowLeft size={13} />
                Back
              </button>
              <div>
                <h1 className="analyzer-page__title">AI Resume Analyzer</h1>
                <p className="analyzer-page__sub">
                  Upload your resume to get ATS score, grammar check, keyword analysis, and AI suggestions.
                </p>
              </div>
            </div>

            {!results ? (
              /* Upload Area */
              <div className="analyzer-page__upload-area">
                <div
                  className={`upload-modal__dropzone analyzer-page__drop ${
                    dragging ? "upload-modal__dropzone--active" : ""
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => !file && inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />

                  {!file ? (
                    <>
                      <div className="upload-modal__icon">
                        <Upload size={36} />
                      </div>
                      <p className="upload-modal__drop-label">
                        Drag & drop your resume here
                      </p>
                      <p className="upload-modal__drop-sub">
                        or <span className="upload-modal__browse">browse files</span> · PDF, DOCX, DOC
                      </p>
                    </>
                  ) : (
                    <div className="upload-modal__file-ready">
                      <div className="upload-modal__file-icon">
                        <FileText size={28} />
                      </div>
                      <div className="upload-modal__file-info">
                        <span className="upload-modal__file-name">{file.name}</span>
                        <span className="upload-modal__file-size">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <button
                        className="upload-modal__file-remove"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {file && (
                  <motion.button
                    className="btn btn--primary analyzer-page__analyze-btn"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {analyzing ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                          <RefreshCw size={14} />
                        </motion.span>
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Analyze Resume
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            ) : (
              /* Results */
              <AnimatePresence>
                <motion.div
                  className="analyzer-page__results"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Score + overview */}
                  <div className="analyzer-page__score-row">
                    <ScoreRing score={results.atsScore} size={140} />

                    <div className="analyzer-page__checks">
                      <CheckItem label="Formatting" status={results.formatting.score >= 80 ? "pass" : "warn"} />
                      <CheckItem label="Grammar" status={results.grammar.score >= 80 ? "pass" : "warn"} />
                      <CheckItem label="Keywords" status={results.keywords.found.length >= 5 ? "pass" : "warn"} />
                      <CheckItem label="Weak Bullets" status={results.weakBullets.length === 0 ? "pass" : "fail"} />
                    </div>

                    <div className="analyzer-page__action-col">
                      <button className="btn btn--primary">
                        <Zap size={13} />
                        Fix Automatically
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setResults(null)}>
                        <Upload size={13} />
                        Upload New
                      </button>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="analyzer-page__details">
                    {/* Keywords */}
                    <div className="analyzer-card">
                      <div className="analyzer-card__header">
                        <Target size={15} />
                        Keywords
                      </div>
                      <div className="analyzer-card__body">
                        <p className="analyzer-card__sub">Found</p>
                        <div className="rp-skills">
                          {results.keywords.found.map((k) => (
                            <span key={k} className="rp-skill rp-skill--found">{k}</span>
                          ))}
                        </div>
                        <p className="analyzer-card__sub" style={{ marginTop: 12 }}>Missing</p>
                        <div className="rp-skills">
                          {results.keywords.missing.map((k) => (
                            <span key={k} className="rp-skill rp-skill--missing">{k}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Grammar issues */}
                    <div className="analyzer-card">
                      <div className="analyzer-card__header">
                        <AlertTriangle size={15} />
                        Grammar Issues
                      </div>
                      <div className="analyzer-card__body">
                        {results.grammar.issues.length === 0 ? (
                          <p className="analyzer-card__empty">No grammar issues found ✓</p>
                        ) : (
                          results.grammar.issues.map((issue, i) => (
                            <div key={i} className="analyzer-card__issue">{issue}</div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Weak bullets */}
                    <div className="analyzer-card">
                      <div className="analyzer-card__header">
                        <TrendingUp size={15} />
                        Weak Bullets
                      </div>
                      <div className="analyzer-card__body">
                        {results.weakBullets.map((b, i) => (
                          <div key={i} className="analyzer-card__issue analyzer-card__issue--warn">
                            "{b}"
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="analyzer-card">
                      <div className="analyzer-card__header">
                        <Sparkles size={15} />
                        AI Suggestions
                      </div>
                      <div className="analyzer-card__body">
                        {results.suggestions.map((s, i) => (
                          <div key={i} className="analyzer-card__suggestion">
                            <span className="analyzer-card__suggestion-num">{i + 1}</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResumeAnalyzerPage;