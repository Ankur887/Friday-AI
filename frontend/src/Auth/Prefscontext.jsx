import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "friday_prefs";

const defaults = {
  theme:         "dark",
  fontSize:      "medium",
  language:      "en",
  responseStyle: "balanced",
  codeTheme:     "oneDark",
  compactMode:   false,
  animations:    true,
  timestamps:    false,
};

const PrefsContext = createContext(null);

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });

  // Apply theme to document body
  useEffect(() => {
    document.body.style.background = prefs.theme === "light" ? "#ffffff" : "#131314";
    document.body.style.color      = prefs.theme === "light" ? "#1f1f1f"  : "#e3e3e3";
  }, [prefs.theme]);

  const savePrefs = (newPrefs) => {
    const merged = { ...prefs, ...newPrefs };
    setPrefs(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  // Derived values for easy consumption
  const fontSizeMap  = { small: 13, medium: 15, large: 18 };
  const chatFontSize = fontSizeMap[prefs.fontSize] ?? 15;

  const bgColor      = prefs.theme === "light" ? "#ffffff" : "#131314";
  const chatBg       = prefs.theme === "light" ? "#ffffff" : "#ffffff"; // chat area stays white
  const sidebarBg    = prefs.theme === "light" ? "#f3f4f6" : "#1e1f20";

  return (
    <PrefsContext.Provider value={{ prefs, savePrefs, chatFontSize, bgColor, chatBg, sidebarBg }}>
      {children}
    </PrefsContext.Provider>
  );
}

export const usePrefs = () => useContext(PrefsContext);