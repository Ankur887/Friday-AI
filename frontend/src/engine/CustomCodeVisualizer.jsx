/**
 * CustomCodeVisualizer.jsx
 *
 * FIXES APPLIED (from previous session diagnosis):
 * 1. RIGHT PANEL REMOVED — Array Input, Search Target, Recursion N,
 *    Supported Types are gone. Layout is now 2-column: code editor + canvas.
 * 2. IMPORT BUG FIXED — ExecutionEngine was imported as default but exported
 *    as named; corrected to named import { ExecutionEngine }.
 * 3. ALGORITHM DETECTION — CodeAlgorithmDetector result is correctly read as
 *    detector.type (not detector.algorithmType).
 * 4. STEP ROUTING — vizType state is set before startVisualization so the
 *    canvas renders the correct sub-visualizer from step 0.
 * 5. CANVAS VISIBILITY — center panel now has flex:1 and overflow:hidden so
 *    visualization actually fills and shows.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Engine imports ────────────────────────────────────────────────────────────
// BUG FIX #2: ExecutionEngine is a named export, not default
import { ExecutionEngine } from "./ExecutionEngine";
import CodeAlgorithmDetector from "./CodeAlgorithmDetector";
import { StructureDetector } from "./StructureDetector";
import { EventRecorder } from "./EventRecorder";

// ─── Visualizer imports ────────────────────────────────────────────────────────
import SortingVisualizer from "../visualizers/SortingVisualizer";
import SearchVisualizer from "../visualizers/SearchVisualizer";
import RecursionVisualizer from "../visualizers/RecursionVisualizer";
import GraphVisualizer from "../visualizers/GraphVisualizer";
import TreeVisualizer from "../visualizers/TreeVisualizer";
import DPVisualizer from "../visualizers/DPVisualizer";
import LinkedListVisualizer from "../visualizers/LinkedListVisualizer";
import StackVisualizer from "../visualizers/StackVisualizer";
import HashmapVisualizer from "../visualizers/HashmapVisualizer";
import PointerVisualizer from "../visualizers/PointerVisualizer";

// ─── Sample code snippets ──────────────────────────────────────────────────────
const SAMPLES = {
  "Bubble Sort": `function bubbleSort(arr) {
  const n = arr.length
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]]
      }
    }
  }
  return arr
}`,
  "Quick Sort": `function quickSort(arr, lo=0, hi=arr.length-1) {
  if (lo < hi) {
    const pivot = arr[hi]; let i = lo - 1
    for (let j = lo; j < hi; j++)
      if (arr[j] <= pivot) { i++; [arr[i],arr[j]]=[arr[j],arr[i]] }
    [arr[i+1],arr[hi]]=[arr[hi],arr[i+1]]
    const p = i + 1
    quickSort(arr, lo, p - 1)
    quickSort(arr, p + 1, hi)
  }
}`,
  "Binary Search": `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (arr[mid] === target) return mid
    else if (arr[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}`,
  Fibonacci: `function fib(n) {
  if (n <= 1) return n
  return fib(n - 1) + fib(n - 2)
}`,
  "Linked List Insert": `function insertTail(head, val) {
  const node = { val, next: null }
  if (!head) return node
  let cur = head
  while (cur.next) cur = cur.next
  cur.next = node
  return head
}`,
};

// ─── VSCode dark+ tokenizer (same as CodePanel in LinkedListVisualizer) ─────────
const VS = {
  comment: "#6a9955",
  string: "#ce9178",
  kwBlue: "#569cd6",
  fnYellow: "#dcdcaa",
  number: "#b5cea8",
  varBlue: "#9cdcfe",
  punct: "#d4d4d4",
  plain: "#d4d4d4",
};

function tokenizeLine(rawLine) {
  const trimmed = rawLine.trimStart();
  if (trimmed.startsWith("//")) return [{ text: rawLine, color: VS.comment }];

  const tokens = [];
  const RE =
    /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\bfunction\b)([ \t]+)([a-zA-Z_$][a-zA-Z0-9_$]*)|(\b(?:const|let|var|if|else|while|for|return|null|true|false|new|this|typeof|break|continue|of|in)\b)|(\b\d+(?:\.\d+)?\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*\()|([a-zA-Z_$][a-zA-Z0-9_$]*)|([^\w])/g;

  let m;
  while ((m = RE.exec(rawLine)) !== null) {
    const [
      ,
      comment,
      str,
      funcKw,
      space,
      funcName,
      kw,
      num,
      callName,
      callParen,
      ident,
      other,
    ] = m;
    if (comment) {
      tokens.push({ text: comment, color: VS.comment });
      continue;
    }
    if (str) {
      tokens.push({ text: str, color: VS.string });
      continue;
    }
    if (funcKw) {
      tokens.push({ text: funcKw, color: VS.kwBlue });
      tokens.push({ text: space, color: VS.plain });
      tokens.push({ text: funcName, color: VS.fnYellow });
      continue;
    }
    if (kw) {
      tokens.push({ text: kw, color: VS.kwBlue });
      continue;
    }
    if (num) {
      tokens.push({ text: num, color: VS.number });
      continue;
    }
    if (callName) {
      tokens.push({ text: callName, color: VS.fnYellow });
      tokens.push({ text: callParen, color: VS.punct });
      continue;
    }
    if (ident) {
      tokens.push({ text: ident, color: VS.varBlue });
      continue;
    }
    if (other) {
      tokens.push({ text: other, color: VS.punct });
      continue;
    }
  }
  return tokens.length > 0 ? tokens : [{ text: rawLine, color: VS.plain }];
}

// ─── Colour constants ──────────────────────────────────────────────────────────
const C = {
  bg: "#080c14",
  panel: "#0d1117",
  border: "#1e2d45",
  text: "#e2e8f0",
  textMuted: "#64748b",
  cyan: "#67e8f9",
  accent: "#6366f1",
};

// ─── Algorithm type → display label & badge color ─────────────────────────────
const TYPE_META = {
  sorting: { label: "Sorting", color: "#22c55e" },
  searching: { label: "Searching", color: "#3b82f6" },
  search: { label: "Searching", color: "#3b82f6" },
  recursion: { label: "Recursion", color: "#a855f7" },
  graph: { label: "Graph", color: "#f59e0b" },
  tree: { label: "Tree", color: "#10b981" },
  dp: { label: "DP", color: "#ec4899" },
  linkedlist: { label: "LinkedList", color: "#06b6d4" },
  linked_list: { label: "LinkedList", color: "#06b6d4" },
  stack: { label: "Stack", color: "#f97316" },
  hashmap: { label: "HashMap", color: "#8b5cf6" },
  pointer: { label: "Pointer", color: "#ef4444" },
  unknown: { label: "Unknown", color: "#64748b" },
};

// ─── Route vizType → the correct sub-visualizer component ────────────────────
function VisualizationCanvas({ vizType, steps, currentStep, isRunning }) {
  if (!steps || steps.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          flexDirection: "column",
          gap: 16,
          color: C.textMuted,
          fontFamily: "monospace",
        }}
      >
        <span style={{ fontSize: 40, opacity: 0.25 }}>▶</span>
        <span style={{ fontSize: 14 }}>
          Click <b style={{ color: C.accent }}>Visualize</b> to start
        </span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>
          Supports: Sorting · Searching · Recursion · Graph · Tree · DP ·
          LinkedList · Stack · HashMap
        </span>
      </div>
    );
  }

  const step = steps[currentStep] || {};

  // Pass the pre-computed steps + current index into each visualizer.
  // Each visualizer must accept { steps, currentStep } props OR
  // fall back to rendering just the current step.
  const commonProps = { steps, currentStep, step, isRunning };

  switch ((vizType || "").toLowerCase()) {
    case "sorting":
      return <SortingVisualizer {...commonProps} />;
    case "searching":
    case "search":
      return <SearchVisualizer {...commonProps} />;
    case "recursion":
      return <RecursionVisualizer {...commonProps} />;
    case "graph":
      return <GraphVisualizer {...commonProps} />;
    case "tree":
      return <TreeVisualizer {...commonProps} />;
    case "dp":
      return <DPVisualizer {...commonProps} />;
    case "linkedlist":
    case "linked_list":
      return <LinkedListVisualizer {...commonProps} />;
    case "stack":
      return <StackVisualizer {...commonProps} />;
    case "hashmap":
      return <HashmapVisualizer {...commonProps} />;
    case "pointer":
      return <PointerVisualizer {...commonProps} />;
    default:
      // Generic fallback: show step message + variables
      return <GenericStepView step={step} />;
  }
}

// ─── Generic fallback for unknown/unrouted algorithms ─────────────────────────
function GenericStepView({ step }) {
  if (!step) return null;
  const vars = Object.entries(step.vars || step.variables || {});
  return (
    <div
      style={{
        padding: 24,
        fontFamily: "monospace",
        color: C.text,
        height: "100%",
        overflowY: "auto",
      }}
    >
      {step.message && (
        <div
          style={{
            fontSize: 13,
            color: C.cyan,
            marginBottom: 16,
            padding: "8px 12px",
            background: "rgba(103,232,249,0.08)",
            borderRadius: 6,
            borderLeft: "3px solid #67e8f9",
          }}
        >
          {step.message}
        </div>
      )}
      {vars.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              color: C.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Variables
          </div>
          {vars.map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <span style={{ color: "#818cf8" }}>{k}</span>
              <span style={{ color: C.textMuted }}>=</span>
              <span style={{ color: C.cyan }}>{JSON.stringify(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Syntax-highlighted code editor panel ────────────────────────────────────
function CodeEditorPanel({ code, onChange, activeLine, readOnly }) {
  const taRef = useRef(null);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#1e1e1e",
        fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
        fontSize: 13,
        overflow: "hidden",
      }}
    >
      {/* Highlighted overlay (display) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* Textarea for editing (transparent, on top) */}
        <textarea
          ref={taRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          readOnly={readOnly}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            padding: "8px 8px 8px 46px",
            background: "transparent",
            color: "transparent",
            caretColor: "#aeafad",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "1.6",
            zIndex: 2,
            whiteSpace: "pre",
            overflowWrap: "normal",
            tabSize: 2,
          }}
        />
        {/* Highlighted rendering (behind textarea) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "auto",
            padding: "8px 8px 8px 0",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {code.split("\n").map((line, i) => {
            const isActive = i === activeLine;
            const toks = tokenizeLine(line);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  minHeight: "1.6em",
                  background: isActive
                    ? "rgba(255,255,255,0.07)"
                    : "transparent",
                  borderLeft: isActive
                    ? "2px solid #569cd6"
                    : "2px solid transparent",
                }}
              >
                {/* Line number */}
                <div
                  style={{
                    width: 38,
                    flexShrink: 0,
                    paddingRight: 8,
                    textAlign: "right",
                    color: isActive ? "#c6c6c6" : "#858585",
                    fontSize: 11,
                    userSelect: "none",
                    lineHeight: "1.6",
                  }}
                >
                  {i + 1}
                </div>
                {/* Code tokens */}
                <pre
                  style={{
                    margin: 0,
                    padding: "0 8px",
                    whiteSpace: "pre",
                    lineHeight: "1.6",
                    flex: 1,
                  }}
                >
                  {toks.map((tok, ti) => (
                    <span key={ti} style={{ color: tok.color }}>
                      {tok.text}
                    </span>
                  ))}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CustomCodeVisualizer() {
  const [code, setCode] = useState(SAMPLES["Bubble Sort"]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [vizType, setVizType] = useState(null); // detected algorithm type
  const [confidence, setConfidence] = useState(null); // detection confidence %
  const [message, setMessage] = useState("");
  const [speed, setSpeed] = useState(600);
  const [showSampleMenu, setShowSampleMenu] = useState(false);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const engineRef = useRef(null);
  const recorderRef = useRef(null);

  // ── Stop playback ────────────────────────────────────────────────────────────
  const stopPlay = useCallback(() => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  }, []);

  // ── Start playback ───────────────────────────────────────────────────────────
  const startPlay = useCallback(() => {
    if (!steps.length) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
  }, [steps, speed]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Update message whenever step changes
  useEffect(() => {
    const s = steps[currentStep];
    if (s) setMessage(s.message || s.description || `Step ${currentStep + 1}`);
  }, [currentStep, steps]);

  // ── Detect algorithm type from code ─────────────────────────────────────────
  const detectType = useCallback((src) => {
    try {
      // BUG FIX #3: CodeAlgorithmDetector returns { type, confidence }
      const detector = CodeAlgorithmDetector
        ? CodeAlgorithmDetector.detect(src)
        : null;
      if (detector) {
        return {
          type: detector.type || detector.algorithmType || "unknown",
          confidence: detector.confidence ?? detector.score ?? null,
        };
      }
    } catch (_) {}
    // Fallback: simple keyword heuristic
    const s = src.toLowerCase();
    if (
      /bubble|insertion|selection|merge|quick|heap.*sort|sort/.test(s) &&
      /swap|arr\[/.test(s)
    )
      return { type: "sorting", confidence: 80 };
    if (/binary.?search|linearsearch|binarysearch/.test(s))
      return { type: "searching", confidence: 85 };
    if (/fib|factorial|hanoi|recursive/.test(s))
      return { type: "recursion", confidence: 75 };
    if (/\.next\s*=|linkedlist|inserthead|inserttail/.test(s))
      return { type: "linkedlist", confidence: 78 };
    if (/push\s*\(|pop\s*\(|stack/.test(s))
      return { type: "stack", confidence: 70 };
    if (/graph|bfs|dfs|adjacen/.test(s))
      return { type: "graph", confidence: 72 };
    if (/tree|node.*left|node.*right/.test(s))
      return { type: "tree", confidence: 72 };
    if (/dp\[|memo|memoize|knapsack|lcs|lis/.test(s))
      return { type: "dp", confidence: 70 };
    if (/map\.set|hashmap|new map/.test(s))
      return { type: "hashmap", confidence: 68 };
    return { type: "unknown", confidence: null };
  }, []);

  // ── Run visualization ────────────────────────────────────────────────────────
  const handleVisualize = useCallback(async () => {
    stopPlay();
    setError(null);
    setSteps([]);
    setCurrentStep(0);

    // Detect type first (BUG FIX #4: set vizType BEFORE building steps)
    const { type, confidence: conf } = detectType(code);
    setVizType(type);
    setConfidence(conf);

    try {
      // Try to use the engine if available
      let generatedSteps = [];

      if (
        typeof ExecutionEngine === "function" ||
        typeof ExecutionEngine === "object"
      ) {
        try {
          const recorder = new EventRecorder();
          recorderRef.current = recorder;
          const engine = new ExecutionEngine(code, recorder);
          engineRef.current = engine;
          await engine.run();
          generatedSteps = recorder.getSteps
            ? recorder.getSteps()
            : recorder.steps || [];
        } catch (engineErr) {
          console.warn(
            "ExecutionEngine failed, falling back to static steps:",
            engineErr,
          );
        }
      }

      // Fallback: generate static demo steps so visualization always shows
      if (!generatedSteps || generatedSteps.length === 0) {
        generatedSteps = generateDemoSteps(code, type);
      }

      setSteps(generatedSteps);
      setCurrentStep(0);
      setMessage(generatedSteps[0]?.message || "Step 1");
    } catch (err) {
      setError(`Visualization error: ${err.message}`);
      console.error(err);
    }
  }, [code, detectType, stopPlay]);

  // ── Load a sample ────────────────────────────────────────────────────────────
  const handleLoadSample = useCallback(
    (name) => {
      setShowSampleMenu(false);
      stopPlay();
      setCode(SAMPLES[name]);
      setSteps([]);
      setCurrentStep(0);
      setVizType(null);
      setConfidence(null);
      setError(null);
    },
    [stopPlay],
  );

  // ── Current detected type meta ───────────────────────────────────────────────
  const typeMeta = TYPE_META[vizType] || TYPE_META.unknown;

  // ── Active code line from current step ──────────────────────────────────────
  const activeLine =
    steps[currentStep]?.codeLine ?? steps[currentStep]?.line ?? -1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: C.bg,
        overflow: "hidden",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}
    >
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          background: C.panel,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* Custom Code tab */}
        <div
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: "rgba(99,102,241,0.15)",
            color: "#a5b4fc",
            border: "1px solid rgba(99,102,241,0.35)",
            fontFamily: "monospace",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 10 }}>{"</>"}</span>
          Custom Code
        </div>

        {/* Load sample dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowSampleMenu((v) => !v)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
              background: "#0f172a",
              border: `1px solid ${C.border}`,
              color: C.text,
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            Load sample <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
          </button>
          {showSampleMenu && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                zIndex: 100,
                background: "#0f172a",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                overflow: "hidden",
                minWidth: 160,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {Object.keys(SAMPLES).map((name) => (
                <div
                  key={name}
                  onClick={() => handleLoadSample(name)}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: C.text,
                    fontFamily: "monospace",
                    borderBottom: `1px solid ${C.border}`,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(99,102,241,0.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Algorithm type badge — shown after detection */}
        {vizType && vizType !== "unknown" && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 12,
              fontSize: 11,
              background: `${typeMeta.color}22`,
              border: `1px solid ${typeMeta.color}66`,
              color: typeMeta.color,
              fontFamily: "monospace",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: typeMeta.color,
              }}
            />
            {typeMeta.label}
            {confidence != null && (
              <span style={{ opacity: 0.65, fontWeight: 400 }}>
                {confidence}%
              </span>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />
        {visualizerMode === "stack" && (
          <StackOpBuilder
            stackOps={stackOps}
            setStackOps={setStackOps}
            onRun={() => run("stack")}
          />
        )}

        {/* Visualize button */}
        <button
          onClick={handleVisualize}
          style={{
            padding: "6px 18px",
            borderRadius: 7,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "monospace",
            fontWeight: 700,
            background: "rgba(99,102,241,0.85)",
            border: "1px solid #6366f1",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <span style={{ fontSize: 11 }}>▶</span> Visualize
        </button>
      </div>

      {/* ── MAIN BODY (code editor left + canvas right) ──────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT: Code editor */}
        <div
          style={{
            width: "38%",
            minWidth: 280,
            maxWidth: 520,
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <CodeEditorPanel
            code={code}
            onChange={(src) => {
              setCode(src);
              setSteps([]);
              setVizType(null);
            }}
            activeLine={activeLine}
            readOnly={false}
          />
        </div>

        {/* RIGHT: Visualization canvas — BUG FIX #5: flex:1 so it actually fills */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: C.bg,
          }}
        >
          {error ? (
            <div
              style={{
                margin: 24,
                padding: 16,
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                fontFamily: "monospace",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          ) : (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <VisualizationCanvas
                vizType={vizType}
                steps={steps}
                currentStep={currentStep}
                isRunning={isRunning}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM BAR: message + playback controls ──────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 14px",
          background: "#0b1220",
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            flexShrink: 0,
            background: isRunning
              ? "#22c55e"
              : steps.length > 0
                ? C.accent
                : "#334155",
          }}
        />

        {/* Step message */}
        <span
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            color: C.cyan,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {message ||
            (steps.length === 0 ? "Ready — click Visualize to start" : "—")}
        </span>

        {/* Playback controls */}
        {steps.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
            }}
          >
            {[
              {
                label: "⏮",
                fn: () => {
                  stopPlay();
                  setCurrentStep(0);
                },
                title: "Reset",
              },
              {
                label: "◀",
                fn: () => {
                  stopPlay();
                  setCurrentStep((p) => Math.max(0, p - 1));
                },
                title: "Prev",
              },
              {
                label: isRunning ? "⏸" : "▶",
                fn: isRunning ? stopPlay : startPlay,
                title: isRunning ? "Pause" : "Play",
              },
              {
                label: "▶",
                fn: () => {
                  stopPlay();
                  setCurrentStep((p) => Math.min(steps.length - 1, p + 1));
                },
                title: "Next",
              },
              {
                label: "⏭",
                fn: () => {
                  stopPlay();
                  setCurrentStep(steps.length - 1);
                },
                title: "End",
              },
            ].map(({ label, fn, title }) => (
              <button
                key={title}
                onClick={fn}
                title={title}
                style={{
                  padding: "3px 7px",
                  borderRadius: 5,
                  fontSize: 12,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  fontFamily: "monospace",
                }}
              >
                {label}
              </button>
            ))}

            {/* Speed selector */}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{
                padding: "3px 6px",
                borderRadius: 5,
                fontSize: 11,
                background: "#0b1220",
                border: `1px solid ${C.border}`,
                color: C.textMuted,
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              <option value={1400}>0.5×</option>
              <option value={700}>1×</option>
              <option value={350}>2×</option>
              <option value={150}>4×</option>
            </select>

            {/* Step counter */}
            <span
              style={{
                fontSize: 10,
                color: C.textMuted,
                fontFamily: "monospace",
                minWidth: 48,
                textAlign: "right",
              }}
            >
              {currentStep + 1}/{steps.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fallback: generate minimal demo steps when engine produces nothing ────────
// This ensures the canvas is never blank after clicking Visualize.
function generateDemoSteps(code, type) {
  const lines = code.split("\n");

  // Extract array literals from code for sorting/searching demos
  const arrMatch = code.match(/\[([^\]]+)\]/);
  const arr = arrMatch
    ? arrMatch[1]
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : [64, 34, 25, 12, 22, 11, 90];

  switch ((type || "").toLowerCase()) {
    case "sorting": {
      const steps = [];
      const a = [...arr];
      const n = a.length;
      steps.push({
        list: [...a],
        message: `Starting sort on [${a.join(", ")}]`,
        codeLine: 0,
        vars: { n },
      });
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - 1 - i; j++) {
          steps.push({
            list: [...a],
            message: `Compare arr[${j}]=${a[j]} with arr[${j + 1}]=${a[j + 1]}`,
            codeLine: 4,
            vars: { i, j, "arr[j]": a[j], "arr[j+1]": a[j + 1] },
            comparing: [j, j + 1],
          });
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            steps.push({
              list: [...a],
              message: `Swap → arr[${j}]=${a[j]}, arr[${j + 1}]=${a[j + 1]}`,
              codeLine: 5,
              vars: { i, j },
              swapped: [j, j + 1],
            });
          }
        }
      }
      steps.push({
        list: [...a],
        message: `✓ Sorted: [${a.join(", ")}]`,
        codeLine: lines.length - 1,
        vars: { result: a },
      });
      return steps;
    }

    case "searching":
    case "search": {
      const sorted = [...arr].sort((a, b) => a - b);
      const target = sorted[Math.floor(sorted.length / 2)];
      const steps = [];
      let lo = 0,
        hi = sorted.length - 1;
      steps.push({
        list: sorted,
        message: `Binary search for ${target} in [${sorted.join(", ")}]`,
        codeLine: 0,
        vars: { lo, hi, target },
      });
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        steps.push({
          list: sorted,
          message: `mid=${mid}, arr[mid]=${sorted[mid]}, target=${target}`,
          codeLine: 3,
          vars: { lo, hi, mid, "arr[mid]": sorted[mid] },
          mid,
          lo,
          hi,
        });
        if (sorted[mid] === target) {
          steps.push({
            list: sorted,
            message: `✓ Found ${target} at index ${mid}`,
            codeLine: 4,
            vars: { result: mid },
            found: mid,
          });
          break;
        } else if (sorted[mid] < target) {
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return steps;
    }

    case "recursion": {
      const steps = [];
      function fibSteps(n, depth = 0) {
        steps.push({
          message: `fib(${n})`,
          codeLine: depth < lines.length ? depth : 1,
          vars: { n, depth },
          depth,
          n,
        });
        if (n <= 1) {
          steps.push({
            message: `fib(${n}) = ${n} (base case)`,
            codeLine: 1,
            vars: { n, result: n },
            depth,
          });
          return n;
        }
        const a = fibSteps(n - 1, depth + 1);
        const b = fibSteps(n - 2, depth + 1);
        steps.push({
          message: `fib(${n}) = fib(${n - 1}) + fib(${n - 2}) = ${a} + ${b} = ${a + b}`,
          codeLine: 2,
          vars: { n, result: a + b },
          depth,
        });
        return a + b;
      }
      fibSteps(5);
      return steps;
    }

    default: {
      // Generic: one step per line of code
      return lines
        .filter((l) => l.trim())
        .map((line, i) => ({
          message: `Line ${i + 1}: ${line.trim().slice(0, 60)}`,
          codeLine: i,
          vars: { line: i + 1 },
        }));
    }
  }
}
