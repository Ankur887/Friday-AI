// File: src/visualizers/PointerVisualizer.jsx
// Fully rewritten — pure inline styles, no Tailwind dependency.
import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useVisualizerStore from "../store/useVisualizerStore";

// ─── colour palette ────────────────────────────────────────────────────────────
const C = {
  stackBg:     "#0d1b2a",
  stackBorder: "#1e3a5f",
  stackHead:   "#38bdf8",
  heapBg:      "#0a1f1a",
  heapBorder:  "#134e3a",
  heapHead:    "#34d399",
  ptrColor:    "#a78bfa",
  ptrArrow:    "#8b5cf6",
  varName:     "#67e8f9",
  varVal:      "#fde68a",
  varType:     "#64748b",
  varAddr:     "#475569",
  addrChip:    "#1e293b",
  msgColor:    "#67e8f9",
  bg:          "#080c14",
  panel:       "#0f172a",
  border:      "#1e2d45",
  label:       "#94a3b8",
  null:        "#ef4444",
};

// ─── mini components ───────────────────────────────────────────────────────────

function SectionHeader({ dot, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px 6px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:dot, flexShrink:0 }} />
      <span style={{ fontSize:10, fontWeight:700, color:dot, letterSpacing:"0.8px", textTransform:"uppercase" }}>{label}</span>
    </div>
  );
}

function MemRow({ name, type, addr, val, isPointer, isNull, highlighted }) {
  const isNullPtr = isNull || String(val) === "null" || String(val) === "nullptr";
  return (
    <motion.div
      layout
      initial={{ opacity:0, x:-10 }}
      animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:10 }}
      transition={{ duration:0.2 }}
      style={{
        display:"flex", alignItems:"center", gap:0,
        padding:"6px 12px",
        borderBottom:`1px solid ${C.border}`,
        background: highlighted ? "rgba(99,102,241,0.1)" : "transparent",
        borderLeft: highlighted ? "2px solid #6366f1" : "2px solid transparent",
        fontFamily:"'JetBrains Mono','Fira Code',monospace",
        transition:"background 0.2s",
      }}
    >
      {/* address */}
      <span style={{ fontSize:9, color:C.varAddr, width:54, flexShrink:0, background:C.addrChip, padding:"1px 4px", borderRadius:3, marginRight:8 }}>
        {addr}
      </span>
      {/* type */}
      <span style={{ fontSize:10, color:C.varType, width:38, flexShrink:0, marginRight:6 }}>
        {type}
      </span>
      {/* name */}
      <span style={{ fontSize:12, color: isPointer ? C.ptrColor : C.varName, fontWeight: isPointer ? 700 : 400, flex:1 }}>
        {name}
      </span>
      {/* value */}
      <span style={{ fontSize:12, color: isNullPtr ? C.null : isPointer ? C.ptrColor : C.varVal, fontWeight:700 }}>
        {String(val)}
      </span>
    </motion.div>
  );
}

function HeapBlock({ id, type, addr, fields }) {
  return (
    <motion.div
      layout
      initial={{ opacity:0, scale:0.95 }}
      animate={{ opacity:1, scale:1 }}
      exit={{ opacity:0, scale:0.9 }}
      transition={{ duration:0.22 }}
      style={{
        margin:"8px 10px",
        border:`1px solid ${C.heapBorder}`,
        borderRadius:8,
        overflow:"hidden",
        background:C.heapBg,
      }}
    >
      {/* block header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 10px", background:"rgba(52,211,153,0.08)", borderBottom:`1px solid ${C.heapBorder}` }}>
        <span style={{ fontSize:11, color:C.heapHead, fontWeight:700, fontFamily:"monospace" }}>{type}</span>
        <span style={{ fontSize:9,  color:C.varAddr,  fontFamily:"monospace", background:C.addrChip, padding:"1px 5px", borderRadius:3 }}>{addr}</span>
      </div>
      {/* fields */}
      {(fields || []).map((f, i) => (
        <div key={i} style={{ display:"flex", gap:8, padding:"4px 10px", borderBottom: i < fields.length-1 ? `1px solid ${C.border}` : "none", fontFamily:"monospace" }}>
          <span style={{ fontSize:10, color:C.varType, width:48 }}>{f.type || ""}</span>
          <span style={{ fontSize:11, color:C.varName, flex:1 }}>{f.name}</span>
          <span style={{ fontSize:11, color:C.varVal,  fontWeight:700 }}>{String(f.val)}</span>
        </div>
      ))}
      {(!fields || fields.length === 0) && (
        <div style={{ padding:"6px 10px", fontSize:10, color:C.varAddr }}>empty object</div>
      )}
    </motion.div>
  );
}

