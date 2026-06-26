// FILE: src/store/authStore.js
// PROJECT: Friday AI
// PURPOSE: Global auth state. login() sets user, logout() clears everything.

import { create } from "zustand";

const API = "http://127.0.0.1:8000";

const useAuthStore = create((set) => ({
  user:          null,
  isLoading:     true,   // true until initial /me check resolves
  isInitialized: false,

  login: (user) => set({ user, isLoading: false, isInitialized: true }),

  logout: async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {}
    localStorage.removeItem("access_token");
    set({ user: null, isLoading: false, isInitialized: true });
  },

  initialize: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ user: null, isLoading: false, isInitialized: true });
      return;
    }
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Not authenticated");
      const user = await res.json();
      set({ user, isLoading: false, isInitialized: true });
    } catch (_) {
      localStorage.removeItem("access_token");
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },
}));

export default useAuthStore;