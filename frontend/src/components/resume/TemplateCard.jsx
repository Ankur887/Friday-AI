import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Check } from "lucide-react";

const templateColors = {
  Modern: { accent: "#6366f1", bg: "#1e1b4b" },
  Classic: { accent: "#d97706", bg: "#1c1408" },
  Startup: { accent: "#10b981", bg: "#052e16" },
  Professional: { accent: "#3b82f6", bg: "#0c1a2e" },
  Minimal: { accent: "#a1a1aa", bg: "#111113" },
  Corporate: { accent: "#8b5cf6", bg: "#1a0e2e" },
  Google: { accent: "#4285f4", bg: "#0a1628" },
  Stripe: { accent: "#635bff", bg: "#0d0b1e" },
  OpenAI: { accent: "#00a67e", bg: "#001a15" },
  Microsoft: { accent: "#00bcf2", bg: "#001825" },
  ATS: { accent: "#22c55e", bg: "#052e16" },
};

const TemplateMockup = memo(({ template }) => {
  const colors = templateColors[template.name] || templateColors.Modern;

  return (
    <div
      className="template-card__mockup"
      style={{ background: colors.bg }}
    >
      <div
        className="template-card__mock-accent"
        style={{ background: colors.accent }}
      />
      <div className="template-card__mock-content">
        <div
          className="template-card__mock-name"
          style={{ background: `${colors.accent}60` }}
        />
        <div className="template-card__mock-role" />
        <div className="template-card__mock-divider" style={{ background: `${colors.accent}40` }} />
        {[70, 50, 80, 45].map((w, i) => (
          <div
            key={i}
            className="template-card__mock-line"
            style={{ width: `${w}%`, opacity: 0.9 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
});

TemplateMockup.displayName = "TemplateMockup";

const TemplateCard = memo(
  ({ template, selected, onSelect, onPreview }) => {
    const [hovered, setHovered] = useState(false);

    return (
      <motion.div
        className={`template-card ${selected ? "template-card--selected" : ""}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => onSelect(template)}
      >
        <div className="template-card__preview">
          <TemplateMockup template={template} />

          <motion.div
            className="template-card__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              className="template-card__preview-btn"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(template);
              }}
            >
              <Eye size={14} />
              Preview
            </button>
            <button
              className="template-card__select-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(template);
              }}
            >
              Use Template
            </button>
          </motion.div>

          {selected && (
            <motion.div
              className="template-card__selected-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Check size={11} />
            </motion.div>
          )}
        </div>

        <div className="template-card__footer">
          <span className="template-card__name">{template.name}</span>
          {template.tag && (
            <span className="template-card__tag">{template.tag}</span>
          )}
        </div>
      </motion.div>
    );
  }
);

TemplateCard.displayName = "TemplateCard";
export default TemplateCard;