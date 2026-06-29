// File: src/visualizers/HashmapVisualizer.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'
import { generateHashMapSteps } from '../utils/algorithms'

// The actual JS code shown in the left panel — each index = line number (1-based)
const CODE_LINES = [
  'function hashMap(entries, SIZE = 8) {',        // 1
  '  const table = new Array(SIZE).fill(null)',    // 2
  '    .map(() => []);',                           // 3
  '  let collisions = 0;',                         // 4
  '',                                              // 5
  '  function hash(key) {',                        // 6
  '    let h = 0;',                                // 7
  '    for (const ch of key) {',                   // 8
  '      h = (h * 31 + ch.charCodeAt(0)) % SIZE;',// 9
  '    }',                                         // 10
  '    return h;',                                 // 11
  '  }',                                           // 12
  '',                                              // 13
  '  for (const [key, val] of entries) {',         // 14
  '    const h = hash(key);',                      // 15  ← hash computed
  '    if (table[h].length > 0)',                  // 16  ← collision check
  '      collisions++;',                           // 17  ← collision bump
  '    table[h].push([key, val]);',                // 18  ← store
  '  }',                                           // 19
  '',                                              // 20
  '  return { table, collisions };',               // 21
  '}',                                             // 22
]

// Map step.line (from algorithm) → 1-based line index in CODE_LINES
// 0=init, 5=hash computed, 12=stored, 15=done
const LINE_MAP = { 0: 1, 5: 15, 16: 16, 17: 17, 12: 18, 15: 21 }

