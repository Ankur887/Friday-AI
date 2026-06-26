import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Bell, User, ChevronDown } from "lucide-react";

const ResumeTopbar = memo(({ title = "Resume Builder", subtitle }) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="resume-topbar"
    >
      <div className="resume-topbar__brand">
        <div className="resume-topbar__icon">
          <Sparkles size={16} />
        </div>
        <div className="resume-topbar__title-group">
          <span className="resume-topbar__title">{title}</span>
          {subtitle && (
            <span className="resume-topbar__subtitle">{subtitle}</span>
          )}
        </div>
      </div>

      <div className="resume-topbar__actions">
        <button className="resume-topbar__icon-btn" aria-label="Notifications">
          <Bell size={16} />
          <span className="resume-topbar__badge" />
        </button>
        <button className="resume-topbar__profile">
          <div className="resume-topbar__avatar">A</div>
          <ChevronDown size={14} className="resume-topbar__chevron" />
        </button>
      </div>
    </motion.header>
  );
});

ResumeTopbar.displayName = "ResumeTopbar";
export default ResumeTopbar;