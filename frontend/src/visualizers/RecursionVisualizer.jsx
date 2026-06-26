// File: src/visualizers/RecursionVisualizer.jsx
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

export default function RecursionVisualizer() {
  const { steps, currentStep } = useVisualizerStore()
  const step = steps[currentStep] || {}

  const tree    = step.tree    ?? []
  const current = step.current ?? -1
  const message = step.description ?? step.message ?? ''

  // Layout: group by depth, spread horizontally
  const positioned = useMemo(() => {
    if (!tree.length) return []
    const byDepth = {}
    for (const n of tree) {
      (byDepth[n.depth] = byDepth[n.depth] || []).push(n)
    }
    const maxDepth = Math.max(...tree.map(n => n.depth))
    const W = 560, levelH = Math.min(80, (340) / (maxDepth + 1))
    const placed = []
    for (const [d, nodes] of Object.entries(byDepth)) {
      const depth = parseInt(d)
      nodes.forEach((n, i) => {
        placed.push({
          ...n,
          sx: 40 + (i + 0.5) * ((W - 80) / nodes.length),
          sy: 40 + depth * levelH,
        })
      })
    }
    return placed
  }, [tree])

  const nodeById = useMemo(() => Object.fromEntries(positioned.map(n => [n.id, n])), [positioned])

  if (!tree.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2">
        <div className="text-3xl">♻️</div>
        <p>Press <strong className="text-blue-400">Visualize</strong> to see the recursion tree</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      <AnimatePresence mode="wait">
        <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="text-xs text-cyan-300 font-mono min-h-[1.2rem]">{message}</motion.p>
      </AnimatePresence>

      <div className="flex-1">
        <svg width="100%" height="100%" viewBox="0 0 560 360" className="overflow-visible">
          {/* Edges */}
          {positioned.map(n => {
            if (n.parentId < 0) return null
            const p = nodeById[n.parentId]
            if (!p) return null
            return (
              <line key={`e-${n.id}`} x1={p.sx} y1={p.sy} x2={n.sx} y2={n.sy}
                stroke="#334155" strokeWidth={1} />
            )
          })}

          {/* Nodes */}
          {positioned.map(n => {
            const isActive = n.id === current
            const isDone   = n.result !== null
            const fill   = isActive ? '#312e81' : isDone ? '#14532d' : '#1e293b'
            const stroke = isActive ? '#6366f1' : isDone ? '#10b981' : '#334155'
            const text   = isActive ? '#c4b5fd' : isDone ? '#6ee7b7' : '#94a3b8'
            return (
              <g key={n.id}>
                <circle cx={n.sx} cy={n.sy} r={22} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={n.sx} y={n.sy + 3} textAnchor="middle" fill={text}
                  fontSize={11} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  f({n.n})
                </text>
                {n.result !== null && (
                  <text x={n.sx} y={n.sy + 34} textAnchor="middle" fill="#10b981"
                    fontSize={10} fontFamily="JetBrains Mono, monospace">
                    ={n.result}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex gap-3 text-[10px] justify-center">
        {[
          { color: '#6366f1', label: 'Active call' },
          { color: '#10b981', label: 'Returned' },
          { color: '#334155', label: 'Pending' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: l.color }} />
            <span className="text-slate-400">{l.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}