// FILE: src/components/resume/ResumeGrid.jsx
// STYLE: resume.io — responsive grid, "New resume" + "Upload" as first two cards

import { memo } from "react";
import { motion } from "framer-motion";
import { Plus, Upload } from "lucide-react";
import ResumeCard from "./ResumeCard";

const GRID_STYLE = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))",
  gap: 24,
};

const NewResumeCard = memo(({ onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
    style={{
      background: "none",
      border: "2px dashed #d1d5db",
      borderRadius: 8,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "0",
      aspectRatio: "3/4",
      transition: "border-color .18s, background .18s",
      width: "100%",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = "#1a56db";
      e.currentTarget.style.background = "#f0f7ff";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = "#d1d5db";
      e.currentTarget.style.background = "none";
    }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: "50%",
      background: "#eff6ff",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Plus size={22} color="#1a56db"/>
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a56db", textAlign: "center" }}>
        New resume
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 2 }}>
        Blank or template
      </div>
    </div>
  </motion.button>
));
NewResumeCard.displayName = "NewResumeCard";

const UploadResumeCard = memo(({ onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
    style={{
      background: "none",
      border: "2px dashed #d1d5db",
      borderRadius: 8,
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "0",
      aspectRatio: "3/4",
      transition: "border-color .18s, background .18s",
      width: "100%",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = "#0e9f6e";
      e.currentTarget.style.background = "#f0fdf4";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = "#d1d5db";
      e.currentTarget.style.background = "none";
    }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: "50%",
      background: "#ecfdf5",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Upload size={20} color="#0e9f6e"/>
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0e9f6e", textAlign: "center" }}>
        Upload resume
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 2 }}>
        PDF · DOCX · Max 10 MB
      </div>
    </div>
  </motion.button>
));
UploadResumeCard.displayName = "UploadResumeCard";

const ResumeGrid = memo(({
  resumes = [],
  onEdit, onAnalyze, onDuplicate, onDownload, onDelete,
  onCreateNew, onUpload,
}) => (
  <div style={GRID_STYLE}>
    <NewResumeCard    onClick={onCreateNew} />
    <UploadResumeCard onClick={onUpload} />

    {resumes.map((resume, i) => (
      <motion.div
        key={resume.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: i * 0.06 }}
      >
        <ResumeCard
          resume={resume}
          onEdit={onEdit}
          onAnalyze={onAnalyze}
          onDuplicate={onDuplicate}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </motion.div>
    ))}
  </div>
));

ResumeGrid.displayName = "ResumeGrid";
export default ResumeGrid;