// File: src/visualizers/TreeVisualizer.jsx
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

export default function TreeVisualizer() {
  const { steps, currentStep } = useVisualizerStore()
  const step = steps[currentStep] || {}

  const nodes   = step.nodes    ?? []
  const edges   = step.edges    ?? []
  const current = step.current  ?? -1
  const visited = step.visited  ?? []
  const path    = step.path     ?? []
  const message = step.description ?? step.message ?? ''

  const W = 560, H = 380

  // Scale node positions to fit SVG viewport
  const scaledNodes = useMemo(() => {
    if (!nodes.length) return []
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y)
    const minX = Math.min(...xs), maxX = Math.max(...xs)
    const minY = Math.min(...ys), maxY = Math.max(...ys)
    const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1
    return nodes.map(n => ({
      ...n,
      sx: 40 + ((n.x - minX) / rangeX) * (W - 80),
      sy: 40 + ((n.y - minY) / rangeY) * (H - 80),
    }))
  }, [nodes])

  const nodeById = useMemo(() => Object.fromEntries(scaledNodes.map(n => [n.id, n])), [scaledNodes])

  function nodeColor(n) {
    if (n.id === current) return { fill: '#312e81', stroke: '#6366f1', text: '#c4b5fd' }
    const isNew = visited.length && visited[visited.length - 1] === n.id
    if (isNew)            return { fill: '#14532d', stroke: '#10b981', text: '#6ee7b7' }
    if (visited.includes(n.id)) return { fill: '#1e3a5f', stroke: '#3b82f6', text: '#93c5fd' }
    if (path.includes(n.id))    return { fill: '#2d1b69', stroke: '#7c3aed', text: '#a78bfa' }
    return { fill: '#1e293b', stroke: '#334155', text: '#94a3b8' }
  }

  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2">
        <div className="text-3xl">🌳</div>
        <p>Press <strong className="text-blue-400">Visualize</strong> to build the BST</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      <AnimatePresence mode="wait">
        <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="text-xs text-cyan-300 font-mono min-h-[1.2rem]">{message}</motion.p>
      </AnimatePresence>

      <div className="flex-1 flex items-center justify-center">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
          {/* Edges */}
          {edges.map((e, i) => {
            const a = nodeById[e.from], b = nodeById[e.to]
            if (!a || !b) return null
            const inPath = path.includes(e.from) && path.includes(e.to)
            return (
              <line key={i} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                stroke={inPath ? '#6366f1' : '#334155'}
                strokeWidth={inPath ? 2 : 1.5}
                strokeOpacity={0.8}
              />
            )
          })}

          {/* Nodes */}
          {scaledNodes.map(n => {
            const { fill, stroke, text } = nodeColor(n)
            return (
              <g key={n.id}>
                <circle cx={n.sx} cy={n.sy} r={22} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={n.sx} y={n.sy + 5} textAnchor="middle"
                  fill={text} fontSize={13} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {n.val}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[10px] justify-center">
        {[
          { color: '#6366f1', label: 'Current' },
          { color: '#10b981', label: 'Just inserted' },
          { color: '#3b82f6', label: 'Visited' },
          { color: '#7c3aed', label: 'Path' },
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