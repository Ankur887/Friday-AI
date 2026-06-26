import { useRef, useState, useCallback, useEffect } from "react";

// Maps the app's internal language codes (matches Auth/PrefsContext.jsx
// `prefs.language`) to BCP-47 locale codes the Web Speech API expects.
export const SPEECH_LOCALES = {
  en: "en-US",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

function getRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * useSpeechRecognition
 *
 * Wraps the browser Web Speech API for one-shot (non-continuous) voice input.
 * `language` should be the app's internal code ("en" | "hi" | "es" | "fr" | "de"),
 * e.g. from usePrefs().prefs.language — NOT a raw BCP-47 string.
 *
 * Returns:
 *  - isSupported: boolean — false if the browser has no SpeechRecognition API
 *  - isListening: boolean
 *  - transcript: string — most recent recognized text (final result)
 *  - error: string | null — human-readable error message, if any
 *  - startListening(): begins listening
 *  - stopListening(): stops listening early
 *  - resetTranscript(): clears the transcript state
 */
export default function useSpeechRecognition(language = "en") {
  const RecognitionCtor = getRecognitionCtor();
  const isSupported = !!RecognitionCtor;

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  // Keep a ref to the latest language so a running recognition instance
  // (or one about to start) always uses the freshest setting without
  // needing to be torn down/rebuilt on every render.
  const langRef = useRef(language);
  useEffect(() => {
    langRef.current = language;
  }, [language]);

  const cleanupRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.onstart = null;
    }
    recognitionRef.current = null;
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    // If something is already running, stop it first to avoid overlapping sessions.
    if (recognitionRef.current) {
      stopListening();
      cleanupRecognition();
    }

    setError(null);
    setTranscript("");

    const recognition = new RecognitionCtor();
    recognition.lang = SPEECH_LOCALES[langRef.current] || SPEECH_LOCALES.en;
    recognition.continuous = false;       // single utterance per click, per spec
    recognition.interimResults = false;   // only final transcript
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const result = event.results?.[0]?.[0]?.transcript || "";
      setTranscript(result);
    };

    recognition.onerror = (event) => {
      const code = event?.error || "unknown";
      const messages = {
        "no-speech": "No speech detected. Try again.",
        "audio-capture": "No microphone found. Check your device.",
        "not-allowed": "Microphone permission denied. Enable it in browser settings.",
        "network": "Network error during speech recognition.",
      };
      setError(messages[code] || `Speech recognition error: ${code}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError("Couldn't start microphone. Please try again.");
      setIsListening(false);
    }
  }, [isSupported, RecognitionCtor, stopListening, cleanupRecognition]);

  const resetTranscript = useCallback(() => setTranscript(""), []);

  // Clean up any active recognition session on unmount.
  useEffect(() => {
    return () => {
      stopListening();
      cleanupRecognition();
    };
  }, [stopListening, cleanupRecognition]);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}