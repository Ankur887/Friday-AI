/**
 * ResumeAnalyzer.jsx
 * Accepts .docx, .pdf, .txt, .md uploads.
 * ALL file types are sent to the existing backend /upload endpoint
 * which returns plain text — no frontend dependencies needed.
 *
 * Backend response shape (from resume_service.py):
 * { overall_score, ats_score, summary, verdict,
 *   sections: { education, experience, projects, skills, formatting },
 *   strengths[], weaknesses[], missing_keywords[],
 *   ats_issues[], improvements[{priority,section,action}],
 *   recruiter_concerns[], standout_factors[] }
 */
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = "http://127.0.0.1:8000";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const FONT   = "Outfit, sans-serif";
const ACCENT = "#6c63ff";
const ACCENT2= "#00d4ff";
const GRAD   = "linear-gradient(135deg, #6c63ff, #00d4ff)";
const TEXT   = "#f0f0f0";
const MUTED  = "#888";
const GLASS  = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function scoreColor(score, max = 10) {
  const pct = (score / max) * 100;
  if (pct >= 70) return "#4ade80";
  if (pct >= 50) return "#facc15";
  return "#f87171";
}
function verdictColor(v = "") {
  const l = v.toLowerCase();
  if (l.includes("strong")) return "#4ade80";
  if (l.includes("good"))   return "#a3e635";
  if (l.includes("needs"))  return "#facc15";
  return "#f87171";
}
function priorityStyle(p = "") {
  if (p === "high")   return { bg:"rgba(248,113,113,0.10)", border:"rgba(248,113,113,0.28)", text:"#f87171" };
  if (p === "medium") return { bg:"rgba(250,204,21,0.09)",  border:"rgba(250,204,21,0.28)",  text:"#facc15" };
  return                     { bg:"rgba(74,222,128,0.09)",  border:"rgba(74,222,128,0.28)",  text:"#4ade80" };
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */
function Spinner({ size = 14 }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      border:"2px solid rgba(255,255,255,0.18)",
      borderTop:"2px solid #fff", borderRadius:"50%",
      animation:"raSpin 0.7s linear infinite", flexShrink:0,
    }} />
  );
}

/* ─── Big ATS ring ───────────────────────────────────────────────────────── */
function ATSRing({ score = 0 }) {
  const SIZE = 128, R = 50;
  const circ = 2 * Math.PI * R;
  const fill = Math.min(score / 100, 1) * circ;
  const color = scoreColor(score, 100);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
      <div style={{ position:"relative", width:SIZE, height:SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={9} />
          <motion.circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
            stroke={color} strokeWidth={9} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - fill }}
            transition={{ duration: 1.4, ease:"easeOut" }}
          />
        </svg>
        <div style={{
          position:"absolute", inset:0,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
        }}>
          <motion.span
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
            style={{ fontSize:28, fontWeight:800, color, fontFamily:FONT, lineHeight:1 }}
          >{score}</motion.span>
          <span style={{ fontSize:10, color:MUTED, fontWeight:600 }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize:11.5, color:MUTED, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>
        ATS SCORE
      </span>
    </div>
  );
}

/* ─── Mini score bar ─────────────────────────────────────────────────────── */
function MiniScore({ score = 0, max = 10 }) {
  const color = scoreColor(score, max);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, minWidth:54 }}>
      <span style={{ fontSize:13, fontWeight:800, color, fontFamily:FONT }}>
        {score}<span style={{ fontSize:10, fontWeight:500, color:MUTED }}>/{max}</span>
      </span>
      <div style={{ width:54, height:3, borderRadius:99, background:"rgba(255,255,255,0.08)" }}>
        <motion.div
          style={{ height:"100%", borderRadius:99, background:color }}
          initial={{ width:0 }}
          animate={{ width:`${(score/max)*100}%` }}
          transition={{ duration:0.9, ease:"easeOut" }}
        />
      </div>
    </div>
  );
}

