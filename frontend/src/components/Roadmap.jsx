import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Roadmap({ data = null }) {
  const [openWeek, setOpenWeek] = useState(0);
  const [checked, setChecked] = useState({});

  if (!data) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 220, color: "rgba(255,255,255,0.2)", fontSize: 14,
        flexDirection: "column", gap: 10,
      }}>
        <span style={{ fontSize: 36 }}>🗺️</span>
        <span>Generate a roadmap to see your plan here</span>
      </div>
    );
  }

  const weeks = Array.isArray(data.weeks) ? data.weeks : [];

  const toggleCheck = (weekIdx, taskIdx) => {
    const key = `${weekIdx}-${taskIdx}`;
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      {data.title && (
        <div style={{
          background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(0,188,212,0.10))",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 14, padding: "16px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ color: "#e3e3e3", fontWeight: 700, fontSize: 15 }}>{data.title}</div>
            {data.summary && (
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 4, maxWidth: 500 }}>{data.summary}</div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: "#00BCD4", fontWeight: 700, fontSize: 22 }}>{weeks.length}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>weeks</div>
          </div>
        </div>
      )}

      {/* Weekly Timeline */}
      {weeks.map((week, wi) => {
        const isOpen = openWeek === wi;
        const tasks = Array.isArray(week.tasks) ? week.tasks : [];
        const doneCount = tasks.filter((_, ti) => checked[`${wi}-${ti}`]).length;

        return (
          <motion.div
            key={wi}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: wi * 0.04 }}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${isOpen ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 13,
              overflow: "hidden",
            }}
          >
            {/* Week header */}
            <div
              onClick={() => setOpenWeek(isOpen ? -1 : wi)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", cursor: "pointer",
              }}
            >
              {/* Week badge */}
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: isOpen ? "linear-gradient(135deg,#6366f1,#00BCD4)" : "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, color: isOpen ? "#fff" : "rgba(255,255,255,0.4)",
              }}>
                W{wi + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#e3e3e3", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {week.theme || `Week ${wi + 1}`}
                </div>
                {week.milestone && (
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
                    🎯 {week.milestone}
                  </div>
                )}
              </div>

              {/* Progress pill */}
              <div style={{
                background: "rgba(255,255,255,0.06)", borderRadius: 99,
                padding: "3px 10px", fontSize: 11, color: "rgba(255,255,255,0.5)",
                flexShrink: 0,
              }}>
                {doneCount}/{tasks.length}
              </div>

              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16, flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                ▾
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: "rgba(255,255,255,0.05)", margin: "0 18px" }}>
              <motion.div
                animate={{ width: tasks.length ? `${(doneCount / tasks.length) * 100}%` : "0%" }}
                transition={{ duration: 0.4 }}
                style={{ height: "100%", background: "linear-gradient(90deg,#6366f1,#00BCD4)", borderRadius: 99 }}
              />
            </div>

            {/* Tasks */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {tasks.map((task, ti) => {
                      const done = !!checked[`${wi}-${ti}`];
                      return (
                        <motion.div
                          key={ti}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ti * 0.04 }}
                          onClick={() => toggleCheck(wi, ti)}
                          style={{
                            display: "flex", gap: 12, alignItems: "flex-start",
                            background: done ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                            border: `2px solid ${done ? "#4ade80" : "rgba(255,255,255,0.2)"}`,
                            background: done ? "#4ade80" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {done && <span style={{ color: "#000", fontSize: 11, fontWeight: 700 }}>✓</span>}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              color: done ? "rgba(255,255,255,0.35)" : "#e3e3e3",
                              fontSize: 13, fontWeight: 500,
                              textDecoration: done ? "line-through" : "none",
                            }}>
                              {typeof task === "string" ? task : task.title || task.task}
                            </div>
                            {task.duration && (
                              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 3 }}>
                                ⏱ {task.duration}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}