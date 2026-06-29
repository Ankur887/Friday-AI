import { useState } from "react";
import { useAuth } from "./AuthContext";

const API = "http://127.0.0.1:8000";

// ── Left-panel shared styles (unchanged) ─────────────────────────────────────
const S = {
  input: {
    width: "100%", padding: "11px 14px", background: "#fff",
    border: "1px solid #e0ddd8", borderRadius: 8, fontSize: 14, color: "#1a1a1a",
    outline: "none", marginBottom: 10,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    boxSizing: "border-box", transition: "border-color 0.15s",
  },
  primaryBtn: (disabled) => ({
    width: "100%", padding: "11px 20px",
    background: disabled ? "#c8c5c0" : "#1a1a1a",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer", marginBottom: 20,
    transition: "background 0.15s",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }),
  error: {
    fontSize: 13, color: "#c0392b", marginBottom: 10, padding: "8px 12px",
    background: "#fef0ef", borderRadius: 6, border: "1px solid #f5c6c5",
  },
  success: {
    fontSize: 13, color: "#166534", marginBottom: 10, padding: "8px 12px",
    background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0",
  },
  toggle: { textAlign: "center", fontSize: 13, color: "#6b6860", fontFamily: "-apple-system, sans-serif" },
  link:   { color: "#1a1a1a", textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer" },
};

// ── Right-panel constants ─────────────────────────────────────────────────────
const PILLS = ["Interview prep","AI Code Review","Resume Builder","Mock Sessions","Roadmaps","Offer Negotiation"];

const WEEK_DATA = [
  [0,0,0,0,1], [0,0,1,0,1], [1,0,1,1,0], [1,1,0,1,1],
  [2,1,2,1,2], [2,2,2,2,2], [3,3,3,3,3],
];
const GRID_COLORS = ["#1A2D52","#4F46E5","#6366F1","#818CF8"];
const GRID_CELLS = [];
for (let d = 0; d < 5; d++) for (let w = 0; w < 7; w++) GRID_CELLS.push(WEEK_DATA[w][d]);

function Sparkline() {
  const pts = [42,48,52,58,63,67,74,80,86,91];
  const W=72, H=22, min=42, range=49;
  const c = pts.map((p,i) => [
    +((i/(pts.length-1))*W).toFixed(1),
    +(H-2-((p-min)/range)*(H-6)).toFixed(1),
  ]);
  const path = c.map(([x,y],i) => `${i?"L":"M"}${x},${y}`).join(" ");
  const [lx,ly] = c[c.length-1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={path} fill="none" stroke="#6366F1" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill="#6366F1"/>
    </svg>
  );
}

function DonutRing() {
  const R=46, C=+(2*Math.PI*R).toFixed(2), fill=+(0.91*C).toFixed(2);
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#A78BFA"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r={R} fill="none" stroke="#1A2D52" strokeWidth="8"/>
      <circle cx="60" cy="60" r={R} fill="none" stroke="url(#rg)" strokeWidth="8"
              strokeDasharray={`${fill} 1000`} strokeLinecap="round"
              transform="rotate(-90 60 60)"/>
    </svg>
  );
}

function TypingDots() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"10px 14px"}}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:6,height:6,borderRadius:"50%",background:"#6366F1",
          animation:`typingBounce 1.3s ease-in-out ${i*0.18}s infinite`,
        }}/>
      ))}
    </div>
  );
}

