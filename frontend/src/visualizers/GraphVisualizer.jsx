// File: src/visualizers/GraphVisualizer.jsx
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

export default function GraphVisualizer() {
  const { steps, currentStep } = useVisualizerStore()
  const step = steps[currentStep] || {}

  const nodes      = step.nodes      ?? []
  const edges      = step.edges      ?? []
  const visited    = step.visited    ?? []
  const current    = step.current    ?? -1
  const activeEdge = step.activeEdge ?? null
  const order      = step.order      ?? []
  const queue      = step.queue      ?? step.stack ?? []
  const dist       = step.dist       ?? null
  const message    = step.description ?? step.message ?? ''

  function nodeStyle(n) {
    if (n.id === current)        return { fill: '#312e81', stroke: '#6366f1', text: '#c4b5fd', r: 26 }
    if (queue.includes(n.id))    return { fill: '#1a2744', stroke: '#3b82f6', text: '#93c5fd', r: 24 }
    if (visited.includes(n.id))  return { fill: '#14532d', stroke: '#10b981', text: '#6ee7b7', r: 24 }
    return                              { fill: '#1e293b', stroke: '#334155', text: '#94a3b8', r: 22 }
  }

  function edgeStyle(u, v) {
    const isActive = activeEdge && ((activeEdge[0] === u && activeEdge[1] === v) || (activeEdge[0] === v && activeEdge[1] === u))
    const inOrder  = order.includes(u) && order.includes(v)
    return {
      stroke: isActive ? '#6366f1' : inOrder ? 'rgba(99,102,241,0.5)' : '#334155',
      width:  isActive ? 3 : inOrder ? 2 : 1.5,
    }
  }

  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2">
        <div className="text-3xl">🕸</div>
        <p>Press <strong className="text-blue-400">Visualize</strong> to traverse the graph</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-3">
      {/* Stats row */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Visited', value: visited.length, color: 'text-emerald-400' },
          { label: 'Queue/Stack', value: queue.length, color: 'text-blue-400' },
          { label: 'Order', value: order.map(i => nodes[i]?.label ?? i).join('→') || '—', color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center px-3 py-1 rounded-lg bg-white/5 border border-white/10 min-w-[80px]">
            <span className={`text-sm font-mono font-bold ${s.color} truncate max-w-[160px]`}>{s.value}</span>
            <span className="text-[10px] text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="text-xs text-cyan-300 font-mono min-h-[1.2rem]">{message}</motion.p>
      </AnimatePresence>

      <div className="flex-1">
        <svg width="100%" height="100%" viewBox="0 0 600 380" className="overflow-visible">
          {/* Edges */}
          {edges.map(([u, v, w], i) => {
            const na = nodes[u], nb = nodes[v]
            if (!na || !nb) return null
            const { stroke, width } = edgeStyle(u, v)
            const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2
            return (
              <g key={i}>
                <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={stroke} strokeWidth={width} />
                {w != null && (
                  <text x={mx} y={my - 5} textAnchor="middle" fill="#64748b" fontSize={10}
                    fontFamily="JetBrains Mono, monospace">{w}</text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const { fill, stroke, text, r } = nodeStyle(n)
            const d = dist?.[n.id]
            return (
              <g key={n.id}>
                {d !== undefined && (
                  <text x={n.x} y={n.y - r - 6} textAnchor="middle" fill="#64748b" fontSize={10}
                    fontFamily="JetBrains Mono, monospace">
                    {d === Infinity ? '∞' : d}
                  </text>
                )}
                <circle cx={n.x} cy={n.y} r={r} fill={fill} stroke={stroke} strokeWidth={1.5} />
                <text x={n.x} y={n.y + 5} textAnchor="middle" fill={text} fontSize={13}
                  fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                  {n.label}
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
          { color: '#3b82f6', label: 'Queue/Stack' },
          { color: '#10b981', label: 'Visited' },
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