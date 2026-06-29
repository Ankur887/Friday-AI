import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Briefcase,
  Building2,
  TrendingUp,
} from "lucide-react";
import TemplateCard from "./TemplateCard";

const TEMPLATES = [
  { id: "modern", name: "Modern", tag: "Popular" },
  { id: "startup", name: "Startup", tag: "Trending" },
  { id: "professional", name: "Professional", tag: "" },
  { id: "classic", name: "Classic", tag: "" },
  { id: "minimal", name: "Minimal", tag: "" },
  { id: "ats", name: "ATS", tag: "Best Score" },
];

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level", sub: "0–2 years" },
  { value: "mid", label: "Mid Level", sub: "3–5 years" },
  { value: "senior", label: "Senior", sub: "6–10 years" },
  { value: "lead", label: "Lead / Staff", sub: "10+ years" },
];

const STEPS = ["Choose Template", "Target Role", "Generate"];

const StepIndicator = memo(({ current, total }) => (
  <div className="create-modal__steps">
    {STEPS.map((label, i) => (
      <div
        key={i}
        className={`create-modal__step ${
          i === current
            ? "create-modal__step--active"
            : i < current
            ? "create-modal__step--done"
            : ""
        }`}
      >
        <div className="create-modal__step-dot">
          {i < current ? "✓" : i + 1}
        </div>
        <span className="create-modal__step-label">{label}</span>
        {i < total - 1 && <div className="create-modal__step-line" />}
      </div>
    ))}
  </div>
));

StepIndicator.displayName = "StepIndicator";

const CreateResumeModal = memo(({ open, onClose, onComplete }) => {
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [generating, setGenerating] = useState(false);

  const canNext =
    step === 0
      ? !!selectedTemplate
      : step === 1
      ? !!targetRole && !!experienceLevel
      : true;

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1800));
    setGenerating(false);
    onComplete?.({
      template: selectedTemplate,
      targetRole,
      targetCompany,
      experienceLevel,
    });
  };

  const handleClose = () => {
    if (generating) return;
    setStep(0);
    setSelectedTemplate(null);
    setTargetRole("");
    setTargetCompany("");
    setExperienceLevel("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal create-modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal__header">
              <div>
                <h2 className="modal__title">Create Resume</h2>
                <p className="modal__subtitle">
                  Step {step + 1} of {STEPS.length} · {STEPS[step]}
                </p>
              </div>
              {!generating && (
                <button className="modal__close" onClick={handleClose}>
                  <X size={16} />
                </button>
              )}
            </div>

            <StepIndicator current={step} total={STEPS.length} />

            <div className="modal__body create-modal__body">
              <AnimatePresence mode="wait">
                {/* Step 0: Template */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="create-modal__template-grid"
                  >
                    {TEMPLATES.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        selected={selectedTemplate?.id === t.id}
                        onSelect={setSelectedTemplate}
                        onPreview={(t) => console.log("preview", t)}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Step 1: Target Role */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="create-modal__fields"
                  >
                    <div className="form-group">
                      <label className="form-label">
                        <Briefcase size={13} />
                        Target Role *
                      </label>
                      <input
                        className="form-input"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <Building2 size={13} />
                        Target Company (optional)
                      </label>
                      <input
                        className="form-input"
                        placeholder="e.g. Stripe, Vercel, Google"
                        value={targetCompany}
                        onChange={(e) => setTargetCompany(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <TrendingUp size={13} />
                        Experience Level *
                      </label>
                      <div className="create-modal__levels">
                        {EXPERIENCE_LEVELS.map((lvl) => (
                          <button
                            key={lvl.value}
                            className={`create-modal__level-btn ${
                              experienceLevel === lvl.value
                                ? "create-modal__level-btn--active"
                                : ""
                            }`}
                            onClick={() => setExperienceLevel(lvl.value)}
                          >
                            <span className="create-modal__level-label">
                              {lvl.label}
                            </span>
                            <span className="create-modal__level-sub">
                              {lvl.sub}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Generate */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    className="create-modal__generate"
                  >
                    <div className="create-modal__summary">
                      <div className="create-modal__summary-item">
                        <span className="create-modal__summary-label">
                          Template
                        </span>
                        <span className="create-modal__summary-value">
                          {selectedTemplate?.name}
                        </span>
                      </div>
                      <div className="create-modal__summary-item">
                        <span className="create-modal__summary-label">
                          Role
                        </span>
                        <span className="create-modal__summary-value">
                          {targetRole}
                        </span>
                      </div>
                      {targetCompany && (
                        <div className="create-modal__summary-item">
                          <span className="create-modal__summary-label">
                            Company
                          </span>
                          <span className="create-modal__summary-value">
                            {targetCompany}
                          </span>
                        </div>
                      )}
                      <div className="create-modal__summary-item">
                        <span className="create-modal__summary-label">
                          Level
                        </span>
                        <span className="create-modal__summary-value capitalize">
                          {experienceLevel}
                        </span>
                      </div>
                    </div>

                    {generating ? (
                      <div className="create-modal__generating">
                        <motion.div
                          className="create-modal__gen-icon"
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            repeat: Infinity,
                            duration: 1.4,
                            ease: "linear",
                          }}
                        >
                          <Sparkles size={28} />
                        </motion.div>
                        <p className="create-modal__gen-label">
                          Generating your resume with AI…
                        </p>
                      </div>
                    ) : (
                      <p className="create-modal__generate-hint">
                        Claude AI will generate a tailored resume based on your
                        target role{targetCompany ? ` at ${targetCompany}` : ""}.
                        You can edit everything in the editor.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!generating && (
              <div className="modal__footer">
                {step > 0 ? (
                  <button className="btn btn--ghost" onClick={handleBack}>
                    <ChevronLeft size={14} />
                    Back
                  </button>
                ) : (
                  <button className="btn btn--ghost" onClick={handleClose}>
                    Cancel
                  </button>
                )}

                {step < 2 ? (
                  <button
                    className="btn btn--primary"
                    onClick={handleNext}
                    disabled={!canNext}
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    className="btn btn--primary"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    <Sparkles size={14} />
                    Generate Resume
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CreateResumeModal.displayName = "CreateResumeModal";
export default CreateResumeModal;