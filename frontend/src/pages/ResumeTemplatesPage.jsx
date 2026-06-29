import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ResumeTemplateGallery from "../components/resume/ResumeTemplateGallery";
import ResumeTopbar from "../components/resume/ResumeTopbar";
import ResumeSidebar from "../components/resume/ResumeSidebar";

const ResumeTemplatesPage = ({ onBack, onSelectTemplate }) => {
  const [selected, setSelected] = useState(null);

  const handleSelect = (template) => {
    setSelected(template);
    onSelectTemplate?.(template);
  };

  return (
    <div className="resume-layout">
      <ResumeSidebar activeId="templates" onNavigate={onBack} />

      <div className="resume-layout__main">
        <ResumeTopbar title="Templates" subtitle="Choose your design" />

        <main className="resume-layout__content">
          <div className="templates-page">
            <div className="templates-page__header">
              <button className="btn btn--ghost btn--sm" onClick={onBack}>
                <ArrowLeft size={13} />
                Back
              </button>
              <div>
                <h1 className="templates-page__title">Resume Templates</h1>
                <p className="templates-page__sub">
                  {selected
                    ? `Selected: ${selected.name}`
                    : "Pick a template to get started"}
                </p>
              </div>
              {selected && (
                <motion.button
                  className="btn btn--primary"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => onSelectTemplate?.(selected)}
                >
                  Use {selected.name}
                </motion.button>
              )}
            </div>

            <ResumeTemplateGallery
              selectedId={selected?.id}
              onSelectTemplate={handleSelect}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResumeTemplatesPage;