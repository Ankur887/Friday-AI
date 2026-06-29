import { create } from 'zustand'

/**
 * Shared Zustand store for robot state.
 * Used by both App.jsx (Friday chat panel) and search.jsx (main chat).
 * The RobotScene component reads isThinking / isReacting to drive animations.
 */
const useRobotStore = create((set) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  isThinking: false,
  isReacting: false,
  isListening: false,
  robotState: 'idle',   // 'idle' | 'thinking' | 'talking' | 'listening' | 'error' | 'success'

  // ── Actions ────────────────────────────────────────────────────────────────
  setThinking: () => set({ isThinking: true,  isReacting: false, isListening: false, robotState: 'thinking' }),
  setTalking:  () => set({ isThinking: false, isReacting: true,  isListening: false, robotState: 'talking'  }),
  setIdle:     () => set({ isThinking: false, isReacting: false, isListening: false, robotState: 'idle'     }),
  setListening:() => set({ isThinking: false, isReacting: false, isListening: true,  robotState: 'listening'}),
  setError:    () => set({ isThinking: false, isReacting: false, isListening: false, robotState: 'error'    }),
  setSuccess:  () => set({ isThinking: false, isReacting: true,  isListening: false, robotState: 'success'  }),

  // Generic setter used by some components
  setRobotState: (state) => set({
    robotState:  state,
    isThinking:  state === 'thinking',
    isReacting:  state === 'talking' || state === 'success',
    isListening: state === 'listening',
  }),
}))

export default useRobotStore
