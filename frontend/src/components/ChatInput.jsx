import { useState, useRef, useCallback, useEffect } from "react";
import { usePrefs } from "../Auth/PrefsContext";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import useAudioStore from "../store/audioStore";

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    placeholder: "Ask the robot anything…",
    thinking: "Friday is thinking…",
    suggestions: ["What can you do?", "Tell me a futuristic fact", "How does AI work?"],
    listening: "Listening…",
    autoSending: (n) => `Auto-sending in ${n}s…`,
    enableVoice: "Enable Voice Responses",
    disableVoice: "Disable Voice Responses",
    cancel: "Cancel",
  },
  hi: {
    placeholder: "रोबोट से कुछ भी पूछें…",
    thinking: "Friday सोच रही है…",
    suggestions: ["तुम क्या कर सकते हो?", "एक भविष्यवादी तथ्य बताओ", "AI कैसे काम करता है?"],
    listening: "सुन रहा हूँ…",
    autoSending: (n) => `${n} सेकंड में भेजा जा रहा है…`,
    enableVoice: "आवाज़ में जवाब सक्षम करें",
    disableVoice: "आवाज़ में जवाब बंद करें",
    cancel: "रद्द करें",
  },
  es: {
    placeholder: "Pregunta al robot lo que quieras…",
    thinking: "Friday está pensando…",
    suggestions: ["¿Qué puedes hacer?", "Cuéntame un hecho futurista", "¿Cómo funciona la IA?"],
    listening: "Escuchando…",
    autoSending: (n) => `Enviando en ${n}s…`,
    enableVoice: "Activar respuestas de voz",
    disableVoice: "Desactivar respuestas de voz",
    cancel: "Cancelar",
  },
  fr: {
    placeholder: "Demandez n'importe quoi au robot…",
    thinking: "Friday réfléchit…",
    suggestions: ["Que peux-tu faire?", "Dis-moi un fait futuriste", "Comment fonctionne l'IA?"],
    listening: "Écoute…",
    autoSending: (n) => `Envoi dans ${n}s…`,
    enableVoice: "Activer les réponses vocales",
    disableVoice: "Désactiver les réponses vocales",
    cancel: "Annuler",
  },
  de: {
    placeholder: "Frag den Roboter alles…",
    thinking: "Friday denkt nach…",
    suggestions: ["Was kannst du tun?", "Sag mir eine futuristische Tatsache", "Wie funktioniert KI?"],
    listening: "Hört zu…",
    autoSending: (n) => `Senden in ${n}s…`,
    enableVoice: "Sprachantworten aktivieren",
    disableVoice: "Sprachantworten deaktivieren",
    cancel: "Abbrechen",
  },
};

