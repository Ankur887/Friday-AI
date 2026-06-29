// FILE: src/store/audioStore.js
// PROJECT: Friday AI — Career OS
// PURPOSE: Zustand store for TTS (speaker) and mic state.
//
// FIXES (2026-06-25):
//   FIX-A: loadSpeakerEnabled() is now actually used to initialize the store
//          (previously the store hardcoded `true` and ignored the function).
//   FIX-B: speakText() defers speech until a user gesture has occurred.
//          Browsers block SpeechSynthesis on page load with no prior interaction.
//          We queue the first call and flush it on the next user gesture (click/key).
//   FIX-C: stopSpeaking() also clears the pending queue so a queued message
//          from startSession doesn't play after the user already started talking.

import { create } from "zustand";

// ─────────────────────────────────────────────────────────────────────────────
// Language code map
// ─────────────────────────────────────────────────────────────────────────────
const LANG_CODES = {
  en: "en-US", hi: "hi-IN", fr: "fr-FR", es: "es-ES", de: "de-DE",
  ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", pt: "pt-BR", ru: "ru-RU",
  ar: "ar-SA", it: "it-IT",
};

function resolveLangCode(lang = "en") {
  return LANG_CODES[lang] || lang;
}

// ─────────────────────────────────────────────────────────────────────────────
// Female voice preference list
// ─────────────────────────────────────────────────────────────────────────────
const FEMALE_VOICE_NAMES = [
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Google UK English Female",
  "Samantha", "Karen", "Victoria", "Veena",
  "Microsoft Zira Desktop - English (United States)",
  "Microsoft Heera Desktop - Hindi (India)",
  "Microsoft Priya Desktop - Hindi (India)",
  "Female", "Woman", "Girl",
];

const FEMALE_KEYWORDS = [
  "female", "woman", "girl", "zira", "samantha", "karen", "victoria",
  "veena", "aria", "jenny", "heera", "priya", "google uk english female", "cortana",
];

const voiceCache = new Map();

