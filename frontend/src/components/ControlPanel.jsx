import React, { useState, useEffect, useCallback } from 'react'
import useVisualizerStore from '../store/useVisualizerStore'
import {
  generateBubbleSortSteps, generateSelectionSortSteps,
  generateInsertionSortSteps, generateMergeSortSteps,
  generateQuickSortSteps, generateLinearSearchSteps,
  generateBinarySearchSteps, generateBFSSteps,
  generateDFSSteps, generateDijkstraSteps,
  generateLinkedListSteps, generateBSTSteps,
  generateStackSteps, generateHashMapSteps,
  generateFibonacciSteps, generateLCSSteps,
  generatePointerSteps,
} from '../utils/algorithms'

const DEFAULT_GRAPH_NODES = [
  { id: 0, label: 'A', x: 300, y: 80  },
  { id: 1, label: 'B', x: 150, y: 200 },
  { id: 2, label: 'C', x: 450, y: 200 },
  { id: 3, label: 'D', x: 80,  y: 340 },
  { id: 4, label: 'E', x: 250, y: 340 },
  { id: 5, label: 'F', x: 400, y: 340 },
  { id: 6, label: 'G', x: 530, y: 340 },
]
const DEFAULT_GRAPH_EDGES = [[0,1,4],[0,2,3],[1,3,2],[1,4,5],[2,5,6],[2,6,1],[4,5,3]]
const BST_ORDER   = [50, 30, 70, 20, 40, 60, 80]

