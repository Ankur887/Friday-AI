// File: src/components/MemoryPanel.jsx
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

export default function MemoryPanel() {
  const { stackFrames, heapObjects } = useVisualizerStore()

  return (
    <div className="h-full flex flex-col text-xs font-mono">
      {/* Stack */}
      <Section
        title="STACK"
        dot="bg-cyan-400"
        count={stackFrames.length}
        countLabel="frame(s)"
        empty={!stackFrames.length}
        emptyText="No stack frames"
      >
        <AnimatePresence>
          {stackFrames.map(frame => (
            <motion.div key={frame.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="rounded-lg border mb-2 overflow-hidden"
              style={{
                background: frame.active ? 'rgba(6,182,212,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor: frame.active ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.06)',
              }}>
              {/* Frame header */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 border-b"
                style={{ borderColor: frame.active ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)' }}>
                <div className={`w-1.5 h-1.5 rounded-full ${frame.active ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                <span style={{ color: frame.active ? '#06b6d4' : '#64748b' }} className="font-bold">
                  {frame.name}
                </span>
              </div>
              {/* Frame vars */}
              {frame.vars?.length > 0 && (
                <div className="px-2.5 py-1.5 space-y-0.5">
                  {frame.vars.map((v, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <span className="text-slate-500">{v.name}</span>
                      <span className="text-slate-300 truncate max-w-[100px]">{String(v.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </Section>

      <div className="border-t border-gray-800/40" />

      {/* Heap */}
      <Section
        title="HEAP"
        dot="bg-emerald-400"
        count={heapObjects.length}
        countLabel="object(s)"
        empty={!heapObjects.length}
        emptyText="No heap objects"
      >
        <AnimatePresence>
          {heapObjects.map(obj => (
            <motion.div key={obj.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border mb-2 overflow-hidden"
              style={{
                background: 'rgba(16,185,129,0.04)',
                borderColor: 'rgba(16,185,129,0.2)',
              }}>
              <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-emerald-400/10">
                <span className="text-emerald-400 font-bold">{obj.type}</span>
                <span className="text-slate-600 text-[10px]">#{obj.id}</span>
              </div>
              <div className="px-2.5 py-1.5">
                {Array.isArray(obj.value) ? (
                  obj.value.length > 0 && typeof obj.value[0] === 'object' ? (
                    // table of entries (hash map)
                    obj.value.slice(0, 4).map((bucket, i) => (
                      bucket.length > 0 && (
                        <div key={i} className="text-slate-400 truncate">
                          [{i}]: {bucket.map(([k, v]) => `${k}→${v}`).join(', ')}
                        </div>
                      )
                    ))
                  ) : (
                    <span className="text-slate-300">[{obj.value.slice(0, 8).join(', ')}{obj.value.length > 8 ? '…' : ''}]</span>
                  )
                ) : typeof obj.value === 'object' && obj.value !== null ? (
                  Object.entries(obj.value).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-slate-300">{String(v)}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-300">{String(obj.value)}</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </Section>
    </div>
  )
}

function Section({ title, dot, count, countLabel, empty, emptyText, children }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/40 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-[10px] font-bold tracking-widest text-gray-500">{title}</span>
        <span className="ml-auto text-[10px] text-gray-600">{count} {countLabel}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {empty
          ? <p className="text-gray-600 text-center mt-4 text-[11px]">{emptyText}</p>
          : children}
      </div>
    </div>
  )
}