export default function ChatInput({ onSend, isThinking }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const { chatFontSize, prefs } = usePrefs();

  const lang     = prefs?.language || "en";
  const t        = T[lang] || T.en;
  const fontSize = chatFontSize || 14;

  // ── Submit (defined early so the auto-stop callback below can use it) ───
  const submit = useCallback(
    (text) => {
      const trimmed = (text ?? value).trim();
      if (!trimmed || isThinking) return;
      onSend(trimmed);
      setValue("");
      inputRef.current?.focus();
    },
    [value, isThinking, onSend]
  );

  // Fires when the mic auto-stops after 5s of silence. Sends whatever was
  // transcribed directly — bypasses `value` state so there's no race with
  // the live-transcript effect below.
  const handleAutoStop = useCallback((finalTranscript) => {
    if (!finalTranscript.trim() || isThinking) return;
    onSend(finalTranscript.trim());
    setValue("");
    inputRef.current?.focus();
  }, [isThinking, onSend]);

  // ── Speech recognition (microphone input) ───────────────────────────────
  const {
    isSupported: micSupported,
    isListening,
    transcript,
    silenceCountdown,
    error: micError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(lang, handleAutoStop);

  // Mirror the live transcript into the input as the user speaks, so they
  // can see it forming and still edit it manually if they type while
  // listening is active.
  useEffect(() => {
    if (isListening) {
      setValue(transcript);
    }
  }, [transcript, isListening]);

  // Once listening stops (manually or via auto-send), clear the hook's
  // internal transcript so the next session starts fresh.
  useEffect(() => {
    if (!isListening) resetTranscript();
  }, [isListening, resetTranscript]);

  const handleMicClick = () => {
    if (isThinking) return;
    if (isListening) {
      stopListening();
    } else {
      setValue("");
      startListening();
    }
  };

  // ── Speaker toggle (TTS on/off) ──────────────────────────────────────────
  const speakerEnabled = useAudioStore((s) => s.speakerEnabled);
  const toggleSpeaker = useAudioStore((s) => s.toggleSpeaker);

  const getEnterToSend = () => {
    try {
      const s = JSON.parse(localStorage.getItem("friday_notifications") || "{}");
      return s.enter !== false;
    } catch { return true; }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && getEnterToSend()) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={{
      flexShrink: 0,
      padding: "10px 14px 14px",
      borderTop: "1px solid rgba(0,188,212,0.1)",
      background: "transparent",
    }}>
      {/* Suggestion chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {t.suggestions.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            disabled={isThinking}
            style={{
              background: "rgba(0,188,212,0.08)",
              border: "1px solid rgba(0,188,212,0.22)",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: Math.max(10, fontSize - 2),
              color: "#0097a7",
              fontFamily: "Outfit, sans-serif",
              cursor: isThinking ? "not-allowed" : "pointer",
              opacity: isThinking ? 0.5 : 1,
              transition: "background 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isThinking) {
                e.currentTarget.style.background = "rgba(0,188,212,0.16)";
                e.currentTarget.style.borderColor = "rgba(0,188,212,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,188,212,0.08)";
              e.currentTarget.style.borderColor = "rgba(0,188,212,0.22)";
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Mic error banner */}
      {micError && (
        <div style={{
          fontSize: Math.max(10, fontSize - 3), color: "#c0392b",
          marginBottom: 6, paddingLeft: 2, fontFamily: "Inter, sans-serif",
        }}>
          {micError}
        </div>
      )}

      {/* Listening / auto-send banner */}
      {isListening && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 8, padding: "6px 12px",
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", gap: 2, alignItems: "center", height: 14 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} style={{
                width: 2.5, borderRadius: 2, background: "#ef4444",
                display: "inline-block",
                animation: `voiceBar 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
              }} />
            ))}
          </div>
          <span style={{
            fontSize: Math.max(10, fontSize - 3), color: "#dc2626",
            fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: "0.04em",
          }}>
            {silenceCountdown !== null ? t.autoSending(silenceCountdown) : t.listening}
          </span>
          <button
            onClick={stopListening}
            style={{
              marginLeft: "auto", background: "none",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6,
              color: "#dc2626", fontSize: Math.max(10, fontSize - 3),
              fontFamily: "Outfit, sans-serif", fontWeight: 600,
              padding: "2px 8px", cursor: "pointer",
            }}
          >
            {t.cancel}
          </button>
        </div>
      )}

      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,0.7)",
        border: isListening ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(0,188,212,0.22)",
        borderRadius: 14, padding: "8px 12px",
        boxShadow: isListening ? "0 0 0 3px rgba(239,68,68,0.12)" : "0 2px 8px rgba(0,120,180,0.07)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={isListening ? t.listening : t.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          disabled={isThinking}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: fontSize, color: "#1a2a3a",
            fontFamily: "Inter, sans-serif", caretColor: "#00BCD4",
          }}
        />

        {/* Microphone button */}
        {micSupported && (
          <button
            onClick={handleMicClick}
            disabled={isThinking}
            title={isListening ? "Listening… (auto-sends after 5s silence)" : "Voice input"}
            style={{
              background: isListening ? "rgba(239,68,68,0.15)" : "rgba(0,188,212,0.08)",
              border: isListening ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(0,188,212,0.22)",
              borderRadius: 9,
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: isThinking ? "not-allowed" : "pointer",
              opacity: isThinking ? 0.4 : 1,
              transition: "background 0.15s, border-color 0.15s",
              flexShrink: 0, padding: 0,
              boxShadow: isListening ? "0 0 8px rgba(239,68,68,0.45)" : "none",
              animation: isListening ? "mic-pulse 1.4s ease-in-out infinite" : "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={isListening ? "#dc2626" : "#0097a7"} strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

        {/* Speaker toggle button */}
        <button
          onClick={toggleSpeaker}
          title={speakerEnabled ? t.disableVoice : t.enableVoice}
          style={{
            background: speakerEnabled ? "rgba(0,188,212,0.15)" : "rgba(0,188,212,0.08)",
            border: "1px solid rgba(0,188,212,0.22)", borderRadius: 9,
            width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "background 0.15s", flexShrink: 0, padding: 0,
          }}
        >
          {speakerEnabled ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#0097a7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#7a8a96" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>

        <button
          onClick={() => submit()}
          disabled={isThinking || !value.trim()}
          title="Send"
          style={{
            background: value.trim() && !isThinking ? "rgba(0,188,212,0.15)" : "transparent",
            border: "1px solid rgba(0,188,212,0.25)", borderRadius: 9,
            width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: isThinking || !value.trim() ? "not-allowed" : "pointer",
            opacity: isThinking || !value.trim() ? 0.4 : 1,
            transition: "background 0.15s, opacity 0.15s", flexShrink: 0, padding: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="#0097a7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <style>{`
        input::placeholder { color: rgba(0,100,130,0.4) !important; }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.45); }
          50% { box-shadow: 0 0 16px rgba(239,68,68,0.75); }
        }
        @keyframes voiceBar {
          from { height: 4px; }
          to   { height: 14px; }
        }
      `}</style>

      {isThinking && (
        <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6, paddingLeft: 2 }}>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </div>
          <span style={{ fontSize: Math.max(10, fontSize - 3), color: "#0097a7", fontFamily: "Outfit, sans-serif", letterSpacing: "0.08em" }}>
            {t.thinking}
          </span>
        </div>
      )}
    </div>
  );
}