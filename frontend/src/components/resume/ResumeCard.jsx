import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3,
  BarChart2,
  Copy,
  Download,
  Trash2,
  MoreVertical,
  Clock,
  Briefcase,
} from "lucide-react";

const ATSBadge = memo(({ score }) => {
  const color =
    score >= 80
      ? "#22c55e"
      : score >= 60
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div className="resume-card__ats" style={{ "--ats-color": color }}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${(score / 100) * 94.2} 94.2`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="resume-card__ats-score" style={{ color }}>
        {score}
      </span>
    </div>
  );
});

ATSBadge.displayName = "ATSBadge";

const ResumeCard = memo(
  ({ resume, onEdit, onAnalyze, onDuplicate, onDownload, onDelete }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleMenuAction = (action) => {
      setMenuOpen(false);
      action();
    };

    const menuItems = [
      { icon: Edit3, label: "Edit", action: () => onEdit(resume) },
      { icon: BarChart2, label: "Analyze", action: () => onAnalyze(resume) },
      { icon: Copy, label: "Duplicate", action: () => onDuplicate(resume) },
      { icon: Download, label: "Download", action: () => onDownload(resume) },
      {
        icon: Trash2,
        label: "Delete",
        action: () => onDelete(resume),
        danger: true,
      },
    ];

    return (
      <motion.div
        className="resume-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        layout
      >
        {/* Preview Thumbnail */}
        <div
          className="resume-card__preview"
          onClick={() => onEdit(resume)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onEdit(resume)}
        >
          <div className="resume-card__mock-page">
            <div className="resume-card__mock-header" />
            <div className="resume-card__mock-lines">
              {[80, 60, 70, 50, 65, 40].map((w, i) => (
                <div
                  key={i}
                  className="resume-card__mock-line"
                  style={{ width: `${w}%`, opacity: 1 - i * 0.12 }}
                />
              ))}
            </div>
          </div>
          <div className="resume-card__preview-overlay">
            <span className="resume-card__preview-cta">Open Editor</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="resume-card__body">
          <div className="resume-card__info">
            <div className="resume-card__name-row">
              <span className="resume-card__name">{resume.name}</span>
              <div className="resume-card__menu-wrapper">
                <button
                  className="resume-card__menu-btn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="More options"
                >
                  <MoreVertical size={14} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className="resume-card__menu"
                      initial={{ opacity: 0, scale: 0.92, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      {menuItems.map(({ icon: Icon, label, action, danger }) => (
                        <button
                          key={label}
                          className={`resume-card__menu-item ${
                            danger ? "resume-card__menu-item--danger" : ""
                          }`}
                          onClick={() => handleMenuAction(action)}
                        >
                          <Icon size={13} />
                          {label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {resume.role && (
              <div className="resume-card__meta">
                <Briefcase size={11} />
                <span>{resume.role}</span>
              </div>
            )}

            <div className="resume-card__meta">
              <Clock size={11} />
              <span>{resume.updatedAt || "Just now"}</span>
            </div>
          </div>

          <ATSBadge score={resume.atsScore ?? 72} />
        </div>

        {/* Quick Actions */}
        <div className="resume-card__actions">
          <button
            className="resume-card__action resume-card__action--primary"
            onClick={() => onEdit(resume)}
          >
            <Edit3 size={12} />
            Edit
          </button>
          <button
            className="resume-card__action"
            onClick={() => onAnalyze(resume)}
          >
            <BarChart2 size={12} />
            Analyze
          </button>
          <button
            className="resume-card__action"
            onClick={() => onDownload(resume)}
          >
            <Download size={12} />
          </button>
          <button
            className="resume-card__action resume-card__action--danger"
            onClick={() => onDelete(resume)}
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Click-outside close */}
        {menuOpen && (
          <div
            className="resume-card__backdrop"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </motion.div>
    );
  }
);

ResumeCard.displayName = "ResumeCard";
export default ResumeCard;