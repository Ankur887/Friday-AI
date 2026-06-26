import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

const STAGES = [
  { id: "uploading", label: "Uploading file" },
  { id: "extracting", label: "Extracting text" },
  { id: "reading", label: "Reading experience" },
  { id: "skills", label: "Finding skills" },
  { id: "generating", label: "Generating resume" },
  { id: "ats", label: "Calculating ATS score" },
  { id: "done", label: "All done!" },
];

const ResumeProgress = memo(({ stage = 0, filename, onComplete }) => {
  const [visibleStages, setVisibleStages] = useState([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= stage) {
        setVisibleStages((prev) => {
          if (prev.includes(i)) return prev;
          return [...prev, i];
        });
        i++;
      }
      if (i > stage) clearInterval(interval);
    }, 320);
    return () => clearInterval(interval);
  }, [stage]);

  const currentStage = STAGES[stage] ?? STAGES[STAGES.length - 1];
  const pct = Math.round(((stage + 1) / STAGES.length) * 100);

  return (
    <div className="resume-progress">
      {filename && (
        <div className="resume-progress__file">
          <span className="resume-progress__filename">{filename}</span>
        </div>
      )}

      {/* Bar */}
      <div className="resume-progress__bar-track">
        <motion.div
          className="resume-progress__bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
      <div className="resume-progress__pct">{pct}%</div>

      {/* Stages list */}
      <div className="resume-progress__stages">
        <AnimatePresence>
          {STAGES.map((s, i) => {
            const visible = visibleStages.includes(i);
            const done = i < stage;
            const active = i === stage;

            if (!visible) return null;

            return (
              <motion.div
                key={s.id}
                className={`resume-progress__stage ${
                  done
                    ? "resume-progress__stage--done"
                    : active
                    ? "resume-progress__stage--active"
                    : ""
                }`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="resume-progress__stage-icon">
                  {done ? (
                    <Check size={12} />
                  ) : active ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Loader2 size={12} />
                    </motion.div>
                  ) : (
                    <div className="resume-progress__stage-dot" />
                  )}
                </div>
                <span className="resume-progress__stage-label">{s.label}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});

ResumeProgress.displayName = "ResumeProgress";
export { STAGES };
export default ResumeProgress;