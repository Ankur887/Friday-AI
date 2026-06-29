// FILE: src/features/ResumeLandingPage.jsx
// PURPOSE: Marketing landing page for the Resume module.
//          All CTA buttons navigate to /resume/new or /resume/upload
//          using useNavigate directly — no onNavigate prop needed.

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ─── tiny helpers ─────────────────────────────────────────── */
const TypedText = ({ words }) => {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[idx];
    if (!del && chars.length < word.length) {
      const t = setTimeout(() => setChars(word.slice(0, chars.length + 1)), 78);
      return () => clearTimeout(t);
    } else if (!del && chars.length === word.length) {
      const t = setTimeout(() => setDel(true), 1800);
      return () => clearTimeout(t);
    } else if (del && chars.length > 0) {
      const t = setTimeout(() => setChars(chars.slice(0, -1)), 42);
      return () => clearTimeout(t);
    } else if (del && chars.length === 0) {
      setDel(false);
      setIdx((idx + 1) % words.length);
    }
  }, [chars, del, idx, words]);
  return (
    <span style={{ color: "#1A56DB", borderRight: "3px solid #1A56DB", paddingRight: 3 }}>
      {chars}
    </span>
  );
};

const FadeIn = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); ob.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(22px)", transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms` }}>
      {children}
    </div>
  );
};

const CountUp = ({ target, suffix = "" }) => {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const s = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - s) / 1800, 1);
          setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [target]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
};

/* ─── mock resume card ──────────────────────────────────────── */
const ResumeCard = ({ accent = "#1A56DB" }) => (
  <div style={{ background: "white", borderRadius: 10, width: 200, padding: "18px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.13)", border: "1px solid #E5E7EB", position: "relative" }}>
    <div style={{ height: 5, borderRadius: 3, background: accent, marginBottom: 14 }} />
    <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: accent }}>JD</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 11, color: "#111" }}>Jane Doe</div>
        <div style={{ fontSize: 9, color: "#6B7280" }}>Software Engineer</div>
      </div>
    </div>
    {[75, 55, 88, 48, 65].map((w, i) => (
      <div key={i} style={{ height: 5, borderRadius: 3, background: i % 2 === 0 ? "#EEF2FF" : "#F3F4F6", width: w + "%", marginBottom: 6 }} />
    ))}
    <div style={{ marginTop: 12, display: "flex", gap: 4, flexWrap: "wrap" }}>
      {["React", "Node", "AWS"].map(s => (
        <span key={s} style={{ background: accent + "15", color: accent, fontSize: 8, fontWeight: 600, borderRadius: 20, padding: "2px 7px" }}>{s}</span>
      ))}
    </div>
    <div style={{ position: "absolute", top: 10, right: 10, background: "#10B981", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, color: "white" }}>ATS 94%</div>
  </div>
);

