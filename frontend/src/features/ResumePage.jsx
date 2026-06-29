// FILE: src/features/ResumePage.jsx
// PURPOSE: Shell router for the entire Resume module.
//          Matches /resume/* and delegates to the appropriate page.
//          Imports resume.css once so all child components get styles.
//
// ROUTE MAP:
//   /resume          → LandingPage  (index — the marketing page)
//   /resume/new      → ResumeHomePage with create modal auto-open
//   /resume/upload   → ResumeHomePage with upload modal auto-open
//   /resume/editor/:id → ResumeEditorPage
//   /resume/templates  → ResumeTemplatesPage
//   /resume/analyze    → ResumeAnalyzerPage

import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";

// ── Design system ───────────────────────────────────────────────────────────
import "../styles/resume.css";

// ── Pages ───────────────────────────────────────────────────────────────────
import LandingPage        from "./ResumeLandingPage";   // ✅ index route
import ResumeHomePage     from "../pages/ResumeHomePage";
import ResumeEditorPage   from "../pages/ResumeEditorPage";
import ResumeAnalyzerPage from "../pages/ResumeAnalyzerPage";
import ResumeTemplatesPage from "../pages/ResumeTemplatesPage";

// ── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
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
}

// ═══════════════════════════════════════════════════════════════════════════
export default function ResumePage() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* ✅ FIX: /resume → LandingPage (was ResumeHomePage before, but the
               old App.jsx had a separate /resume route blocking this entirely.
               Now App.jsx sends ALL /resume/* here, so this index fires for
               bare /resume and the landing page renders correctly.) */}
          <Route index element={<LandingPage />} />

          {/* /resume/new → dashboard with Create Resume modal open */}
          <Route path="new" element={<ResumeHomePage openCreate />} />

          {/* /resume/upload → dashboard with Upload Resume modal open */}
          <Route path="upload" element={<ResumeHomePage openUpload />} />

          {/* /resume/editor/:id */}
          <Route path="editor/:id" element={<ResumeEditorPage />} />

          {/* /resume/templates */}
          <Route path="templates" element={<ResumeTemplatesPage />} />

          {/* /resume/analyze */}
          <Route path="analyze" element={<ResumeAnalyzerPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}