/* ─── Section accordion row ──────────────────────────────────────────────── */
function SectionRow({ name, data }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return (
    <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width:"100%", display:"flex", alignItems:"center",
        justifyContent:"space-between", gap:12,
        padding:"10px 14px", background:"transparent",
        border:"none", cursor:"pointer",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{
            width:8, height:8, borderRadius:"50%", flexShrink:0,
            background: scoreColor(data.score, 10),
            boxShadow:`0 0 6px ${scoreColor(data.score,10)}80`,
          }} />
          <span style={{ fontSize:13.5, fontWeight:600, color:TEXT, fontFamily:FONT }}>{label}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <MiniScore score={data.score} max={10} />
          <span style={{ color:MUTED, fontSize:13, display:"inline-block", transition:"transform 0.2s", transform: open?"rotate(180deg)":"none" }}>▾</span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
            style={{ overflow:"hidden", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"10px 14px 12px", background:"rgba(0,0,0,0.18)" }}
          >
            <p style={{ fontSize:13, color:"#bbb", margin:"0 0 8px", lineHeight:1.6, fontFamily:FONT }}>{data.feedback}</p>
            {data.issues?.filter(Boolean).map((iss, i) => (
              <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:4 }}>
                <span style={{ color:"#f87171", fontSize:11, marginTop:3, flexShrink:0 }}>✕</span>
                <span style={{ fontSize:12.5, color:"#9ca3af", lineHeight:1.5, fontFamily:FONT }}>{iss}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Chip ───────────────────────────────────────────────────────────────── */
function Chip({ text, variant="neutral" }) {
  const s = {
    good:    { bg:"rgba(74,222,128,0.10)",  border:"rgba(74,222,128,0.25)",  color:"#4ade80" },
    bad:     { bg:"rgba(248,113,113,0.10)", border:"rgba(248,113,113,0.25)", color:"#f87171" },
    neutral: { bg:"rgba(255,255,255,0.06)", border:"rgba(255,255,255,0.12)", color:"#9ca3af" },
  }[variant] || {};
  return (
    <span style={{ fontSize:12, fontWeight:500, padding:"3px 10px", borderRadius:6, background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontFamily:FONT }}>
      {text}
    </span>
  );
}

/* ─── Improvement card ───────────────────────────────────────────────────── */
function ImprovementCard({ item, index }) {
  const c = priorityStyle(item.priority);
  return (
    <motion.div
      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.06 }}
      style={{ display:"flex", gap:12, padding:"10px 14px", borderRadius:10, alignItems:"flex-start", background:c.bg, border:`1px solid ${c.border}` }}
    >
      <div style={{
        flexShrink:0, marginTop:2, fontSize:10, fontWeight:800,
        letterSpacing:"0.06em", padding:"2px 7px", borderRadius:5,
        background:`${c.border}`, color:c.text, fontFamily:FONT,
        textTransform:"uppercase", whiteSpace:"nowrap",
      }}>
        {item.priority}
      </div>
      <span style={{ fontSize:13, color:"#d1d5db", lineHeight:1.55, fontFamily:FONT }}>
        {item.section && <span style={{ fontSize:11, color:MUTED, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>{item.section} · </span>}
        {item.action}
      </span>
    </motion.div>
  );
}

/* ─── Section heading ────────────────────────────────────────────────────── */
const SH = ({ children }) => (
  <p style={{ margin:"0 0 11px", fontSize:11.5, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:FONT }}>
    {children}
  </p>
);

/* ══════════════════════════════════════════════════════════════════════════
   FILE EXTRACTION — all types go through the backend /upload endpoint.
   main.py handles .pdf (pypdf), .docx (python-docx), .txt, .md, .py, .js, .csv.
══════════════════════════════════════════════════════════════════════════ */

async function extractViaBackend(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API}/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.content || "";
}

async function extractPlainText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = (e) => resolve(e.target.result);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsText(file);
  });
}

async function extractFileText(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  // pdf, txt, md, py, js, csv, docx are all handled by the backend /upload
  if (["pdf", "txt", "md", "py", "js", "csv"].includes(ext)) {
    return extractViaBackend(file);
  }
  // docx: try backend first (works if python-docx is installed),
  // otherwise fall back to plain text read (will be messy but won't crash)
  if (ext === "docx") {
    try {
      return await extractViaBackend(file);
    } catch {
      const raw = await extractPlainText(file);
      return raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/ {3,}/g, " ").trim();
    }
  }
  // anything else: try plain text
  return extractPlainText(file);
}

