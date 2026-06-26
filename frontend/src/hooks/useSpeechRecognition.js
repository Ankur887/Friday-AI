// FILE: src/hooks/useSpeechRecognition.js
// PROJECT: Friday AI — Career OS
// PURPOSE: Web Speech API wrapper — continuous STT with silence detection,
//          live transcript, auto-submit on silence, and error recovery.
// UPDATED: 2026-06-25

import { useState, useRef, useCallback, useEffect } from "react";

const LANG_CODES = {
  en: "en-US",
  hi: "hi-IN",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  ja: "ja-JP",
  zh: "zh-CN",
  ko: "ko-KR",
  pt: "pt-BR",
  ru: "ru-RU",
  ar: "ar-SA",
  it: "it-IT",
};

function resolveLang(lang = "en") {
  return LANG_CODES[lang] || lang;
}

// ── Resolve the constructor ONCE at module load time (not inside the hook) ──
// This avoids a new reference on every render breaking useCallback deps.
const SpeechRecognitionCtor =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

/**
 * useSpeechRecognition
 *
 * @param {string}   lang          - Language key ("en", "hi", etc.)
 * @param {function} onFinalResult - Called with the final transcript string
 *                                   when the user stops speaking (3s silence).
 *
 * @returns {{
 *   isSupported:      boolean,
 *   isListening:      boolean,
 *   transcript:       string,
 *   silenceCountdown: number|null,
 *   error:            string|null,
 *   startListening:   () => void,
 *   stopListening:    () => void,
 *   resetTranscript:  () => void,
 * }}
 */
export default function useSpeechRecognition(lang = "en", onFinalResult) {
  const isSupported = Boolean(SpeechRecognitionCtor);

  const [isListening,      setIsListening]      = useState(false);
  const [transcript,       setTranscript]       = useState("");
  const [silenceCountdown, setSilenceCountdown] = useState(null);
  const [error,            setError]            = useState(null);

  // All mutable state lives in refs so callbacks never go stale
  const recognitionRef    = useRef(null);
  const finalBufferRef    = useRef("");
  const silenceTimerRef   = useRef(null);
  const countdownRef      = useRef(null);
  const countdownValRef   = useRef(null);
  const isListeningRef    = useRef(false);
  const onFinalRef        = useRef(onFinalResult);
  const manualStopRef     = useRef(false);
  const langRef           = useRef(lang);

  // Keep refs fresh on every render — no stale closures
  useEffect(() => { onFinalRef.current = onFinalResult; }, [onFinalResult]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // ── Clear silence timers ────────────────────────────────────────────────────
  const clearSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownRef.current);
    silenceTimerRef.current  = null;
    countdownRef.current     = null;
    countdownValRef.current  = null;
    setSilenceCountdown(null);
  }, []); // no deps — only touches refs and setters

  // ── 3-second silence → fire onFinalResult ──────────────────────────────────
  const startSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownRef.current);

    countdownValRef.current = 3;
    setSilenceCountdown(3);

    countdownRef.current = setInterval(() => {
      countdownValRef.current = (countdownValRef.current ?? 3) - 1;
      setSilenceCountdown(countdownValRef.current);
      if (countdownValRef.current <= 0) clearInterval(countdownRef.current);
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      clearTimeout(silenceTimerRef.current);
      clearInterval(countdownRef.current);
      setSilenceCountdown(null);

      const final = finalBufferRef.current.trim();
      if (final && onFinalRef.current) {
        onFinalRef.current(final);
        finalBufferRef.current = "";
        setTranscript("");
      }
    }, 3000);
  }, []); // no deps — only touches refs

  // ── Stop listening ──────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    manualStopRef.current  = true;
    isListeningRef.current = false;

    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownRef.current);
    setSilenceCountdown(null);
    setIsListening(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) { /* already stopped */ }
    }
  }, []); // no deps — only touches refs

  // ── Start listening ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError("Speech recognition is not supported in this browser. Use Chrome or Edge.");
      return;
    }
    if (isListeningRef.current) return; // already running

    setError(null);
    setTranscript("");
    finalBufferRef.current = "";
    manualStopRef.current  = false;

    // Always create a fresh instance
    let recognition;
    try {
      recognition = new SpeechRecognitionCtor();
    } catch (e) {
      setError(`Could not create recognition instance: ${e.message}`);
      return;
    }

    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = resolveLang(langRef.current);
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("[STT] Started, lang:", recognition.lang);
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      // Reset silence timer on every new result
      clearTimeout(silenceTimerRef.current);
      clearInterval(countdownRef.current);

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalBufferRef.current += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      const combined = (finalBufferRef.current + interim).trim();
      setTranscript(combined);

      // Start fresh silence countdown
      startSilenceTimer();
    };

    recognition.onspeechend = () => {
      console.log("[STT] Speech ended, starting silence timer");
      startSilenceTimer();
    };

    recognition.onerror = (event) => {
      console.log("[STT] Error:", event.error);

      // These are non-fatal — ignore
      if (event.error === "no-speech") return;
      if (event.error === "aborted")   return;

      if (event.error === "not-allowed") {
        setError("Microphone access denied. Allow microphone permission in your browser.");
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === "network") {
        setError("Network error during speech recognition. Check your connection.");
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === "audio-capture") {
        setError("No microphone found or mic is in use by another app.");
        isListeningRef.current = false;
        setIsListening(false);
      } else {
        // Non-fatal unknown error — log but don't stop
        console.warn("[STT] Non-fatal error:", event.error);
      }
    };

    recognition.onend = () => {
      console.log("[STT] onend — manualStop:", manualStopRef.current, "isListening:", isListeningRef.current);
      // Auto-restart unless manually stopped
      if (!manualStopRef.current && isListeningRef.current) {
        setTimeout(() => {
          if (!manualStopRef.current && isListeningRef.current) {
            try {
              recognition.start();
              console.log("[STT] Auto-restarted");
            } catch (e) {
              console.warn("[STT] Auto-restart failed:", e.message);
            }
          }
        }, 100); // tiny delay prevents "already started" errors
      } else {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      console.log("[STT] .start() called");
    } catch (err) {
      setError(`Could not start microphone: ${err.message}`);
      console.error("[STT] start() threw:", err);
    }
  }, [startSilenceTimer]); // only startSilenceTimer, which has no deps itself

  // ── Reset transcript ────────────────────────────────────────────────────────
  const resetTranscript = useCallback(() => {
    setTranscript("");
    finalBufferRef.current = "";
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownRef.current);
    setSilenceCountdown(null);
  }, []);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      clearTimeout(silenceTimerRef.current);
      clearInterval(countdownRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) { /* ignore */ }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    silenceCountdown,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}