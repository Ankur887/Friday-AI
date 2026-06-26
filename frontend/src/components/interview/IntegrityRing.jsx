// FILE: src/components/interview/IntegrityRing.jsx
// PROJECT: Friday AI — Career OS
// PURPOSE: SVG circular progress ring — 6-tier color system with status label
//          and floating +X.X gain popup animation
// LAST UPDATED: 2026-06-25

import { useEffect, useState, useRef } from "react";
import styles from "./sphere.module.css";

// ── Threshold helpers ─────────────────────────────────────────────────────────

function scoreToColor(s) {
  if (s >= 96) return "#FBBF24"; // gold — Outstanding
  if (s >= 81) return "#3B82F6"; // blue — Excellent
  if (s >= 61) return "#22C55E"; // green — Strong
  if (s >= 41) return "#F59E0B"; // amber — Progressing
  if (s >= 21) return "#F97316"; // orange — Building
  return "#EF4444";              // red — Starting
}

function scoreToLabel(s) {
  if (s >= 96) return "Outstanding";
  if (s >= 81) return "Excellent";
  if (s >= 61) return "Strong";
  if (s >= 41) return "Progressing";
  if (s >= 21) return "Building...";
  return "Starting...";
}

function scoreToGlow(s) {
  if (s >= 96) return "0 0 24px rgba(251,191,36,0.8), 0 0 48px rgba(251,191,36,0.35)";
  if (s >= 81) return "0 0 18px rgba(59,130,246,0.6)";
  if (s >= 61) return "0 0 16px rgba(34,197,94,0.5)";
  if (s >= 41) return "0 0 14px rgba(245,158,11,0.4)";
  if (s >= 21) return "0 0 12px rgba(249,115,22,0.4)";
  return "0 0 10px rgba(239,68,68,0.35)";
}

// ── Animated score counter hook ────────────────────────────────────────────────
function useCountUp(target, duration = 650) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const startTime = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(start + (target - start) * eased);
      setDisplay(val);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else prevRef.current = target;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return display;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * IntegrityRing
 * @param {number}      props.score         - Current score 0–100
 * @param {number|null} props.gainAnimation - Points just earned (triggers float)
 */
export default function IntegrityRing({ score, gainAnimation }) {
  const clamped     = Math.min(Math.max(score || 0, 0), 100);
  const color       = scoreToColor(clamped);
  const label       = scoreToLabel(clamped);
  const glow        = scoreToGlow(clamped);
  const displayScore = useCountUp(clamped);

  // SVG ring math
  const radius       = 44;
  const circumference = 2 * Math.PI * radius; // ≈ 276.5
  const dashOffset    = circumference - (clamped / 100) * circumference;

  // Float popups
  const [floats, setFloats] = useState([]);
  const floatId = useRef(0);

  useEffect(() => {
    if (!gainAnimation) return;
    const id = ++floatId.current;
    setFloats((p) => [...p, { id, value: gainAnimation }]);
    const t = setTimeout(
      () => setFloats((p) => p.filter((f) => f.id !== id)),
      1300
    );
    return () => clearTimeout(t);
  }, [gainAnimation]);

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>

      {/* Floating gain popups */}
      {floats.map((f) => (
        <div
          key={f.id}
          className={styles.gainFloat}
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            fontFamily: "Outfit, sans-serif",
            fontWeight: 900,
            fontSize: 13,
            color: color,
            textShadow: `0 0 12px ${color}cc`,
            whiteSpace: "nowrap",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          +{typeof f.value === "number" ? f.value.toFixed(1) : f.value}
        </div>
      ))}

      {/* SVG ring */}
      <svg width="116" height="116" viewBox="0 0 116 116" style={{ display: "block" }}>
        {/* Track */}
        <circle
          cx="58" cy="58" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="8"
        />
        {/* Progress arc */}
        <circle
          cx="58" cy="58" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 58 58)"
          style={{
            transition: "stroke-dashoffset 0.65s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease",
            filter: clamped >= 81 ? `drop-shadow(0 0 6px ${color})` : "none",
          }}
        />
        {/* Gold shimmer arc (outstanding tier) */}
        {clamped >= 96 && (
          <circle
            cx="58" cy="58" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 58 58)"
            style={{
              opacity: 0.35,
              filter: "blur(4px)",
              transition: "stroke-dashoffset 0.65s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        )}
      </svg>

      {/* Center text */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Outfit, sans-serif",
        textShadow: clamped >= 81 ? glow : "none",
        gap: 1,
      }}>
        {/* INTEGRITY */}
        <div style={{
          fontSize: 7,
          fontWeight: 900,
          color: color,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.75,
        }}>
          INTEGRITY
        </div>

        {/* Score number */}
        <div style={{
          fontSize: 20,
          fontWeight: 900,
          color: color,
          lineHeight: 1,
          letterSpacing: "-0.5px",
        }}>
          {displayScore}
        </div>

        {/* /100 */}
        <div style={{
          fontSize: 8,
          color: "rgba(255,255,255,0.3)",
          fontWeight: 600,
          lineHeight: 1,
        }}>
          / 100
        </div>

        {/* Status label */}
        <div style={{
          fontSize: 7,
          fontWeight: 800,
          color: color,
          letterSpacing: "0.06em",
          marginTop: 2,
          opacity: 0.85,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
