// File: src/store/useVisualizerStore.js
import { create } from 'zustand'

const useVisualizerStore = create((set, get) => ({
  activeAlgorithm: 'bubbleSort',
  // FIXED: one canonical field — was split "visualizerMode" vs "visualizationMode"
  visualizerMode: 'sorting',

  steps: [],
  currentStep: 0,
  isPlaying: false,
  playbackSpeed: 1,
  totalSteps: 0,

  variables:   [],
  stackFrames: [],
  heapObjects: [],

  inputData:    [64, 34, 25, 12, 22, 11, 90], 
  searchTarget: 25,
  customCode:   '',

  comparisons: 0,
  swaps:       0,
  accesses:    0,

  setActiveAlgorithm: (algo) => set({ activeAlgorithm: algo }),

  // FIXED: both names point to same setter so App.jsx and ControlPanel both work
  setVisualizerMode:    (mode) => get()._setMode(mode),
  setVisualizationMode: (mode) => get()._setMode(mode),
  _setMode: (mode) => set({
    visualizerMode: mode,
    steps: [], currentStep: 0, isPlaying: false,
    variables: [], stackFrames: [], heapObjects: [],
    comparisons: 0, swaps: 0, accesses: 0,
  }),

  setSteps: (steps) => set({
    steps,
    totalSteps:  steps.length,
    currentStep: 0,
    isPlaying:   false,
  }),

  setCurrentStep: (idx) => {
    const { steps } = get()
    const i = Math.max(0, Math.min(idx, steps.length - 1))
    const snap = steps[i] || {}
    set({
      currentStep: i,
      variables:   snap.variables   || [],
      stackFrames: snap.stackFrames || [],
      heapObjects: snap.heapObjects || [],
      comparisons: snap.comparisons || 0,
      swaps:       snap.swaps       || 0,
      accesses:    snap.accesses    || 0,
    })
  },

  stepForward: () => {
    const { currentStep, steps } = get()
    if (currentStep < steps.length - 1) get().setCurrentStep(currentStep + 1)
    else set({ isPlaying: false })
  },

  stepBack: () => {
    const { currentStep } = get()
    if (currentStep > 0) get().setCurrentStep(currentStep - 1)
  },

  setIsPlaying:     (v) => set({ isPlaying: v }),
  setPlaybackSpeed: (v) => set({ playbackSpeed: v }),
  setInputData:     (d) => set({ inputData: d }),
  setSearchTarget:  (t) => set({ searchTarget: t }),
  setCustomCode:    (c) => set({ customCode: c }),

  reset: () => set({
    steps: [], currentStep: 0, isPlaying: false,
    variables: [], stackFrames: [], heapObjects: [],
    comparisons: 0, swaps: 0, accesses: 0, totalSteps: 0,
  }),
}))

export default useVisualizerStore