export default function HashMapVisualizer() {
  const { steps, currentStep, setSteps } = useVisualizerStore()
  const step = steps[currentStep] || {}

  const table      = step.table      ?? []
  const current    = step.current    ?? -1
  const key        = step.key        ?? ''
  const hash       = step.hash       ?? -1
  const collisions = step.collisions ?? 0
  const message    = step.description ?? step.message ?? ''
  const activeLine = LINE_MAP[step.line] ?? -1

  // ── Custom input state ──────────────────────────────────────────────────
  const [entries, setEntries] = useState([
    { key: 'name',  val: 'Alice' },
    { key: 'age',   val: '30'    },
    { key: 'city',  val: 'NYC'   },
    { key: 'job',   val: 'Dev'   },
    { key: 'lang',  val: 'JS'    },
  ])
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [sizeInput, setSizeInput] = useState('8')

  const addEntry = () => {
    const k = newKey.trim()
    const v = newVal.trim()
    if (!k || !v) return
    if (entries.find(e => e.key === k)) {
      setEntries(prev => prev.map(e => e.key === k ? { key: k, val: v } : e))
    } else {
      setEntries(prev => [...prev, { key: k, val: v }])
    }
    setNewKey('')
    setNewVal('')
  }

  const removeEntry = (k) => setEntries(prev => prev.filter(e => e.key !== k))

  const handleVisualize = () => {
    const size = Math.max(4, Math.min(16, parseInt(sizeInput) || 8))
    const data = entries.map(e => [e.key, e.val])
    const newSteps = generateHashMapSteps(data, size)
    setSteps(newSteps)
    setShowInput(false)
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!table.length && !showInput) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <div className="text-4xl">⛓</div>
        <p className="text-sm">No data yet — configure your hashmap</p>
        <button
          onClick={() => setShowInput(true)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Configure &amp; Visualize
        </button>
      </div>
    )
  }

  // ── Input panel ─────────────────────────────────────────────────────────
  if (showInput) {
    return (
      <div className="flex flex-col h-full gap-3 p-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Configure HashMap</h2>
          {table.length > 0 && (
            <button onClick={() => setShowInput(false)} className="text-xs text-slate-400 hover:text-slate-200">
              ← Back
            </button>
          )}
        </div>

        {/* Table size */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 w-24 flex-shrink-0">Table size</label>
          <input
            type="number" min="4" max="16" value={sizeInput}
            onChange={e => setSizeInput(e.target.value)}
            className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 font-mono"
          />
          <span className="text-xs text-slate-500">(4–16 buckets)</span>
        </div>

        {/* Entry list */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-400">Entries</span>
          {entries.map(e => (
            <div key={e.key} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5 font-mono text-xs">
              <span className="text-yellow-300 flex-1">"{e.key}"</span>
              <span className="text-slate-500">→</span>
              <span className="text-cyan-300 flex-1">"{e.val}"</span>
              <button onClick={() => removeEntry(e.key)} className="text-slate-600 hover:text-red-400 ml-2 transition-colors">✕</button>
            </div>
          ))}
        </div>

        {/* Add new entry */}
        <div className="flex gap-2 items-center">
          <input
            placeholder="key"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry()}
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 font-mono placeholder-slate-600"
          />
          <span className="text-slate-500 text-xs">→</span>
          <input
            placeholder="value"
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEntry()}
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 font-mono placeholder-slate-600"
          />
          <button
            onClick={addEntry}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors"
          >+ Add</button>
        </div>

        <button
          onClick={handleVisualize}
          disabled={entries.length === 0}
          className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          ▶ Visualize
        </button>
      </div>
    )
  }

  // ── Main visualizer: code panel left + buckets right ────────────────────
  return (
    <div className="flex h-full overflow-hidden gap-0">

      {/* ── LEFT: Code panel ───────────────────────────────────────────── */}
      <div className="w-[42%] flex-shrink-0 flex flex-col bg-[#0d1117] border-r border-slate-700/50 overflow-hidden">
        {/* Code panel header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/70 border-b border-slate-700/50">
          <span className="text-[11px] text-slate-400 font-mono">hashmap.js</span>
          <button
            onClick={() => setShowInput(true)}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            Edit input
          </button>
        </div>

        {/* Code lines */}
        <div className="flex-1 overflow-y-auto py-2">
          {CODE_LINES.map((line, idx) => {
            const lineNum = idx + 1
            const isActive = lineNum === activeLine
            return (
              <motion.div
                key={lineNum}
                animate={{
                  backgroundColor: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
                }}
                transition={{ duration: 0.15 }}
                className="flex items-stretch min-h-[22px] relative"
              >
                {/* Active line accent bar */}
                {isActive && (
                  <motion.div
                    layoutId="active-line-bar"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-400 rounded-r"
                  />
                )}
                {/* Line number */}
                <span className="select-none w-8 text-right pr-3 text-[11px] font-mono leading-[22px] flex-shrink-0"
                  style={{ color: isActive ? '#818cf8' : '#374151' }}>
                  {lineNum}
                </span>
                {/* Code text */}
                <span
                  className="flex-1 text-[11.5px] font-mono leading-[22px] pr-3 whitespace-pre"
                  style={{ color: isActive ? '#e0e7ff' : '#9ca3af' }}
                >
                  {line || ' '}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Variable watch panel */}
        {step.vars && Object.keys(step.vars).length > 0 && (
          <div className="border-t border-slate-700/50 px-3 py-2 bg-slate-900/60">
            <p className="text-[10px] text-slate-500 mb-1.5 font-mono uppercase tracking-wider">Variables</p>
            <div className="flex flex-col gap-0.5">
              {Object.entries(step.vars).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-purple-400 w-20 truncate">{k}</span>
                  <span className="text-slate-600">=</span>
                  <span className="text-green-300 truncate">{JSON.stringify(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Hash table visualization ────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-2 p-3 overflow-hidden">

        {/* Stats row */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Buckets',    value: table.length,              color: 'text-blue-400'   },
            { label: 'Active',     value: current >= 0 ? current : '—', color: 'text-indigo-400' },
            { label: 'Collisions', value: collisions,                color: 'text-red-400'    },
            { label: 'Key',        value: key || '—',                color: 'text-yellow-400' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 min-w-[54px]">
              <span className={`text-xs font-mono font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[9px] text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-[11px] text-cyan-300 font-mono min-h-[1rem] leading-tight"
          >
            {message}
          </motion.p>
        </AnimatePresence>

        {/* Buckets */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {table.map((bucket, idx) => {
            const isActive    = idx === current
            const hasItems    = bucket.length > 0
            const hasCollision = bucket.length > 1
            return (
              <motion.div
                key={idx}
                layout
                animate={{
                  borderColor:     isActive ? '#6366f1' : hasItems ? '#334155' : '#1e293b',
                  backgroundColor: isActive ? 'rgba(99,102,241,0.1)' : hasItems ? '#1e293b' : '#0f172a',
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono"
                style={{ minHeight: 34 }}
              >
                {/* Index */}
                <span className="text-slate-600 w-7 text-right text-[11px] flex-shrink-0">[{idx}]</span>

                {/* Bucket contents */}
                <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                  {hasItems ? (
                    bucket.map(([k, v], ci) => (
                      <motion.span
                        key={ci}
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="px-1.5 py-0.5 rounded text-[11px]"
                        style={{
                          background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(56,189,248,0.08)',
                          color:      isActive ? '#a5b4fc' : '#38bdf8',
                          border:    `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'rgba(56,189,248,0.15)'}`,
                        }}
                      >
                        {k}:{v}
                      </motion.span>
                    ))
                  ) : (
                    <span className="text-slate-700 text-[10px]">empty</span>
                  )}
                </div>

                {/* Collision badge */}
                {hasCollision && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 flex-shrink-0">
                    ⚡ chain
                  </span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}