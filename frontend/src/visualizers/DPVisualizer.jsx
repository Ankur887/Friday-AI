// File: src/visualizers/DPVisualizer.jsx
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

export default function DPVisualizer() {
  const { steps, currentStep } = useVisualizerStore()
  const step = steps[currentStep] || {}

  const dp      = step.dp    ?? []
  const s1      = step.s1    ?? ''
  const s2      = step.s2    ?? ''
  const ci      = step.ci    ?? -1
  const cj      = step.cj    ?? -1
  const match   = step.match ?? false
  const message = step.description ?? step.message ?? ''

  if (!dp.length) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2">
        <div className="text-3xl">🧮</div>
        <p>Press <strong className="text-blue-400">Visualize</strong> to see the LCS DP table</p>
      </div>
    )
  }

  const m = dp.length - 1
  const n = (dp[0]?.length ?? 1) - 1
  const CELL = Math.min(40, Math.floor(Math.min(520 / (n + 2), 320 / (m + 2))))

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm font-mono font-bold text-cyan-400">"{s1}"</span>
          <span className="text-[10px] text-slate-500">s1</span>
        </div>
        <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span className="text-sm font-mono font-bold text-pink-400">"{s2}"</span>
          <span className="text-[10px] text-slate-500">s2</span>
        </div>
        {ci >= 0 && cj >= 0 && (
          <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border ${match ? 'bg-emerald-400/10 border-emerald-400/30' : 'bg-white/5 border-white/10'}`}>
            <span className={`text-sm font-mono font-bold ${match ? 'text-emerald-400' : 'text-slate-400'}`}>
              {match ? '✓ Match!' : '✗ No match'}
            </span>
            <span className="text-[10px] text-slate-500">s1[{ci-1}] vs s2[{cj-1}]</span>
          </div>
        )}
        {ci === m && cj === n && dp[m]?.[n] !== undefined && (
          <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-purple-400/10 border border-purple-400/30">
            <span className="text-lg font-mono font-bold text-purple-400">{dp[m][n]}</span>
            <span className="text-[10px] text-slate-500">LCS Length</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="text-xs text-cyan-300 font-mono min-h-[1.2rem]">{message}</motion.p>
      </AnimatePresence>

      {/* Table */}
      <div className="flex-1 overflow-auto flex items-start justify-center">
        <div className="font-mono">
          {/* Column headers */}
          <div className="flex" style={{ marginLeft: CELL + 4 }}>
            <div style={{ width: CELL, height: CELL }} />
            {s2.split('').map((c, j) => (
              <div key={j} style={{ width: CELL, height: CELL }}
                className="flex items-center justify-center text-pink-400 font-bold"
                style={{ width: CELL, height: CELL, fontSize: Math.max(10, CELL - 20) }}>
                {c}
              </div>
            ))}
          </div>

          {/* Rows */}
          {dp.map((row, i) => (
            <div key={i} className="flex items-center">
              {/* Row header */}
              <div style={{ width: CELL, height: CELL }}
                className="flex items-center justify-center font-bold"
                style={{ width: CELL, height: CELL, color: i === 0 ? '#475569' : '#06b6d4', fontSize: Math.max(10, CELL - 20) }}>
                {i === 0 ? '' : s1[i - 1]}
              </div>

              {row.map((val, j) => {
                const isActive = i === ci && j === cj
                const hasFill  = val > 0
                let bg = '#0f172a', border = '#1e293b', textColor = '#374151'
                if (isActive) { bg = '#312e81'; border = '#6366f1'; textColor = '#c4b5fd' }
                else if (hasFill) { bg = '#14532d'; border = '#10b981'; textColor = '#6ee7b7' }
                return (
                  <motion.div key={j}
                    animate={{ backgroundColor: bg, borderColor: border }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center border"
                    style={{ width: CELL, height: CELL, fontSize: Math.max(9, CELL - 22), color: textColor }}>
                    {val}
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}