function selectVoice(langCode) {
  if (!("speechSynthesis" in window)) return null;
  const cached = voiceCache.get(langCode);
  if (cached) return cached;

  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const lang2 = langCode.split("-")[0].toLowerCase();

  for (const name of FEMALE_VOICE_NAMES) {
    const v = voices.find((v) => v.name === name);
    if (v) { voiceCache.set(langCode, v); return v; }
  }

  const femaleForLang = voices.find((v) => {
    const n = v.name.toLowerCase();
    const langMatch =
      v.lang.toLowerCase() === langCode.toLowerCase() ||
      v.lang.toLowerCase().startsWith(lang2);
    return langMatch && FEMALE_KEYWORDS.some((k) => n.includes(k));
  });
  if (femaleForLang) { voiceCache.set(langCode, femaleForLang); return femaleForLang; }

  const femaleAny = voices.find((v) =>
    FEMALE_KEYWORDS.some((k) => v.name.toLowerCase().includes(k))
  );
  if (femaleAny) { voiceCache.set(langCode, femaleAny); return femaleAny; }

  const langMatch = voices.find((v) =>
    v.lang.toLowerCase() === langCode.toLowerCase() ||
    v.lang.toLowerCase().startsWith(lang2)
  );
  if (langMatch) { voiceCache.set(langCode, langMatch); return langMatch; }

  return voices[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown cleaner
// ─────────────────────────────────────────────────────────────────────────────
function cleanForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, "code block")
    .replace(/`[^`]+`/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[-*]\s/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage persistence
// ─────────────────────────────────────────────────────────────────────────────
const SPEAKER_KEY = "speakerEnabled";

function loadSpeakerEnabled() {
  try {
    const stored = localStorage.getItem(SPEAKER_KEY);
    if (stored === null) return true; // default ON for new users
    return stored === "true";
  } catch {
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX-B: User-gesture gate
//
// Browsers (Chrome, Safari) block speechSynthesis.speak() unless at least one
// user gesture (click, keydown, touchstart) has happened in the page session.
// startSession fires on mount via useEffect — no gesture yet.
//
// Solution: track whether a gesture has occurred. If speak() is called before
// any gesture, queue the call and flush it on the first gesture event.
// ─────────────────────────────────────────────────────────────────────────────
let _gestureOccurred = false;
let _pendingSpeech   = null; // { text, lang } — only keep the latest

function _flushPendingSpeech() {
  if (_pendingSpeech) {
    const { text, lang } = _pendingSpeech;
    _pendingSpeech = null;
    _doSpeak(text, lang);
  }
}

function _registerGestureListeners() {
  if (typeof window === "undefined") return;
  const handler = () => {
    if (_gestureOccurred) return;
    _gestureOccurred = true;
    // Remove listeners — only need to fire once
    window.removeEventListener("click",      handler, true);
    window.removeEventListener("keydown",    handler, true);
    window.removeEventListener("touchstart", handler, true);
    _flushPendingSpeech();
  };
  window.addEventListener("click",      handler, true);
  window.addEventListener("keydown",    handler, true);
  window.addEventListener("touchstart", handler, true);
}

if (typeof window !== "undefined") _registerGestureListeners();

// ─────────────────────────────────────────────────────────────────────────────
// Module-level utterance tracking
// ─────────────────────────────────────────────────────────────────────────────
let _currentUtterance = null;

// ─────────────────────────────────────────────────────────────────────────────
// Internal speak implementation (always runs after gesture gate is cleared)
// ─────────────────────────────────────────────────────────────────────────────
function _doSpeak(text, lang) {
  if (!("speechSynthesis" in window)) return;

  const clean = cleanForSpeech(text || "");
  if (!clean) return;

  const langCode  = resolveLangCode(lang);

  window.speechSynthesis.cancel();
  _currentUtterance = null;

  const utterance     = new SpeechSynthesisUtterance(clean);
  utterance.lang      = langCode;
  utterance.rate      = 0.95;
  utterance.pitch     = 1.05;
  utterance.volume    = 1.0;

  utterance.onend   = () => { _currentUtterance = null; };
  utterance.onerror = (e) => {
    if (e.error !== "interrupted") console.warn("[audioStore] Speech error:", e.error);
    _currentUtterance = null;
  };

  const doSpeak = () => {
    const voice = selectVoice(langCode);
    if (voice) utterance.voice = voice;
    _currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    const prevHandler = window.speechSynthesis.onvoiceschanged;
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = prevHandler ?? null;
      voiceCache.clear();
      doSpeak();
    };
  } else {
    doSpeak();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Stop any ongoing or queued speech immediately. */
export function stopSpeaking() {
  // FIX-C: clear the pending queue too so a queued first-message doesn't
  // play after the user has already started talking
  _pendingSpeech = null;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  _currentUtterance = null;
}

/**
 * Speak text.
 * FIX-B: if no user gesture yet, queues the call; flushes on first click/key.
 * Subsequent AI turns (after user clicked SPEAK) always have a gesture, so
 * they speak immediately.
 */
export function speakText(text, lang = "en") {
  if (!("speechSynthesis" in window)) return;
  const clean = cleanForSpeech(text || "");
  if (!clean) return;

  if (_gestureOccurred) {
    // Normal path — gesture already happened, speak right away
    _doSpeak(text, lang);
  } else {
    // Pre-gesture path — queue for flush on first interaction
    // Only keep the latest (if AI sends multiple before any gesture)
    _pendingSpeech = { text, lang };
    console.log("[audioStore] Speech queued (awaiting user gesture)");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Zustand store
// ─────────────────────────────────────────────────────────────────────────────

const useAudioStore = create((set, get) => ({
  // FIX-A: actually call loadSpeakerEnabled() — was hardcoded `true` before,
  // ignoring any previously stored preference
  speakerEnabled: loadSpeakerEnabled(),

  isSpeaking:  false,
  isListening: false,

  toggleSpeaker: () => {
    const next = !get().speakerEnabled;
    try { localStorage.setItem(SPEAKER_KEY, String(next)); } catch { /* ignore */ }
    if (!next) stopSpeaking();
    set({ speakerEnabled: next });
  },

  setListening: (val) => set({ isListening: Boolean(val) }),
  setSpeaking:  (val) => set({ isSpeaking:  Boolean(val) }),
}));

// Invalidate voice cache when browser loads new voices
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const _orig = window.speechSynthesis.onvoiceschanged;
  window.speechSynthesis.onvoiceschanged = (...args) => {
    voiceCache.clear();
    if (typeof _orig === "function") _orig(...args);
  };
}

export default useAudioStore;