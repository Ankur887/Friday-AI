// File: src/components/VariablePanel.jsx
import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

export default function VariablePanel() {
  const { variables, comparisons, swaps, accesses, steps, currentStep } = useVisualizerStore()
  const step = steps[currentStep] || {}

  const stats = [
    { label: 'Compares', value: comparisons, color: '#f59e0b' },
    { label: 'Swaps',    value: swaps,        color: '#ef4444' },
    { label: 'Accesses', value: accesses,     color: '#60a5fa' },
    { label: `${currentStep + 1}/${steps.length || 1}`, value: null, isStep: true, color: '#a78bfa' },
  ]

  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* Title row + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0, fontFamily: 'monospace' }}>
          Variables
        </span>
        <div style={{ height: 1, flex: 1, background: 'rgba(30,45,69,0.6)' }} />

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: s.color }}>
                {s.isStep ? s.label : s.value}
              </span>
              {!s.isStep && (
                <span style={{ fontSize: 10, color: '#4b5563', fontFamily: 'monospace' }}>{s.label}</span>
              )}
              {s.isStep && (
                <span style={{ fontSize: 10, color: '#4b5563', fontFamily: 'monospace' }}>Step</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step message */}
      {(step.description || step.message) && (
        <p style={{ fontSize: 12, color: 'rgba(103,232,249,0.8)', fontFamily: 'monospace', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {step.description ?? step.message}
        </p>
      )}

      {/* Variable cards */}
      {variables.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <AnimatePresence>
            {variables.map(v => (
              <motion.div
                key={v.name}
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                exit={{    scale: 0.9, opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '4px 10px', borderRadius: 8,
                  fontFamily: 'monospace', fontSize: 12,
                  background:   v.changed ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border:      `1px solid ${v.changed ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow:    v.changed ? '0 0 8px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <span style={{ color: '#67e8f9' }}>{v.name}</span>
                <span style={{ color: '#334155' }}>=</span>
                <span style={{ color: '#fde68a', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.value}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p style={{ fontSize: 11, color: '#374151', margin: 0, fontFamily: 'monospace' }}>
          No variables tracked yet — press Visualize to start
        </p>
      )}
    </div>
  )
}


//  <div style={{ width: 210, flexShrink: 0, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
//           <div style={{ flex: '0 0 25%', borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
//             <VariablesPanel vars={step.vars} />
//           </div>
//           <div style={{ flex: '0 0 25%', borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
//             <StackPanel stackFrame={step.stackFrame} />
//           </div>
//           <div style={{ flex: '0 0 25%', borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
//             <HeapPanel heap={step.heap} listType={step.listType} />
//           </div>
//           <div style={{ flex: '0 0 25%', overflow: 'hidden' }}>
//             <TimelinePanel steps={steps} currentStep={currentStep} onJump={handleJump} />
//           </div>
//         </div>