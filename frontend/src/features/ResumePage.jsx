// FILE: src/features/ResumePage.jsx
// PURPOSE: Shell router for the entire Resume module.
//          Matches /resume/* and delegates to the appropriate page.
//          Imports resume.css once so all child components get styles.

import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";

// ── Import the design system once for the whole module ─────────────────────
import "../styles/resume.css";

// ── Pages (lazy-loaded for performance) ────────────────────────────────────
import ResumeHomePage    from "../pages/ResumeHomePage";
import ResumeEditorPage  from "../pages/ResumeEditorPage";
import ResumeAnalyzerPage from "../pages/ResumeAnalyzerPage";
import ResumeTemplatesPage from "../pages/ResumeTemplatesPage";

// ── Skeleton while a lazy page loads ───────────────────────────────────────
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
//  ResumePage — nested router
//  Mounted at /resume/* by App.jsx
// ═══════════════════════════════════════════════════════════════════════════
export default function ResumePage() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* /resume → dashboard */}
          <Route index element={<ResumeHomePage />} />

          {/* /resume/editor/:id */}
          <Route path="editor/:id" element={<ResumeEditorPage />} />

          {/* /resume/templates */}
          <Route path="templates" element={<ResumeTemplatesPage />} />

          {/* /resume/analyze */}
          <Route path="analyze" element={<ResumeAnalyzerPage />} />

          {/* /resume/new → redirect to dashboard (modal opens there) */}
          <Route path="new" element={<ResumeHomePage openCreate />} />

          {/* /resume/upload → redirect to dashboard (modal opens there) */}
          <Route path="upload" element={<ResumeHomePage openUpload />} />
        </Routes>
      </Suspense>
    </div>
  );
}