const ACCEPTED = ".pdf,.docx,.txt,.md,.py,.js,.csv";

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function ResumeAnalyzer() {
  const [resumeText,    setResumeText]    = useState("");
  const [targetRole,    setTargetRole]    = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [fileName,      setFileName]      = useState("");
  const [extracting,    setExtracting]    = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState(null);
  const [dragging,      setDragging]      = useState(false);
  const fileInputRef = useRef(null);

  /* ── Process any uploaded file ── */
  const processFile = async (file) => {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setFileName(file.name);
    try {
      const text = await extractFileText(file); // ← was calling undefined extractDocx/extractPdf/extractText
      if (!text.trim()) throw new Error("No readable text found in this file.");
      setResumeText(text);
    } catch (e) {
      setError(`File error: ${e.message}`);
      setFileName("");
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  /* ── Analyze ── */
  const handleAnalyze = async () => {
    if (!resumeText.trim() || loading) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}/resume/analyze`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          resume_text:    resumeText,
          target_role:    targetRole,
          target_company: targetCompany,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      if (!data || Object.keys(data).length === 0)
        throw new Error("AI returned an empty result. Try again.");
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:"100%", boxSizing:"border-box",
    background:"#1a1a1e", border:"1px solid rgba(255,255,255,0.07)",
    borderRadius:10, padding:"10px 14px",
    fontSize:14, color:TEXT, fontFamily:FONT, outline:"none",
    transition:"border-color 0.2s, box-shadow 0.2s",
  };

  const sectionKeys = ["education","experience","projects","skills","formatting"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18, fontFamily:FONT }}>

      {/* ── Drop zone ── */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border:`2px dashed ${dragging ? ACCENT2 : "rgba(255,255,255,0.12)"}`,
          borderRadius:14, padding:"22px 20px",
          textAlign:"center", cursor:"pointer",
          background: dragging ? "rgba(0,212,255,0.05)" : "rgba(255,255,255,0.02)",
          transition:"all 0.2s",
        }}
      >
        {extracting ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <Spinner size={22} />
            <span style={{ fontSize:13, color:MUTED, fontFamily:FONT }}>Extracting text from {fileName}…</span>
          </div>
        ) : fileName ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:26 }}>✅</span>
            <span style={{ fontSize:13.5, color:"#4ade80", fontWeight:600, fontFamily:FONT }}>{fileName}</span>
            <span style={{ fontSize:12, color:MUTED }}>Click to replace</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize:30, marginBottom:8 }}>📄</div>
            <p style={{ margin:0, fontSize:13.5, color:"#9ca3af", fontFamily:FONT }}>
              Drop your resume here or{" "}
              <span style={{ color:ACCENT2, fontWeight:600 }}>click to browse</span>
            </p>
            <p style={{ margin:"5px 0 0", fontSize:12, color:"#4b5563" }}>
              Supports <strong style={{ color:"#6b7280" }}>.docx · .pdf · .txt · .md</strong>
            </p>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept={ACCEPTED}
        style={{ display:"none" }}
        onChange={(e) => processFile(e.target.files?.[0])}
      />

      {/* ── Paste fallback ── */}
      {!fileName && (
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="…or paste your resume text here directly"
          rows={6}
          style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }}
          onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
          onBlur={(e)  => (e.target.style.boxShadow = "none")}
        />
      )}

      {/* Extracted text preview */}
      {fileName && resumeText && (
        <div style={{
          ...GLASS, padding:"12px 14px",
          display:"flex", justifyContent:"space-between", alignItems:"center", gap:12,
        }}>
          <span style={{ fontSize:12.5, color:MUTED, fontFamily:FONT }}>
            ✓ {resumeText.length.toLocaleString()} characters extracted
          </span>
          <button onClick={() => { setFileName(""); setResumeText(""); setResult(null); }}
            style={{ background:"transparent", border:"none", color:"#f87171", fontSize:12, cursor:"pointer", fontFamily:FONT }}>
            ✕ Clear
          </button>
        </div>
      )}

      {/* ── Target inputs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {[
          { label:"Target Role",    val:targetRole,    set:setTargetRole,    ph:"e.g. Software Engineer" },
          { label:"Target Company", val:targetCompany, set:setTargetCompany, ph:"e.g. Google" },
        ].map(({ label, val, set, ph }) => (
          <div key={label}>
            <label style={{ display:"block", fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.4)", letterSpacing:"1.1px", textTransform:"uppercase", marginBottom:6, fontFamily:FONT }}>
              {label}
            </label>
            <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
              style={inputStyle}
              onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px ${ACCENT}40`)}
              onBlur={(e)  => (e.target.style.boxShadow = "none")}
            />
          </div>
        ))}
      </div>

      {/* ── Analyze button ── */}
      <motion.button
        whileHover={!loading && resumeText.trim() ? { scale:1.02, boxShadow:"0 0 28px rgba(108,99,255,0.4)" } : {}}
        whileTap={!loading && resumeText.trim() ? { scale:0.97 } : {}}
        onClick={handleAnalyze}
        disabled={!resumeText.trim() || loading || extracting}
        style={{
          padding:"13px 0", borderRadius:10, border:"none",
          background:(!resumeText.trim() || loading || extracting) ? "rgba(255,255,255,0.07)" : GRAD,
          color:(!resumeText.trim() || loading || extracting) ? "#4b5563" : "#fff",
          fontSize:15, fontWeight:700, fontFamily:FONT,
          cursor:(!resumeText.trim() || loading || extracting) ? "not-allowed" : "pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:9,
          transition:"background 0.2s",
        }}
      >
        {loading ? <><Spinner /> Analyzing Resume…</> : <>🔍 Analyze Resume</>}
      </motion.button>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding:"11px 15px", borderRadius:10, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", color:"#f87171", fontSize:13, fontFamily:FONT }}>
          ⚠️ {error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          RESULTS
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:0.4, ease:[0.16,1,0.3,1] }}
            style={{ display:"flex", flexDirection:"column", gap:16 }}
          >

            {/* Hero: ring + verdict + summary */}
            <div style={{ ...GLASS, padding:"22px 24px", display:"flex", gap:24, alignItems:"center" }}>
              <ATSRing score={result.ats_score ?? result.overall_score ?? 0} />
              <div style={{ flex:1, minWidth:0 }}>
                {result.verdict && (
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:6,
                    padding:"3px 12px", borderRadius:20, marginBottom:10,
                    background:`${verdictColor(result.verdict)}18`,
                    border:`1px solid ${verdictColor(result.verdict)}40`,
                  }}>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:verdictColor(result.verdict), fontFamily:FONT }}>
                      {result.verdict}
                    </span>
                  </div>
                )}
                {result.overall_score !== undefined && (
                  <div style={{ marginBottom:8 }}>
                    <span style={{ fontSize:11, color:MUTED, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Overall — </span>
                    <span style={{ fontSize:13, fontWeight:700, color:scoreColor(result.overall_score, 100), fontFamily:FONT }}>{result.overall_score}/100</span>
                  </div>
                )}
                {result.summary && (
                  <p style={{ fontSize:13.5, color:"#bbb", margin:0, lineHeight:1.65, fontFamily:FONT }}>{result.summary}</p>
                )}
              </div>
            </div>

            {/* Section breakdown */}
            {result.sections && (
              <div style={{ ...GLASS, padding:"16px 18px" }}>
                <SH>Section Breakdown</SH>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {sectionKeys.map((k) => result.sections[k]
                    ? <SectionRow key={k} name={k} data={result.sections[k]} />
                    : null
                  )}
                </div>
              </div>
            )}

            {/* Strengths + Weaknesses */}
            {(result.strengths?.length > 0 || result.weaknesses?.length > 0) && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {result.strengths?.length > 0 && (
                  <div style={{ ...GLASS, padding:"14px 16px" }}>
                    <SH>✅ Strengths</SH>
                    {result.strengths.map((s, i) => (
                      <div key={i} style={{ display:"flex", gap:7, marginBottom:5 }}>
                        <span style={{ color:"#4ade80", fontSize:11, marginTop:3 }}>▸</span>
                        <span style={{ fontSize:12.5, color:"#bbb", lineHeight:1.5, fontFamily:FONT }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.weaknesses?.length > 0 && (
                  <div style={{ ...GLASS, padding:"14px 16px" }}>
                    <SH>⚠️ Weaknesses</SH>
                    {result.weaknesses.map((w, i) => (
                      <div key={i} style={{ display:"flex", gap:7, marginBottom:5 }}>
                        <span style={{ color:"#f87171", fontSize:11, marginTop:3 }}>▸</span>
                        <span style={{ fontSize:12.5, color:"#bbb", lineHeight:1.5, fontFamily:FONT }}>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Missing keywords */}
            {result.missing_keywords?.length > 0 && (
              <div style={{ ...GLASS, padding:"14px 16px" }}>
                <SH>🔑 Missing Keywords</SH>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {result.missing_keywords.map((k, i) => <Chip key={i} text={k} variant="bad" />)}
                </div>
              </div>
            )}

            {/* ATS issues */}
            {result.ats_issues?.length > 0 && (
              <div style={{ ...GLASS, padding:"14px 16px" }}>
                <SH>🤖 ATS Issues</SH>
                {result.ats_issues.map((iss, i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                    <span style={{ color:"#facc15", fontSize:11, marginTop:3 }}>⚡</span>
                    <span style={{ fontSize:13, color:"#9ca3af", lineHeight:1.55, fontFamily:FONT }}>{iss}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action items */}
            {result.improvements?.length > 0 && (
              <div style={{ ...GLASS, padding:"14px 16px" }}>
                <SH>🚀 Action Items</SH>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {result.improvements.map((item, i) => <ImprovementCard key={i} item={item} index={i} />)}
                </div>
              </div>
            )}

            {/* Standout factors */}
            {result.standout_factors?.length > 0 && (
              <div style={{ ...GLASS, padding:"14px 16px" }}>
                <SH>⭐ Standout Factors</SH>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {result.standout_factors.map((f, i) => <Chip key={i} text={f} variant="good" />)}
                </div>
              </div>
            )}

            {/* Recruiter concerns */}
            {result.recruiter_concerns?.length > 0 && (
              <div style={{ ...GLASS, padding:"14px 16px" }}>
                <SH>🧐 Recruiter Concerns</SH>
                {result.recruiter_concerns.map((c, i) => (
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                    <span style={{ color:"#c084fc", fontSize:11, marginTop:3 }}>▸</span>
                    <span style={{ fontSize:13, color:"#9ca3af", lineHeight:1.55, fontFamily:FONT }}>{c}</span>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes raSpin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #555; }
      `}</style>
    </div>
  );
}