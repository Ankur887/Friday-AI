/**
 * useVoice.js
 * -----------
 * Thin unified voice API for interview components.
 * Combines useSpeechRecognition (mic input) + audioStore (TTS output).
 */
import { useCallback } from "react";
import { speakText, stopSpeaking } from "../store/audioStore";
import useAudioStore from "../store/audioStore";
import useSpeechRecognition from "./useSpeechRecognition";
import { usePrefs } from "../Auth/PrefsContext";

export default function useVoice({ lang = "en", onAutoSend } = {}) {
  const speakerEnabled = useAudioStore((s) => s.speakerEnabled);
  const { prefs }      = usePrefs();
  const activeLang     = lang || prefs?.language || "en";

  // ── Speech recognition (mic → text) ────────────────────────────────────────
  const {
    isSupported,
    isListening,
    transcript,
    silenceCountdown,
    error: micError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(activeLang, onAutoSend);

  // ── TTS (text → speech) ─────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!speakerEnabled) return;
    speakText(text, activeLang);
  }, [speakerEnabled, activeLang]);

  const stop = useCallback(() => {
    stopSpeaking();
    if (isListening) stopListening();
  }, [isListening, stopListening]);

  return {
    // mic
    isSupported,
    isListening,
    transcript,
    silenceCountdown,
    micError,
    startListening,
    stopListening,
    resetTranscript,
    // speaker
    speak,
    stop,
    speakerEnabled,
    activeLang,
  };
}
