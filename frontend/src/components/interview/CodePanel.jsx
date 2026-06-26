// FILE: src/components/interview/CodePanel.jsx
// PROJECT: Friday AI — Career OS
// PURPOSE: Monaco-based code editor panel for coding rounds.
//          Supports 6 languages, Cmd/Ctrl+Enter submit, local JS eval,
//          submit flash, language-change confirmation, output panel.

import { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";

// ── Language definitions ──────────────────────────────────────────────────────
const LANGUAGES = [
  {
    id: "python",
    label: "Python",
    monacoId: "python",
    defaultCode: "def solution():\n    pass\n",
  },
  {
    id: "javascript",
    label: "JavaScript",
    monacoId: "javascript",
    defaultCode: "function solution() {\n  \n}\n",
  },
  {
    id: "java",
    label: "Java",
    monacoId: "java",
    defaultCode:
      "class Solution {\n    public void solution() {\n        \n    }\n}\n",
  },
  {
    id: "cpp",
    label: "C++",
    monacoId: "cpp",
    defaultCode:
      "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n",
  },
  {
    id: "typescript",
    label: "TypeScript",
    monacoId: "typescript",
    defaultCode: "function solution(): void {\n  \n}\n",
  },
  {
    id: "go",
    label: "Go",
    monacoId: "go",
    defaultCode: "package main\n\nfunc solution() {\n\n}\n",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isDefaultCode(code, lang) {
  const def = LANGUAGES.find((l) => l.id === lang)?.defaultCode ?? "";
  return code.trim() === def.trim() || code.trim() === "";
}

// ── Output Panel ──────────────────────────────────────────────────────────────
function OutputPanel({ output, onClear }) {
  if (!output) return null;
  const isError = output.startsWith("Error") || output.startsWith("TypeError") || output.startsWith("ReferenceError");
  return (
    <div style={{
      borderTop: "1px solid rgba(255,255,255,0.07)",
      background: "#0D1117",
      maxHeight: 120,
      overflowY: "auto",
      flexShrink: 0,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "4px 10px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
          color: isError ? "#FCA5A5" : "rgba(255,255,255,0.35)",
          fontFamily: "Outfit, sans-serif", textTransform: "uppercase",
        }}>
          {isError ? "Error" : "Output"}
        </span>
        <button
          onClick={onClear}
          style={{
            background: "none", border: "none",
            color: "rgba(255,255,255,0.25)", fontSize: 10,
            cursor: "pointer", padding: "0 4px", fontFamily: "Outfit, sans-serif",
          }}
        >
          Clear
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: "8px 12px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 12,
        color: isError ? "#FCA5A5" : "#E6EDF3",
        lineHeight: 1.65,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}>
        {output}
      </pre>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
/**
 * CodePanel
 *
 * Props:
 *   onSubmit(code, language)  — called when user submits code
 *   isDisabled                — true while AI is thinking
 *   defaultLanguage           — default 'python'
 *   question                  — current AI question string (for context display)
 *   isThinking                — AI is processing last submission
 */
export default function CodePanel({
  onSubmit,
  isDisabled = false,
  defaultLanguage = "python",
  question = "",
  isThinking = false,
}) {
  const initLang =
    LANGUAGES.find((l) => l.id === defaultLanguage) || LANGUAGES[0];

  const [selectedLang, setSelectedLang] = useState(initLang);
  const [code, setCode] = useState(initLang.defaultCode);
  const [output, setOutput] = useState("");
  const [submitFlash, setSubmitFlash] = useState(false); // "Submitted ✓" flash
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const editorRef = useRef(null);

  // Keyboard shortcut: Cmd/Ctrl+Enter → submit, Cmd/Ctrl+Shift+Enter → run
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRun();
        } else {
          e.preventDefault();
          handleSubmit();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }); // intentionally no dep array — always reads latest closures via handleRun/handleSubmit refs

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // ── Language change ───────────────────────────────────────────────────────
  const handleLangChange = (langId) => {
    const nextLang = LANGUAGES.find((l) => l.id === langId);
    if (!nextLang) return;
    if (!isDefaultCode(code, selectedLang.id)) {
      const confirmed = window.confirm(
        "Changing language will reset the editor. Continue?"
      );
      if (!confirmed) return;
    }
    setSelectedLang(nextLang);
    setCode(nextLang.defaultCode);
    setOutput("");
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (isDisabled || submitDisabled || !code.trim()) return;
    setSubmitDisabled(true);
    const formatted = `[Code: ${selectedLang.id}]\n\n${code}`;
    onSubmit(formatted, selectedLang.id);
    // Flash "Submitted ✓" for 1.5s
    setSubmitFlash(true);
    setTimeout(() => {
      setSubmitFlash(false);
      setSubmitDisabled(false);
    }, 1500);
  }, [isDisabled, submitDisabled, code, selectedLang, onSubmit]);

  // ── Run (JS only, sandboxed) ──────────────────────────────────────────────
  const handleRun = useCallback(() => {
    if (selectedLang.id !== "javascript") {
      setOutput(
        "Run requires a backend. Use Submit to send your code for AI review."
      );
      return;
    }
    try {
      const logs = [];
      const fakeConsole = { log: (...args) => logs.push(args.map(String).join(" ")) };
      // eslint-disable-next-line no-new-func
      const fn = new Function("console", code);
      const result = fn(fakeConsole);
      const out = [
        ...logs,
        result !== undefined ? `→ ${String(result)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      setOutput(out || "(no output)");
    } catch (err) {
      setOutput(`${err.name}: ${err.message}`);
    }
  }, [selectedLang.id, code]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const submitLabel = submitFlash
    ? "Submitted ✓"
    : isThinking
    ? "AI reviewing…"
    : "Submit Code";

  const submitBg = submitFlash
    ? "rgba(34,197,94,0.25)"
    : isDisabled || submitDisabled
    ? "rgba(255,255,255,0.04)"
    : "rgba(79,70,229,0.85)";

  const submitColor = submitFlash
    ? "#4ADE80"
    : isDisabled || submitDisabled
    ? "#374151"
    : "#fff";

  const submitBorder = submitFlash
    ? "1.5px solid rgba(34,197,94,0.4)"
    : isDisabled || submitDisabled
    ? "1.5px solid rgba(255,255,255,0.07)"
    : "1.5px solid rgba(79,70,229,0.5)";

  return (
    <div
      role="region"
      aria-label="Code editor"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0D1117",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
        fontFamily: "Outfit, Inter, sans-serif",
      }}
    >
      {/* ── Toolbar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
        flexWrap: "wrap",
      }}>
        {/* Language selector */}
        <select
          value={selectedLang.id}
          onChange={(e) => handleLangChange(e.target.value)}
          disabled={isDisabled}
          aria-label="Programming language selector"
          style={{
            background: "#161B22",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 7,
            color: "#C9D1D9",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "Outfit, sans-serif",
            padding: "4px 8px",
            cursor: isDisabled ? "not-allowed" : "pointer",
            outline: "none",
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id} style={{ background: "#0D1117" }}>
              {l.label}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* AI thinking indicator */}
        {isThinking && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "#818CF8", fontWeight: 600,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#818CF8",
              animation: "cpCodeSpin 1s ease-in-out infinite",
            }} />
            AI is reviewing your code…
          </div>
        )}

        {/* Run button (JS only) */}
        <button
          onClick={handleRun}
          disabled={isDisabled}
          aria-label="Run code locally"
          title={
            selectedLang.id === "javascript"
              ? "Run locally (Ctrl+Shift+Enter)"
              : "Run requires backend — Submit instead"
          }
          style={{
            padding: "5px 12px",
            borderRadius: 7,
            border: "1.5px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: isDisabled ? "#374151" : "rgba(255,255,255,0.45)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "Outfit, sans-serif",
            cursor: isDisabled ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          ▶ Run
        </button>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isDisabled || submitDisabled || !code.trim()}
          aria-label="Submit code to AI interviewer"
          title="Submit (Ctrl+Enter)"
          style={{
            padding: "5px 14px",
            borderRadius: 7,
            border: submitBorder,
            background: submitBg,
            color: submitColor,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "Outfit, sans-serif",
            cursor: isDisabled || submitDisabled || !code.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            letterSpacing: "0.04em",
          }}
        >
          {submitLabel}
        </button>
      </div>

      {/* ── Monaco Editor ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Editor
          height="100%"
          language={selectedLang.monacoId}
          value={code}
          onChange={(val) => setCode(val || "")}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            suggest: { showWords: false },
            padding: { top: 10, bottom: 10 },
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            readOnly: isDisabled,
          }}
        />
      </div>

      {/* ── Output Panel ── */}
      <OutputPanel output={output} onClear={() => setOutput("")} />

      {/* ── Keyframe for spinner ── */}
      <style>{`
        @keyframes cpCodeSpin {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}