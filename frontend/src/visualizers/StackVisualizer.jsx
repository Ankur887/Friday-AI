// File: src/visualizers/StackVisualizer.jsx
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

export default function StackVisualizer() {
  const { steps, currentStep } = useVisualizerStore()
  const step = steps[currentStep] || {}

  const stack   = step.stack   ?? []
  const op      = step.op      ?? ''
  const val     = step.val     ?? null
  const message = step.description ?? step.message ?? ''
  const size    = step.size    ?? stack.length

  if (stack.length === 0 && !message) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2">
        <div className="text-3xl">📚</div>
        <p>Press <strong className="text-blue-400">Visualize</strong> to animate stack operations</p>
      </div>
    )
  }

  const opColors = {
    push: { text: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
    pop:  { text: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30' },
    peek: { text: 'text-yellow-400',  bg: 'bg-yellow-400/10',  border: 'border-yellow-400/30' },
  }
  const opStyle = opColors[op] || { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30' }

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      {/* Stats */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 min-w-[64px]">
          <span className="text-lg font-mono font-bold text-blue-400">{size}</span>
          <span className="text-[10px] text-slate-500">Size</span>
        </div>
        {op && (
          <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border min-w-[80px] ${opStyle.bg} ${opStyle.border}`}>
            <span className={`text-lg font-mono font-bold uppercase ${opStyle.text}`}>{op}</span>
            <span className="text-[10px] text-slate-500">Operation</span>
          </div>
        )}
        {val !== null && (
          <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 min-w-[64px]">
            <span className="text-lg font-mono font-bold text-purple-400">"{val}"</span>
            <span className="text-[10px] text-slate-500">Value</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={message} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="text-xs text-cyan-300 font-mono min-h-[1.2rem]">{message}</motion.p>
      </AnimatePresence>

      {/* Stack visualization */}
      <div className="flex-1 flex items-end justify-center pb-4">
        <div className="flex flex-col-reverse gap-1 items-center" style={{ minWidth: 160 }}>
          {/* Bottom border */}
          <div className="w-48 h-0.5 bg-cyan-500/60 rounded-full" />

          <AnimatePresence>
            {stack.map((item, idx) => {
              const isTop = idx === stack.length - 1
              return (
                <motion.div
                  key={`${item}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="relative w-40 rounded-lg font-mono text-center py-2.5 border"
                  style={{
                    background: isTop ? '#312e81' : '#1e293b',
                    borderColor: isTop ? '#6366f1' : '#334155',
                    color: isTop ? '#c4b5fd' : '#94a3b8',
                    boxShadow: isTop ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
                  }}
                >
                  {item}
                  {isTop && (
                    <span className="absolute -right-16 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-mono whitespace-nowrap">
                      ← top
                    </span>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {stack.length === 0 && (
            <div className="w-40 py-2.5 rounded-lg text-center text-slate-600 font-mono text-sm border border-dashed border-slate-700">
              (empty)
            </div>
          )}
          <span className="text-[10px] text-slate-500 mt-1">bottom</span>
        </div>
      </div>
    </div>
  )
}