function GraphInputBuilder({ nodes, setNodes, edges, setEdges }) {
  const [edgeInput, setEdgeInput] = useState('')   // "A-B:4"
  const [labelInput, setLabelInput] = useState('') // "A,B,C"
  const [err, setErr] = useState('')

  // Rebuild nodes from comma-separated labels, preserve x/y if label already exists
  function applyLabels() {
    setErr('')
    const labels = labelInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    if (labels.length < 2) return setErr('Need at least 2 nodes')
    if (labels.length > 10) return setErr('Max 10 nodes')

    // Layout: arrange in a circle
    const cx = 300, cy = 210, rx = 200, ry = 150
    const newNodes = labels.map((label, i) => {
      const existing = nodes.find(n => n.label === label)
      if (existing) return { ...existing, id: i }
      const angle = (2 * Math.PI * i) / labels.length - Math.PI / 2
      return { id: i, label, x: Math.round(cx + rx * Math.cos(angle)), y: Math.round(cy + ry * Math.sin(angle)) }
    })
    setNodes(newNodes)
    // Drop edges that reference removed nodes
    const validIds = new Set(newNodes.map(n => n.id))
    setEdges(edges.filter(([u, v]) => validIds.has(u) && validIds.has(v)))
  }

  function addEdge() {
    setErr('')
    // Format: "A-B" or "A-B:5"
    const match = edgeInput.trim().toUpperCase().match(/^([A-Z]+)-([A-Z]+)(?::(\d+))?$/)
    if (!match) return setErr('Format: A-B or A-B:5')
    const [, la, lb, w] = match
    const u = nodes.find(n => n.label === la)
    const v = nodes.find(n => n.label === lb)
    if (!u) return setErr(`Node "${la}" not found`)
    if (!v) return setErr(`Node "${lb}" not found`)
    if (u.id === v.id) return setErr('Self-loops not allowed')
    const dup = edges.find(([a, b]) => (a === u.id && b === v.id) || (a === v.id && b === u.id))
    if (dup) return setErr('Edge already exists')
    setEdges([...edges, [u.id, v.id, w ? parseInt(w) : undefined]])
    setEdgeInput('')
  }

  function removeEdge(i) { setEdges(edges.filter((_, j) => j !== i)) }

  function reset() {
    setNodes(DEFAULT_GRAPH_NODES)
    setEdges(DEFAULT_GRAPH_EDGES)
    setLabelInput('')
    setEdgeInput('')
    setErr('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>

      {/* Node labels */}
      <input
        value={labelInput}
        onChange={e => setLabelInput(e.target.value)}
        placeholder="Nodes: A,B,C,D"
        style={{ ...S.input, width: 130 }}
        onKeyDown={e => e.key === 'Enter' && applyLabels()}
      />
      <button onClick={applyLabels} style={{ ...S.input, cursor: 'pointer', padding: '4px 8px' }}>Set</button>

      <div style={{ width: 1, height: 22, background: '#1e2d45' }} />

      {/* Edge input */}
      <input
        value={edgeInput}
        onChange={e => setEdgeInput(e.target.value)}
        placeholder="Edge: A-B or A-B:4"
        style={{ ...S.input, width: 130 }}
        onKeyDown={e => e.key === 'Enter' && addEdge()}
      />
      <button onClick={addEdge} style={{ ...S.input, cursor: 'pointer', padding: '4px 8px' }}>+ Edge</button>

      {/* Edge chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 300 }}>
        {edges.map(([u, v, w], i) => {
          const ul = nodes[u]?.label ?? u, vl = nodes[v]?.label ?? v
          return (
            <span key={i} style={{ background: '#1e2d45', color: '#94a3b8', borderRadius: 4, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              {ul}-{vl}{w != null ? `:${w}` : ''}
              <span onClick={() => removeEdge(i)} style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 700 }}>×</span>
            </span>
          )
        })}
      </div>

      {err && <span style={{ color: '#ef4444', fontSize: 11 }}>{err}</span>}

      <button onClick={reset} style={{ ...S.input, cursor: 'pointer', padding: '4px 8px', color: '#94a3b8' }}>↺</button>
    </div>
  )
}

const MODES = [
  { id: 'sorting',    label: 'Sorting',     icon: '📊', algos: ['bubbleSort','selectionSort','insertionSort','mergeSort','quickSort'] },
  { id: 'searching',  label: 'Search',      icon: '🔍', algos: ['linearSearch','binarySearch'] },
  { id: 'linkedlist', label: 'Linked List', icon: '🔗', algos: ['linkedList'] },
  { id: 'tree',       label: 'Tree / BST',  icon: '🌳', algos: ['bstInsert'] },
  { id: 'graph',      label: 'Graph',       icon: '🕸', algos: ['bfs','dfs','dijkstra'] },
  { id: 'stack',      label: 'Stack',       icon: '📚', algos: ['stack'] },
  { id: 'hashmap',    label: 'Hash Map',    icon: '#',  algos: ['hashMap'] },
  { id: 'pointer',    label: 'Pointers',    icon: '→',  algos: ['pointerDemo'] },
  { id: 'recursion',  label: 'Recursion',   icon: '♻',  algos: ['fibonacci'] },
  { id: 'dp',         label: 'Dynamic Prog',icon: '🧮', algos: ['lcs'] },
]

const ALGO_LABELS = {
  bubbleSort:'Bubble Sort', selectionSort:'Selection Sort',
  insertionSort:'Insertion Sort', mergeSort:'Merge Sort', quickSort:'Quick Sort',
  linearSearch:'Linear Search', binarySearch:'Binary Search',
  linkedList:'Linked List Demo',
  bstInsert:'BST Insert & Traverse',
  bfs:'BFS', dfs:'DFS', dijkstra:'Dijkstra',
  stack:'Stack Demo',
  hashMap:'Hash Map Demo',
  pointerDemo:'Pointer Demo',
  fibonacci:'Fibonacci',
  lcs:'LCS (DP)',
}

export default function ControlPanel() {
  const {
    activeAlgorithm, setActiveAlgorithm,
    visualizerMode,  setVisualizerMode,
    inputData,       setInputData,
    searchTarget,    setSearchTarget,
    setSteps,
  } = useVisualizerStore()

  const [rawInput,  setRawInput]  = useState(inputData.join(', '))
  const [targetVal, setTargetVal] = useState(String(searchTarget))

  const currentMode = MODES.find(m => m.id === visualizerMode) || MODES[0]

  const buildAndRun = useCallback((algo, overrideArr, overrideTgt) => {
    const arr = overrideArr
      || rawInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
    const tgt = overrideTgt ?? (parseInt(targetVal) || 25)

    let steps = []
    try {
      switch (algo) {
        case 'bubbleSort':    steps = generateBubbleSortSteps([...arr]);    break
        case 'selectionSort': steps = generateSelectionSortSteps([...arr]); break
        case 'insertionSort': steps = generateInsertionSortSteps([...arr]); break
        case 'mergeSort':     steps = generateMergeSortSteps([...arr]);     break
        case 'quickSort':     steps = generateQuickSortSteps([...arr]);     break
        case 'linearSearch':
          steps = generateLinearSearchSteps([...arr], tgt)
          break
        case 'binarySearch':
          steps = generateBinarySearchSteps([...arr].sort((a,b) => a-b), tgt)
          break
        case 'bfs':      steps = generateBFSSteps(GRAPH_NODES, GRAPH_EDGES);      break
        case 'dfs':      steps = generateDFSSteps(GRAPH_NODES, GRAPH_EDGES);      break
        case 'dijkstra': steps = generateDijkstraSteps(GRAPH_NODES, GRAPH_EDGES); break
        case 'linkedList':  steps = generateLinkedListSteps(); break
        case 'bstInsert':   steps = generateBSTSteps(BST_ORDER); break
        case 'stack':       steps = generateStackSteps();      break
        case 'hashMap':     steps = generateHashMapSteps();    break
        case 'pointerDemo': steps = generatePointerSteps();    break
        case 'fibonacci': steps = generateFibonacciSteps(Math.min(tgt || 6, 8)); break
        case 'lcs':       steps = generateLCSSteps('ABCBDAB', 'BDCAB');          break

        default: steps = generateBubbleSortSteps([...arr])
      }
    } catch (err) {
      console.error(`[ControlPanel] step generation failed for "${algo}":`, err)
      steps = []
    }

    setSteps(steps)
    setInputData(arr)
    setSearchTarget(tgt)
  }, [rawInput, targetVal, setSteps, setInputData, setSearchTarget])

  // auto-run bubble sort on first mount
  useEffect(() => { buildAndRun('bubbleSort') }, []) // eslint-disable-line

  function handleModeChange(mode) {
    const first = MODES.find(m => m.id === mode)?.algos[0] || 'bubbleSort'
    setVisualizerMode(mode)
    setActiveAlgorithm(first)
    setTimeout(() => buildAndRun(first), 0)
  }

  function handleAlgoChange(algo) {
    setActiveAlgorithm(algo)
    buildAndRun(algo)
  }

  function randomize() {
    const arr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 90) + 10)
    setRawInput(arr.join(', '))
    buildAndRun(activeAlgorithm, arr)
  }

  const btnBase = {
    fontSize: 11, padding: '4px 10px', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'6px 14px', flexWrap:'wrap',
      borderBottom:'1px solid #1e2d45',
      background:'rgba(15,23,42,0.8)',
    }}>

      {/* ── mode tabs ── */}
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => handleModeChange(m.id)}
          style={{
            ...btnBase,
            background: visualizerMode === m.id ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
            border:     `1px solid ${visualizerMode === m.id ? '#3b82f6' : '#1e2d45'}`,
            color:      visualizerMode === m.id ? '#60a5fa' : '#64748b',
          }}
        >
          {m.icon} {m.label}
        </button>
      ))}

      <div style={{ width:1, height:24, background:'#1e2d45', flexShrink:0 }} />

      {/* ── algorithm dropdown ── */}
      <select
        value={activeAlgorithm}
        onChange={e => handleAlgoChange(e.target.value)}
        style={{
          background:'#1a2235', border:'1px solid #1e2d45',
          color:'#e2e8f0', fontSize:12, padding:'4px 8px',
          borderRadius:8, outline:'none',
        }}
      >
        {currentMode.algos.map(a => (
          <option key={a} value={a}>{ALGO_LABELS[a] || a}</option>
        ))}
      </select>

      {/* ── array input (sorting + searching) ── */}
      {['sorting','searching'].includes(visualizerMode) && (
        <>
          <input
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder="e.g. 5, 3, 8, 1"
            style={{
              background:'#1a2235', border:'1px solid #1e2d45',
              color:'#e2e8f0', fontSize:12, padding:'4px 8px',
              borderRadius:8, outline:'none', width:190,
            }}
          />
          <button
            onClick={randomize}
            style={{ ...btnBase, background:'rgba(139,92,246,0.2)', border:'1px solid #8b5cf6', color:'#a78bfa' }}
          >
            🎲 Random
          </button>
        </>
      )}

      {/* ── search target ── */}
      {visualizerMode === 'searching' && (
        <input
          value={targetVal}
          onChange={e => setTargetVal(e.target.value)}
          placeholder="Target"
          style={{
            background:'#1a2235', border:'1px solid #1e2d45',
            color:'#e2e8f0', fontSize:12, padding:'4px 8px',
            borderRadius:8, outline:'none', width:72,
          }}
        />
      )}

      {/* ── fibonacci n ── */}
      {visualizerMode === 'recursion' && (
        <input
          value={targetVal}
          onChange={e => setTargetVal(e.target.value)}
          placeholder="n (max 8)"
          style={{
            background:'#1a2235', border:'1px solid #1e2d45',
            color:'#e2e8f0', fontSize:12, padding:'4px 8px',
            borderRadius:8, outline:'none', width:80,
          }}
        />
      )}

      {/* ── visualize button ── */}
      <button
        onClick={() => buildAndRun(activeAlgorithm)}
        style={{
          ...btnBase, marginLeft:'auto',
          padding:'6px 20px', fontSize:13,
          background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',
          border:'none', color:'#fff',
          boxShadow:'0 0 14px rgba(59,130,246,0.4)',
        }}
      >
        ▶ Visualize
      </button>
    </div>
  )
}