import { memo } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FilePlus,
  Layers,
  BarChart2,
  Download,
  Settings,
  ChevronLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", route: "/resume" },
  { id: "new", icon: FilePlus, label: "New Resume", route: "/resume/new" },
  { id: "templates", icon: Layers, label: "Templates", route: "/resume/templates" },
  { id: "analyze", icon: BarChart2, label: "Analyzer", route: "/resume/analyze" },
];

const BOTTOM_ITEMS = [
  { id: "settings", icon: Settings, label: "Settings" },
];

const ResumeSidebar = memo(({ activeId, onNavigate, onCollapse }) => {
  return (
    <motion.aside
      className="resume-sidebar"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Logo area */}
      <div className="resume-sidebar__logo">
        <div className="resume-sidebar__logo-mark">R</div>
        <span className="resume-sidebar__logo-text">ResumAI</span>
        {onCollapse && (
          <button
            className="resume-sidebar__collapse"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="resume-sidebar__nav">
        {NAV_ITEMS.map(({ id, icon: Icon, label, route }) => (
          <button
            key={id}
            className={`resume-sidebar__item ${
              activeId === id ? "resume-sidebar__item--active" : ""
            }`}
            onClick={() => onNavigate?.(route)}
          >
            <Icon size={16} className="resume-sidebar__item-icon" />
            <span className="resume-sidebar__item-label">{label}</span>
            {activeId === id && (
              <motion.div
                className="resume-sidebar__item-indicator"
                layoutId="sidebar-indicator"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="resume-sidebar__spacer" />

      {/* Bottom */}
      <div className="resume-sidebar__bottom">
        {BOTTOM_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className="resume-sidebar__item"
            onClick={() => onNavigate?.(id)}
          >
            <Icon size={16} className="resume-sidebar__item-icon" />
            <span className="resume-sidebar__item-label">{label}</span>
          </button>
        ))}
      </div>
    </motion.aside>
  );
});

ResumeSidebar.displayName = "ResumeSidebar";
export default ResumeSidebar;