/* ─── data ──────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "✦", title: "AI Content Suggestions", desc: "Get bullet-point ideas and stronger phrasing tailored to your role as you type." },
  { icon: "◎", title: "ATS Score Checker", desc: "Instantly see how recruiters' systems will rank your resume — and fix issues." },
  { icon: "▦", title: "50+ Templates", desc: "Professionally designed layouts for every industry and career level." },
  { icon: "⬡", title: "Job Match Analysis", desc: "Paste a job description and see which keywords are missing from your resume." },
  { icon: "◈", title: "Real-time Analytics", desc: "See who viewed your resume, when, and for how long." },
  { icon: "↗", title: "One-click Export", desc: "Download as PDF, share a live link, or import into LinkedIn in seconds." },
];

const TEMPLATES = [
  { name: "Stockholm", color: "#1A56DB", tag: "Most popular" },
  { name: "New York", color: "#0E9F6E", tag: "ATS #1" },
  { name: "Vienna", color: "#E3A008", tag: "Creative" },
  { name: "Sydney", color: "#9061F9", tag: "Modern" },
  { name: "London", color: "#E02424", tag: "Executive" },
  { name: "Dublin", color: "#057A55", tag: "Minimal" },
];

const STEPS = [
  { n: "1", title: "Pick a template", desc: "Choose from 50+ recruiter-approved designs. All ATS-tested." },
  { n: "2", title: "Fill in your details", desc: "Smart prompts guide every section. AI completes your bullet points." },
  { n: "3", title: "Optimize with AI", desc: "Run the ATS checker and accept suggestions in one click." },
  { n: "4", title: "Download & apply", desc: "Export a pixel-perfect PDF and land the interview." },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "Product Manager · Google", quote: "3 interview calls in one week. The ATS checker alone is worth it.", init: "PS", color: "#1A56DB" },
  { name: "Marcus J.", role: "Software Engineer · Meta", quote: "Zero callbacks before. Five interviews in 10 days after rebuilding with ResumAI.", init: "MJ", color: "#0E9F6E" },
  { name: "Aisha R.", role: "Data Analyst · Amazon", quote: "My ATS score jumped from 44 to 91. Rewrote my bullets completely in minutes.", init: "AR", color: "#9061F9" },
];

const COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Stripe", "Adobe", "OpenAI", "Shopify", "Salesforce", "Airbnb"];

/* ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  // ✅ FIX: use useNavigate directly — no prop needed
  const navigate = useNavigate();
  const [scroll, setScroll] = useState(0);
  const [hovTpl, setHovTpl] = useState(null);
  const [hovFeat, setHovFeat] = useState(null);

  useEffect(() => {
    const h = () => setScroll(window.scrollY);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  // ✅ FIX: "Create my resume" → /resume/new  |  "Upload existing" → /resume/upload
  const goCreate = () => navigate("/resume/new");
  const goUpload = () => navigate("/resume/upload");
  // "Check ATS score" and "Analyze" go to the analyzer
  const goAnalyze = () => navigate("/resume/analyze");
  // Templates tab in dashboard
  const goTemplates = () => navigate("/resume/templates");

  const navBg = scroll > 30 ? "rgba(255,255,255,0.97)" : "transparent";
  const navShadow = scroll > 30 ? "0 1px 0 #E5E7EB" : "none";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#fff", color: "#111827", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes floatY { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ping { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.7);opacity:0} }
        .pri { background:#1A56DB; color:#fff; border:none; padding:13px 26px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; transition:background .18s,transform .18s,box-shadow .18s; display:inline-flex; align-items:center; gap:7px; }
        .pri:hover { background:#1648C0; transform:translateY(-2px); box-shadow:0 8px 22px rgba(26,86,219,.3); }
        .sec { background:#fff; color:#374151; border:1.5px solid #D1D5DB; padding:13px 26px; border-radius:8px; font-size:15px; font-weight:600; cursor:pointer; transition:border-color .18s,color .18s,transform .18s; display:inline-flex; align-items:center; gap:7px; }
        .sec:hover { border-color:#1A56DB; color:#1A56DB; transform:translateY(-2px); }
        .navbtn { background:none; border:none; font-size:14px; font-weight:500; color:#374151; cursor:pointer; padding:4px 0; transition:color .15s; }
        .navbtn:hover { color:#1A56DB; }
        .feat-card { background:#fff; border:1px solid #F3F4F6; border-radius:14px; padding:28px 24px; transition:all .22s; cursor:default; }
        .feat-card:hover { box-shadow:0 8px 28px rgba(26,86,219,.09); border-color:#BFDBFE; transform:translateY(-3px); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", background: navBg, boxShadow: navShadow, backdropFilter: scroll > 30 ? "blur(10px)" : "none", transition: "all .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1A56DB" />
            <rect x="7" y="7" width="14" height="2.2" rx="1.1" fill="white" />
            <rect x="7" y="11.5" width="10" height="1.8" rx=".9" fill="white" opacity=".8" />
            <rect x="7" y="15.5" width="12" height="1.8" rx=".9" fill="white" opacity=".8" />
            <rect x="7" y="19.5" width="8" height="1.8" rx=".9" fill="white" opacity=".6" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#111827", letterSpacing: "-.4px" }}>ResumAI</span>
        </div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {/* ✅ FIX: nav links use correct routes */}
          <button className="navbtn" onClick={goTemplates}>Templates</button>
          <button className="navbtn" onClick={goCreate}>Features</button>
          <button className="navbtn" onClick={goCreate}>Pricing</button>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="navbtn" onClick={goCreate}>Log in</button>
          <button className="pri" style={{ padding: "9px 20px", fontSize: 14 }} onClick={goCreate}>
            Get started — it's free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 60, background: "linear-gradient(150deg,#F0F7FF 0%,#EEF2FF 55%,#F5F3FF 100%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "8%", right: "3%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,86,219,.07) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "6%", left: "2%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle,rgba(144,97,249,.06) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", width: "100%" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #DBEAFE", borderRadius: 20, padding: "5px 14px", marginBottom: 28, boxShadow: "0 2px 8px rgba(26,86,219,.07)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block", position: "relative" }}>
                <span style={{ position: "absolute", inset: -2, borderRadius: "50%", border: "2px solid #10B981", animation: "ping 1.4s ease-out infinite" }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1A56DB" }}>AI-powered resume builder</span>
            </div>

            <h1 style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.08, letterSpacing: "-2px", color: "#0F172A", marginBottom: 22 }}>
              The resume that<br />gets you{" "}
              <span style={{ display: "inline-block", minWidth: 260 }}>
                <TypedText words={["interviews", "callbacks", "hired faster", "noticed first", "better offers"]} />
              </span>
            </h1>

            <p style={{ fontSize: 17, color: "#6B7280", lineHeight: 1.72, marginBottom: 34, maxWidth: 470 }}>
              Build an ATS-optimised resume in minutes. AI writes your bullet points, checks every keyword, and formats it for the job you want.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
              {/* ✅ FIX: correct route handlers */}
              <button className="pri" style={{ fontSize: 16, padding: "15px 30px" }} onClick={goCreate}>
                Create my resume →
              </button>
              <button className="sec" style={{ fontSize: 16, padding: "15px 30px" }} onClick={goUpload}>
                ↑ Upload existing
              </button>
            </div>

            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {["✓ Free to start", "✓ ATS ready", "✓ No design skills needed", "✓ PDF in minutes"].map(t => (
                <span key={t} style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", height: 440, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ animation: "floatY 4s ease-in-out infinite" }}>
              <ResumeCard accent="#1A56DB" />
            </div>
            <div style={{ position: "absolute", bottom: 60, left: 20, background: "white", borderRadius: 10, padding: "11px 14px", boxShadow: "0 8px 24px rgba(0,0,0,.10)", border: "1px solid #E5E7EB", minWidth: 178 }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4 }}>✦ AI suggestion</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>"Led cross-functional team of 6"</div>
              <div style={{ fontSize: 11, color: "#10B981", marginTop: 3 }}>+14% ATS boost</div>
            </div>
            <div style={{ position: "absolute", top: 70, right: 16, background: "white", borderRadius: 10, padding: "11px 14px", boxShadow: "0 8px 24px rgba(0,0,0,.10)", border: "1px solid #E5E7EB" }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6 }}>Job match score</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF2FF", border: "3px solid #1A56DB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#1A56DB" }}>94%</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>Google SWE</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <section style={{ background: "#fff", borderTop: "1px solid #F3F4F6", borderBottom: "1px solid #F3F4F6", padding: "40px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <FadeIn>
            <p style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 32 }}>
              Candidates hired at
            </p>
          </FadeIn>
          <div style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", animation: "marquee 24s linear infinite", width: "200%" }}>
              {[...COMPANIES, ...COMPANIES].map((c, i) => (
                <div key={i} style={{ flex: "none", padding: "0 36px", fontSize: 15, fontWeight: 700, color: "#D1D5DB", whiteSpace: "nowrap", letterSpacing: "-.2px" }}>{c}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BIG STAT ── */}
      <section style={{ background: "#fff", padding: "80px 48px 0" }}>
        <FadeIn>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: "#0F172A", letterSpacing: "-2px", lineHeight: 1 }}>
              <CountUp target={158000} />+ resumes built today
            </div>
            <p style={{ fontSize: 16, color: "#9CA3AF", marginTop: 10 }}>Updated in real time — join professionals landing jobs every day.</p>
          </div>
        </FadeIn>
      </section>

      {/* ── STATS GRID ── */}
      <section style={{ background: "#fff", padding: "52px 48px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {[
            { stat: "10 min", label: "Average time to a complete draft" },
            { stat: "2.4×", label: "More interview callbacks on average" },
            { stat: "94%", label: "ATS pass rate across all templates" },
            { stat: "50+", label: "Recruiter-approved templates" },
          ].map((c, i) => (
            <FadeIn key={i} delay={i * 70}>
              <div style={{ background: "#FAFAFA", border: "1px solid #F3F4F6", borderRadius: 14, padding: "28px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: "#1A56DB", letterSpacing: "-1px", marginBottom: 6 }}>{c.stat}</div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>{c.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: "#FAFAFA", padding: "88px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A56DB", letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 10 }}>Features</div>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px", marginBottom: 12 }}>Everything you need to get hired</h2>
              <p style={{ fontSize: 16, color: "#9CA3AF", maxWidth: 440, margin: "0 auto" }}>Built around one goal: more interviews, in less time.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={i} delay={i * 55}>
                <div
                  className="feat-card"
                  onMouseEnter={() => setHovFeat(i)}
                  onMouseLeave={() => setHovFeat(null)}
                  style={{ background: hovFeat === i ? "#F8FAFF" : "#fff", border: "1px solid " + (hovFeat === i ? "#BFDBFE" : "#F3F4F6"), borderRadius: 14, padding: "28px 24px", transition: "all .22s", cursor: "default" }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#1A56DB", marginBottom: 16 }}>{f.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#0F172A", marginBottom: 7 }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── ATS BEFORE / AFTER ── */}
      <section style={{ background: "#fff", padding: "88px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <FadeIn>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A56DB", letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 10 }}>ATS optimisation</div>
              <h2 style={{ fontSize: 38, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px", marginBottom: 14 }}>From ignored to interview-ready</h2>
              <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.72, marginBottom: 30 }}>
                75% of resumes never reach a human. Applicant Tracking Systems filter them out first. ResumAI optimises yours — for free, in minutes.
              </p>
              {/* ✅ FIX: goes to analyzer */}
              <button className="pri" onClick={goAnalyze}>Check my ATS score →</button>
            </div>
          </FadeIn>
          <FadeIn delay={180}>
            <div style={{ background: "#FAFAFA", borderRadius: 16, padding: 32, border: "1px solid #E5E7EB" }}>
              {[
                { label: "Before ResumAI", score: 38, color: "#EF4444" },
                { label: "After ResumAI", score: 94, color: "#10B981" },
              ].map((r, i) => (
                <div key={i} style={{ marginBottom: i === 0 ? 28 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>{r.label}</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: r.color }}>{r.score}%</span>
                  </div>
                  <div style={{ background: "#E5E7EB", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 6, background: r.color, width: r.score + "%" }} />
                  </div>
                  {i === 0 && <div style={{ borderTop: "1px dashed #E5E7EB", margin: "28px 0" }} />}
                </div>
              ))}
              <div style={{ marginTop: 22, background: "#F0FDF4", borderRadius: 9, padding: "13px 16px", display: "flex", gap: 11, alignItems: "center" }}>
                <span style={{ color: "#10B981", fontWeight: 700, fontSize: 18 }}>✓</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#065F46" }}>Recruiter approved</div>
                  <div style={{ fontSize: 12, color: "#34D399" }}>+148% more likely to get an interview</div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "#F8FAFF", padding: "88px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 68 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A56DB", letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 10 }}>How it works</div>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px" }}>Blank to hired in 4 steps</h2>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, position: "relative" }}>
            <div style={{ position: "absolute", top: 26, left: "12.5%", right: "12.5%", height: 2, background: "linear-gradient(90deg,#BFDBFE,#1A56DB,#9061F9)", opacity: .4, borderRadius: 2 }} />
            {STEPS.map((s, i) => (
              <FadeIn key={i} delay={i * 90}>
                <div style={{ textAlign: "center", padding: "0 12px", position: "relative" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "white", border: "2.5px solid #1A56DB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontWeight: 800, fontSize: 16, color: "#1A56DB", position: "relative", zIndex: 1, boxShadow: "0 0 0 5px #EEF2FF" }}>{s.n}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A", marginBottom: 7 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ── */}
      <section style={{ background: "#fff", padding: "88px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A56DB", letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 10 }}>Templates</div>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px", marginBottom: 10 }}>Designed to impress</h2>
              <p style={{ fontSize: 16, color: "#9CA3AF" }}>Every layout is ATS-tested, recruiter-reviewed, and built for your industry.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 16, marginBottom: 36 }}>
            {TEMPLATES.map((t, i) => (
              <FadeIn key={i} delay={i * 50}>
                <div
                  onMouseEnter={() => setHovTpl(i)}
                  onMouseLeave={() => setHovTpl(null)}
                  onClick={goCreate}  /* ✅ FIX */
                  style={{ background: "#FAFAFA", borderRadius: 12, overflow: "hidden", border: "1.5px solid " + (hovTpl === i ? t.color + "60" : "#F3F4F6"), cursor: "pointer", transition: "all .22s", transform: hovTpl === i ? "scale(1.04)" : "scale(1)", boxShadow: hovTpl === i ? "0 10px 28px rgba(0,0,0,.10)" : "none" }}
                >
                  <div style={{ background: t.color + "15", padding: "20px 14px 14px", minHeight: 130, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ background: "white", borderRadius: 6, width: "85%", padding: "10px 8px", boxShadow: "0 3px 10px rgba(0,0,0,.07)" }}>
                      <div style={{ height: 4, borderRadius: 2, background: t.color, marginBottom: 7, width: "65%" }} />
                      {[85, 55, 75, 45, 60].map((w, j) => (
                        <div key={j} style={{ height: 3, borderRadius: 2, background: "#F3F4F6", width: w + "%", marginBottom: 4 }} />
                      ))}
                    </div>
                    <div style={{ position: "absolute", top: 8, right: 8, background: t.color, color: "white", fontSize: 8, fontWeight: 700, borderRadius: 10, padding: "2px 7px" }}>{t.tag}</div>
                    {hovTpl === i && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ background: "white", color: t.color, fontWeight: 700, fontSize: 11, borderRadius: 6, padding: "6px 14px" }}>Use this →</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>ATS optimised</div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            {/* ✅ FIX: goes to templates page */}
            <button className="sec" onClick={goTemplates}>Browse all 50+ templates →</button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: "#FAFAFA", padding: "88px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A56DB", letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 10 }}>Success stories</div>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px" }}>Real results from real people</h2>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div style={{ background: "white", border: "1px solid #F3F4F6", borderRadius: 14, padding: "26px 22px" }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                    {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: "#F59E0B", fontSize: 15 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 20 }}>"{t.quote}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.color + "18", border: "2px solid " + t.color + "50", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: t.color }}>{t.init}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD / ENHANCE ── */}
      <section style={{ background: "#fff", padding: "88px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <FadeIn>
            <div
              onClick={goUpload}  /* ✅ FIX */
              style={{ background: "#F8FAFF", borderRadius: 16, padding: 48, border: "2px dashed #BFDBFE", textAlign: "center", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#1A56DB"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#BFDBFE"}
            >
              <div style={{ fontSize: 44, marginBottom: 14, color: "#1A56DB" }}>↑</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#374151", marginBottom: 6 }}>Drop your resume here</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>PDF, DOCX — up to 10 MB</div>
              <button className="pri" style={{ fontSize: 14, padding: "10px 22px" }}>Upload resume</button>
            </div>
          </FadeIn>
          <FadeIn delay={140}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A56DB", letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 10 }}>Already have a resume?</div>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: "#0F172A", letterSpacing: "-1px", marginBottom: 14 }}>Let AI upgrade it instantly</h2>
              <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.72, marginBottom: 28 }}>
                Upload your existing resume and get immediate improvements — better keywords, stronger bullet points, improved ATS score.
              </p>
              {["Stronger action verbs and quantified results", "Better ATS keyword coverage", "Cleaner formatting and layout", "Gap analysis with suggestions"].map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, color: "#374151" }}>{b}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ background: "#FAFAFA", padding: "88px 48px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A56DB", letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 10 }}>Pricing</div>
              <h2 style={{ fontSize: 40, fontWeight: 900, color: "#0F172A", letterSpacing: "-1.5px", marginBottom: 10 }}>Simple, transparent pricing</h2>
              <p style={{ fontSize: 16, color: "#9CA3AF" }}>Start free. Upgrade when you're ready.</p>
            </div>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {[
              { name: "Free", price: "$0", per: "forever", features: ["3 resumes", "5 templates", "PDF export", "ATS checker"], cta: "Get started", hi: false },
              { name: "Pro", price: "$9", per: "/month", badge: "Most popular", features: ["Unlimited resumes", "50+ templates", "Priority AI", "Analytics", "Custom URL", "Cover letters"], cta: "Start free trial", hi: true },
              { name: "Enterprise", price: "Custom", per: "", features: ["Team accounts", "SSO", "API access", "Dedicated support", "Custom branding"], cta: "Contact sales", hi: false },
            ].map((p, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div style={{ background: p.hi ? "#1A56DB" : "white", border: p.hi ? "none" : "1px solid #E5E7EB", borderRadius: 16, padding: "32px 26px", position: "relative", transform: p.hi ? "scale(1.035)" : "scale(1)", boxShadow: p.hi ? "0 16px 44px rgba(26,86,219,.28)" : "none" }}>
                  {p.badge && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#F59E0B", color: "white", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "4px 14px", whiteSpace: "nowrap" }}>{p.badge}</div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 12, color: p.hi ? "rgba(255,255,255,.65)" : "#9CA3AF", marginBottom: 7, textTransform: "uppercase", letterSpacing: ".08em" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 22 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: p.hi ? "white" : "#0F172A" }}>{p.price}</span>
                    <span style={{ fontSize: 13, color: p.hi ? "rgba(255,255,255,.55)" : "#9CA3AF" }}>{p.per}</span>
                  </div>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                      <span style={{ color: p.hi ? "#93C5FD" : "#10B981", fontWeight: 700, fontSize: 13 }}>✓</span>
                      <span style={{ fontSize: 13, color: p.hi ? "rgba(255,255,255,.82)" : "#374151" }}>{f}</span>
                    </div>
                  ))}
                  {/* ✅ FIX: all pricing CTAs go to /resume/new */}
                  <button
                    onClick={goCreate}
                    style={{ width: "100%", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, marginTop: 22, cursor: "pointer", transition: "all .18s", background: p.hi ? "white" : "#1A56DB", color: p.hi ? "#1A56DB" : "white", border: "none" }}
                  >{p.cta}</button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background: "linear-gradient(135deg,#1E3A8A,#1A56DB,#6D28D9)", padding: "96px 48px", textAlign: "center" }}>
        <FadeIn>
          <h2 style={{ fontSize: 50, fontWeight: 900, color: "white", letterSpacing: "-2px", marginBottom: 14, lineHeight: 1.08 }}>
            Your next interview starts here
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.7)", marginBottom: 38, maxWidth: 460, margin: "0 auto 38px" }}>
            Join 158,000+ professionals who landed their dream job with ResumAI.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {/* ✅ FIX: final CTA buttons */}
            <button style={{ background: "white", color: "#1A56DB", border: "none", padding: "15px 34px", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={goCreate}>
              Create my resume →
            </button>
            <button style={{ background: "rgba(255,255,255,.12)", color: "white", border: "1.5px solid rgba(255,255,255,.35)", padding: "15px 34px", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer" }} onClick={goUpload}>
              Upload existing resume
            </button>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0F172A", color: "#6B7280", padding: "60px 48px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 44 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="7" fill="#1A56DB" />
                  <rect x="7" y="7" width="14" height="2.2" rx="1.1" fill="white" />
                  <rect x="7" y="11.5" width="10" height="1.8" rx=".9" fill="white" opacity=".8" />
                  <rect x="7" y="15.5" width="12" height="1.8" rx=".9" fill="white" opacity=".8" />
                  <rect x="7" y="19.5" width="8" height="1.8" rx=".9" fill="white" opacity=".6" />
                </svg>
                <span style={{ fontWeight: 800, fontSize: 16, color: "white" }}>ResumAI</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "#4B5563", maxWidth: 260 }}>The AI resume builder that gets you more interviews, faster.</p>
            </div>
            {[
              { title: "Product", links: [["Templates", goTemplates], ["Resume Builder", goCreate], ["ATS Checker", goAnalyze], ["Analytics", goCreate]] },
              { title: "Resources", links: [["Blog", goCreate], ["Help Center", goCreate], ["Resume Examples", goTemplates], ["Cover Letters", goCreate]] },
              { title: "Company", links: [["About", goCreate], ["Privacy", goCreate], ["Terms", goCreate], ["Contact", goCreate]] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "white", marginBottom: 14, letterSpacing: ".05em", textTransform: "uppercase" }}>{col.title}</div>
                {col.links.map(([label, handler]) => (
                  <div key={label} onClick={handler} style={{ fontSize: 13, color: "#4B5563", marginBottom: 9, cursor: "pointer", transition: "color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#9CA3AF"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4B5563"}
                  >{label}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #1F2937", paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12 }}>© 2026 ResumAI. All rights reserved.</span>
            <span style={{ fontSize: 12 }}>Made for job seekers everywhere ✦</span>
          </div>
        </div>
      </footer>
    </div>
  );
}