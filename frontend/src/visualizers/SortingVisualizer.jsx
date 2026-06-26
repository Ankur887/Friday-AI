// File: src/visualizers/SortingVisualizer.jsx
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

const STATE_COLORS = {
  default:   { fill: '#1e3a5f', border: '#2d5a8e', glow: 'none',                              label: 'Default'   },
  comparing: { fill: '#92400e', border: '#f59e0b', glow: '0 0 14px rgba(245,158,11,0.8)',      label: 'Comparing' },
  swapping:  { fill: '#7f1d1d', border: '#ef4444', glow: '0 0 14px rgba(239,68,68,0.9)',       label: 'Swapping'  },
  sorted:    { fill: '#064e3b', border: '#10b981', glow: '0 0 10px rgba(16,185,129,0.6)',      label: 'Sorted'    },
  pivot:     { fill: '#4c1d95', border: '#a855f7', glow: '0 0 16px rgba(168,85,247,0.9)',      label: 'Pivot'     },
  merging:   { fill: '#164e63', border: '#06b6d4', glow: '0 0 12px rgba(6,182,212,0.7)',       label: 'Merging'   },
  left:      { fill: '#1e1b4b', border: '#6366f1', glow: '0 0 10px rgba(99,102,241,0.6)',      label: 'Left half' },
  right:     { fill: '#500724', border: '#f472b6', glow: '0 0 10px rgba(244,114,182,0.6)',     label: 'Right half'},
}

function getStateKey(idx, { comparing, swapping, sorted, merging, left, right, pivot }) {
  if (sorted.includes(idx))    return 'sorted'
  if (swapping.includes(idx))  return 'swapping'
  if (merging.includes(idx))   return 'merging'
  if (left.includes(idx))      return 'left'
  if (right.includes(idx))     return 'right'
  if (idx === pivot)           return 'pivot'
  if (comparing.includes(idx)) return 'comparing'
  return 'default'
}