// ─── Arrow SVG overlay ─────────────────────────────────────────────────────────
// Draws arrows between stack and heap panels using absolute-positioned SVG.
// We use a simple approach: render the arrows textually in a dedicated panel.
function ArrowsPanel({ pointers }) {
  if (!pointers || pointers.length === 0) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", gap:8, padding:"0 4px", minWidth:120, flexShrink:0 }}>
      {pointers.map((ptr, i) => {
        const isHeap = ptr.heap;
        const isNull = !ptr.to || ptr.to === "null";
        return (
          <motion.div
            key={i}
            initial={{ opacity:0, x:-4 }}
            animate={{ opacity:1, x:0 }}
            transition={{ duration:0.25, delay:i*0.07 }}
            style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              padding:"6px 8px",
              background:"rgba(139,92,246,0.08)",
              border:`1px solid rgba(139,92,246,0.25)`,
              borderRadius:7,
              fontFamily:"monospace",
            }}
          >
            <span style={{ fontSize:10, color:C.ptrColor, fontWeight:700, marginBottom:3 }}>{ptr.label}</span>
            {isNull ? (
              <span style={{ fontSize:9, color:C.null }}>→ null</span>
            ) : (
              <>
                <span style={{ fontSize:16, color:C.ptrArrow, lineHeight:1 }}>→</span>
                <span style={{ fontSize:9, color:C.varAddr, marginTop:2 }}>{ptr.to}</span>
                {isHeap && <span style={{ fontSize:8, color:C.heapHead, marginTop:1 }}>HEAP</span>}
              </>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Step message bar ──────────────────────────────────────────────────────────
function MessageBar({ message, stepIndex, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 14px", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", flexShrink:0 }} />
      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          initial={{ opacity:0, x:-6 }}
          animate={{ opacity:1, x:0 }}
          exit={{ opacity:0 }}
          transition={{ duration:0.15 }}
          style={{ fontSize:12, fontFamily:"monospace", color:C.msgColor, flex:1 }}
        >
          {message || "—"}
        </motion.span>
      </AnimatePresence>
      {total > 0 && (
        <span style={{ fontSize:10, color:C.varAddr, flexShrink:0, fontFamily:"monospace" }}>
          {stepIndex+1} / {total}
        </span>
      )}
    </div>
  );
}

// ─── Code snippet for pointer demo ────────────────────────────────────────────
const PTR_CODE = [
  "int x    = 10;        // 0x1000",
  "int y    = 20;        // 0x1004",
  "int *p   = &x;        // p → 0x1000",
  "int **pp = &p;        // pp → 0x1008",
  "",
  "*p  = 99;             // x = 99",
  "**pp = 42;            // x = 42",
  "",
  "int *q = new int(42); // heap 0x2000",
  "Node *n = new Node(); // heap 0x3000",
  "// memory complete",
];

function CodeAnnotation({ activeLine }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#0d1117", fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:12, overflow:"auto" }}>
      <div style={{ padding:"6px 12px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ fontSize:10, color:C.varAddr, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>pointer_demo.cpp</span>
      </div>
      {PTR_CODE.map((line, i) => (
        <div key={i} style={{
          display:"flex", alignItems:"stretch", minHeight:22,
          background: i === activeLine ? "rgba(99,102,241,0.13)" : "transparent",
          borderLeft:  i === activeLine ? "3px solid #6366f1"     : "3px solid transparent",
        }}>
          <div style={{ width:28, paddingRight:8, paddingLeft:6, paddingTop:3, textAlign:"right", flexShrink:0, color: i === activeLine ? "#6366f1" : "#2d3f55", fontSize:10, userSelect:"none" }}>
            {i+1}
          </div>
          <pre style={{ margin:0, padding:"2px 8px 2px 2px", fontSize:12, lineHeight:"1.6", whiteSpace:"pre", flex:1, color: i === activeLine ? "#e2e8f0" : "#4b6180" }}>
            {line}
          </pre>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PointerVisualizer() {
  const { steps, currentStep } = useVisualizerStore();
  const step = steps[currentStep] || {};

  const stackMem = step.stack    || [];
  const heapMem  = step.heap     || [];
  const pointers = step.pointers || [];
  const message  = step.description || step.message || "";
  const line     = step.line ?? -1;

  // Which stack vars are pointer types (contain * or 0x)
  const isPtr = (v) =>
    v.type?.includes("*") ||
    String(v.val).startsWith("0x") ||
    String(v.name).includes("*");

  if (!stackMem.length && !heapMem.length) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12, color:C.varAddr }}>
        <div style={{ fontSize:36 }}>🧠</div>
        <p style={{ fontSize:14 }}>Press <span style={{ color:"#38bdf8", fontWeight:700 }}>Visualize</span> to explore memory & pointers</p>
        <p style={{ fontSize:11, color:C.border }}>Shows stack, heap, pointer arrows, and double pointers</p>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:C.bg, overflow:"hidden" }}>

      {/* Message bar */}
      <MessageBar message={message} stepIndex={currentStep} total={steps.length} />

      {/* Main 3-column layout */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", gap:0 }}>

        {/* ── Left: Code annotation ── */}
        <div style={{ width:260, flexShrink:0, borderRight:`1px solid ${C.border}`, overflow:"hidden" }}>
          <CodeAnnotation activeLine={line} />
        </div>

        {/* ── Center-left: Stack memory ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", borderRight:`1px solid ${C.border}`, overflow:"hidden", minWidth:0 }}>
          <SectionHeader dot={C.stackHead} label="Stack Memory" />
          <div style={{ flex:1, overflowY:"auto" }}>
            {/* column headers */}
            <div style={{ display:"flex", gap:0, padding:"4px 12px", borderBottom:`1px solid ${C.border}`, background:C.panel }}>
              {["Address","Type","Name","Value"].map((h,i) => (
                <span key={h} style={{ fontSize:9, color:C.varAddr, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", flex: i===2?1:i===0?0.7:i===1?0.6:0.7 }}>{h}</span>
              ))}
            </div>
            <AnimatePresence>
              {stackMem.length === 0
                ? <div style={{ padding:16, color:C.varAddr, fontSize:12, textAlign:"center" }}>Empty stack frame</div>
                : stackMem.map((v, i) => (
                    <MemRow
                      key={`${v.addr}-${v.name}`}
                      name={v.name}
                      type={v.type}
                      addr={v.addr}
                      val={v.val}
                      isPointer={isPtr(v)}
                      highlighted={pointers.some(p => p.from === v.addr)}
                    />
                  ))
              }
            </AnimatePresence>

            {/* Stack growth indicator */}
            {stackMem.length > 0 && (
              <div style={{ padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:2, height:40, background:`linear-gradient(to bottom, ${C.stackHead}, transparent)` }} />
                <span style={{ fontSize:9, color:C.varAddr }}>stack grows ↓</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Pointer arrows ── */}
        <ArrowsPanel pointers={pointers} />

        {/* ── Right: Heap memory ── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", borderLeft:`1px solid ${C.border}`, overflow:"hidden", minWidth:0 }}>
          <SectionHeader dot={C.heapHead} label="Heap Memory" />
          <div style={{ flex:1, overflowY:"auto" }}>
            <AnimatePresence>
              {heapMem.length === 0
                ? <div style={{ padding:16, color:C.varAddr, fontSize:12, textAlign:"center" }}>No heap allocations</div>
                : heapMem.map((obj) => (
                    <HeapBlock
                      key={obj.addr || obj.id}
                      id={obj.id}
                      type={obj.type}
                      addr={obj.addr}
                      fields={obj.fields}
                    />
                  ))
              }
            </AnimatePresence>

            {heapMem.length > 0 && (
              <div style={{ padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:2, height:40, background:`linear-gradient(to bottom, ${C.heapHead}, transparent)` }} />
                <span style={{ fontSize:9, color:C.varAddr }}>heap grows ↑</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Pointer relationships legend ── */}
      {pointers.length > 0 && (
        <div style={{ flexShrink:0, borderTop:`1px solid ${C.border}`, background:C.panel, padding:"8px 14px" }}>
          <div style={{ fontSize:9, color:C.varAddr, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>
            Pointer Relationships
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {pointers.map((ptr, i) => {
              const isNull = !ptr.to || ptr.to === "null";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:6, padding:"3px 10px", fontFamily:"monospace" }}>
                  <span style={{ fontSize:11, color:C.ptrColor, fontWeight:700 }}>{ptr.label}</span>
                  <span style={{ fontSize:12, color:C.ptrArrow }}>{isNull ? "→ null" : "→"}</span>
                  {!isNull && <span style={{ fontSize:10, color:C.varAddr }}>{ptr.to}</span>}
                  {ptr.heap && <span style={{ fontSize:9, color:C.heapHead, marginLeft:2 }}>[heap]</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}