function RightPanel() {
  const kw  = (t) => <span style={{color:"#8B5CF6"}}>{t}</span>;
  const fn  = (t) => <span style={{color:"#38BDF8"}}>{t}</span>;
  const v   = (t) => <span style={{color:"#F1F5F9"}}>{t}</span>;
  const op  = (t) => <span style={{color:"#94A3B8"}}>{t}</span>;
  const bi  = (t) => <span style={{color:"#34D399"}}>{t}</span>;

  const codeLines = [
    <>{kw("def")}{" "}{fn("two_sum")}{op("(")}{v("nums")}{op(", ")}{v("target")}{op("):")}</>,
    <>{"    "}{v("seen")}{op(" = {}")}</>,
    <>{"    "}{kw("for")}{" "}{v("i")}{op(", ")}{v("n")}{" "}{kw("in")}{" "}{bi("enumerate")}{op("(")}{v("nums")}{op("):")}</>,
    <>{"        "}{kw("if")}{" "}{v("target")}{op(" - ")}{v("n")}{" "}{kw("in")}{" "}{v("seen")}{op(":")}</>,
    <>{"            "}{kw("return")}{" "}{op("[")}{v("seen")}{op("[")}{v("target")}{op(" - ")}{v("n")}{op("]")}{op(", ")}{v("i")}{op("]")}</>,
    <>{"        "}{v("seen")}{op("[")}{v("n")}{op("] = ")}{v("i")}</>,
  ];

  return (
    <div style={{
      flex:1, minWidth:0, height:"100vh",
      display:"flex", flexDirection:"column",
      background:"#060A12", overflow:"hidden", position:"relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes livePulse    { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes typingBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes scrollLeft   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>

      <div style={{
        position:"absolute", top:0, right:0, width:520, height:420,
        background:"radial-gradient(ellipse at top right,rgba(99,102,241,0.08) 0%,transparent 70%)",
        pointerEvents:"none", zIndex:0,
      }}/>

      {/* TOP STRIP */}
      <div style={{
        height:56, flexShrink:0, zIndex:1,
        background:"#0C1628", borderBottom:"1px solid #1A2D52",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 24px",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#F43F5E",animation:"livePulse 1.4s ease-in-out infinite"}}/>
          <span style={{fontSize:11,fontWeight:700,color:"#F43F5E",letterSpacing:"0.1em",fontFamily:"'Space Grotesk',sans-serif"}}>LIVE DEMO</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:11,color:"#4C6397",fontFamily:"Inter,sans-serif"}}>Readiness</span>
            <span style={{fontSize:15,fontWeight:700,color:"#818CF8",fontFamily:"'Space Grotesk',sans-serif"}}>91</span>
          </div>
          <Sparkline/>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{flex:1,minHeight:0,display:"flex",flexDirection:"row",position:"relative",zIndex:1}}>

        {/* LEFT COL: CODE */}
        <div style={{width:"55%",flexShrink:0,background:"#0C1628",borderRight:"1px solid #1A2D52",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{height:44,flexShrink:0,display:"flex",alignItems:"center",padding:"0 16px",gap:10,borderBottom:"1px solid #1A2D52"}}>
            <div style={{display:"flex",gap:5,flexShrink:0}}>
              {["#FF5F57","#FFBD2E","#28C840"].map(c=>(
                <div key={c} style={{width:10,height:10,borderRadius:"50%",background:c}}/>
              ))}
            </div>
            <span style={{flex:1,textAlign:"center",fontSize:11,color:"#4C6397",fontFamily:"Inter,sans-serif"}}>solution.py — Friday AI IDE</span>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <span style={{fontSize:10,color:"#38BDF8",background:"rgba(56,189,248,0.08)",padding:"2px 7px",borderRadius:4,fontFamily:"Inter,sans-serif"}}>Python 3.11</span>
              <span style={{fontSize:10,color:"#10B981",background:"rgba(16,185,129,0.08)",padding:"2px 7px",borderRadius:4,fontFamily:"Inter,sans-serif"}}>● Run</span>
            </div>
          </div>

          <div style={{padding:"14px 0",flexShrink:0,fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:12.5,lineHeight:1.85}}>
            {codeLines.map((line,i)=>(
              <div key={i} style={{display:"flex",alignItems:"baseline",paddingLeft:16,paddingRight:16,whiteSpace:"pre"}}>
                <span style={{color:"#1A2D52",minWidth:18,textAlign:"right",fontSize:10.5,userSelect:"none",flexShrink:0,marginRight:14,fontFamily:"'JetBrains Mono',monospace"}}>{i+1}</span>
                <span style={{whiteSpace:"pre"}}>{line}</span>
              </div>
            ))}
            <div style={{paddingLeft:48,paddingTop:4,whiteSpace:"pre",color:"#4C6397",fontSize:11.5,fontFamily:"'JetBrains Mono',monospace"}}>{"# O(n) time · O(n) space"}</div>
          </div>

          <div style={{height:1,background:"#1A2D52",flexShrink:0}}/>

          <div style={{flex:1,minHeight:0,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"10px 16px",flexShrink:0,display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid #1A2D52"}}>
              <span style={{fontSize:13,fontWeight:600,color:"#818CF8",fontFamily:"'Space Grotesk',sans-serif"}}>✦ AI Chat</span>
              <span style={{fontSize:9.5,fontWeight:600,color:"#818CF8",background:"rgba(99,102,241,0.15)",padding:"2px 7px",borderRadius:99,fontFamily:"Inter,sans-serif"}}>GPT-4o</span>
            </div>
            <div style={{flex:1,minHeight:0,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10,overflowY:"auto"}}>
              <div style={{maxWidth:"88%",background:"#111827",borderLeft:"2px solid #6366F1",borderRadius:"0 8px 8px 0",padding:"9px 12px"}}>
                <div style={{fontSize:10,color:"#4C6397",marginBottom:3,fontFamily:"Inter,sans-serif"}}>Friday AI</div>
                <div style={{fontSize:12,color:"#CBD5E1",lineHeight:1.6,fontFamily:"Inter,sans-serif"}}>Your solution is correct! Time complexity is O(n). Want me to walk through the edge cases?</div>
              </div>
              <div style={{maxWidth:"80%",alignSelf:"flex-end",background:"rgba(99,102,241,0.10)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:"8px 8px 0 8px",padding:"9px 12px"}}>
                <div style={{fontSize:12,color:"#C7D2FE",lineHeight:1.6,fontFamily:"Inter,sans-serif"}}>Yes — what about empty arrays?</div>
              </div>
              <div style={{background:"#111827",borderLeft:"2px solid #6366F1",borderRadius:"0 8px 8px 0",display:"inline-flex",alignSelf:"flex-start"}}>
                <TypingDots/>
              </div>
            </div>
            <div style={{margin:"0 16px 14px",flexShrink:0,background:"#060A12",border:"1px solid #1A2D52",borderRadius:8,display:"flex",alignItems:"center",padding:"0 12px",height:40}}>
              <span style={{flex:1,fontSize:12,color:"#4C6397",fontFamily:"Inter,sans-serif"}}>Ask AI anything...</span>
              <div style={{width:28,height:28,background:"#6366F1",borderRadius:6,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <line x1="22" y1="2" x2="11" y2="13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: STATS */}
        <div style={{flex:1,minWidth:0,background:"#060A12",display:"flex",flexDirection:"column",padding:"18px 22px 18px 14px",gap:13,overflowY:"auto"}}>
          <div style={{background:"#0C1628",border:"1px solid #1A2D52",borderRadius:14,padding:"15px 18px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
            <div style={{position:"relative",flexShrink:0}}>
              <DonutRing/>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:24,fontWeight:700,color:"#F1F5F9",fontFamily:"'Space Grotesk',sans-serif",lineHeight:1}}>91</span>
                <span style={{fontSize:9.5,color:"#4C6397",fontFamily:"Inter,sans-serif",marginTop:2}}>Score</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:12,color:"#10B981",fontWeight:500,fontFamily:"Inter,sans-serif"}}>↑ 4 pts this week</div>
              <div style={{fontSize:10.5,color:"#818CF8",background:"rgba(99,102,241,0.1)",padding:"3px 8px",borderRadius:99,width:"fit-content",fontFamily:"Inter,sans-serif"}}>Top 12% of users</div>
              <div style={{fontSize:10.5,color:"#4C6397",fontFamily:"Inter,sans-serif"}}>Interview in 4 days</div>
            </div>
          </div>

          <div style={{background:"#0C1628",border:"1px solid #1A2D52",borderRadius:14,padding:"13px 15px",flexShrink:0}}>
            <div style={{fontSize:9.5,fontWeight:700,color:"#4C6397",letterSpacing:"0.1em",marginBottom:10,fontFamily:"Inter,sans-serif"}}>CONSISTENCY</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {GRID_CELLS.map((level,i)=>(
                <div key={i} style={{aspectRatio:"1",background:GRID_COLORS[level],borderRadius:3}}/>
              ))}
            </div>
            <div style={{fontSize:10.5,color:"#4C6397",marginTop:8,fontFamily:"Inter,sans-serif"}}>32-day streak 🔥</div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,flexShrink:0}}>
            {[
              {num:"148",label:"Problems",   delta:"+12 this week", dc:"#10B981"},
              {num:"11", label:"Interviews", delta:"74% acceptance",dc:"#818CF8"},
              {num:"63h",label:"Studied",    delta:"↑ from 48h",   dc:"#38BDF8"},
              {num:"6/12",label:"Roadmap",   delta:"System Design", dc:"#A78BFA"},
            ].map(({num,label,delta,dc})=>(
              <div key={label} style={{background:"#0C1628",border:"1px solid #1A2D52",borderRadius:10,padding:"11px 13px"}}>
                <div style={{fontSize:18,fontWeight:700,color:"#F1F5F9",fontFamily:"'Space Grotesk',sans-serif",lineHeight:1}}>{num}</div>
                <div style={{fontSize:9.5,color:"#4C6397",marginTop:3,fontFamily:"Inter,sans-serif"}}>{label}</div>
                <div style={{fontSize:9.5,color:dc,marginTop:5,fontFamily:"Inter,sans-serif"}}>{delta}</div>
              </div>
            ))}
          </div>

          <div style={{background:"#0C1628",border:"1px solid rgba(244,63,94,0.28)",borderLeft:"3px solid #F43F5E",borderRadius:14,padding:"13px 15px",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:700,color:"#F1F5F9",fontFamily:"'Space Grotesk',sans-serif"}}>Mock Interview</span>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#F43F5E",animation:"livePulse 1s ease-in-out infinite"}}/>
                <span style={{fontSize:9.5,fontWeight:700,color:"#F43F5E",letterSpacing:"0.05em",fontFamily:"Inter,sans-serif"}}>LIVE</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
              <div style={{background:"#0F1B32",borderLeft:"2px solid #1A2D52",borderRadius:"0 6px 6px 0",padding:"7px 10px"}}>
                <div style={{fontSize:9.5,color:"#4C6397",marginBottom:3,fontFamily:"Inter,sans-serif"}}>Interviewer</div>
                <div style={{fontSize:11,color:"#CBD5E1",lineHeight:1.5,fontFamily:"Inter,sans-serif"}}>Design a URL shortener like bit.ly. Walk me through your approach.</div>
              </div>
              <div style={{background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.15)",borderRadius:"6px 6px 0 6px",padding:"7px 10px",alignSelf:"flex-end",maxWidth:"90%"}}>
                <div style={{fontSize:11,color:"#C7D2FE",lineHeight:1.5,fontFamily:"Inter,sans-serif"}}>I'd start with a hash map for O(1) lookups...</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <span style={{fontSize:9.5,color:"#818CF8",background:"rgba(99,102,241,0.1)",padding:"2px 7px",borderRadius:99,fontFamily:"Inter,sans-serif"}}>System Design</span>
              <span style={{fontSize:9.5,color:"#4C6397",fontFamily:"'Space Grotesk',sans-serif"}}>08:42</span>
              <span style={{fontSize:9.5,color:"#10B981",fontFamily:"Inter,sans-serif"}}>✓ On track</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STRIP */}
      <div style={{height:48,flexShrink:0,zIndex:1,background:"#0C1628",borderTop:"1px solid #1A2D52",display:"flex",alignItems:"center",overflow:"hidden"}}>
        <div style={{display:"flex",animation:"scrollLeft 24s linear infinite",whiteSpace:"nowrap"}}>
          {[...PILLS,...PILLS].map((label,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",flexShrink:0}}>
              <span style={{fontSize:11.5,color:"#4C6397",padding:"0 28px",fontFamily:"Inter,sans-serif"}}>
                <span style={{color:"#6366F1",marginRight:6}}>✦</span>{label}
              </span>
              <div style={{width:1,height:14,background:"#1A2D52",flexShrink:0}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main LoginPage ─────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();

  // step: "form" | "otp" | "forgot" | "reset_otp" | "new_password"
  const [mode,        setMode]        = useState("login");
  const [step,        setStep]        = useState("form");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [firstName,   setFirstName]   = useState("");
  const [otp,         setOtp]         = useState("");
  const [userId,      setUserId]      = useState(null);
  const [resetToken,  setResetToken]  = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [successMsg,  setSuccessMsg]  = useState(null);

  // ── input focus helpers ──────────────────────────────────────────────────────
  const onFocus = (e) => { e.target.style.borderColor = "#1a1a1a"; };
  const onBlur  = (e) => { e.target.style.borderColor = "#e0ddd8"; };
  const onKey   = (fn) => (e) => { if (e.key === "Enter") fn(); };

  // ── reset to clean state ─────────────────────────────────────────────────────
  const switchMode = (m) => {
    setMode(m); setError(null); setSuccessMsg(null); setStep("form");
    setEmail(""); setPassword(""); setFirstName(""); setOtp("");
    setUserId(null); setResetToken(null); setNewPassword(""); setConfirmPass("");
  };

  const goToForgot = () => {
    setStep("forgot"); setError(null); setSuccessMsg(null); setOtp("");
    setResetToken(null); setNewPassword(""); setConfirmPass("");
  };

  // ── login / signup ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null); setLoading(true);
    try {
      if (mode === "login") {
        const res  = await fetch(`${API}/api/auth/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify({ identifier: email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 403 && data.user_id) { setUserId(data.user_id); setStep("otp"); setLoading(false); return; }
          throw new Error(data.message || "Login failed. Check your credentials.");
        }
        login(data.access_token, data.user);
      } else {
        const sr = await fetch(`${API}/api/auth/suggest-username`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ first_name: firstName }) });
        const { username } = await sr.json();
        const res  = await fetch(`${API}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ first_name: firstName, username, email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed.");
        setUserId(data.user_id); setStep("otp");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── verify OTP (signup / login 2FA) ─────────────────────────────────────────
  const handleOtp = async () => {
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ user_id: userId, otp_code: otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code.");
      login(data.access_token, data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── forgot password: send reset email ───────────────────────────────────────
  const handleForgotSend = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Couldn't send reset email.");
      // Move to OTP step regardless (don't reveal if account exists)
      setStep("reset_otp"); setSuccessMsg("A 6-digit code has been sent to your email.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── forgot password: verify reset OTP ───────────────────────────────────────
  const handleResetOtp = async () => {
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/verify-reset-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp_code: otp }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code.");
      setResetToken(data.reset_token); setStep("new_password"); setSuccessMsg(null); setOtp("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── forgot password: set new password ───────────────────────────────────────
  const handleNewPassword = async () => {
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPass) { setError("Passwords don't match."); return; }
    setError(null); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Couldn't reset password.");
      // Auto-login if server returns token, otherwise go back to login
      if (data.access_token) {
        login(data.access_token, data.user);
      } else {
        setSuccessMsg("Password updated! You can now sign in.");
        switchMode("login");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const isDisabled = loading || !email.trim() || !password.trim() || (mode === "signup" && !firstName.trim());

  // ── helper: small back link ──────────────────────────────────────────────────
  const BackLink = ({ onClick, label = "Go back" }) => (
    <div style={{ ...S.toggle, marginBottom: 0 }}>
      <span style={S.link} onClick={onClick}>← {label}</span>
    </div>
  );

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ══ LEFT: auth form ════════════════════════════════════════════════ */}
      <div style={{
        flex: "0 0 480px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 56px", background: "#faf9f7", overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontSize: 19, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.4px" }}>Friday AI</span>
        </div>

        {/* ── STEP: OTP (signup / 2FA login) ──────────────────────────────── */}
        {step === "otp" && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 400, color: "#1a1a1a", letterSpacing: "-0.6px", marginBottom: 8, fontFamily: "Georgia,'Times New Roman',serif" }}>Check your email</h1>
            <p style={{ fontSize: 14, color: "#6b6860", marginBottom: 6, lineHeight: 1.5 }}>Enter the 6-digit code sent to</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 18 }}>{email}</p>
            <input value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onFocus={onFocus} onBlur={onBlur} onKeyDown={onKey(handleOtp)}
              placeholder="000000" maxLength={6}
              style={{ ...S.input, fontSize: 22, letterSpacing: "0.3em", textAlign: "center", fontWeight: 600 }}/>
            {error && <div style={S.error}>{error}</div>}
            <button onClick={handleOtp} disabled={loading || otp.length < 4} style={S.primaryBtn(loading || otp.length < 4)}>
              {loading ? "Verifying…" : "Verify code"}
            </button>
            <BackLink onClick={() => { setStep("form"); setOtp(""); setError(null); }} label="Wrong email? Go back" />
          </>
        )}

        {/* ── STEP: FORGOT — enter email ───────────────────────────────────── */}
        {step === "forgot" && (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 400, color: "#1a1a1a", letterSpacing: "-0.7px", marginBottom: 8, fontFamily: "Georgia,'Times New Roman',serif" }}>Reset your password</h1>
            <p style={{ fontSize: 14, color: "#6b6860", marginBottom: 24, lineHeight: 1.5 }}>
              Enter the email address linked to your account and we'll send a verification code.
            </p>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
              onKeyDown={onKey(handleForgotSend)}
              type="email" placeholder="Enter your email"
              style={S.input}
            />
            {error   && <div style={S.error}>{error}</div>}
            {successMsg && <div style={S.success}>{successMsg}</div>}
            <button
              onClick={handleForgotSend}
              disabled={loading || !email.trim()}
              style={S.primaryBtn(loading || !email.trim())}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#333"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1a1a1a"; }}
            >
              {loading ? "Sending…" : "Send reset code"}
            </button>
            <BackLink onClick={() => { setStep("form"); setError(null); setSuccessMsg(null); }} label="Back to sign in" />
          </>
        )}

        {/* ── STEP: RESET OTP — enter code ────────────────────────────────── */}
        {step === "reset_otp" && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 400, color: "#1a1a1a", letterSpacing: "-0.6px", marginBottom: 8, fontFamily: "Georgia,'Times New Roman',serif" }}>Enter the code</h1>
            <p style={{ fontSize: 14, color: "#6b6860", marginBottom: 6, lineHeight: 1.5 }}>We sent a 6-digit code to</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 18 }}>{email}</p>
            {successMsg && <div style={S.success}>{successMsg}</div>}
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onFocus={onFocus} onBlur={onBlur}
              onKeyDown={onKey(handleResetOtp)}
              placeholder="000000" maxLength={6}
              style={{ ...S.input, fontSize: 22, letterSpacing: "0.3em", textAlign: "center", fontWeight: 600 }}
            />
            {error && <div style={S.error}>{error}</div>}
            <button
              onClick={handleResetOtp}
              disabled={loading || otp.length < 4}
              style={S.primaryBtn(loading || otp.length < 4)}
            >
              {loading ? "Verifying…" : "Verify code"}
            </button>
            <div style={{ ...S.toggle, marginBottom: 12 }}>
              Didn't receive it?{" "}
              <span style={S.link} onClick={handleForgotSend}>Resend code</span>
            </div>
            <BackLink onClick={() => { setStep("forgot"); setOtp(""); setError(null); setSuccessMsg(null); }} label="Change email" />
          </>
        )}

        {/* ── STEP: NEW PASSWORD ───────────────────────────────────────────── */}
        {step === "new_password" && (
          <>
            <h1 style={{ fontSize: 30, fontWeight: 400, color: "#1a1a1a", letterSpacing: "-0.7px", marginBottom: 8, fontFamily: "Georgia,'Times New Roman',serif" }}>Choose a new password</h1>
            <p style={{ fontSize: 14, color: "#6b6860", marginBottom: 24, lineHeight: 1.5 }}>
              Must be at least 8 characters.
            </p>
            <input
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
              type="password" placeholder="New password"
              style={S.input}
            />
            <input
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
              onKeyDown={onKey(handleNewPassword)}
              type="password" placeholder="Confirm new password"
              style={{ ...S.input, marginBottom: 10 }}
            />
            {error && <div style={S.error}>{error}</div>}
            <button
              onClick={handleNewPassword}
              disabled={loading || !newPassword || !confirmPass}
              style={S.primaryBtn(loading || !newPassword || !confirmPass)}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#333"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1a1a1a"; }}
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </>
        )}

        {/* ── STEP: FORM (login / signup) ──────────────────────────────────── */}
        {step === "form" && (
          <>
            <h1 style={{ fontSize: 38, fontWeight: 400, color: "#1a1a1a", lineHeight: 1.18, letterSpacing: "-0.8px", marginBottom: 8, fontFamily: "Georgia,'Times New Roman',serif" }}>
              {mode === "login" ? "Ready to Ace Your Interview?" : "Create your account"}
            </h1>
            <p style={{ fontSize: 14, color: "#6b6860", marginBottom: 36, lineHeight: 1.5 }}>
              Your AI Career OS — interviews, resumes, and more
            </p>

            {successMsg && <div style={S.success}>{successMsg}</div>}

            {mode === "signup" && (
              <input value={firstName} onChange={e => setFirstName(e.target.value)}
                onFocus={onFocus} onBlur={onBlur} onKeyDown={onKey(handleSubmit)}
                placeholder="Your first name" style={S.input}/>
            )}
            <input value={email} onChange={e => setEmail(e.target.value)}
              onFocus={onFocus} onBlur={onBlur} onKeyDown={onKey(handleSubmit)}
              type="email" placeholder="Enter your email" style={S.input}/>
            <input value={password} onChange={e => setPassword(e.target.value)}
              onFocus={onFocus} onBlur={onBlur} onKeyDown={onKey(handleSubmit)}
              type="password" placeholder={mode === "signup" ? "Create a password" : "Password"}
              style={{ ...S.input, marginBottom: 6 }}/>

            {/* ── Forgot password link (login only) ── */}
            {mode === "login" && (
              <div style={{ textAlign: "right", marginBottom: 14 }}>
                <span
                  style={{ fontSize: 13, color: "#6b6860", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                  onClick={goToForgot}
                >
                  Forgot password?
                </span>
              </div>
            )}

            {error && <div style={S.error}>{error}</div>}

            <button onClick={handleSubmit} disabled={isDisabled} style={S.primaryBtn(isDisabled)}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#333"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#1a1a1a"; }}>
              {loading
                ? (mode === "login" ? "Signing in…" : "Creating account…")
                : (mode === "login" ? "Continue with email" : "Create account")}
            </button>

            <div style={S.toggle}>
              {mode === "login"
                ? <> New to Friday AI?{" "}<span style={S.link} onClick={() => switchMode("signup")}>Sign up free</span></>
                : <> Already have an account?{" "}<span style={S.link} onClick={() => switchMode("login")}>Sign in</span></>}
            </div>
          </>
        )}

        {/* Desktop app button (always visible) */}
        <button
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 28,
            padding: "11px 20px", background: "transparent", border: "1px solid #e0ddd8",
            borderRadius: 8, fontSize: 13, color: "#6b6860", cursor: "pointer", width: "100%",
            transition: "border-color 0.15s", fontFamily: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#b0ada8"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0ddd8"; }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6860" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
          </svg>
          Download desktop app
        </button>
      </div>

      {/* ══ RIGHT: dark product preview ════════════════════════════════════ */}
      <RightPanel/>
    </div>
  );
}