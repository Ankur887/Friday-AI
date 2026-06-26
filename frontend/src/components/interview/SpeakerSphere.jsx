// FILE: src/components/interview/SpeakerSphere.jsx
// PROJECT: Friday AI — Career OS
// PURPOSE: Single centered 200px AI sphere with animated SVG waveform ring.
//          User sphere removed — user is represented by mic indicator only.
// LAST UPDATED: 2026-06-25

import styles from "./sphere.module.css";

/**
 * SpeakerSphere — single AI bubble, always centered
 *
 * @param {boolean} props.isSpeaking  - AI is outputting TTS audio
 * @param {boolean} props.isThinking  - AI is awaiting LLM response
 */
export default function SpeakerSphere({ isSpeaking, isThinking }) {
  // Ring dimensions — SVG is 260px container, sphere is 200px (r=100)
  const outerRadius = 120; // slightly outside the 100px sphere radius
  const innerRadius = 110;
  const outerCirc   = 2 * Math.PI * outerRadius; // ≈ 753.98
  const innerCirc   = 2 * Math.PI * innerRadius; // ≈ 691.15

  const ringColor      = "rgba(124,58,237,0.75)";
  const ringColorFaint = "rgba(79,70,229,0.28)";

  const sphereClass = [
    styles.sphereAI,
    isSpeaking ? styles.speaking : "",
    !isSpeaking && isThinking ? styles.thinking : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 24,
    }}>
      {/* ── Sphere + waveform ring ── */}
      <div style={{
        position: "relative",
        width: 260,
        height: 260,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* SVG waveform ring (rendered behind sphere) */}
        <svg
          viewBox="0 0 260 260"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          {/* Outer faint dash ring */}
          <circle
            cx="130" cy="130"
            r={outerRadius}
            fill="none"
            stroke={ringColorFaint}
            strokeWidth={isSpeaking ? 2.5 : 1}
            strokeDasharray={
              isSpeaking
                ? `${outerCirc * 0.14} ${outerCirc * 0.05}`
                : `${outerCirc}`
            }
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              opacity: isSpeaking ? 0.85 : isThinking ? 0.35 : 0.2,
              transition: "opacity 0.4s ease, stroke-width 0.3s ease",
              animation: isSpeaking
                ? "waveStrokeDash 1.15s ease-in-out infinite"
                : isThinking
                ? "waveStrokeDash 2.4s ease-in-out infinite"
                : "none",
              transformOrigin: "130px 130px",
            }}
          />
          {/* Inner bright dash ring */}
          <circle
            cx="130" cy="130"
            r={innerRadius}
            fill="none"
            stroke={ringColor}
            strokeWidth={isSpeaking ? 2 : 0.8}
            strokeDasharray={
              isSpeaking
                ? `${innerCirc * 0.08} ${innerCirc * 0.07}`
                : `${innerCirc}`
            }
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              opacity: isSpeaking ? 1 : isThinking ? 0.2 : 0.1,
              transition: "opacity 0.4s ease, stroke-width 0.3s ease",
              animation: isSpeaking
                ? "waveStrokeDash 0.85s ease-in-out infinite reverse"
                : "none",
              transformOrigin: "130px 130px",
            }}
          />
        </svg>

        {/* The 3D sphere */}
        <div className={sphereClass} />
      </div>

      {/* ── Label + status ── */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}>
        <span style={{
          fontFamily: "Outfit, Inter, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: "#818CF8",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          AI Interviewer
        </span>

        {/* Dynamic status pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px",
          borderRadius: 99,
          background: isSpeaking
            ? "rgba(129,140,248,0.15)"
            : isThinking
            ? "rgba(245,158,11,0.12)"
            : "rgba(255,255,255,0.05)",
          border: isSpeaking
            ? "1px solid rgba(129,140,248,0.3)"
            : isThinking
            ? "1px solid rgba(245,158,11,0.25)"
            : "1px solid rgba(255,255,255,0.08)",
          transition: "all 0.3s ease",
        }}>
          <div style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: isSpeaking
              ? "#818CF8"
              : isThinking
              ? "#F59E0B"
              : "rgba(255,255,255,0.2)",
            boxShadow: isSpeaking
              ? "0 0 8px #818CF8"
              : isThinking
              ? "0 0 8px #F59E0B"
              : "none",
            transition: "all 0.3s ease",
          }} />
          <span style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: isSpeaking
              ? "#A5B4FC"
              : isThinking
              ? "#FCD34D"
              : "rgba(255,255,255,0.25)",
            transition: "color 0.3s ease",
          }}>
            {isSpeaking ? "SPEAKING" : isThinking ? "THINKING" : "IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
}
