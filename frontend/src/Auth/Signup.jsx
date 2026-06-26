import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const API = "http://127.0.0.1:8000";

// ── Password strength ─────────────────────────────────────────────────────────
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[a-z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  return score;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
const strengthColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

// ── OTP Input ─────────────────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (index, val) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    onChange(next.join(""));
    if (clean && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 48, height: 56,
            textAlign: "center", fontSize: 22, fontWeight: 700,
            background: "#1e1f20", color: "#e3e3e3",
            border: d ? "2px solid #6366f1" : "2px solid #3a3b3c",
            borderRadius: 10, outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => e.currentTarget.style.borderColor = "#6366f1"}
          onBlur={e => e.currentTarget.style.borderColor = d ? "#6366f1" : "#3a3b3c"}
        />
      ))}
    </div>
  );
}

// ── Main SignUp component ─────────────────────────────────────────────────────
export default function SignUp({ onClose, onSwitchToLogin }) {
  const { login } = useAuth();
  const [step, setStep]       = useState(1);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // Pending auth — stored in React state, not window
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingUser,  setPendingUser]  = useState(null);

  // Form data
  const [firstName, setFirstName]   = useState("");
  const [lastName,  setLastName]    = useState("");
  const [username,  setUsername]    = useState("");
  const [email,     setEmail]       = useState("");
  const [password,  setPassword]    = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd,   setShowPwd]     = useState(false);
  const [otp,       setOtp]         = useState("");
  const [userId,    setUserId]      = useState("");
  const [countdown, setCountdown]   = useState(0);
  const [terms, setTerms] = useState({ tos: false, privacy: false, data: false, age: false });

  const [usernameStatus, setUsernameStatus] = useState("idle"); // "idle"|"checking"|"available"|"taken"
  const checkAbortRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Auto-suggest username when entering step 2 ────────────────────────────
  const hasSuggestedRef = useRef(false);
  useEffect(() => {
    if (step === 2 && !hasSuggestedRef.current && firstName) {
      hasSuggestedRef.current = true;
      setUsernameStatus("checking");
      fetch(`${API}/api/auth/suggest-username`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
      })
        .then(r => r.json())
        .then(d => {
          setUsername(d.username);
          setUsernameStatus("available");
        })
        .catch(() => setUsernameStatus("idle"));
    }
  }, [step]);

  // ── Real-time username availability check (debounced) ─────────────────────
  const checkUsername = useCallback((value) => {
    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    if (checkAbortRef.current) clearTimeout(checkAbortRef.current);
    setUsernameStatus("checking");
    checkAbortRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/api/auth/check-username?username=${encodeURIComponent(value)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(val);
    checkUsername(val);
  };

  const pwdStrength = getPasswordStrength(password);

  // ── Step handlers ─────────────────────────────────────────────────────────
  const handleStep1 = () => {
    if (!firstName || firstName.length < 2)
      return setError("First name must be at least 2 characters");
    if (!/^[A-Za-z\s]+$/.test(firstName))
      return setError("First name: letters only");
    if (lastName && !/^[A-Za-z\s]+$/.test(lastName))
      return setError("Last name: letters only");
    setError("");
    setStep(2);
  };

  const handleStep2 = () => {
    if (!username || username.length < 3)
      return setError("Username must be at least 3 characters");
    if (usernameStatus === "taken")
      return setError("That username is already taken — please choose another");
    if (usernameStatus === "checking")
      return setError("Still checking availability, please wait…");
    setError("");
    setStep(3);
  };

  const handleStep3 = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/api/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message);
      setStep(4);
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  const handleStep4 = () => {
    if (pwdStrength < 3)         return setError("Password is too weak");
    if (password !== confirmPwd) return setError("Passwords do not match");
    setError(""); setStep(5);
  };

  const handleRegister = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message);
      setUserId(data.user_id);
      setCountdown(60);
      setStep(6);
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) return setError("Enter all 6 digits");
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, otp_code: otp }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message);
      // ✅ Store in React state — not window
      setPendingToken(data.access_token);
      setPendingUser(data.user);
      setStep(7);
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    await fetch(`${API}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    setCountdown(60);
  };

  const handleFinish = () => {
    if (!Object.values(terms).every(Boolean))
      return setError("Please accept all terms to continue");
    // ✅ Use React state — not window
    login(pendingToken, pendingUser);
    onClose();
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", padding: "12px 14px",
    background: "#1e1f20", color: "#e3e3e3",
    border: "1px solid #3a3b3c", borderRadius: 10,
    fontSize: 15, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const btnStyle = (disabled = false) => ({
    width: "100%", padding: "12px",
    background: disabled ? "#2a2b2c" : "#6366f1",
    color: disabled ? "#666" : "#fff",
    border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.2s",
    fontFamily: "inherit",
  });

  // Username status indicator
  const usernameIndicator = () => {
    if (!username || username.length < 3) return null;
    const map = {
      checking:  { icon: "⏳", color: "#888",    text: "Checking…" },
      available: { icon: "✅", color: "#22c55e", text: `@${username} is available` },
      taken:     { icon: "❌", color: "#ef4444", text: `@${username} is taken` },
      idle:      null,
    };
    return map[usernameStatus] || null;
  };

  const indicator = usernameIndicator();
  const step2Disabled = !username || username.length < 3 ||
    usernameStatus === "taken" || usernameStatus === "checking";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#131314", borderRadius: 16, padding: "36px 32px",
        width: "100%", maxWidth: 420,
        border: "1px solid #2a2b2c", position: "relative",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14,
          background: "transparent", border: "none",
          color: "#666", fontSize: 20, cursor: "pointer",
        }}>✕</button>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, justifyContent: "center" }}>
          {[1,2,3,4,5,6,7].map(s => (
            <div key={s} style={{
              width: s === step ? 20 : 8, height: 8, borderRadius: 4,
              background: s <= step ? "#6366f1" : "#2a2b2c",
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Create your account</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Let's start with your name</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                placeholder="First name *"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Last name (optional)"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={inputStyle}
              />
            </div>
          </>
        )}

        {/* ── Step 2: Username ── */}
        {step === 2 && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Choose a username</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Your unique ID — used to keep your chats private
            </p>
            <div style={{ position: "relative" }}>
              <input
                placeholder="Username"
                value={username}
                onChange={handleUsernameChange}
                style={{ ...inputStyle, paddingRight: 40 }}
                autoComplete="off"
              />
              {username && username.length >= 3 && (
                <span style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)", fontSize: 16,
                }}>
                  {usernameStatus === "checking"  && "⏳"}
                  {usernameStatus === "available" && "✅"}
                  {usernameStatus === "taken"     && "❌"}
                </span>
              )}
            </div>
            {indicator && (
              <p style={{ color: indicator.color, fontSize: 13, marginTop: 6, marginBottom: 0 }}>
                {indicator.text}
              </p>
            )}
            <p style={{ color: "#555", fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              Only letters, numbers, and underscores. Min 3 characters.
            </p>
          </>
        )}

        {/* ── Step 3: Email ── */}
        {step === 3 && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Your email address</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>We'll send a verification code here</p>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        {/* ── Step 4: Password ── */}
        {step === 4 && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Create a password</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Minimum 8 characters with uppercase, number & symbol
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 48 }}
                />
                <button onClick={() => setShowPwd(v => !v)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", color: "#888",
                  cursor: "pointer", fontSize: 16,
                }}>
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
              {password && (
                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= pwdStrength ? strengthColors[pwdStrength] : "#2a2b2c",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <p style={{ color: strengthColors[pwdStrength], fontSize: 12, margin: 0 }}>
                    {strengthLabels[pwdStrength]}
                  </p>
                </div>
              )}
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: confirmPwd && confirmPwd !== password ? "#ef4444" : "#3a3b3c",
                }}
              />
            </div>
          </>
        )}

        {/* ── Step 5: Review ── */}
        {step === 5 && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Almost there!</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Review your details before we send the verification code
            </p>
            <div style={{
              background: "#1e1f20", borderRadius: 10, padding: 16,
              marginBottom: 24, display: "flex", flexDirection: "column", gap: 10,
            }}>
              {[
                ["Name",     `${firstName} ${lastName}`.trim()],
                ["Username", `@${username}`],
                ["Email",    email],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888", fontSize: 14 }}>{label}</span>
                  <span style={{ color: "#e3e3e3", fontSize: 14, fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Step 6: OTP ── */}
        {step === 6 && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Verify your email</h2>
            <p style={{ color: "#888", marginBottom: 8, fontSize: 14 }}>Enter the 6-digit code sent to</p>
            <p style={{ color: "#6366f1", marginBottom: 24, fontSize: 14, fontWeight: 600 }}>{email}</p>
            <OTPInput value={otp} onChange={setOtp} />
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={handleResendOTP}
                disabled={countdown > 0}
                style={{
                  background: "transparent", border: "none",
                  color: countdown > 0 ? "#666" : "#6366f1",
                  cursor: countdown > 0 ? "not-allowed" : "pointer",
                  fontSize: 14, fontFamily: "inherit",
                }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
              </button>
            </div>
          </>
        )}

        {/* ── Step 7: Terms ── */}
        {step === 7 && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Terms & Conditions</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Please review and accept to continue</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["tos",     "I agree to the Terms of Service"],
                ["privacy", "I agree to the Privacy Policy"],
                ["data",    "I agree to the Data Processing Policy"],
                ["age",     "I am at least 18 years old"],
              ].map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={terms[key]}
                    onChange={e => setTerms(prev => ({ ...prev, [key]: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: "#6366f1", cursor: "pointer" }}
                  />
                  <span style={{ color: "#bdc1c6", fontSize: 14 }}>{label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, marginTop: 12, marginBottom: 0 }}>{error}</p>
        )}

        {/* CTA Button */}
        <div style={{ marginTop: 24 }}>
          {step === 1 && <button style={btnStyle()} onClick={handleStep1}>Continue</button>}
          {step === 2 && <button style={btnStyle(step2Disabled)} onClick={handleStep2}>Continue</button>}
          {step === 3 && (
            <button style={btnStyle(loading)} onClick={handleStep3}>
              {loading ? "Checking…" : "Continue"}
            </button>
          )}
          {step === 4 && <button style={btnStyle()} onClick={handleStep4}>Continue</button>}
          {step === 5 && (
            <button style={btnStyle(loading)} onClick={handleRegister}>
              {loading ? "Sending code…" : "Send verification code"}
            </button>
          )}
          {step === 6 && (
            <button style={btnStyle(loading || otp.length < 6)} onClick={handleVerifyOTP}>
              {loading ? "Verifying…" : "Verify"}
            </button>
          )}
          {step === 7 && (
            <button
              style={btnStyle(!Object.values(terms).every(Boolean))}
              onClick={handleFinish}
            >
              Create Account
            </button>
          )}
        </div>

        {/* Back */}
        {step > 1 && step < 6 && (
          <button
            onClick={() => { setError(""); setStep(s => s - 1); }}
            style={{
              width: "100%", marginTop: 10, padding: "10px",
              background: "transparent", border: "1px solid #3a3b3c",
              color: "#888", borderRadius: 10, fontSize: 14,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Back
          </button>
        )}

        {/* Switch to login */}
        <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginTop: 16, marginBottom: 0 }}>
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} style={{
            background: "transparent", border: "none",
            color: "#6366f1", cursor: "pointer", fontSize: 14,
            fontFamily: "inherit", fontWeight: 600,
          }}>Sign in</button>
        </p>
      </div>
    </div>
  );
}