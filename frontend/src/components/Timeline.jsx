// File: src/components/Timeline.jsx
import { useEffect, useRef } from 'react'
import useVisualizerStore from '../store/useVisualizerStore'

const SPEEDS = { 0.25: 1600, 0.5: 800, 1: 400, 2: 200, 4: 80 }
const SPEED_LABELS = [0.25, 0.5, 1, 2, 4]

export default function Timeline() {
  const {
    steps, currentStep, isPlaying, playbackSpeed,
    setCurrentStep, setIsPlaying, setPlaybackSpeed,
    stepForward, stepBack,
  } = useVisualizerStore()

  const timerRef = useRef(null)
  const total = steps.length

  // Playback loop
  useEffect(() => {
    clearInterval(timerRef.current)
    if (!isPlaying) return
    const delay = SPEEDS[playbackSpeed] ?? 400
    timerRef.current = setInterval(() => {
      const { currentStep: cs, steps: ss, setIsPlaying: sip } = useVisualizerStore.getState()
      if (cs < ss.length - 1) {
        useVisualizerStore.getState().setCurrentStep(cs + 1)
      } else {
        clearInterval(timerRef.current)
        sip(false)
      }
    }, delay)
    return () => clearInterval(timerRef.current)
  }, [isPlaying, playbackSpeed])

  const pct = total > 1 ? (currentStep / (total - 1)) * 100 : 0
  const step = steps[currentStep] || {}

  return (
    <div className="border-t border-gray-800/60 bg-gray-900/80 px-4 py-2 flex flex-col gap-2 flex-shrink-0">
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-gray-800 cursor-pointer"
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          setCurrentStep(Math.round(ratio * (total - 1)))
        }}>
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
          style={{ width: `${pct}%` }} />
        {/* Thumb */}
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-blue-400 shadow-lg transition-all"
          style={{ left: `calc(${pct}% - 6px)` }} />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Restart */}
        <Btn onClick={() => { setIsPlaying(false); setCurrentStep(0) }} title="Restart">⟳</Btn>

        {/* Step back */}
        <Btn onClick={stepBack} disabled={currentStep === 0} title="Previous step">◀</Btn>

        {/* Play / Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!total}
          title={isPlaying ? 'Pause' : 'Play'}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold transition-all shadow-lg"
          style={{
            background: isPlaying ? 'linear-gradient(135deg,#ef4444,#f97316)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            boxShadow: isPlaying ? '0 0 14px rgba(239,68,68,0.4)' : '0 0 14px rgba(59,130,246,0.4)',
            opacity: !total ? 0.4 : 1,
          }}>
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Step forward */}
        <Btn onClick={stepForward} disabled={currentStep >= total - 1} title="Next step">▶</Btn>

        {/* Step counter */}
        <span className="text-xs text-gray-500 font-mono min-w-[80px]">
          {total ? `${currentStep + 1} / ${total}` : '— / —'}
        </span>

        {/* Step message */}
        <span className="flex-1 text-xs text-cyan-300 font-mono truncate">
          {step.description ?? step.message ?? ''}
        </span>

        {/* Speed selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-gray-500">Speed</span>
          {SPEED_LABELS.map(s => (
            <button key={s}
              onClick={() => setPlaybackSpeed(s)}
              className="px-2 py-0.5 rounded text-[10px] font-mono transition-colors"
              style={{
                background: playbackSpeed === s ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${playbackSpeed === s ? '#6366f1' : '#1e2d45'}`,
                color: playbackSpeed === s ? '#a5b4fc' : '#64748b',
              }}>
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Btn({ children, onClick, disabled, title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: disabled ? '#374151' : '#94a3b8',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}>
      {children}
    </button>
  )
}