export default function SortingVisualizer() {
  const { steps, currentStep } = useVisualizerStore()
  const step = steps[currentStep] || {}

  // ── Normalize field names ──────────────────────────────────────────────────
  // algorithms.js emits `arr`, visualizer expected `array` — handle both
  const array      = step.array     ?? step.arr     ?? []
  const comparing  = step.comparing ?? step.compare ?? []
  const swapping   = step.swapping  ?? step.swap    ?? []
  const sorted     = step.sorted    ?? []
  const merging    = step.merging   ?? []
  const left       = step.left      ?? []
  const right      = step.right     ?? []
  const pivot      = step.pivot     ?? -1
  // merge sort uses `merges`, others use `swaps` — unify
  const comparisons = step.comparisons ?? 0
  const swaps       = step.swaps ?? step.merges ?? 0
  const message     = step.description ?? step.message ?? ''
  const vars        = step.vars ?? {}

  const maxVal = useMemo(() => Math.max(...(array.length ? array : [1])), [array])
  const n = array.length

  if (!n) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'#475569' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
          <line x1="2" y1="20" x2="22" y2="20"/>
        </svg>
        <p style={{ fontSize:14, color:'#475569' }}>
          Select an algorithm and press <span style={{ color:'#38bdf8', fontWeight:700 }}>Visualize</span>
        </p>
      </div>
    )
  }

  const barW   = n <= 10 ? 56 : n <= 20 ? 40 : n <= 40 ? 24 : n <= 80 ? 13 : n <= 150 ? 7 : 4
  const gap    = n <= 20 ? 5  : n <= 40 ? 3  : n <= 80 ? 2  : 1
  const showVal = n <= 24
  const showIdx = n <= 32

  // pointer variables (i, j, lo, hi, mid, etc.) for overlay arrows
  const pointerVars = Object.entries(vars).filter(([k, v]) =>
    typeof v === 'number' && v >= 0 && v < n &&
    ['i','j','lo','hi','mid','left','right','key','minIdx','pivotIdx'].includes(k)
  )

  const stateCtx = { comparing, swapping, sorted, merging, left, right, pivot }

  // label for the "swaps" stat — merge sort calls them merges
  const swapLabel = (step.merges !== undefined && step.swaps === undefined) ? 'Merges' : 'Swaps'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:0, userSelect:'none', minHeight:0 }}>

      {/* ── Stats row ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', flexShrink:0, marginBottom:10 }}>
        {[
          { label:'Comparisons', value:comparisons,    color:'#f59e0b' },
          { label:swapLabel,     value:swaps,           color:'#ef4444' },
          { label:'Array size',  value:n,               color:'#60a5fa' },
          { label:'Sorted',      value:sorted.length,   color:'#10b981' },
          { label:'Step',        value:`${currentStep+1}/${steps.length}`, color:'#a855f7' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'#0f172a', border:'1px solid #1e3a5f', borderRadius:8, padding:'6px 14px', display:'flex', flexDirection:'column', alignItems:'center', minWidth:72 }}>
            <span style={{ color, fontSize:17, fontWeight:700, fontFamily:'monospace' }}>{value}</span>
            <span style={{ color:'#64748b', fontSize:10, marginTop:2 }}>{label}</span>
          </div>
        ))}

        {/* live pointer values */}
        {pointerVars.map(([k, v]) => (
          <div key={k} style={{ background:'#0f172a', border:'1px solid #312e81', borderRadius:8, padding:'6px 14px', display:'flex', flexDirection:'column', alignItems:'center', minWidth:56 }}>
            <span style={{ color:'#818cf8', fontSize:17, fontWeight:700, fontFamily:'monospace' }}>{v}</span>
            <span style={{ color:'#64748b', fontSize:10, marginTop:16 }}>{k}</span>
          </div>
        ))}
      </div>

      {/* ── Step message ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity:0, x:-6 }}
          animate={{ opacity:1, x:0 }}
          exit={{ opacity:0 }}
          transition={{ duration:0.14 }}
          style={{ flexShrink:0, marginBottom:10, padding:'7px 12px', background:'#0f172a', border:'1px solid #1e3a5f', borderRadius:8 }}
        >
          <span style={{ fontSize:12, fontFamily:'monospace', color:'#67e8f9' }}>{message || '—'}</span>
        </motion.div>
      </AnimatePresence>

      {/* ── Bar chart area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>

        <div style={{ flex:1, position:'relative', display:'flex', flexDirection:'column', minHeight:0 }}>

          {/* ── Bars ── */}
          <div style={{
            flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center',
            overflow:'hidden', gap:`${gap}px`,
            background:'rgba(15,23,42,0.6)', border:'1px solid #1e2d45',
            borderRadius:12, padding:'16px 12px 0 12px', minHeight:0,
          }}>
            {array.map((val, idx) => {
              const stKey = getStateKey(idx, stateCtx)
              const { fill, border, glow } = STATE_COLORS[stKey]
              const hPct = Math.max((val / maxVal) * 100, 1.2)
              const isActive = comparing.includes(idx) || swapping.includes(idx) || idx === pivot || merging.includes(idx) || left.includes(idx) || right.includes(idx)

              return (
                <div
                  key={idx}
                  style={{
                    position:'relative', display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'flex-end',
                    height:'100%', width:barW, minWidth:barW, flexShrink:0,
                  }}
                >
                  {/* value label above bar */}
                  {showVal && (
                    <div style={{
                      position:'absolute', bottom:`calc(${hPct}% + 4px)`,
                      fontSize:9, fontFamily:'monospace', color:'#94a3b8',
                      whiteSpace:'nowrap', pointerEvents:'none',
                    }}>
                      {val}
                    </div>
                  )}

                  {/* pointer labels (i, j, pivot…) above bar */}
                  {pointerVars.map(([k, v]) => v === idx && (
                    <div key={k} style={{
                      position:'absolute', top:-22, fontSize:10,
                      fontFamily:'monospace', color:'#818cf8', fontWeight:700, whiteSpace:'nowrap',
                    }}>
                      {k}
                    </div>
                  ))}

                  {/* the bar itself */}
                  <motion.div
                    layout
                    animate={{
                      height: `${hPct}%`,
                      backgroundColor: fill,
                      borderColor: border,
                      boxShadow: glow,
                      scaleX: isActive ? 1.06 : 1,
                    }}
                    transition={{ type:'spring', stiffness:600, damping:32 }}
                    style={{
                      width:'100%', minHeight:3,
                      borderRadius: barW >= 14 ? '4px 4px 0 0' : '2px 2px 0 0',
                      border:'1px solid',
                      transformOrigin:'bottom',
                    }}
                  />

                  {/* index label below bar */}
                  {showIdx && (
                    <div style={{ fontSize:8, color:'#334155', marginTop:2, fontFamily:'monospace' }}>
                      {idx}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Pointer arrows row below bars ── */}
          {pointerVars.length > 0 && (
            <div style={{
              display:'flex', gap:`${gap}px`, paddingLeft:12, paddingRight:12,
              marginTop:4, position:'relative', height:28, flexShrink:0,
            }}>
              {array.map((_, idx) => {
                const ptrs = pointerVars.filter(([, v]) => v === idx)
                if (!ptrs.length) return <div key={idx} style={{ width:barW, minWidth:barW, flexShrink:0 }} />
                return (
                  <div key={idx} style={{ width:barW, minWidth:barW, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <AnimatePresence>
                      <motion.div
                        key={`arr-${ptrs.map(([k]) => k).join('-')}-${idx}`}
                        initial={{ opacity:0, y:-4 }}
                        animate={{ opacity:1, y:0 }}
                        exit={{ opacity:0 }}
                        transition={{ duration:0.2 }}
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1 }}
                      >
                        <div style={{ color:'#818cf8', fontSize:13, lineHeight:1 }}>↑</div>
                        <div style={{ color:'#818cf8', fontSize:9, fontFamily:'monospace', fontWeight:700, whiteSpace:'nowrap' }}>
                          {ptrs.map(([k]) => k).join('/')}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Legend ── */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8, flexShrink:0 }}>
          {Object.entries(STATE_COLORS).map(([key, { border, label }]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:border, flexShrink:0 }} />
              <span style={{ color:'#64748b', fontSize:10, fontFamily:'monospace' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}