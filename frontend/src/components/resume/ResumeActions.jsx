import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Loader2 } from "lucide-react";

const AI_ACTIONS = [
  { id: "improve", label: "Improve", group: "General" },
  { id: "rewrite", label: "Rewrite", group: "General" },
  { id: "expand", label: "Expand", group: "General" },
  { id: "shorten", label: "Shorten", group: "General" },
  { id: "professional", label: "Professional Tone", group: "Tone" },
  { id: "startup", label: "Startup Tone", group: "Tone" },
  { id: "ats", label: "ATS Optimize", group: "ATS" },
  { id: "google", label: "Google Style", group: "Company" },
  { id: "amazon", label: "Amazon Style", group: "Company" },
  { id: "microsoft", label: "Microsoft Style", group: "Company" },
];

const GROUPS = ["General", "Tone", "ATS", "Company"];

const ResumeActions = memo(({ onAction, loading, context }) => {
  const [open, setOpen] = useState(false);
  const [activeAction, setActiveAction] = useState(null);

  const handleAction = async (action) => {
    setOpen(false);
    setActiveAction(action.id);
    await onAction?.(action.id, context);
    setActiveAction(null);
  };

  return (
    <div className="resume-actions">
      <motion.button
        className={`resume-actions__trigger ${
          loading ? "resume-actions__trigger--loading" : ""
        }`}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={!!loading}
      >
        {loading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 size={13} />
          </motion.span>
        ) : (
          <Sparkles size={13} />
        )}
        AI Magic
        <ChevronDown
          size={11}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="resume-actions__menu"
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {GROUPS.map((group) => {
              const items = AI_ACTIONS.filter((a) => a.group === group);
              return (
                <div key={group} className="resume-actions__group">
                  <span className="resume-actions__group-label">{group}</span>
                  {items.map((action) => (
                    <button
                      key={action.id}
                      className={`resume-actions__item ${
                        activeAction === action.id
                          ? "resume-actions__item--active"
                          : ""
                      }`}
                      onClick={() => handleAction(action)}
                    >
                      {activeAction === action.id ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "linear",
                          }}
                        >
                          <Loader2 size={11} />
                        </motion.span>
                      ) : (
                        <Sparkles size={11} />
                      )}
                      {action.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {open && (
        <div
          className="resume-actions__backdrop"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
});

ResumeActions.displayName = "ResumeActions";
export default ResumeActions;