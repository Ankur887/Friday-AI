import React from "react";

/**
 * FloatingChatPanel
 * Wraps ONLY the message list + input bar.
 * Kept very transparent so the robot is clearly visible.
 * NO backdrop-filter blur on this component — that was killing the robot render quality.
 */
export default function FloatingChatPanel({ children, style = {} }) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 10,
        background: "rgba(6, 9, 26, 0.72)",
        // Only a tiny blur — just enough to separate from background
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        borderRadius: "18px",
        border: "1px solid rgba(80, 130, 220, 0.18)",
        boxShadow: "0 4px 32px rgba(0, 0, 30, 0.55)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}