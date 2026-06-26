import React, { useState } from "react";
import { useAuth } from "./AuthContext";

const API = "http://127.0.0.1:8000";

export default function SignIn({ onClose, onSwitchToSignUp }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(""); // email OR username
  const [password,   setPassword]   = useState("");
  const [showPwd,    setShowPwd]    = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  // Forgot / reset flow
  const [mode,   setMode]   = useState("login"); // "login" | "forgot" | "reset"
  const [otp,    setOtp]    = useState("");
  const [userId, setUserId] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

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
    transition: "background 0.2s", fontFamily: "inherit",
  });

  const handleLogin = async () => {
    if (!identifier || !password) return setError("All fields are required");
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Send as `identifier` — backend will resolve email or username
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (res.status === 403) {
        // Unverified email — redirect to OTP
        setUserId(data.user_id);
        setMode("verify");
        return;
      }
      if (!res.ok) return setError(data.message || "Invalid credentials");
      login(data.access_token, data.user);
      onClose();
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return setError("Enter your email address");
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setUserId(data.user_id || "");
      setMode("reset");
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  const handleReset = async () => {
    if (otp.length < 6 || !newPwd) return setError("Fill all fields");
    if (newPwd.length < 8)          return setError("Password must be at least 8 characters");
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, otp_code: otp, new_password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message);
      setMode("login");
      setError("");
      setOtp("");
      setNewPwd("");
    } catch { setError("Network error"); }
    finally   { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "#131314", borderRadius: 16, padding: "36px 32px",
        width: "100%", maxWidth: 400,
        border: "1px solid #2a2b2c", position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 14,
          background: "transparent", border: "none",
          color: "#666", fontSize: 20, cursor: "pointer",
        }}>✕</button>

        {/* ── Login ── */}
        {mode === "login" && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Welcome back</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>Sign in with your email or username</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                placeholder="Email or username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value.trim())}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                style={inputStyle}
                autoComplete="username"
              />
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  style={{ ...inputStyle, paddingRight: 48 }}
                  autoComplete="current-password"
                />
                <button onClick={() => setShowPwd(v => !v)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", color: "#888",
                  cursor: "pointer", fontSize: 16,
                }}>
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
              <button onClick={() => { setForgotEmail(identifier.includes("@") ? identifier : ""); setMode("forgot"); }} style={{
                background: "transparent", border: "none",
                color: "#6366f1", cursor: "pointer", fontSize: 13,
                textAlign: "right", fontFamily: "inherit", padding: 0,
              }}>
                Forgot password?
              </button>
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{error}</p>}

            <div style={{ marginTop: 20 }}>
              <button style={btnStyle(loading)} onClick={handleLogin}>
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </div>
            <p style={{ textAlign: "center", color: "#888", fontSize: 14, marginTop: 16, marginBottom: 0 }}>
              Don't have an account?{" "}
              <button onClick={onSwitchToSignUp} style={{
                background: "transparent", border: "none",
                color: "#6366f1", cursor: "pointer", fontSize: 14,
                fontFamily: "inherit", fontWeight: 600,
              }}>Sign up</button>
            </p>
          </>
        )}

        {/* ── Forgot Password ── */}
        {mode === "forgot" && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Reset password</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Enter your account email to receive a reset code
            </p>
            <input
              type="email"
              placeholder="Email address"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value.trim())}
              style={inputStyle}
            />
            {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{error}</p>}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <button style={btnStyle(loading)} onClick={handleForgot}>
                {loading ? "Sending…" : "Send reset code"}
              </button>
              <button onClick={() => { setError(""); setMode("login"); }} style={{
                ...btnStyle(),
                background: "transparent",
                border: "1px solid #3a3b3c",
                color: "#888",
              }}>
                Back to sign in
              </button>
            </div>
          </>
        )}

        {/* ── Reset with OTP ── */}
        {mode === "reset" && (
          <>
            <h2 style={{ color: "#e3e3e3", margin: "0 0 8px", fontSize: 22 }}>Create new password</h2>
            <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
              Enter the 6-digit code from your email and choose a new password
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                placeholder="6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={inputStyle}
                maxLength={6}
              />
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                style={inputStyle}
              />
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{error}</p>}
            <div style={{ marginTop: 20 }}>
              <button style={btnStyle(loading)} onClick={handleReset}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </div>

            {/* Success message after reset */}
            {mode === "login" && (
              <p style={{ color: "#22c55e", fontSize: 13, marginTop: 8, textAlign: "center" }}>
                Password reset! You can now sign in.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}