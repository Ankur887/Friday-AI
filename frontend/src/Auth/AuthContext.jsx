// src/Auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API = "http://127.0.0.1:8000";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem("access_token") || null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (accessToken) => {
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return true;
      }
    } catch {}
    return false;
  }, []);

  // ── Moved ABOVE useEffect ─────────────────────────────────
  const tryRefresh = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem("access_token", data.access_token);
        setUser(data.user);
        return true;
      }
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    return false;
  }, []);

  useEffect(() => {
    const init = async () => {
      if (token) {
        const ok = await fetchMe(token);
        if (!ok) await tryRefresh();
      } else {
        await tryRefresh();
      }
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("access_token", accessToken);
  };

  const logout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchMe, tryRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);