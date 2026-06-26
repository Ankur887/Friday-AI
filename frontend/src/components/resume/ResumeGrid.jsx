import { memo } from "react";
import { motion } from "framer-motion";
import { Plus, Upload } from "lucide-react";
import ResumeCard from "./ResumeCard";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const NewResumeCard = memo(({ onClick }) => (
  <motion.button
    className="resume-grid__new-card"
    onClick={onClick}
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.22 }}
    aria-label="Create new resume"
  >
    <div className="resume-grid__new-icon">
      <Plus size={24} />
    </div>
    <span className="resume-grid__new-label">New Resume</span>
    <span className="resume-grid__new-sub">Start from scratch or template</span>
  </motion.button>
));

NewResumeCard.displayName = "NewResumeCard";

const UploadResumeCard = memo(({ onClick }) => (
  <motion.button
    className="resume-grid__upload-card"
    onClick={onClick}
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.22 }}
    aria-label="Upload existing resume"
  >
    <div className="resume-grid__upload-icon">
      <Upload size={24} />
    </div>
    <span className="resume-grid__upload-label">Upload Resume</span>
    <span className="resume-grid__upload-sub">PDF, DOCX, DOC · Max 10MB</span>
  </motion.button>
));

UploadResumeCard.displayName = "UploadResumeCard";

const ResumeGrid = memo(
  ({
    resumes = [],
    onEdit,
    onAnalyze,
    onDuplicate,
    onDownload,
    onDelete,
    onCreateNew,
    onUpload,
  }) => {
    return (
      <motion.div
        className="resume-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <NewResumeCard onClick={onCreateNew} />
        <UploadResumeCard onClick={onUpload} />

        {resumes.map((resume) => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            onEdit={onEdit}
            onAnalyze={onAnalyze}
            onDuplicate={onDuplicate}
            onDownload={onDownload}
            onDelete={onDelete}
          />
        ))}
      </motion.div>
    );
  }
);

ResumeGrid.displayName = "ResumeGrid";
export default ResumeGrid;