// FILE: src/pages/ResumeHomePage.jsx
// PURPOSE: Main resume dashboard page. Uses real React Router navigation.
//          Supports openCreate/openUpload props (when landing via /resume/new
//          or /resume/upload) to auto-open the appropriate modal.

import { Suspense, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import ResumeSidebar from "../components/resume/ResumeSidebar";
import ResumeTopbar from "../components/resume/ResumeTopbar";
import ResumeDashboard from "../components/resume/ResumeDashboard";

// Skeleton while dashboard mounts
const PageSkeleton = () => (
  <div className="page-skeleton">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        className="page-skeleton__block skeleton"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const ResumeHomePage = ({ openCreate = false, openUpload = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active nav from current path
  const getActiveId = () => {
    const p = location.pathname;
    if (p === "/resume" || p === "/resume/") return "dashboard";
    if (p.startsWith("/resume/templates")) return "templates";
    if (p.startsWith("/resume/analyze")) return "analyze";
    if (p.startsWith("/resume/new")) return "new";
    return "dashboard";
  };

  // ── Navigation callbacks → real router ──────────────────────────────────
  const handleNavigate = (route) => navigate(route);

  const handleNavigateEditor = (id) => navigate(`/resume/editor/${id}`);

  const handleNavigateAnalyzer = () => navigate("/resume/analyze");

  return (
    <div className="resume-layout">
      <ResumeSidebar
        activeId={getActiveId()}
        onNavigate={handleNavigate}
      />

      <div className="resume-layout__main">
        <ResumeTopbar
          title="Resume Builder"
          subtitle="AI-powered resume platform"
        />

        <main className="resume-layout__content">
          <Suspense fallback={<PageSkeleton />}>
            <ResumeDashboard
              onNavigateEditor={handleNavigateEditor}
              onNavigateAnalyzer={handleNavigateAnalyzer}
              initialOpenCreate={openCreate}
              initialOpenUpload={openUpload}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default ResumeHomePage;