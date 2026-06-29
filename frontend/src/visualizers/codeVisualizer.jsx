import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { create } from 'zustand'
import LinkedListVisualizer from './LinkedListVisualizer'
import CustomCodeVisualizerEngine from '../engine/CustomCodeVisualizer'

const useVizStore = create((set, get) => ({
  activeAlgorithm: 'bubbleSort',
  visualizerMode:  'sorting',
  steps:           [],
  currentStep:     0,
  isPlaying:       false,
  speed:           1,
  totalSteps:      0,
  variables:       [],
  stackFrames:     [],
  heapObjects:     [],
  inputData:       [],
  searchTarget:    25,
  comparisons:     0,
  swaps:           0,
  accesses:        0,

  setActiveAlgorithm: (a)  => set({ activeAlgorithm: a }),
  setVisualizerMode:  (m)  => set({ visualizerMode: m, steps: [], currentStep: 0, isPlaying: false, variables: [], stackFrames: [], heapObjects: [], comparisons: 0, swaps: 0, accesses: 0 }),
  setSpeed:           (v)  => set({ speed: v }),
  setIsPlaying:       (v)  => set({ isPlaying: v }),
  setInputData:       (d)  => set({ inputData: d }),
  setSearchTarget:    (t)  => set({ searchTarget: t }),

  setSteps: (steps) => {
    const s = steps[0] || {}
    set({
      steps, totalSteps: steps.length, currentStep: 0, isPlaying: false,
      variables:   s.variables   || [],
      stackFrames: s.stackFrames || [],
      heapObjects: s.heapObjects || [],
      comparisons: s.comparisons || 0,
      swaps:       s.swaps       || 0,
      accesses:    s.accesses    || 0,
    })
  },

  setCurrentStep: (step) => {
    const { steps } = get()
    const c = Math.max(0, Math.min(step, steps.length - 1))
    const s = steps[c] || {}
    set({
      currentStep: c,
      variables:   s.variables   || [],
      stackFrames: s.stackFrames || [],
      heapObjects: s.heapObjects || [],
      comparisons: s.comparisons || 0,
      swaps:       s.swaps       || 0,
      accesses:    s.accesses    || 0,
    })
  },

  reset: () => set({ steps: [], currentStep: 0, isPlaying: false, variables: [], stackFrames: [], heapObjects: [], comparisons: 0, swaps: 0, accesses: 0, totalSteps: 0 }),
}))

const IC = {
  Play:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>,
  Pause:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Prev:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>,
  Next:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>,
  Reset:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>,
  Zap:     () => <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>,
  Code:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16,18 22,12 16,6"/><polyline points="8,6 2,12 8,18"/></svg>,
  Cpu:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
}

function snap(arr, opts = {}) {
  return { arr: [...arr], array: [...arr], comparing: opts.comparing || [], swapping: opts.swapping || [], sorted: opts.sorted || [], pivot: opts.pivot ?? -1, left: opts.left ?? [], right: opts.right ?? [], merging: opts.merging ?? [], message: opts.message || '', comparisons: opts.comparisons ?? 0, swaps: opts.swaps ?? 0, line: opts.line ?? 0, vars: opts.vars || {} }
}
function genBubble(init) {
  const arr = [...init], steps = []; let c = 0, s = 0
  steps.push(snap(arr, { message: 'Initial array — ready to sort', comparisons: c, swaps: s }))
  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      c++
      const sorted = Array.from({ length: i }, (_, k) => arr.length - 1 - k)
      steps.push(snap(arr, { comparing: [j, j+1], sorted, message: `Compare arr[${j}]=${arr[j]} with arr[${j+1}]=${arr[j+1]}`, comparisons: c, swaps: s, line: 4, vars: { i, j } }))
      if (arr[j] > arr[j+1]) { ;[arr[j], arr[j+1]] = [arr[j+1], arr[j]]; s++; steps.push(snap(arr, { swapping: [j, j+1], sorted, message: `Swap arr[${j}] ↔ arr[${j+1}]`, comparisons: c, swaps: s, line: 5 })) }
    }
  }
  steps.push(snap(arr, { sorted: arr.map((_, i) => i), message: 'Sorted! ✓', comparisons: c, swaps: s }))
  return steps
}
function genSelection(init) {
  const arr = [...init], steps = []; let c = 0, s = 0
  steps.push(snap(arr, { message: 'Initial array', comparisons: c, swaps: s }))
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i
    for (let j = i + 1; j < arr.length; j++) {
      c++
      steps.push(snap(arr, { comparing: [j, minIdx], sorted: Array.from({ length: i }, (_, k) => k), message: `Compare arr[${j}]=${arr[j]} vs min arr[${minIdx}]=${arr[minIdx]}`, comparisons: c, swaps: s, line: 4, vars: { i, j, minIdx } }))
      if (arr[j] < arr[minIdx]) minIdx = j
    }
    if (minIdx !== i) { ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]; s++; steps.push(snap(arr, { swapping: [i, minIdx], sorted: Array.from({ length: i }, (_, k) => k), message: `Place min ${arr[i]} at position ${i}`, comparisons: c, swaps: s, line: 7 })) }
  }
  steps.push(snap(arr, { sorted: arr.map((_, i) => i), message: 'Sorted! ✓', comparisons: c, swaps: s }))
  return steps
}
function genInsertion(init) {
  const arr = [...init], steps = []; let c = 0, s = 0
  steps.push(snap(arr, { message: 'First element trivially sorted', comparisons: c, swaps: s }))
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i]; let j = i - 1
    steps.push(snap(arr, { comparing: [i], sorted: Array.from({ length: i }, (_, k) => k), message: `Key = arr[${i}] = ${key}`, comparisons: c, swaps: s, line: 3 }))
    while (j >= 0 && arr[j] > key) { c++; arr[j+1] = arr[j]; s++; steps.push(snap(arr, { comparing: [j, j+1], swapping: [j+1], sorted: Array.from({ length: i }, (_, k) => k), message: `Shift ${arr[j]} right`, comparisons: c, swaps: s, line: 5 })); j-- }
    arr[j+1] = key
    steps.push(snap(arr, { swapping: [j+1], sorted: Array.from({ length: i+1 }, (_, k) => k), message: `Insert ${key} at position ${j+1}`, comparisons: c, swaps: s, line: 7 }))
  }
  steps.push(snap(arr, { sorted: arr.map((_, i) => i), message: 'Sorted! ✓', comparisons: c, swaps: s }))
  return steps
}
function genMerge(init) {
  const arr = [...init], steps = []; let c = 0, m = 0
  steps.push(snap(arr, { message: 'Start Merge Sort', comparisons: c }))
  function ms(a, offset = 0) {
    if (a.length <= 1) return a
    const mid = Math.floor(a.length / 2), L = a.slice(0, mid), R = a.slice(mid)
    steps.push(snap(arr, { left: L.map((_, k) => offset+k), right: R.map((_, k) => offset+mid+k), message: `Split [${a}] → [${L}] | [${R}]`, comparisons: c, swaps: m, line: 3 }))
    const sL = ms(L, offset), sR = ms(R, offset+mid), res = []; let i = 0, j = 0
    while (i < sL.length && j < sR.length) { c++; res.push(sL[i] <= sR[j] ? sL[i++] : sR[j++]) }
    while (i < sL.length) res.push(sL[i++])
    while (j < sR.length) res.push(sR[j++])
    for (let k = 0; k < res.length; k++) arr[offset+k] = res[k]
    m++; steps.push(snap(arr, { merging: res.map((_, k) => offset+k), message: `Merge → [${res}]`, comparisons: c, swaps: m, line: 12 }))
    return res
  }
  ms([...init])
  steps.push(snap(arr, { sorted: arr.map((_, i) => i), message: 'Sorted! ✓', comparisons: c, swaps: m }))
  return steps
}
function genQuick(init) {
  const arr = [...init], steps = []; let c = 0, s = 0
  steps.push(snap(arr, { message: 'Start Quick Sort', comparisons: c, swaps: s }))
  function qs(lo, hi) {
    if (lo >= hi) return
    const pv = arr[hi]
    steps.push(snap(arr, { pivot: hi, message: `Pivot = arr[${hi}] = ${pv}`, comparisons: c, swaps: s, line: 8 }))
    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      c++; steps.push(snap(arr, { comparing: [j, hi], pivot: hi, message: `arr[${j}]=${arr[j]} ≤ ${pv}?`, comparisons: c, swaps: s, line: 11 }))
      if (arr[j] <= pv) { i++; ;[arr[i], arr[j]] = [arr[j], arr[i]]; s++; steps.push(snap(arr, { swapping: [i, j], pivot: hi, message: `Swap arr[${i}] ↔ arr[${j}]`, comparisons: c, swaps: s, line: 12 })) }
    }
    ;[arr[i+1], arr[hi]] = [arr[hi], arr[i+1]]; s++
    const pi = i+1; steps.push(snap(arr, { swapping: [i+1, hi], sorted: [pi], pivot: pi, message: `Pivot placed at ${pi}`, comparisons: c, swaps: s, line: 14 }))
    qs(lo, pi-1); qs(pi+1, hi)
  }
  qs(0, arr.length-1)
  steps.push(snap(arr, { sorted: arr.map((_, i) => i), message: 'Sorted! ✓', comparisons: c, swaps: s }))
  return steps
}
function genLinearSearch(arr, target) {
  const steps = []; let c = 0
  steps.push({ array: arr, arr, current: -1, found: -1, target, visited: [], message: `Search for ${target}`, comparisons: 0 })
  for (let i = 0; i < arr.length; i++) {
    c++; steps.push({ array: arr, arr, current: i, found: -1, target, visited: Array.from({ length: i }, (_, k) => k), message: `Check arr[${i}]=${arr[i]} == ${target}?`, comparisons: c, line: 3 })
    if (arr[i] === target) { steps.push({ array: arr, arr, current: i, found: i, target, visited: Array.from({ length: i+1 }, (_, k) => k), message: `Found ${target} at index ${i} ✓`, comparisons: c, line: 4 }); return steps }
  }
  steps.push({ array: arr, arr, current: -1, found: -2, target, visited: arr.map((_, i) => i), message: `${target} not found`, comparisons: c })
  return steps
}
function genBinarySearch(init, target) {
  const arr = [...init].sort((a, b) => a - b), steps = []; let c = 0
  steps.push({ array: arr, arr, lo: 0, hi: arr.length-1, mid: -1, found: -1, target, message: `Binary search for ${target}`, comparisons: 0 })
  let lo = 0, hi = arr.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo+hi)/2); c++
    steps.push({ array: arr, arr, lo, hi, mid, found: -1, target, message: `mid=${mid}, arr[mid]=${arr[mid]}`, comparisons: c, line: 3 })
    if (arr[mid] === target) { steps.push({ array: arr, arr, lo, hi, mid, found: mid, target, message: `Found ${target} at index ${mid} ✓`, comparisons: c }); return steps }
    else if (arr[mid] < target) { lo = mid+1; steps.push({ array: arr, arr, lo, hi, mid, found: -1, target, message: `arr[mid] < target → search right`, comparisons: c }) }
    else { hi = mid-1; steps.push({ array: arr, arr, lo, hi, mid, found: -1, target, message: `arr[mid] > target → search left`, comparisons: c }) }
  }
  steps.push({ array: arr, arr, lo, hi: lo-1, mid: -1, found: -2, target, message: `${target} not found`, comparisons: c })
  return steps
}
const GRAPH_NODES = [
  { id: 0, label: 'A', x: 300, y: 60  }, { id: 1, label: 'B', x: 150, y: 180 },
  { id: 2, label: 'C', x: 450, y: 180 }, { id: 3, label: 'D', x: 80,  y: 300 },
  { id: 4, label: 'E', x: 250, y: 300 }, { id: 5, label: 'F', x: 400, y: 300 }, { id: 6, label: 'G', x: 520, y: 300 },
]
const GRAPH_EDGES = [[0,1,4],[0,2,3],[1,3,2],[1,4,5],[2,5,6],[2,6,1],[4,5,3]]
function genBFS(nodes = GRAPH_NODES, edges = GRAPH_EDGES) {
  const steps = []
  const adj = Array.from({ length: nodes.length }, () => [])
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u) }
  const visited = new Set([0]), queue = [0], order = []
  steps.push({ nodes, edges, visited: [], queue: [0], current: -1, order: [], activeEdge: null, message: 'BFS: enqueue start node A', line: 1 })
  while (queue.length) {
    const cur = queue.shift(); order.push(cur)
    steps.push({ nodes, edges, visited: [...visited], queue: [...queue], current: cur, order: [...order], activeEdge: null, message: `Dequeue ${nodes[cur].label}`, line: 4 })
    for (const nb of adj[cur]) {
      steps.push({ nodes, edges, visited: [...visited], queue: [...queue], current: cur, order: [...order], activeEdge: [cur, nb], message: `Check ${nodes[nb].label} — ${visited.has(nb) ? 'visited' : 'enqueue'}`, line: 7 })
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
    }
  }
  steps.push({ nodes, edges, visited: [...visited], queue: [], current: -1, order, activeEdge: null, message: `BFS: ${order.map(i => nodes[i].label).join(' → ')}` })
  return steps
}
function genDFS(nodes = GRAPH_NODES, edges = GRAPH_EDGES) {
  const steps = []
  const adj = Array.from({ length: nodes.length }, () => [])
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u) }
  const visited = new Set(), order = [], stack = []
  function dfs(cur, depth = 0) {
    visited.add(cur); order.push(cur); stack.push(cur)
    steps.push({ nodes, edges, visited: [...visited], stack: [...stack], current: cur, order: [...order], activeEdge: null, message: `Visit ${nodes[cur].label} (depth ${depth})`, line: 1 })
    for (const nb of adj[cur].sort()) {
      if (!visited.has(nb)) { steps.push({ nodes, edges, visited: [...visited], stack: [...stack], current: cur, order: [...order], activeEdge: [cur, nb], message: `Explore ${nodes[cur].label}→${nodes[nb].label}`, line: 4 }); dfs(nb, depth+1) }
    }
    stack.pop(); steps.push({ nodes, edges, visited: [...visited], stack: [...stack], current: cur, order: [...order], activeEdge: null, message: `Backtrack from ${nodes[cur].label}`, line: 6 })
  }
  dfs(0)
  steps.push({ nodes, edges, visited: [...visited], stack: [], current: -1, order, activeEdge: null, message: `DFS: ${order.map(i => nodes[i].label).join(' → ')}` })
  return steps
}
function genDijkstra(nodes = GRAPH_NODES, edges = GRAPH_EDGES) {
  const n = nodes.length, INF = Infinity, adj = Array.from({ length: n }, () => [])
  for (const [u, v, w = 1] of edges) { adj[u].push([v, w]); adj[v].push([u, w]) }
  const dist = Array(n).fill(INF); dist[0] = 0
  const prev = Array(n).fill(-1), visited = new Set(), steps = []
  steps.push({ nodes, edges, dist: [...dist], visited: [], current: -1, prev: [...prev], activeEdge: null, message: `Dijkstra from A — dist[A]=0` })
  for (let iter = 0; iter < n; iter++) {
    let u = -1; for (let i = 0; i < n; i++) if (!visited.has(i) && (u === -1 || dist[i] < dist[u])) u = i
    if (u === -1 || dist[u] === INF) break
    visited.add(u); steps.push({ nodes, edges, dist: [...dist], visited: [...visited], current: u, prev: [...prev], activeEdge: null, message: `Process ${nodes[u].label} (dist=${dist[u]})` })
    for (const [v, w] of adj[u]) {
      const alt = dist[u]+w; steps.push({ nodes, edges, dist: [...dist], visited: [...visited], current: u, prev: [...prev], activeEdge: [u, v], message: `Relax ${nodes[u].label}→${nodes[v].label}: ${dist[u]}+${w}=${alt}` })
      if (alt < dist[v]) { dist[v] = alt; prev[v] = u }
    }
  }
  steps.push({ nodes, edges, dist: [...dist], visited: [...visited], current: -1, prev: [...prev], activeEdge: null, message: `Done: ${nodes.map((nd, i) => `${nd.label}=${dist[i]===INF?'∞':dist[i]}`).join(', ')}` })
  return steps
}
function genLinkedList() {
  const steps = []; let list = [], ops = 0
  const s = (msg, cur = -1, line = 0, vars = {}) => { ops++; steps.push({ list: [...list], current: cur, highlighted: cur >= 0 ? [cur] : [], message: msg, ops, line, vars }) }
  s('Empty linked list — head = null', -1, 0)
  for (const v of [10, 20, 30, 40, 50]) { list.push(v); s(`Insert ${v} at tail`, list.length-1, 9) }
  const di = list.indexOf(30); s(`Find 30 to delete`, di, 18)
  list.splice(di, 1); s(`Deleted 30`, -1, 20)
  list.unshift(5); s(`Insert 5 at head`, 0, 12)
  list = [...list].reverse(); s(`Reverse list`, -1, 25)
  steps.push({ list: [...list], current: -1, highlighted: [], message: `Final: ${list.join(' → ')} → null`, ops, line: 30, vars: {} })
  return steps
}
function genStack(operations) {
  const ops = operations || [
    { op:'push', val:'A' }, { op:'push', val:'B' }, { op:'push', val:'C' },
    { op:'peek' }, { op:'pop' }, { op:'push', val:'D' },
    { op:'push', val:'E' }, { op:'pop' }, { op:'pop' },
  ]
  const steps = []
  let stack = []
  const makeStep = (msg, op, val = null, line = 0) => {
    const sc = [...stack]
    return {
      stack: sc, op, val, message: msg, size: sc.length, line,
      vars: { top: sc.length ? sc[sc.length - 1] : 'empty', size: sc.length },
      stackFrames: [{ id: 'main', name: 'stack()', active: true, vars: [{ name: 'size', value: sc.length }, { name: 'top', value: sc.length ? sc[sc.length - 1] : 'empty' }, ...(val !== null ? [{ name: op === 'pop' ? 'popped' : op === 'peek' ? 'peeked' : 'pushed', value: val }] : [])] }],
      heapObjects: [{ id: 'stack_arr', type: 'Stack[]', value: sc.length ? [...sc].reverse() : ['(empty)'] }],
    }
  }
  steps.push(makeStep('Empty stack — LIFO (Last In, First Out)', 'init', null, 0))
  for (const { op, val } of ops) {
    if (op === 'push') { stack.push(val); steps.push(makeStep(`push("${val}") — added to top → size = ${stack.length}`, 'push', val, 3)) }
    else if (op === 'pop') { if (!stack.length) { steps.push(makeStep('pop() — underflow!', 'error', null, 6)) } else { const p = stack.pop(); steps.push(makeStep(`pop() → "${p}" removed → size = ${stack.length}`, 'pop', p, 6)) } }
    else if (op === 'peek') { const top = stack.length ? stack[stack.length - 1] : null; steps.push(makeStep(top !== null ? `peek() → "${top}"` : 'peek() — empty', 'peek', top, 9)) }
  }
  steps.push(makeStep('Stack operations complete ✓', 'done', null, 12))
  return steps
}

function genHashMap(customEntries, customSize) {
  const SIZE = customSize || 8
  const hashFn = (k) => { let h = 0; for (let i = 0; i < String(k).length; i++) h = (h * 31 + String(k).charCodeAt(i)) % SIZE; return h }
  const table = Array.from({ length: SIZE }, () => [])
  const steps = []
  let collisions = 0

  steps.push({
    table: table.map(b => [...b]), current: -1, key: '', hash: -1, collisions: 0,
    message: `Empty hash table — ${SIZE} buckets`, line: 0,
    vars: { SIZE, collisions: 0 },
  })

  const entries = customEntries || [
    ['name', 'Alice'], ['age', '30'], ['city', 'NYC'],
    ['job', 'Dev'], ['lang', 'JS'],
  ]

  for (const [k, v] of entries) {
    const key = String(k), val = String(v)
    const h = hashFn(key)

    steps.push({
      table: table.map(b => [...b]), current: h, key, hash: h, collisions,
      message: `hash("${key}") = ${h}  →  bucket ${h}`, line: 5,
      vars: { key, hash: h, formula: `(h*31 + charCode) % ${SIZE}` },
    })

    const hadCollision = table[h].length > 0
    if (hadCollision) {
      steps.push({
        table: table.map(b => [...b]), current: h, key, hash: h, collisions,
        message: `Bucket ${h} has ${table[h].length} item(s) — collision!`, line: 16,
        vars: { bucket: h, existing: table[h].length },
      })
      collisions++
      steps.push({
        table: table.map(b => [...b]), current: h, key, hash: h, collisions,
        message: `collisions++ → ${collisions}`, line: 17,
        vars: { collisions },
      })
    }

    table[h].push([key, val])
    steps.push({
      table: table.map(b => [...b]), current: h, key, hash: h, collisions,
      message: `Store "${key}" → "${val}" at bucket ${h}${hadCollision ? ' (chained)' : ''}`, line: 12,
      vars: { key, val, bucket: h, collision: hadCollision, collisions },
    })
  }

  steps.push({
    table: table.map(b => [...b]), current: -1, key: '', hash: -1, collisions,
    message: `Done! ${entries.length} entries, ${collisions} collision${collisions !== 1 ? 's' : ''}`, line: 15,
    vars: { total: entries.length, collisions },
  })
  return steps
}

function genBST(customValues) {
   const values = (customValues && customValues.length > 0)
    ? customValues : [50, 30, 70, 20, 40, 60, 80], steps = [], nodeList = [], edgeList = [], posMap = {}; let id = 0
  function relayout(r, d, lo, hi) { if (!r) return; const m=(lo+hi)/2; posMap[r.id]={x:40+m*480,y:50+d*70}; relayout(r.left,d+1,lo,m); relayout(r.right,d+1,m,hi) }
  function insert(r, val, pid = -1) {
    if (!r) { const n={id:id++,val,left:null,right:null,parentId:pid}; nodeList.push(n); if(pid>=0) edgeList.push({from:pid,to:n.id}); return n }
    if (val < r.val) r.left = insert(r.left, val, r.id); else if (val > r.val) r.right = insert(r.right, val, r.id); return r
  }
  steps.push({ nodes: [], edges: [], positions: {}, current: -1, path: [], visited: [], message: 'Empty BST' })
  let root = null
  for (const v of values) { root = insert(root, v); relayout(root, 0, 0, 1); steps.push({ nodes: nodeList.map(n=>({...n})), edges: [...edgeList], positions: {...posMap}, current: id-1, path: [], visited: [id-1], message: `Inserted ${v}` }) }
  return steps
}
function genFibonacci(n = 6) {
  const steps = [], tree = []; let callId = 0
  function fib(val, parentId = -1, depth = 0) {
    if (depth > 10) return 0; const cid = callId++
    tree.push({ id: cid, n: val, parentId, depth, result: null })
    steps.push({ tree: tree.map(x=>({...x})), current: cid, message: `fib(${val}) called`, line: 0, vars: { n: val, depth }, callStack: tree.filter(x=>x.result===null).map(x=>`fib(${x.n})`) })
    let result
    if (val <= 1) { result = val; tree[cid].result = result; steps.push({ tree: tree.map(x=>({...x})), current: cid, message: `Base: fib(${val})=${val}`, line: 1, vars: { n: val, result }, callStack: [] }) }
    else { const a = fib(val-1,cid,depth+1), b = fib(val-2,cid,depth+1); result = a+b; tree[cid].result = result; steps.push({ tree: tree.map(x=>({...x})), current: cid, message: `fib(${val})=${a}+${b}=${result}`, line: 2, vars: { n: val, result }, callStack: [] }) }
    return result
  }
  fib(Math.min(n, 7))
  return steps
}
function genLCS(s1 = 'ABCBDAB', s2 = 'BDCAB') {
  const m = s1.length, n = s2.length, dp = Array.from({length:m+1},()=>Array(n+1).fill(0)), steps = []
  steps.push({ dp: dp.map(r=>[...r]), s1, s2, ci: -1, cj: -1, match: false, message: 'Init DP table' })
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const match = s1[i-1]===s2[j-1]
    if (match) dp[i][j]=dp[i-1][j-1]+1; else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1])
    steps.push({ dp: dp.map(r=>[...r]), s1, s2, ci: i, cj: j, match, message: `s1[${i-1}]='${s1[i-1]}' ${match?'==':'≠'} s2[${j-1}]='${s2[j-1]}' → dp[${i}][${j}]=${dp[i][j]}`, vars: { i, j, 'dp[i][j]': dp[i][j] } })
  }
  steps.push({ dp: dp.map(r=>[...r]), s1, s2, ci: m, cj: n, match: false, message: `LCS length = ${dp[m][n]}` })
  return steps
}

function genNormalQueue(ops, capacity = 10) {
  const steps = []
  let queue = []

  const snap = (msg, line, highlight = -1, op = '', inserted = null, removed = null) => {
    const sf = [{
      id: 'queue', name: 'Queue()', active: true,
      vars: [
        { name: 'front', value: 0 },
        { name: 'rear',  value: queue.length - 1 },
        { name: 'size',  value: queue.length },
        { name: 'capacity', value: capacity },
        ...(inserted !== null ? [{ name: 'inserted', value: inserted }] : []),
        ...(removed  !== null ? [{ name: 'removed',  value: removed  }] : []),
      ]
    }]
    const ho = [{ id: 'queue_arr', type: 'Queue[]', value: queue.length ? [...queue] : ['(empty)'] }]
    steps.push({
      queue: [...queue], highlight, op, insertedVal: inserted, removedVal: removed,
      message: msg, line,
      vars: { front: 0, rear: queue.length - 1, size: queue.length, capacity, currentOp: op },
      stackFrames: sf, heapObjects: ho,
    })
  }

  snap('Empty queue — ready for operations', 0)

  for (const { op, val } of ops) {
    if (op === 'enqueue') {
      if (queue.length >= capacity) { snap(`enqueue(${val}) — Queue FULL! Cannot insert`, 3, -1, 'full'); continue }
      snap(`enqueue(${val}) — inserting at rear`, 3, queue.length, 'enqueue', val)
      queue.push(val)
      snap(`queue[${queue.length-1}] = ${val}, rear = ${queue.length-1}, size = ${queue.length}`, 4, queue.length-1, 'enqueue', val)
    } else if (op === 'dequeue') {
      if (!queue.length) { snap('dequeue() — Queue EMPTY! Cannot remove', 8, -1, 'empty'); continue }
      const removed = queue[0]
      snap(`dequeue() — removing front element ${removed}`, 8, 0, 'dequeue', null, removed)
      queue.shift()
      snap(`Removed ${removed}, front shifted, size = ${queue.length}`, 9, -1, 'dequeue', null, removed)
    } else if (op === 'peek' || op === 'front') {
      if (!queue.length) { snap('peek() — Queue is empty', 13, -1, 'peek'); continue }
      snap(`peek() → front = ${queue[0]}`, 13, 0, 'peek')
    } else if (op === 'rear') {
      if (!queue.length) { snap('rear() — Queue is empty', 16, -1, 'rear'); continue }
      snap(`rear() → rear = ${queue[queue.length-1]}`, 16, queue.length-1, 'rear')
    } else if (op === 'isEmpty') {
      snap(`isEmpty() → ${queue.length === 0}`, 19, -1, 'isEmpty')
    } else if (op === 'isFull') {
      snap(`isFull() → ${queue.length >= capacity}`, 22, -1, 'isFull')
    } else if (op === 'clear') {
      queue = []
      snap('clear() — Queue cleared', 25, -1, 'clear')
    }
  }

  snap(`Done — size = ${queue.length}`, 27, -1, 'done')
  return steps
}

function genCircularQueue(ops, capacity = 8) {
  const steps = []
  const arr = new Array(capacity).fill(null)
  let front = -1, rear = -1, size = 0

  const snap = (msg, line, activeIdx = -1, op = '', inserted = null, removed = null) => {
    const sf = [{ id: 'cq', name: 'CircularQueue()', active: true, vars: [
      { name: 'front',    value: front },
      { name: 'rear',     value: rear  },
      { name: 'size',     value: size  },
      { name: 'capacity', value: capacity },
      ...(inserted !== null ? [{ name: 'inserted', value: inserted }] : []),
      ...(removed  !== null ? [{ name: 'removed',  value: removed  }] : []),
    ]}]
    const ho = [{ id: 'cq_arr', type: 'CircularQueue[]', value: [...arr].map(v => v === null ? '_' : v) }]
    steps.push({
      circularQueue: [...arr], front, rear, capacity, size,
      activeIdx, op, insertedVal: inserted, removedVal: removed,
      message: msg, line,
      vars: { front, rear, size, capacity, currentOp: op },
      stackFrames: sf, heapObjects: ho,
    })
  }

  snap(`Empty circular queue — capacity = ${capacity}`, 0)

  for (const { op, val } of ops) {
    if (op === 'enqueue') {
      if (size === capacity) { snap(`enqueue(${val}) — Queue FULL`, 6, -1, 'full'); continue }
      if (front === -1) { front = 0; rear = 0 }
      else rear = (rear + 1) % capacity
      arr[rear] = val; size++
      snap(`enqueue(${val}) → rear moves to ${rear}, arr[${rear}] = ${val}`, 7, rear, 'enqueue', val)
    } else if (op === 'dequeue') {
      if (size === 0) { snap('dequeue() — Queue EMPTY', 12, -1, 'empty'); continue }
      const removed = arr[front]
      snap(`dequeue() → removing arr[${front}] = ${removed}`, 12, front, 'dequeue', null, removed)
      arr[front] = null; size--
      if (size === 0) { front = -1; rear = -1 }
      else front = (front + 1) % capacity
      snap(`Removed ${removed}, front → ${front}, size = ${size}`, 13, front, 'dequeue', null, removed)
    } else if (op === 'front') {
      if (size === 0) { snap('front() — Queue empty', 17, -1, 'front'); continue }
      snap(`front() → arr[${front}] = ${arr[front]}`, 17, front, 'front')
    } else if (op === 'rear') {
      if (size === 0) { snap('rear() — Queue empty', 20, -1, 'rear'); continue }
      snap(`rear() → arr[${rear}] = ${arr[rear]}`, 20, rear, 'rear')
    } else if (op === 'isEmpty') {
      snap(`isEmpty() → ${size === 0}`, 23, -1, 'isEmpty')
    } else if (op === 'isFull') {
      snap(`isFull() → ${size === capacity}`, 26, -1, 'isFull')
    }
  }

  snap('Done', 28, -1, 'done')
  return steps
}

function genDeque(ops, capacity = 10) {
  const steps = []
  let deque = []

  const snap = (msg, line, highlightFront = false, highlightRear = false, op = '', val = null) => {
    const sf = [{ id: 'dq', name: 'Deque()', active: true, vars: [
      { name: 'size', value: deque.length },
      { name: 'front', value: deque[0] ?? '—' },
      { name: 'rear',  value: deque[deque.length-1] ?? '—' },
      ...(val !== null ? [{ name: 'value', value: val }] : []),
    ]}]
    const ho = [{ id: 'dq_arr', type: 'Deque[]', value: deque.length ? [...deque] : ['(empty)'] }]
    steps.push({
      deque: [...deque], highlightFront, highlightRear, op, insertedVal: val,
      message: msg, line,
      vars: { size: deque.length, front: deque[0] ?? '—', rear: deque[deque.length-1] ?? '—', currentOp: op },
      stackFrames: sf, heapObjects: ho,
    })
  }

  snap('Empty deque', 0)

  for (const { op, val } of ops) {
    if (op === 'pushFront') {
      deque.unshift(val)
      snap(`pushFront(${val}) — inserted at front`, 3, true, false, 'pushFront', val)
    } else if (op === 'pushRear') {
      deque.push(val)
      snap(`pushRear(${val}) — inserted at rear`, 6, false, true, 'pushRear', val)
    } else if (op === 'popFront') {
      if (!deque.length) { snap('popFront() — Deque empty', 9, false, false, 'empty'); continue }
      const removed = deque.shift()
      snap(`popFront() → removed ${removed} from front`, 9, true, false, 'popFront', removed)
    } else if (op === 'popRear') {
      if (!deque.length) { snap('popRear() — Deque empty', 12, false, false, 'empty'); continue }
      const removed = deque.pop()
      snap(`popRear() → removed ${removed} from rear`, 12, false, true, 'popRear', removed)
    } else if (op === 'front') {
      snap(`front() → ${deque[0] ?? 'empty'}`, 15, true, false, 'front')
    } else if (op === 'rear') {
      snap(`rear() → ${deque[deque.length-1] ?? 'empty'}`, 18, false, true, 'rear')
    }
  }

  snap('Done', 20, false, false, 'done')
  return steps
}

function genPriorityQueue(ops) {
  const steps = []
  let heap = []

  const snap = (msg, line, swapIdx = [], activeIdx = -1, op = '', val = null) => {
    const sf = [{ id: 'pq', name: 'PriorityQueue()', active: true, vars: [
      { name: 'size', value: heap.length },
      { name: 'max',  value: heap[0] ?? '—' },
      ...(val !== null ? [{ name: 'value', value: val }] : []),
    ]}]
    const ho = [{ id: 'pq_arr', type: 'MaxHeap[]', value: heap.length ? [...heap] : ['(empty)'] }]
    steps.push({
      heap: [...heap], swapIdx, activeIdx, op, insertedVal: val,
      message: msg, line,
      vars: { size: heap.length, max: heap[0] ?? '—', currentOp: op },
      stackFrames: sf, heapObjects: ho,
    })
  }

  const heapifyUp = (arr, i) => {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      if (arr[parent] >= arr[i]) break
      snap(`Heapify Up: arr[${i}]=${arr[i]} > arr[${parent}]=${arr[parent]} → swap`, 8, [i, parent], i, 'heapifyUp')
      ;[arr[i], arr[parent]] = [arr[parent], arr[i]]
      snap(`Swapped → arr[${parent}]=${arr[parent]}`, 9, [i, parent], parent, 'heapifyUp')
      i = parent
    }
  }

  const heapifyDown = (arr, i) => {
    const n = arr.length
    while (true) {
      let largest = i
      const l = 2*i+1, r = 2*i+2
      if (l < n && arr[l] > arr[largest]) largest = l
      if (r < n && arr[r] > arr[largest]) largest = r
      if (largest === i) break
      snap(`Heapify Down: swap arr[${i}]=${arr[i]} with arr[${largest}]=${arr[largest]}`, 18, [i, largest], i, 'heapifyDown')
      ;[arr[i], arr[largest]] = [arr[largest], arr[i]]
      snap(`Swapped → arr[${i}]=${arr[i]}`, 19, [i, largest], largest, 'heapifyDown')
      i = largest
    }
  }

  snap('Empty priority queue (max-heap)', 0)

  for (const { op, val } of ops) {
    if (op === 'insert') {
      heap.push(val)
      snap(`insert(${val}) — added at index ${heap.length-1}`, 5, [], heap.length-1, 'insert', val)
      heapifyUp(heap, heap.length - 1)
      snap(`insert(${val}) done — heap property restored`, 10, [], 0, 'insert', val)
    } else if (op === 'extractMax') {
      if (!heap.length) { snap('extractMax() — empty!', 14, [], -1, 'empty'); continue }
      const max = heap[0]
      snap(`extractMax() → max = ${max} (root)`, 14, [], 0, 'extractMax', max)
      heap[0] = heap.pop()
      if (heap.length) {
        snap(`Moved last element ${heap[0]} to root, heapify down`, 16, [], 0, 'extractMax')
        heapifyDown(heap, 0)
      }
      snap(`extractMax() = ${max} done`, 21, [], -1, 'extractMax', max)
    } else if (op === 'peek') {
      snap(`peek() → max = ${heap[0] ?? 'empty'}`, 24, [], 0, 'peek', heap[0])
    }
  }

  snap('Done', 26, [], -1, 'done')
  return steps
}

function buildSteps(raw, algo) {
  if (!raw || !raw.length) return []
  return raw.map((step, idx) => {
    const array = step.array ?? step.arr ?? []
    const norm = { ...step, array, comparing: step.comparing ?? [], swapping: step.swapping ?? [], sorted: step.sorted ?? [], description: step.description ?? step.message ?? '' }
    const vars = []
    if (array.length) vars.push({ name: 'array', type: 'Array', value: JSON.stringify(array) })
    if (step.i   !== undefined) vars.push({ name: 'i',   value: step.i })
    if (step.j   !== undefined) vars.push({ name: 'j',   value: step.j })
    if (step.lo  !== undefined) vars.push({ name: 'lo',  value: step.lo })
    if (step.hi  !== undefined) vars.push({ name: 'hi',  value: step.hi })
    if (step.mid !== undefined) vars.push({ name: 'mid', value: step.mid })
    if (step.pivot !== undefined && step.pivot !== -1) vars.push({ name: 'pivot', value: step.pivot })
    if (step.vars) for (const [k, v] of Object.entries(step.vars)) if (!vars.find(x=>x.name===k)) vars.push({ name: k, value: typeof v==='object'?JSON.stringify(v):String(v) })
    const stackFrames = step.stackFrames || (() => {
      if (array.length) return [{ id:'main', name:`${algo}()`, active:true, vars:[{name:'n',value:array.length},...(step.vars?.i!==undefined?[{name:'i',value:step.vars.i}]:[]),...(step.vars?.j!==undefined?[{name:'j',value:step.vars.j}]:[]),...(step.vars?.minIdx!==undefined?[{name:'minIdx',value:step.vars.minIdx}]:[])].filter(Boolean) }]
      if (step.nodes) return [{ id:'trav', name:`${algo}()`, active:true, vars:[{name:'nodes',value:step.nodes.length},...(step.current!==-1&&step.current!==undefined?[{name:'current',value:step.current}]:[])].filter(Boolean) }]
      return []
    })()
    const heapObjects = step.heapObjects || (array.length ? [{ id:'arr', type:'Array', value:[...array] }] : [])
    return { ...norm, stepIndex:idx, comparisons:norm.comparisons??0, swaps:norm.swaps??0, accesses:0, variables:vars, stackFrames, heapObjects, progress:raw.length>1?(idx/(raw.length-1))*100:100 }
  })
}

const S = {
  root:      { display:'flex', flexDirection:'column', height:'100vh', background:'#0b0e17', color:'#e2e8f0', fontFamily:'"Inter",system-ui,sans-serif', overflow:'hidden' },
  header:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid #1e2d45', background:'#0d1117', flexShrink:0 },
  main:      { display:'flex', flex:1, overflow:'hidden', minHeight:0 },
  center:    { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0, minHeight:0 },
  vizArea:   { flex:1, overflow:'hidden', padding:16, display:'flex', flexDirection:'column', minHeight:0 },
  rightPanel:{ width:220, borderLeft:'1px solid #1e2d45', background:'#0d1117', overflowY:'auto', flexShrink:0 },
  timeline:  { borderTop:'1px solid #1e2d45', background:'#0b0f1a', padding:'10px 16px', flexShrink:0 },
  btn:       (active) => ({ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', color:'#cbd5e1', cursor:'pointer', transition:'all 0.15s' }),
  playBtn:   { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#06b6d4,#8b5cf6)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 0 12px rgba(6,182,212,0.3)' },
  modeBtn:   (active) => ({ padding:'4px 10px', borderRadius:8, border:`1px solid ${active?'#3b82f6':'#1e2d45'}`, background: active?'rgba(59,130,246,0.18)':'rgba(255,255,255,0.03)', color: active?'#60a5fa':'#64748b', cursor:'pointer', fontSize:11, fontWeight:600, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }),
  tag:       { fontSize:10, padding:'2px 6px', borderRadius:4, background:'rgba(168,85,247,0.15)', color:'#c084fc', border:'1px solid rgba(168,85,247,0.3)', fontWeight:700 },
  input:     { background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', borderRadius:8, padding:'4px 8px', fontSize:12, outline:'none', fontFamily:'inherit' },
  select:    { background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', borderRadius:8, padding:'4px 8px', fontSize:12, outline:'none', fontFamily:'inherit', cursor:'pointer' },
  sectionHd: { fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'#475569', textTransform:'uppercase', padding:'12px 12px 6px' },
}

function SortingViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { array = [], comparing = [], swapping = [], sorted = [], pivot = -1, merging = [], left = [], right = [], comparisons = 0, swaps = 0, message = '' } = step
  const maxVal = useMemo(() => Math.max(...array, 1), [array])
  const BAR_COLORS = {
    sorted:    { fill: '#064e3b', border: '#10b981', glow: '0 0 10px rgba(16,185,129,0.6)'  },
    swapping:  { fill: '#7f1d1d', border: '#ef4444', glow: '0 0 14px rgba(239,68,68,0.9)'  },
    merging:   { fill: '#164e63', border: '#06b6d4', glow: '0 0 12px rgba(6,182,212,0.7)'  },
    left:      { fill: '#1e1b4b', border: '#6366f1', glow: '0 0 10px rgba(99,102,241,0.6)' },
    right:     { fill: '#500724', border: '#f472b6', glow: '0 0 10px rgba(244,114,182,0.6)'},
    pivot:     { fill: '#4c1d95', border: '#a855f7', glow: '0 0 16px rgba(168,85,247,0.9)' },
    comparing: { fill: '#92400e', border: '#f59e0b', glow: '0 0 14px rgba(245,158,11,0.8)' },
    default:   { fill: '#1e3a5f', border: '#2d5a8e', glow: 'none'                          },
  }
  const getColor = (i) => {
    if (sorted.includes(i))    return BAR_COLORS.sorted
    if (swapping.includes(i))  return BAR_COLORS.swapping
    if (merging.includes(i))   return BAR_COLORS.merging
    if (left.includes(i))      return BAR_COLORS.left
    if (right.includes(i))     return BAR_COLORS.right
    if (i === pivot)           return BAR_COLORS.pivot
    if (comparing.includes(i)) return BAR_COLORS.comparing
    return BAR_COLORS.default
  }
  if (!array.length) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#475569', fontSize:14 }}>Press ▶ Visualize to begin</div>
  const n = array.length
  const bw = n <= 10 ? 52 : n <= 20 ? 36 : n <= 40 ? 22 : n <= 80 ? 12 : 6
  const gap = n <= 20 ? 5 : n <= 40 ? 3 : 2
  const showVal = n <= 24, showIdx = n <= 32
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, gap:10 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', flexShrink:0 }}>
        {[['Comparisons',comparisons,'#f59e0b'],['Swaps',swaps,'#ef4444'],['Size',n,'#60a5fa'],['Sorted',sorted.length,'#10b981']].map(([l,v,c]) => (
          <div key={l} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 14px', borderRadius:8, background:'#0f172a', border:'1px solid #1e3a5f', minWidth:72 }}>
            <span style={{ fontSize:18, fontWeight:700, fontFamily:'monospace', color:c }}>{v}</span>
            <span style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ flexShrink:0, padding:'7px 12px', background:'#0f172a', border:'1px solid #1e3a5f', borderRadius:8 }}>
        <span style={{ fontSize:12, fontFamily:'monospace', color:'#67e8f9' }}>{message || '—'}</span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
        <div style={{ flex:1, minHeight:0, display:'flex', alignItems:'flex-end', justifyContent:'center', gap, background:'rgba(15,23,42,0.6)', border:'1px solid #1e2d45', borderRadius:12, padding:'16px 12px 0 12px', overflow:'hidden' }}>
          {array.map((val, idx) => {
            const { fill, border, glow } = getColor(idx)
            const hPct = Math.max((val / maxVal) * 100, 1.5)
            const isActive = comparing.includes(idx) || swapping.includes(idx) || idx === pivot
            return (
              <div key={idx} style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', width:bw, minWidth:bw, flexShrink:0 }}>
                {showVal && <div style={{ position:'absolute', bottom:`calc(${hPct}% + 4px)`, fontSize:9, fontFamily:'monospace', color:'#94a3b8', whiteSpace:'nowrap', pointerEvents:'none', userSelect:'none' }}>{val}</div>}
                <motion.div animate={{ height:`${hPct}%`, backgroundColor:fill, borderColor:border, boxShadow:glow, scaleX:isActive?1.06:1 }} transition={{ type:'spring', stiffness:600, damping:32 }} style={{ width:'100%', minHeight:3, borderRadius:bw>=14?'4px 4px 0 0':'2px 2px 0 0', border:'1px solid', transformOrigin:'bottom' }}/>
                {showIdx && <div style={{ fontSize:8, color:'#334155', marginTop:2, fontFamily:'monospace', userSelect:'none' }}>{idx}</div>}
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8, flexShrink:0 }}>
          {Object.entries(BAR_COLORS).map(([key, { border }]) => (
            <span key={key} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:border, display:'inline-block' }}/>
              <span style={{ color:'#64748b', fontSize:10, textTransform:'capitalize', fontFamily:'monospace' }}>{key}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { array=[], lo=-1, hi=-1, mid=-1, found=-1, current=-1, visited=[], target, message='' } = step
  if (!array.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>Press ▶ Visualize to begin</div>
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16,padding:8}}>
      <div style={{fontSize:11,color:'#22d3ee',fontFamily:'monospace'}}>{message}</div>
      <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'center'}}>
        {array.map((val, idx) => {
          let bg='#1e2d45', border='#334155', color='#94a3b8'
          if (found===idx)     { bg='#064e3b'; border='#10b981'; color='#6ee7b7' }
          else if (found===-2&&visited.includes(idx)) { bg='#2d1515'; border='#7f1d1d'; color='#fca5a5' }
          else if (mid===idx)  { bg='#1e1b4b'; border='#6366f1'; color='#a5b4fc' }
          else if (idx>=lo&&idx<=hi&&lo!==-1) { bg='rgba(6,182,212,0.1)'; border='#0891b2'; color='#67e8f9' }
          else if (current===idx) { bg='rgba(245,158,11,0.15)'; border='#f59e0b'; color='#fcd34d' }
          else if (visited.includes(idx)) { bg='rgba(100,116,139,0.1)'; border='#334155'; color='#475569' }
          return (
            <div key={idx} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:8,color:border}}>{lo===idx&&'lo '}{hi===idx&&'hi '}{mid===idx&&'mid '}</span>
              <div style={{width:44,height:44,borderRadius:8,border:`1px solid ${border}`,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color,transition:'all 0.3s'}}>{val}</div>
              <span style={{fontSize:9,color:'#475569'}}>{idx}</span>
            </div>
          )
        })}
      </div>
      {target!==undefined&&<div style={{textAlign:'center',fontSize:12,color:'#64748b'}}>Target: <span style={{color:'#f59e0b',fontWeight:700}}>{target}</span></div>}
    </div>
  )
}

function GraphViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { nodes=[], edges=[], visited=[], current=-1, order=[], activeEdge=null, dist, message='' } = step
  if (!nodes.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>Press ▶ Visualize to begin</div>
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{fontSize:11,color:'#22d3ee',fontFamily:'monospace'}}>{message}</div>
      <svg width="100%" viewBox="0 0 600 380" style={{background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid #1e2d45'}}>
        {edges.map(([u,v],i)=>{ const a=nodes[u],b=nodes[v]; if(!a||!b) return null; const isActive=activeEdge&&((activeEdge[0]===u&&activeEdge[1]===v)||(activeEdge[0]===v&&activeEdge[1]===u)); return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isActive?'#f59e0b':'#1e3a5f'} strokeWidth={isActive?2.5:1.5} strokeOpacity={0.8}/> })}
        {nodes.map((nd,i)=>{ const isVisited=visited.includes(i), isCurrent=current===i, isOrder=order.indexOf(i); let fill=isCurrent?'#f59e0b':isVisited?'#0891b2':'#1e3a5f', stroke=isCurrent?'#fcd34d':isVisited?'#22d3ee':'#2d4a6e'; return (<g key={i}><circle cx={nd.x} cy={nd.y} r={22} fill={fill} stroke={stroke} strokeWidth={2}/><text x={nd.x} y={nd.y} textAnchor="middle" dominantBaseline="central" fill={isCurrent||isVisited?'#fff':'#94a3b8'} fontSize={13} fontWeight={700}>{nd.label}</text>{dist&&dist[i]!==undefined&&<text x={nd.x} y={nd.y+32} textAnchor="middle" fill='#22d3ee' fontSize={10}>{dist[i]===Infinity?'∞':dist[i]}</text>}{isOrder>=0&&<text x={nd.x+18} y={nd.y-18} fill='#f59e0b' fontSize={10} fontWeight={700}>{isOrder+1}</text>}</g>) })}
      </svg>
      {order.length>0&&<div style={{fontSize:11,color:'#64748b'}}>Order: <span style={{color:'#22d3ee'}}>{order.map(i=>nodes[i]?.label).join(' → ')}</span></div>}
    </div>
  )
}

function TreeViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { nodes=[], edges=[], positions={}, current=-1, visited=[], message='' } = step
  if (!nodes.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>Press ▶ Visualize to begin</div>
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{fontSize:11,color:'#22d3ee',fontFamily:'monospace'}}>{message}</div>
      <svg width="100%" viewBox="0 0 600 400" style={{background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid #1e2d45'}}>
        {edges.map((e,i)=>{ const a=positions[e.from],b=positions[e.to]; if(!a||!b) return null; return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke='#1e3a5f' strokeWidth={1.5}/> })}
        {nodes.map(nd=>{ const pos=positions[nd.id]; if(!pos) return null; const isCur=nd.id===current, isVis=visited.includes(nd.id); return (<g key={nd.id}><circle cx={pos.x} cy={pos.y} r={20} fill={isCur?'#f59e0b':isVis?'#0891b2':'#1e3a5f'} stroke={isCur?'#fcd34d':isVis?'#22d3ee':'#2d4a6e'} strokeWidth={2}/><text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill='#fff' fontSize={12} fontWeight={700}>{nd.val}</text></g>) })}
      </svg>
    </div>
  )
}

function StackViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { stack = [], op = '', val = null, message = '', size = 0 } = step
  const opColors = {
    push:  { bg:'rgba(16,185,129,0.15)',  border:'#10b981', text:'#34d399',  label:'PUSH'  },
    pop:   { bg:'rgba(239,68,68,0.15)',   border:'#ef4444', text:'#fca5a5',  label:'POP'   },
    peek:  { bg:'rgba(245,158,11,0.15)',  border:'#f59e0b', text:'#fcd34d',  label:'PEEK'  },
    init:  { bg:'rgba(99,102,241,0.12)',  border:'#6366f1', text:'#a5b4fc',  label:'INIT'  },
    done:  { bg:'rgba(16,185,129,0.10)',  border:'#10b981', text:'#34d399',  label:'DONE'  },
    error: { bg:'rgba(239,68,68,0.15)',   border:'#ef4444', text:'#fca5a5',  label:'ERROR' },
  }
  const opStyle = opColors[op] || { bg:'rgba(255,255,255,0.04)', border:'#1e2d45', text:'#94a3b8', label: op?.toUpperCase() || '—' }
  if (!steps.length) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#475569', fontSize:14 }}>Press ▶ Visualize to begin</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', gap:10, padding:'12px 16px', minHeight:0 }}>
      <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 14px', borderRadius:8, background:'#0f172a', border:'1px solid #1e3a5f', minWidth:72 }}>
          <span style={{ fontSize:18, fontWeight:700, fontFamily:'monospace', color:'#60a5fa' }}>{size}</span>
          <span style={{ fontSize:10, color:'#64748b', marginTop:2 }}>Size</span>
        </div>
        {op && op !== 'init' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 14px', borderRadius:8, background:opStyle.bg, border:`1px solid ${opStyle.border}`, minWidth:80 }}>
            <span style={{ fontSize:18, fontWeight:700, fontFamily:'monospace', color:opStyle.text }}>{opStyle.label}</span>
            <span style={{ fontSize:10, color:'#64748b', marginTop:2 }}>Operation</span>
          </div>
        )}
        {val !== null && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 14px', borderRadius:8, background:'#0f172a', border:'1px solid #312e81', minWidth:72 }}>
            <span style={{ fontSize:18, fontWeight:700, fontFamily:'monospace', color:'#a5b4fc' }}>"{val}"</span>
            <span style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{op==='pop'?'Popped':op==='peek'?'Peeked':'Pushed'}</span>
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'6px 14px', borderRadius:8, background:'#0f172a', border:'1px solid #1e3a5f', minWidth:80 }}>
          <span style={{ fontSize:13, fontWeight:700, fontFamily:'monospace', color:stack.length?'#fcd34d':'#334155' }}>
            {stack.length ? `"${stack[stack.length-1]}"` : 'empty'}
          </span>
          <span style={{ fontSize:10, color:'#64748b', marginTop:2 }}>Top</span>
        </div>
      </div>
      <div style={{ flexShrink:0, padding:'7px 12px', background:'#0f172a', border:'1px solid #1e3a5f', borderRadius:8 }}>
        <span style={{ fontSize:12, fontFamily:'monospace', color:'#67e8f9' }}>{message || '—'}</span>
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0, overflow:'hidden' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0, width:220 }}>
          {stack.length > 0 && <div style={{ fontSize:10, color:'#64748b', fontFamily:'monospace', marginBottom:4, alignSelf:'flex-end', marginRight:8 }}>← top</div>}
          <div style={{ display:'flex', flexDirection:'column', width:'100%', gap:2 }}>
            {stack.length === 0 ? (
              <div style={{ width:'100%', padding:'12px 0', textAlign:'center', border:'1px dashed #1e2d45', borderRadius:8, color:'#334155', fontFamily:'monospace', fontSize:13 }}>(empty)</div>
            ) : (
              [...stack].reverse().map((item, i) => {
                const isTop = i === 0
                const isNew = op === 'push' && isTop
                const isPopping = op === 'pop' && isTop
                return (
                  <motion.div key={`${item}-${stack.length-1-i}`}
                    initial={{ opacity:0, x: isNew ? -30 : 0, scale: isNew ? 0.85 : 1 }}
                    animate={{ opacity:1, x:0, scale:1 }} exit={{ opacity:0, x:40, scale:0.85 }}
                    transition={{ type:'spring', stiffness:400, damping:28 }}
                    style={{ width:'100%', padding:'10px 0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', fontSize:16, fontWeight:700, borderRadius: isTop ? '8px 8px 0 0' : '0', background: isTop ? (isNew?'rgba(16,185,129,0.18)':isPopping?'rgba(239,68,68,0.18)':'rgba(99,102,241,0.18)') : 'rgba(255,255,255,0.04)', border: `1px solid ${isTop ? (isNew?'#10b981':isPopping?'#ef4444':'#6366f1') : '#1e2d45'}`, color: isTop ? (isNew?'#34d399':isPopping?'#fca5a5':'#a5b4fc') : '#64748b', position:'relative' }}>
                    {item}
                    {isTop && <span style={{ position:'absolute', left:8, fontSize:9, color:isNew?'#34d399':'#6366f1', fontWeight:400 }}>{isNew ? '← pushed' : isPopping ? '← pop next' : '← top'}</span>}
                  </motion.div>
                )
              })
            )}
          </div>
          <div style={{ width:'100%', height:4, background:'rgba(6,182,212,0.4)', borderRadius:'0 0 4px 4px' }} />
          <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace', marginTop:6 }}>bottom</div>
        </div>
      </div>
    </div>
  )
}

function LinkedListViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { list=[], current=-1, highlighted=[], message='' } = step
  if (!step.list && !message) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>Press ▶ Visualize to begin</div>
  return (
    <div style={{display:'flex',flexDirection:'column',gap:16,padding:8}}>
      <div style={{fontSize:11,color:'#22d3ee',fontFamily:'monospace'}}>{message}</div>
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:4}}>
        <span style={{fontSize:11,color:'#64748b',marginRight:4}}>head →</span>
        {list.map((val,i)=>{ const isHl=highlighted.includes(i)||current===i; return (<React.Fragment key={i}><motion.div animate={{borderColor:isHl?'#f59e0b':'#1e2d45',background:isHl?'rgba(245,158,11,0.1)':'rgba(255,255,255,0.04)'}} style={{display:'flex',borderRadius:8,border:'1px solid',overflow:'hidden'}}><div style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:isHl?'#fcd34d':'#94a3b8',borderRight:'1px solid #1e2d45'}}>{val}</div><div style={{width:28,height:44,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#334155'}}>next</div></motion.div>{i<list.length-1&&<span style={{color:'#334155',fontSize:16}}>→</span>}</React.Fragment>) })}
        {list.length>0&&<span style={{color:'#334155',fontSize:11}}> → null</span>}
        {list.length===0&&<span style={{color:'#334155',fontSize:13}}>null</span>}
      </div>
    </div>
  )
}

function HashMapViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { table=[], current=-1, key='', hash=-1, collisions=0, message='' } = step
  if (!step.table && !message) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>Press ▶ Visualize to begin</div>
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',gap:10,padding:'8px 4px',minHeight:0}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
        {[['Buckets',table.length,'#60a5fa'],['Active Bucket',current>=0?current:'—','#818cf8'],['Collisions',collisions,'#ef4444'],['Current Key',key||'—','#fcd34d']].map(([l,v,c])=>(
          <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'#0f172a',border:'1px solid #1e3a5f',minWidth:72}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:c}}>{v}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{flexShrink:0,padding:'6px 10px',background:'#0f172a',border:'1px solid #1e3a5f',borderRadius:8}}>
        <span style={{fontSize:12,fontFamily:'monospace',color:'#67e8f9'}}>{message||'—'}</span>
      </div>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:3}}>
        {table.map((bucket,i)=>{
          const isActive=i===current
          const hasCollision=bucket.length>1
          return (
            <motion.div key={i}
              animate={{
                borderColor: isActive?'#6366f1':bucket.length>0?'#334155':'#1e293b',
                backgroundColor: isActive?'rgba(99,102,241,0.12)':bucket.length>0?'#111827':'#0a0f1a',
              }}
              transition={{duration:0.18}}
              style={{display:'flex',alignItems:'center',gap:8,borderRadius:8,border:'1px solid',padding:'6px 10px',minHeight:36}}
            >
              <div style={{width:28,height:28,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:'monospace',fontWeight:700,flexShrink:0,background:isActive?'rgba(99,102,241,0.25)':'rgba(255,255,255,0.04)',color:isActive?'#a5b4fc':'#475569',border:`1px solid ${isActive?'#6366f1':'#1e2d45'}`}}>{i}</div>
              <div style={{flex:1,display:'flex',flexWrap:'wrap',gap:5,alignItems:'center'}}>
                {bucket.length===0
                  ? <span style={{color:'#1e2d45',fontSize:11,fontFamily:'monospace'}}>empty</span>
                  : bucket.map(([k,v],j)=>(
                    <motion.span key={j}
                      initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
                      style={{fontSize:11,padding:'2px 8px',borderRadius:5,fontFamily:'monospace',
                        background: isActive?'rgba(99,102,241,0.2)':'rgba(6,182,212,0.08)',
                        color: isActive?'#a5b4fc':'#67e8f9',
                        border:`1px solid ${isActive?'rgba(99,102,241,0.5)':'rgba(6,182,212,0.2)'}`,
                      }}>
                      {k} → {v}
                    </motion.span>
                  ))
                }
              </div>
              {hasCollision&&(
                <span style={{fontSize:9,padding:'2px 6px',borderRadius:4,background:'rgba(245,158,11,0.1)',color:'#fcd34d',border:'1px solid rgba(245,158,11,0.3)',flexShrink:0,fontWeight:700}}>
                  ⚡ chain {bucket.length}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function RecursionViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { tree=[], current=-1, message='' } = step
  if (!tree.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>Press ▶ Visualize to begin</div>
  const maxDepth = Math.max(...tree.map(n=>n.depth), 0)
  const W = 600, H = Math.max(200, (maxDepth+1)*80)
  const byDepth = {}
  tree.forEach(n=>{ byDepth[n.depth]=(byDepth[n.depth]||[]).concat(n) })
  const positions = {}
  Object.entries(byDepth).forEach(([d,nodes])=>{ nodes.forEach((n,i)=>{ positions[n.id]={ x: W*(i+1)/(nodes.length+1), y: 40+Number(d)*70 } }) })
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{fontSize:11,color:'#22d3ee',fontFamily:'monospace'}}>{message}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{background:'rgba(255,255,255,0.02)',borderRadius:12,border:'1px solid #1e2d45',minHeight:150}}>
        {tree.map(nd=>{ if(nd.parentId<0) return null; const a=positions[nd.parentId],b=positions[nd.id]; if(!a||!b) return null; return <line key={nd.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke='#1e3a5f' strokeWidth={1.5}/> })}
        {tree.map(nd=>{ const pos=positions[nd.id]; if(!pos) return null; const isCur=nd.id===current, isDone=nd.result!==null; return (<g key={nd.id}><circle cx={pos.x} cy={pos.y} r={18} fill={isCur?'#92400e':isDone?'#064e3b':'#1e3a5f'} stroke={isCur?'#f59e0b':isDone?'#10b981':'#2d4a6e'} strokeWidth={2}/><text x={pos.x} y={pos.y-4} textAnchor="middle" fill='#fff' fontSize={10} fontWeight={700}>{nd.n!==undefined?`f(${nd.n})`:nd.label||''}</text>{isDone&&<text x={pos.x} y={pos.y+8} textAnchor="middle" fill='#34d399' fontSize={9}>{nd.result}</text>}</g>) })}
      </svg>
    </div>
  )
}

function DPViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { dp=[], s1='', s2='', ci=-1, cj=-1, match=false, message='' } = step
  if (!dp.length) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>Press ▶ Visualize to begin</div>
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8,overflowX:'auto'}}>
      <div style={{fontSize:11,color:'#22d3ee',fontFamily:'monospace'}}>{message}</div>
      <table style={{borderCollapse:'collapse',fontSize:11,fontFamily:'monospace'}}>
        <thead><tr><td style={{width:32,height:28}}/><td style={{width:32,height:28,color:'#475569',textAlign:'center'}}>ε</td>{s2.split('').map((c,j)=><td key={j} style={{width:32,height:28,color:'#64748b',textAlign:'center',fontWeight:700}}>{c}</td>)}</tr></thead>
        <tbody>{dp.map((row,i)=>(<tr key={i}><td style={{color:i>0?'#64748b':'#475569',textAlign:'center',fontWeight:i>0?700:400,width:32}}>{i>0?s1[i-1]:'ε'}</td>{row.map((cell,j)=>{ const isActive=i===ci&&j===cj; return <td key={j} style={{width:32,height:28,textAlign:'center',border:'1px solid #1e2d45',background:isActive?(match?'rgba(16,185,129,0.2)':'rgba(99,102,241,0.2)'):'rgba(255,255,255,0.02)',color:isActive?(match?'#34d399':'#a5b4fc'):'#94a3b8',fontWeight:isActive?700:400,transition:'all 0.2s'}}>{cell}</td> })}</tr>))}</tbody>
      </table>
    </div>
  )
}

function QueueViz() {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const { message = '' } = step

  if (step.circularQueue !== undefined) return <CircularQueueViz step={step} />
  if (step.deque         !== undefined) return <DequeViz         step={step} />
  if (step.heap          !== undefined) return <PriorityQueueViz step={step} />

  const { queue = [], highlight = -1, op = '', insertedVal, removedVal } = step

  if (!queue && !message) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#475569',fontSize:14}}>
      Configure operations above and press ▶ Visualize
    </div>
  )

  const opColor = { enqueue:'#10b981', dequeue:'#ef4444', peek:'#f59e0b', front:'#f59e0b', rear:'#818cf8', full:'#ef4444', empty:'#ef4444', clear:'#06b6d4', done:'#10b981' }
  const accent = opColor[op] || '#64748b'

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',gap:10,padding:'12px 16px',minHeight:0}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
        {[
          ['Size', queue.length, '#60a5fa'],
          ['Front', queue.length ? queue[0] : '—', '#10b981'],
          ['Rear',  queue.length ? queue[queue.length-1] : '—', '#818cf8'],
          ['Op', op || '—', accent],
        ].map(([l,v,c])=>(
          <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'#0f172a',border:'1px solid #1e3a5f',minWidth:64}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:c}}>{String(v).slice(0,6)}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>{l}</span>
          </div>
        ))}
        {(insertedVal !== null && insertedVal !== undefined) && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'rgba(16,185,129,0.08)',border:'1px solid #10b981',minWidth:64}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:'#34d399'}}>{insertedVal}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>Inserted</span>
          </div>
        )}
        {(removedVal !== null && removedVal !== undefined) && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'rgba(239,68,68,0.08)',border:'1px solid #ef4444',minWidth:64}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:'#fca5a5'}}>{removedVal}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>Removed</span>
          </div>
        )}
      </div>

      <div style={{flexShrink:0,padding:'6px 10px',background:'#0f172a',border:'1px solid #1e3a5f',borderRadius:8}}>
        <span style={{fontSize:12,fontFamily:'monospace',color:'#67e8f9'}}>{message || '—'}</span>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,minHeight:0}}>
        <div style={{display:'flex',alignItems:'center',gap:0,flexWrap:'wrap',justifyContent:'center'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginRight:8}}>
            <span style={{fontSize:10,color:'#10b981',fontFamily:'monospace',fontWeight:700}}>FRONT</span>
            <span style={{fontSize:16,color:'#10b981'}}>→</span>
          </div>

          {queue.length === 0 ? (
            <div style={{padding:'12px 24px',border:'1px dashed #1e2d45',borderRadius:8,color:'#334155',fontFamily:'monospace',fontSize:13}}>(empty)</div>
          ) : (
            queue.map((val, i) => {
              const isHighlight = i === highlight
              const isFront = i === 0
              const isRear  = i === queue.length - 1
              const isNew   = isHighlight && op === 'enqueue'
              const isLeave = isHighlight && op === 'dequeue'
              return (
                <motion.div key={`${val}-${i}`}
                  initial={{ opacity: isNew ? 0 : 1, y: isNew ? -30 : 0, scale: isNew ? 0.7 : 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: isLeave ? -40 : 0, scale: 0.7 }}
                  transition={{ type:'spring', stiffness:400, damping:28 }}
                  style={{
                    width: 54, height: 54,
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    fontFamily:'monospace', fontSize:16, fontWeight:700,
                    border:`2px solid ${isHighlight ? accent : isFront ? '#10b981' : isRear ? '#818cf8' : '#1e3a5f'}`,
                    background: isHighlight ? `${accent}22` : isFront ? 'rgba(16,185,129,0.08)' : isRear ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.04)',
                    color: isHighlight ? accent : isFront ? '#34d399' : isRear ? '#a5b4fc' : '#94a3b8',
                    borderRight: i < queue.length-1 ? 'none' : undefined,
                    borderRadius: i===0&&queue.length===1?8:i===0?'8px 0 0 8px':i===queue.length-1?'0 8px 8px 0':0,
                    position:'relative',
                    boxShadow: isHighlight ? `0 0 14px ${accent}66` : 'none',
                  }}
                >
                  {val}
                  {(isFront||isRear) && (
                    <span style={{position:'absolute',bottom:-18,fontSize:8,color:isFront?'#10b981':'#818cf8',fontWeight:400}}>
                      {isFront&&isRear?'F+R':isFront?'front':isRear?'rear':''}
                    </span>
                  )}
                </motion.div>
              )
            })
          )}

          <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginLeft:8}}>
            <span style={{fontSize:10,color:'#818cf8',fontFamily:'monospace',fontWeight:700}}>REAR</span>
            <span style={{fontSize:16,color:'#818cf8'}}>←</span>
          </div>
        </div>

        {queue.length > 0 && (
          <div style={{display:'flex',gap:0,marginLeft:56}}>
            {queue.map((_,i) => (
              <div key={i} style={{width:54,textAlign:'center',fontSize:9,color:'#334155',fontFamily:'monospace',borderRight:i<queue.length-1?'none':undefined}}>[{i}]</div>
            ))}
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:10,flexShrink:0,flexWrap:'wrap'}}>
        {[['Front','#10b981'],['Rear','#818cf8'],['Active','#f59e0b'],['Enqueue','#10b981'],['Dequeue','#ef4444']].map(([l,c])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:8,height:8,borderRadius:2,background:c}}/>
            <span style={{fontSize:10,color:'#64748b',fontFamily:'monospace'}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CircularQueueViz({ step }) {
  const { circularQueue = [], front = -1, rear = -1, capacity = 8, size = 0, activeIdx = -1, op = '', message = '' } = step
  const CX = 220, CY = 180, R = 140
  const cells = Array.from({ length: capacity }, (_, i) => {
    const angle = (2 * Math.PI * i / capacity) - Math.PI / 2
    return { i, val: circularQueue[i], x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle), angle }
  })
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',gap:10,padding:'12px 16px',minHeight:0}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
        {[['Front',front,'#10b981'],['Rear',rear,'#818cf8'],['Size',size,'#60a5fa'],['Capacity',capacity,'#475569']].map(([l,v,c])=>(
          <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'#0f172a',border:'1px solid #1e3a5f',minWidth:64}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:c}}>{v}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{flexShrink:0,padding:'6px 10px',background:'#0f172a',border:'1px solid #1e3a5f',borderRadius:8}}>
        <span style={{fontSize:12,fontFamily:'monospace',color:'#67e8f9'}}>{message||'—'}</span>
      </div>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:0}}>
        <svg width={440} height={360} viewBox="0 0 440 360" style={{maxWidth:'100%'}}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e2d45" strokeWidth={1} strokeDasharray="4 4"/>
          {cells.map(({ i, val, x, y }) => {
            const isFront = i === front
            const isRear  = i === rear
            const isActive = i === activeIdx
            const isEmpty  = val === null || val === undefined
            const border = isActive ? '#f59e0b' : isFront ? '#10b981' : isRear ? '#818cf8' : isEmpty ? '#1e2d45' : '#334155'
            const bg     = isActive ? 'rgba(245,158,11,0.2)' : isFront ? 'rgba(16,185,129,0.15)' : isRear ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)'
            const textC  = isActive ? '#fcd34d' : isFront ? '#34d399' : isRear ? '#a5b4fc' : isEmpty ? '#334155' : '#94a3b8'
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={22} fill={bg} stroke={border} strokeWidth={isActive||isFront||isRear?2:1}/>
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={textC} fontSize={13} fontWeight={700}>{isEmpty ? i : val}</text>
                <text x={x} y={y+28} textAnchor="middle" fill="#334155" fontSize={9}>[{i}]</text>
                {isFront && <text x={x} y={y-30} textAnchor="middle" fill="#10b981" fontSize={9} fontWeight={700}>F</text>}
                {isRear  && <text x={x} y={y-(isFront?40:30)} textAnchor="middle" fill="#818cf8" fontSize={9} fontWeight={700}>R</text>}
              </g>
            )
          })}
          <text x={CX} y={CY-12} textAnchor="middle" fill="#475569" fontSize={11}>size={size}</text>
          <text x={CX} y={CY+6}  textAnchor="middle" fill="#475569" fontSize={11}>cap={capacity}</text>
          <text x={CX} y={CY+22} textAnchor="middle" fill="#334155" fontSize={9}>{op||'—'}</text>
        </svg>
      </div>
    </div>
  )
}

function DequeViz({ step }) {
  const { deque = [], highlightFront = false, highlightRear = false, op = '', insertedVal, message = '' } = step
  const isPushFront = op === 'pushFront'
  const isPushRear  = op === 'pushRear'
  const isPopFront  = op === 'popFront'
  const isPopRear   = op === 'popRear'
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',gap:10,padding:'12px 16px',minHeight:0}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
        {[['Size',deque.length,'#60a5fa'],['Front',deque[0]??'—','#10b981'],['Rear',deque[deque.length-1]??'—','#818cf8'],['Op',op||'—','#f59e0b']].map(([l,v,c])=>(
          <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'#0f172a',border:'1px solid #1e3a5f',minWidth:64}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:c}}>{String(v).slice(0,6)}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{flexShrink:0,padding:'6px 10px',background:'#0f172a',border:'1px solid #1e3a5f',borderRadius:8}}>
        <span style={{fontSize:12,fontFamily:'monospace',color:'#67e8f9'}}>{message||'—'}</span>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,minHeight:0}}>
        <div style={{display:'flex',width:'100%',justifyContent:'space-between',paddingLeft:60,paddingRight:60}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <motion.div animate={{opacity:isPushFront||isPopFront?1:0.2}} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              {isPushFront && <span style={{fontSize:10,color:'#10b981',fontFamily:'monospace'}}>push →</span>}
              {isPopFront  && <span style={{fontSize:10,color:'#ef4444',fontFamily:'monospace'}}>← pop</span>}
              {!isPushFront&&!isPopFront && <span style={{fontSize:10,color:'#334155',fontFamily:'monospace'}}>front</span>}
            </motion.div>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <motion.div animate={{opacity:isPushRear||isPopRear?1:0.2}} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
              {isPushRear && <span style={{fontSize:10,color:'#10b981',fontFamily:'monospace'}}>← push</span>}
              {isPopRear  && <span style={{fontSize:10,color:'#ef4444',fontFamily:'monospace'}}>pop →</span>}
              {!isPushRear&&!isPopRear && <span style={{fontSize:10,color:'#334155',fontFamily:'monospace'}}>rear</span>}
            </motion.div>
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:0,flexWrap:'wrap',justifyContent:'center'}}>
          {deque.length === 0
            ? <div style={{padding:'12px 24px',border:'1px dashed #1e2d45',borderRadius:8,color:'#334155',fontFamily:'monospace',fontSize:13}}>(empty)</div>
            : deque.map((val, i) => {
              const isFront = i === 0
              const isRear  = i === deque.length - 1
              const hl = (isFront && highlightFront) || (isRear && highlightRear)
              const accentC = isFront && highlightFront ? (isPushFront?'#10b981':'#ef4444') : isRear && highlightRear ? (isPushRear?'#10b981':'#ef4444') : '#1e3a5f'
              return (
                <motion.div key={`${val}-${i}`}
                  initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                  transition={{ type:'spring', stiffness:400, damping:28 }}
                  style={{
                    width:54, height:54, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    fontFamily:'monospace', fontSize:16, fontWeight:700,
                    border:`2px solid ${hl?accentC:'#1e3a5f'}`,
                    background: hl ? `${accentC}22` : 'rgba(255,255,255,0.04)',
                    color: hl ? accentC : '#94a3b8',
                    borderRight: i<deque.length-1?'none':undefined,
                    borderRadius: i===0&&deque.length===1?8:i===0?'8px 0 0 8px':i===deque.length-1?'0 8px 8px 0':0,
                    boxShadow: hl ? `0 0 12px ${accentC}66` : 'none',
                  }}
                >
                  {val}
                </motion.div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

function PriorityQueueViz({ step }) {
  const { heap = [], swapIdx = [], activeIdx = -1, op = '', insertedVal, message = '' } = step
  const W = 560, nodeR = 22
  function getPos(i) {
    const depth = Math.floor(Math.log2(i + 1))
    const posInRow = i - (Math.pow(2, depth) - 1)
    const totalInRow = Math.pow(2, depth)
    const x = (W / (totalInRow + 1)) * (posInRow + 1)
    const y = 50 + depth * 72
    return { x, y }
  }
  const maxDepth = heap.length ? Math.floor(Math.log2(heap.length)) : 0
  const svgH = Math.max(160, (maxDepth + 1) * 72 + 60)
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',gap:10,padding:'12px 16px',minHeight:0}}>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
        {[['Size',heap.length,'#60a5fa'],['Max',heap[0]??'—','#f59e0b'],['Op',op||'—','#818cf8']].map(([l,v,c])=>(
          <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'#0f172a',border:'1px solid #1e3a5f',minWidth:64}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:c}}>{String(v).slice(0,8)}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>{l}</span>
          </div>
        ))}
        {insertedVal !== null && insertedVal !== undefined && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'5px 12px',borderRadius:8,background:'rgba(16,185,129,0.08)',border:'1px solid #10b981',minWidth:64}}>
            <span style={{fontSize:15,fontWeight:700,fontFamily:'monospace',color:'#34d399'}}>{insertedVal}</span>
            <span style={{fontSize:9,color:'#64748b',marginTop:2}}>{op==='extractMax'?'Extracted':'Inserted'}</span>
          </div>
        )}
      </div>
      <div style={{flexShrink:0,padding:'6px 10px',background:'#0f172a',border:'1px solid #1e3a5f',borderRadius:8}}>
        <span style={{fontSize:12,fontFamily:'monospace',color:'#67e8f9'}}>{message||'—'}</span>
      </div>
      <div style={{flex:1,overflow:'auto',minHeight:0}}>
        {heap.length === 0
          ? <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#334155',fontSize:13,fontFamily:'monospace'}}>(empty heap)</div>
          : (
            <svg width="100%" viewBox={`0 0 ${W} ${svgH}`} style={{background:'rgba(255,255,255,0.01)',borderRadius:8,border:'1px solid #1e2d45'}}>
              {heap.map((_, i) => {
                if (i === 0) return null
                const parent = Math.floor((i-1)/2)
                const a = getPos(parent), b = getPos(i)
                return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#1e3a5f" strokeWidth={1.5}/>
              })}
              {heap.map((val, i) => {
                const { x, y } = getPos(i)
                const isSwap   = swapIdx.includes(i)
                const isActive = i === activeIdx
                const isRoot   = i === 0
                const fill   = isSwap ? '#92400e' : isActive ? '#1e3a5f' : isRoot ? '#1e1b4b' : '#0f172a'
                const stroke = isSwap ? '#f59e0b' : isActive ? '#818cf8'  : isRoot ? '#6366f1' : '#334155'
                const textC  = isSwap ? '#fcd34d' : isActive ? '#a5b4fc'  : isRoot ? '#a5b4fc' : '#94a3b8'
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={isSwap||isRoot?2:1.5}
                      style={{filter: isSwap?'drop-shadow(0 0 6px #f59e0b)':isRoot?'drop-shadow(0 0 6px #6366f1)':'none'}}/>
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={textC} fontSize={12} fontWeight={700}>{val}</text>
                    <text x={x} y={y+nodeR+12} textAnchor="middle" fill="#334155" fontSize={8}>[{i}]</text>
                    {isRoot && <text x={x} y={y-nodeR-8} textAnchor="middle" fill="#6366f1" fontSize={9} fontWeight={700}>MAX</text>}
                  </g>
                )
              })}
            </svg>
          )
        }
      </div>
      {heap.length > 0 && (
        <div style={{flexShrink:0,display:'flex',gap:0,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:10,color:'#475569',fontFamily:'monospace',marginRight:6}}>heap:</span>
          {heap.map((v,i)=>(
            <div key={i} style={{width:36,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontFamily:'monospace',fontWeight:700,
              border:`1px solid ${swapIdx.includes(i)?'#f59e0b':i===activeIdx?'#818cf8':'#1e2d45'}`,
              background:swapIdx.includes(i)?'rgba(245,158,11,0.15)':i===activeIdx?'rgba(129,140,248,0.15)':'rgba(255,255,255,0.03)',
              color:swapIdx.includes(i)?'#fcd34d':i===activeIdx?'#a5b4fc':'#64748b',
              borderRight:i<heap.length-1?'none':undefined,
              borderRadius:i===0?'4px 0 0 4px':i===heap.length-1?'0 4px 4px 0':0,
            }}>{v}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function MemoryPanel() {
  const { stackFrames, heapObjects } = useVizStore()
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={S.sectionHd}>Stack</div>
      <div style={{overflowY:'auto',flex:1,minHeight:0}}>
        {stackFrames.length===0
          ? <div style={{fontSize:11,color:'#334155',padding:'4px 12px 8px'}}>No stack frames</div>
          : stackFrames.map(f=>(
            <div key={f.id} style={{margin:'2px 8px 4px',padding:'6px 8px',background:f.active?'rgba(6,182,212,0.06)':'rgba(255,255,255,0.02)',border:`1px solid ${f.active?'rgba(6,182,212,0.3)':'#1e2d45'}`,borderRadius:6}}>
              <div style={{fontSize:11,fontWeight:600,color:f.active?'#22d3ee':'#64748b',fontFamily:'monospace',marginBottom:4,display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:f.active?'#22d3ee':'#334155',display:'inline-block'}}/>{f.name}
              </div>
              {f.vars?.map((v,i)=>(
                <div key={i} style={{fontSize:10,color:'#64748b',fontFamily:'monospace',paddingLeft:11}}>
                  <span style={{color:'#94a3b8'}}>{v.name}</span><span style={{color:'#475569'}}> = </span><span style={{color:'#fcd34d'}}>{String(v.value).slice(0,20)}</span>
                </div>
              ))}
            </div>
          ))
        }
      </div>
      <div style={{borderTop:'1px solid #1e2d45'}}/>
      <div style={S.sectionHd}>Heap</div>
      <div style={{overflowY:'auto',flex:1,minHeight:0}}>
        {heapObjects.length===0
          ? <div style={{fontSize:11,color:'#334155',padding:'4px 12px 8px'}}>No heap objects</div>
          : heapObjects.map(o=>(
            <div key={o.id} style={{margin:'2px 8px 6px',padding:'6px 8px',background:'rgba(168,85,247,0.05)',border:'1px solid rgba(168,85,247,0.2)',borderRadius:6}}>
              <div style={{fontSize:10,fontWeight:600,color:'#c084fc',fontFamily:'monospace',marginBottom:3}}>{o.id}: {o.type}</div>
              <div style={{fontSize:10,color:'#a78bfa',fontFamily:'monospace',wordBreak:'break-all'}}>
                {Array.isArray(o.value) ? `[${o.value.slice(0,10).join(', ')}${o.value.length>10?'…':''}]` : JSON.stringify(o.value).slice(0,60)}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

function VarPanel() {
  const { variables } = useVizStore()
  if (!variables.length) return null
  return (
    <div style={{borderTop:'1px solid #1e2d45',background:'#0d1117',padding:'6px 12px',display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
      {variables.slice(0,12).map((v,i)=>(
        <div key={i} style={{fontSize:10,fontFamily:'monospace',padding:'2px 6px',background:'rgba(255,255,255,0.04)',border:'1px solid #1e2d45',borderRadius:4}}>
          <span style={{color:'#94a3b8'}}>{v.name}</span><span style={{color:'#475569'}}>=</span><span style={{color:'#fcd34d'}}>{String(v.value).slice(0,16)}</span>
        </div>
      ))}
    </div>
  )
}

const ALGO_CODES = {
  bubbleSort:    `function bubbleSort(arr) {\n  const n = arr.length\n  for (let i = 0; i < n - 1; i++) {\n    for (let j = 0; j < n - 1 - i; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j+1]] = [arr[j+1], arr[j]]\n      }\n    }\n  }\n  return arr\n}`,
  selectionSort: `function selectionSort(arr) {\n  for (let i = 0; i < arr.length - 1; i++) {\n    let minIdx = i\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[j] < arr[minIdx]) minIdx = j\n    }\n    if (minIdx !== i)\n      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]\n  }\n  return arr\n}`,
  insertionSort: `function insertionSort(arr) {\n  for (let i = 1; i < arr.length; i++) {\n    const key = arr[i]\n    let j = i - 1\n    while (j >= 0 && arr[j] > key) {\n      arr[j + 1] = arr[j]\n      j--\n    }\n    arr[j + 1] = key\n  }\n  return arr\n}`,
  mergeSort:     `function mergeSort(arr) {\n  if (arr.length <= 1) return arr\n  const mid = Math.floor(arr.length / 2)\n  const L = mergeSort(arr.slice(0, mid))\n  const R = mergeSort(arr.slice(mid))\n  return merge(L, R)\n}\nfunction merge(L, R) {\n  const res = []; let i = 0, j = 0\n  while (i < L.length && j < R.length)\n    res.push(L[i] <= R[j] ? L[i++] : R[j++])\n  return res.concat(L.slice(i), R.slice(j))\n}`,
  quickSort:     `function quickSort(arr, lo=0, hi=arr.length-1) {\n  if (lo < hi) {\n    const p = partition(arr, lo, hi)\n    quickSort(arr, lo, p - 1)\n    quickSort(arr, p + 1, hi)\n  }\n  return arr\n}\nfunction partition(arr, lo, hi) {\n  const pivot = arr[hi]; let i = lo - 1\n  for (let j = lo; j < hi; j++)\n    if (arr[j] <= pivot) { i++; swap(arr,i,j) }\n  swap(arr, i+1, hi)\n  return i + 1\n}`,
  linearSearch:  `function linearSearch(arr, target) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) {\n      return i  // found!\n    }\n  }\n  return -1\n}`,
  binarySearch:  `function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2)\n    if (arr[mid] === target) return mid\n    else if (arr[mid] < target) lo = mid + 1\n    else hi = mid - 1\n  }\n  return -1\n}`,
  bfs:           `function bfs(graph, start) {\n  const visited = new Set([start])\n  const queue = [start]\n  while (queue.length > 0) {\n    const node = queue.shift()\n    for (const nb of graph[node]) {\n      if (!visited.has(nb)) {\n        visited.add(nb)\n        queue.push(nb)\n      }\n    }\n  }\n}`,
  dfs:           `function dfs(graph, node, visited = new Set()) {\n  visited.add(node)\n  for (const nb of graph[node]) {\n    if (!visited.has(nb)) {\n      dfs(graph, nb, visited)\n    }\n  }\n  return visited\n}`,
  dijkstra:      `function dijkstra(graph, src) {\n  const dist = {}; const pq = new MinHeap()\n  dist[src] = 0; pq.push([0, src])\n  while (!pq.empty()) {\n    const [d, u] = pq.pop()\n    for (const [v, w] of graph[u]) {\n      if (d + w < (dist[v] ?? Infinity)) {\n        dist[v] = d + w\n        pq.push([dist[v], v])\n      }\n    }\n  }\n  return dist\n}`,
  bstInsert:     `function insert(root, val) {\n  if (!root) return new Node(val)\n  if (val < root.val)\n    root.left = insert(root.left, val)\n  else if (val > root.val)\n    root.right = insert(root.right, val)\n  return root\n}`,
  fibonacci:     `function fib(n) {\n  if (n <= 1) return n\n  return fib(n - 1) + fib(n - 2)\n}`,
  lcs:           `function lcs(s1, s2) {\n  const m=s1.length, n=s2.length\n  const dp = Array(m+1).fill(0).map(()=>Array(n+1).fill(0))\n  for (let i=1;i<=m;i++)\n    for (let j=1;j<=n;j++)\n      if (s1[i-1]===s2[j-1])\n        dp[i][j] = dp[i-1][j-1]+1\n      else\n        dp[i][j] = Math.max(dp[i-1][j],dp[i][j-1])\n  return dp[m][n]\n}`,
  stack:         `class Stack {\n  constructor() {\n    this.items = []\n  }\n  push(val) {\n    this.items.push(val)      // O(1)\n  }\n  pop() {\n    if (this.isEmpty()) return null\n    return this.items.pop()   // O(1)\n  }\n  peek() {\n    return this.items[this.items.length - 1]\n  }\n  isEmpty() {\n    return this.items.length === 0\n  }\n}`,
  normalQueue: `class Queue {\n  constructor(capacity) {\n    this.items = []\n    this.capacity = capacity\n  }\n  enqueue(x) {\n    if (this.isFull()) throw 'Full'\n    this.items.push(x)           // ← insert at rear\n  }\n  dequeue() {\n    if (this.isEmpty()) return null\n    return this.items.shift()    // ← remove from front\n  }\n  peek() {\n    return this.items[0]         // ← front element\n  }\n  rear() {\n    return this.items[this.items.length - 1]\n  }\n  isEmpty() {\n    return this.items.length === 0\n  }\n  isFull() {\n    return this.items.length >= this.capacity\n  }\n  clear() {\n    this.items = []\n  }\n  size() { return this.items.length }\n}`,
  circularQueue: `class CircularQueue {\n  constructor(capacity) {\n    this.queue = new Array(capacity).fill(null)\n    this.capacity = capacity\n    this.front = -1; this.rear = -1; this.size = 0\n  }\n  enqueue(x) {\n    if (this.isFull()) throw 'Full'\n    if (this.front === -1) { this.front = 0; this.rear = 0 }\n    else this.rear = (this.rear + 1) % this.capacity\n    this.queue[this.rear] = x\n    this.size++\n  }\n  dequeue() {\n    if (this.isEmpty()) return null\n    const val = this.queue[this.front]\n    this.queue[this.front] = null\n    this.size--\n    if (this.size === 0) { this.front = -1; this.rear = -1 }\n    else this.front = (this.front + 1) % this.capacity\n    return val\n  }\n  front() { return this.queue[this.front] }\n  rear()  { return this.queue[this.rear]  }\n  isEmpty() { return this.size === 0 }\n  isFull()  { return this.size === this.capacity }\n}`,
  deque: `class Deque {\n  constructor() { this.items = [] }\n  pushFront(x) {\n    this.items.unshift(x)  // ← insert at front\n  }\n  pushRear(x) {\n    this.items.push(x)     // ← insert at rear\n  }\n  popFront() {\n    return this.items.shift()  // ← remove front\n  }\n  popRear() {\n    return this.items.pop()    // ← remove rear\n  }\n  front() {\n    return this.items[0]\n  }\n  rear() {\n    return this.items[this.items.length - 1]\n  }\n  size()    { return this.items.length }\n  isEmpty() { return this.items.length === 0 }\n}`,
  priorityQueue: `class MaxHeap {\n  constructor() { this.heap = [] }\n  insert(x) {\n    this.heap.push(x)\n    this._heapifyUp(this.heap.length - 1)\n  }\n  _heapifyUp(i) {\n    while (i > 0) {\n      const p = Math.floor((i-1)/2)\n      if (this.heap[p] >= this.heap[i]) break\n      ;[this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]]\n      i = p\n    }\n  }\n  extractMax() {\n    const max = this.heap[0]\n    this.heap[0] = this.heap.pop()\n    this._heapifyDown(0)\n    return max\n  }\n  _heapifyDown(i) {\n    const n = this.heap.length\n    while (true) {\n      let largest = i\n      const l=2*i+1, r=2*i+2\n      if (l<n && this.heap[l]>this.heap[largest]) largest=l\n      if (r<n && this.heap[r]>this.heap[largest]) largest=r\n      if (largest===i) break\n      ;[this.heap[i], this.heap[largest]] = [this.heap[largest], this.heap[i]]\n      i = largest\n    }\n  }\n  peek() { return this.heap[0] }\n}`,
  hashMap: `function hashMap(entries, SIZE) {\n  const table = new Array(SIZE).fill(null)\n    .map(() => [])   // empty buckets\n  let collisions = 0\n\n  function hash(key) {\n    let h = 0\n    for (const ch of key)\n      h = (h * 31 + ch.charCodeAt(0)) % SIZE\n    return h\n  }\n\n  for (const [key, val] of entries) {\n    const h = hash(key)          // ← compute bucket\n    if (table[h].length > 0)     // ← bucket occupied?\n      collisions++               // ← yes: collision\n    table[h].push([key, val])    // ← store entry\n  }\n\n  return { table, collisions }   // ← done\n}`,
}

const HASHMAP_LINE_MAP = { 0: 0, 5: 13, 16: 14, 17: 15, 12: 16, 15: 18 }

const KW = ['function','let','const','var','if','else','while','for','return','new','class','this','of','in','true','false','null','undefined','break','continue','throw','typeof','instanceof']

function hl(line) {
  let h = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  h = h.replace(/(\/\/.*$)/gm, '<span style="color:#3d5166;font-style:italic">$1</span>')
  h = h.replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, '<span style="color:#4ade80">$1</span>')
  h = h.replace(/(?<![a-zA-Z_$])\b(\d+)\b/g, '<span style="color:#4ade80">$1</span>')
  h = h.replace(
    /\b(const|let|var)\s+([a-zA-Z_$][\w$]*)/g,
    '<span style="color:#c084fc">$1</span> <span style="color:#facc15">$2</span>'
  )
  KW.forEach(k => {
    h = h.replace(
      new RegExp(`\\b(${k})\\b(?![^<]*>)`, 'g'),
      '<span style="color:#c084fc">$1</span>'
    )
  })
  h = h.replace(
    /\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()(?![^<]*>)/g,
    '<span style="color:#67e8f9">$1</span>'
  )
  h = h.replace(
    /\.([a-zA-Z_$][a-zA-Z0-9_$]*)(?!\s*\()(?![^<]*>)/g,
    '.<span style="color:#93c5fd">$1</span>'
  )
  return h
}

function CodePanel({ algo }) {
  const { steps, currentStep } = useVizStore()
  const step = steps[currentStep] || {}
  const rawLine = step.line ?? -1
  const activeLine = algo === 'hashMap' ? (HASHMAP_LINE_MAP[rawLine] ?? -1) : rawLine
  const code = ALGO_CODES[algo] || '// Select an algorithm'
  const lines = code.split('\n')
  const activeRef = useRef(null)
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [activeLine])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
      <div style={{
        padding: '7px 10px', borderBottom: '1px solid #161f2e',
        flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center',
        background: '#0d1117',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ marginLeft: 6, fontSize: 11, color: '#3d5166', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
          {algo}.js
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace", fontSize: 12.5, lineHeight: '1.7' }}>
        {lines.map((line, i) => {
          const isActive = i === activeLine
          return (
            <div
              key={i}
              ref={isActive ? activeRef : null}
              style={{
                display: 'flex',
                alignItems: 'stretch',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                borderLeft: `3px solid ${isActive ? '#6366f1' : 'transparent'}`,
                transition: 'background 0.15s',
              }}
            >
              <div style={{
                userSelect: 'none',
                width: 36,
                paddingRight: 12,
                paddingLeft: 6,
                textAlign: 'right',
                flexShrink: 0,
                color: isActive ? '#6366f1' : '#2a3a50',
                fontSize: 11,
                lineHeight: '1.7',
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
              }}>
                {i + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  paddingRight: 16,
                  whiteSpace: 'pre',
                  color: isActive ? '#e2e8f0' : '#4a6080',
                  lineHeight: '1.7',
                }}
                dangerouslySetInnerHTML={{ __html: hl(line) }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CustomCodeTab() { return <CustomCodeVisualizerEngine /> }

const PRESETS = [0.3, 0.5, 1, 2, 3, 5]
function sliderToSpeed(v) { const mn=Math.log(0.3),mx=Math.log(5); return parseFloat(Math.exp(mn+(v/100)*(mx-mn)).toFixed(2)) }
function speedToSlider(s) { const mn=Math.log(0.3),mx=Math.log(5); return ((Math.log(s)-mn)/(mx-mn))*100 }

function Timeline() {
  const { steps, currentStep, isPlaying, speed, setCurrentStep, setIsPlaying, setSpeed, reset } = useVizStore()
  const intervalRef = useRef(null)
  const [showSpeed, setShowSpeed] = useState(false)
  const total = steps.length, pct = total>1?(currentStep/(total-1))*100:0, spd = speed||1
  const clearTimer = () => { if(intervalRef.current) clearInterval(intervalRef.current) }
  const advanceFull = useCallback(()=>{
    const { currentStep: cs, steps: ss, setCurrentStep: scs, setIsPlaying: sip } = useVizStore.getState()
    if (cs < ss.length - 1) scs(cs + 1)
    else { clearInterval(intervalRef.current); sip(false) }
  },[])
  useEffect(()=>{ clearTimer(); if(isPlaying&&total>0) intervalRef.current=setInterval(advanceFull,1000/spd); return clearTimer },[isPlaying,spd,advanceFull,total])
  const togglePlay = ()=>{ if(currentStep>=total-1) reset(); setIsPlaying(!isPlaying) }
  const label = steps[currentStep]?.message||steps[currentStep]?.description||'—'
  const ctrlBtn = (onClick, children, disabled=false, title='') => (
    <motion.button whileTap={{scale:0.88}} onClick={onClick} disabled={disabled} title={title} style={{...S.btn(false),opacity:disabled?0.3:1}}>{children}</motion.button>
  )
  return (
    <div style={S.timeline}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
        <span style={{fontSize:11,color:'#475569',fontFamily:'monospace',width:64,textAlign:'right',flexShrink:0}}>{currentStep+1}/{Math.max(1,total)}</span>
        <div style={{flex:1,height:6,borderRadius:3,background:'rgba(255,255,255,0.08)',cursor:'pointer',position:'relative'}}
          onClick={e=>{ const r=e.currentTarget.getBoundingClientRect(); setIsPlaying(false); setCurrentStep(Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*(total-1))) }}>
          <motion.div style={{position:'absolute',left:0,top:0,height:'100%',borderRadius:3,background:'linear-gradient(90deg,#06b6d4,#8b5cf6)',width:`${pct}%`}} transition={{type:'spring',stiffness:300,damping:30}}/>
        </div>
        <span style={{fontSize:11,color:'#475569',width:36,flexShrink:0}}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{flex:1,minWidth:0}}>
          <motion.p key={currentStep} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{duration:0.15}} style={{fontSize:11,color:'#22d3ee',fontFamily:'monospace',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',margin:0}}>{label}</motion.p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {ctrlBtn(()=>{ setIsPlaying(false); reset() },<IC.Reset/>,false,'Restart')}
          {ctrlBtn(()=>{ setIsPlaying(false); setCurrentStep(Math.max(0,currentStep-1)) },<IC.Prev/>,currentStep===0,'Previous')}
          <motion.button whileTap={{scale:0.92}} onClick={togglePlay} disabled={total===0} style={{...S.playBtn,opacity:total===0?0.4:1}}>
            {isPlaying?<IC.Pause/>:<IC.Play/>}
          </motion.button>
          {ctrlBtn(()=>{ setIsPlaying(false); setCurrentStep(Math.min(total-1,currentStep+1)) },<IC.Next/>,currentStep>=total-1,'Next')}
          <button onClick={()=>setShowSpeed(v=>!v)} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',cursor:'pointer',minWidth:56}}>
            <IC.Zap/><span style={{fontSize:11,color:'#fcd34d',fontFamily:'monospace'}}>{spd}x</span>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showSpeed&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} transition={{duration:0.2}} style={{overflow:'hidden'}}>
            <div style={{paddingTop:8,display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:10,color:'#475569',width:28}}>0.3x</span>
                <input type="range" min={0} max={100} step={0.5} value={speedToSlider(spd)} onChange={e=>setSpeed(sliderToSpeed(Number(e.target.value)))} style={{flex:1,height:4,borderRadius:2,appearance:'none',background:`linear-gradient(90deg,#06b6d4 0%,#8b5cf6 ${speedToSlider(spd)}%,rgba(255,255,255,0.08) ${speedToSlider(spd)}%,rgba(255,255,255,0.08) 100%)`,cursor:'pointer'}}/>
                <span style={{fontSize:10,color:'#475569',width:20}}>5x</span>
                <span style={{fontSize:11,color:'#fcd34d',fontFamily:'monospace',width:36,textAlign:'right'}}>{spd}x</span>
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <span style={{fontSize:10,color:'#475569'}}>Presets:</span>
                {PRESETS.map(p=>(<button key={p} onClick={()=>setSpeed(p)} style={{padding:'2px 8px',borderRadius:4,border:`1px solid ${spd===p?'#06b6d4':'rgba(255,255,255,0.1)'}`,background:spd===p?'rgba(6,182,212,0.2)':'rgba(255,255,255,0.04)',color:spd===p?'#67e8f9':'#64748b',fontSize:11,fontFamily:'monospace',cursor:'pointer'}}>{p}x</button>))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #06b6d4;box-shadow:0 0 5px rgba(6,182,212,0.5);cursor:pointer}input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #06b6d4;cursor:pointer}`}</style>
    </div>
  )
}

const DEFAULT_STACK_OPS = [
  {op:'push',val:'A'},{op:'push',val:'B'},{op:'push',val:'C'},
  {op:'peek'},{op:'pop'},{op:'push',val:'D'},{op:'push',val:'E'},{op:'pop'},{op:'pop'},
]
const OP_COLORS = { push:'#10b981', pop:'#ef4444', peek:'#f59e0b' }

function StackOpBuilder({ stackOps, setStackOps }) {
  const [op, setOp] = useState('push')
  const [val, setVal] = useState('')
  function add() {
    if (op === 'push' && !val.trim()) return
    setStackOps(prev => [...prev, op === 'push' ? { op, val: val.trim() } : { op }])
    setVal('')
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      <select value={op} onChange={e => setOp(e.target.value)} style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 6px', borderRadius:6, outline:'none' }}>
        <option value="push">push</option><option value="pop">pop</option><option value="peek">peek</option>
      </select>
      {op === 'push' && <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key==='Enter'&&add()} placeholder="value" maxLength={4} style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 6px', borderRadius:6, outline:'none', width:56 }}/>}
      <button onClick={add} style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #334155', background:'rgba(255,255,255,0.05)', color:'#94a3b8', fontSize:11, cursor:'pointer' }}>+ Add</button>
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', maxWidth:300 }}>
        {stackOps.map((o, i) => (
          <div key={i} onClick={() => setStackOps(prev => prev.filter((_,idx) => idx !== i))} title="Click to remove"
            style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontFamily:'monospace', cursor:'pointer', userSelect:'none', background:`${OP_COLORS[o.op]}22`, border:`1px solid ${OP_COLORS[o.op]}66`, color:OP_COLORS[o.op] }}>
            {o.op}{o.val ? `(${o.val})` : "()"}
          </div>
        ))}
      </div>
      <button onClick={() => setStackOps(DEFAULT_STACK_OPS)} style={{ padding:'3px 6px', borderRadius:6, border:'1px solid #1e2d45', background:'transparent', color:'#475569', fontSize:10, cursor:'pointer' }}>Reset</button>
    </div>
  )
}

const DEFAULT_HASHMAP_ENTRIES = [
  {key:'name',val:'Alice'},{key:'age',val:'30'},{key:'city',val:'NYC'},{key:'job',val:'Dev'},{key:'lang',val:'JS'},
]

function HashMapInputBuilder({ entries, setEntries, tableSize, setTableSize }) {
  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')

  function add() {
    const k = newKey.trim(), v = newVal.trim()
    if (!k || !v) return
    setEntries(prev => {
      const exists = prev.findIndex(e => e.key === k)
      if (exists >= 0) return prev.map((e,i) => i===exists ? {key:k,val:v} : e)
      return [...prev, { key: k, val: v }]
    })
    setNewKey(''); setNewVal('')
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:10, color:'#64748b' }}>size:</span>
        <select value={tableSize} onChange={e => setTableSize(Number(e.target.value))}
          style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 5px', borderRadius:6, outline:'none' }}>
          {[4,6,8,10,12,16].map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ width:1, height:18, background:'#1e2d45' }}/>
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', maxWidth:320 }}>
        {entries.map((e, i) => (
          <div key={i} onClick={() => setEntries(prev => prev.filter((_,idx) => idx !== i))} title="Click to remove"
            style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontFamily:'monospace', cursor:'pointer', userSelect:'none',
              background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.4)', color:'#a5b4fc' }}>
            {e.key}:{e.val} ✕
          </div>
        ))}
      </div>
      <input value={newKey} onChange={e=>setNewKey(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
        placeholder="key" maxLength={8}
        style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 6px', borderRadius:6, outline:'none', width:56 }}/>
      <span style={{ fontSize:11, color:'#475569' }}>→</span>
      <input value={newVal} onChange={e=>setNewVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
        placeholder="value" maxLength={8}
        style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 6px', borderRadius:6, outline:'none', width:56 }}/>
      <button onClick={add}
        style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #334155', background:'rgba(255,255,255,0.05)', color:'#94a3b8', fontSize:11, cursor:'pointer' }}>
        + Add
      </button>
      <button onClick={() => setEntries(DEFAULT_HASHMAP_ENTRIES)}
        style={{ padding:'3px 6px', borderRadius:6, border:'1px solid #1e2d45', background:'transparent', color:'#475569', fontSize:10, cursor:'pointer' }}>
        Reset
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT GRAPH DATA + GraphInputBuilder  ← THE TWO MISSING PIECES
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_GRAPH_NODES = [
  { id: 0, label: 'A', x: 300, y: 60  },
  { id: 1, label: 'B', x: 150, y: 180 },
  { id: 2, label: 'C', x: 450, y: 180 },
  { id: 3, label: 'D', x: 80,  y: 300 },
  { id: 4, label: 'E', x: 250, y: 300 },
  { id: 5, label: 'F', x: 400, y: 300 },
  { id: 6, label: 'G', x: 520, y: 300 },
]
const DEFAULT_GRAPH_EDGES = [
  [0, 1, 4], [0, 2, 3], [1, 3, 2], [1, 4, 5],
  [2, 5, 6], [2, 6, 1], [4, 5, 3],
]

const NODE_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function GraphInputBuilder({ nodes, setNodes, edges, setEdges }) {
  const [fromId, setFromId] = useState('')
  const [toId,   setToId]   = useState('')
  const [weight, setWeight] = useState('1')

  function addEdge() {
    const u = parseInt(fromId), v = parseInt(toId), w = parseInt(weight) || 1
    if (isNaN(u) || isNaN(v) || u === v) return
    if (u >= nodes.length || v >= nodes.length) return
    if (edges.some(([a, b]) => (a === u && b === v) || (a === v && b === u))) return
    setEdges(prev => [...prev, [u, v, w]])
    setFromId(''); setToId(''); setWeight('1')
  }

  function removeEdge(idx) {
    setEdges(prev => prev.filter((_, i) => i !== idx))
  }

  function addNode() {
    if (nodes.length >= NODE_LABELS.length) return
    const label = NODE_LABELS[nodes.length]
    const angle = (2 * Math.PI * nodes.length) / Math.max(nodes.length + 1, 7)
    setNodes(prev => [...prev, {
      id: prev.length,
      label,
      x: Math.round(300 + 180 * Math.cos(angle - Math.PI / 2)),
      y: Math.round(190 + 130 * Math.sin(angle - Math.PI / 2)),
    }])
  }

  function removeNode(id) {
    setNodes(prev => {
      const filtered = prev.filter(n => n.id !== id)
      return filtered.map((n, i) => ({ ...n, id: i, label: NODE_LABELS[i] }))
    })
    setEdges(prev =>
      prev
        .filter(([u, v]) => u !== id && v !== id)
        .map(([u, v, w]) => [u > id ? u - 1 : u, v > id ? v - 1 : v, w])
    )
  }

  function reset() {
    setNodes(DEFAULT_GRAPH_NODES)
    setEdges(DEFAULT_GRAPH_EDGES)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      {/* Node chips */}
      <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
        {nodes.map(n => (
          <div key={n.id} onClick={() => removeNode(n.id)} title="Click to remove node"
            style={{ padding:'2px 7px', borderRadius:4, fontSize:11, fontFamily:'monospace',
              cursor:'pointer', userSelect:'none',
              background:'rgba(6,182,212,0.12)', border:'1px solid rgba(6,182,212,0.35)', color:'#67e8f9' }}>
            {n.label} ✕
          </div>
        ))}
        {nodes.length < NODE_LABELS.length && (
          <button onClick={addNode}
            style={{ padding:'2px 7px', borderRadius:4, fontSize:11, cursor:'pointer',
              background:'rgba(255,255,255,0.04)', border:'1px solid #334155', color:'#64748b' }}>
            + Node
          </button>
        )}
      </div>

      <div style={{ width:1, height:18, background:'#1e2d45' }} />

      {/* Edge builder */}
      <select value={fromId} onChange={e => setFromId(e.target.value)}
        style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 5px', borderRadius:6, outline:'none' }}>
        <option value="">From</option>
        {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
      </select>
      <span style={{ fontSize:11, color:'#475569' }}>→</span>
      <select value={toId} onChange={e => setToId(e.target.value)}
        style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 5px', borderRadius:6, outline:'none' }}>
        <option value="">To</option>
        {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
      </select>
      <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="w" type="number" min={1}
        style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 5px', borderRadius:6, outline:'none', width:40 }} />
      <button onClick={addEdge}
        style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #334155', background:'rgba(255,255,255,0.05)', color:'#94a3b8', fontSize:11, cursor:'pointer' }}>
        + Edge
      </button>

      {/* Edge chips */}
      <div style={{ display:'flex', gap:3, flexWrap:'wrap', maxWidth:280 }}>
        {edges.map(([u, v, w], i) => (
          <div key={i} onClick={() => removeEdge(i)} title="Click to remove edge"
            style={{ padding:'2px 6px', borderRadius:4, fontSize:10, fontFamily:'monospace',
              cursor:'pointer', userSelect:'none',
              background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.35)', color:'#c084fc' }}>
            {nodes[u]?.label ?? u}–{nodes[v]?.label ?? v}{w !== 1 ? `(${w})` : ''} ✕
          </div>
        ))}
      </div>

      <button onClick={reset}
        style={{ padding:'3px 6px', borderRadius:6, border:'1px solid #1e2d45', background:'transparent', color:'#475569', fontSize:10, cursor:'pointer' }}>
        Reset
      </button>
    </div>
  )
}

const MODES = [
  { id:'sorting',   label:'📊 Sorting',    algos:['bubbleSort','selectionSort','insertionSort','mergeSort','quickSort'] },
  { id:'searching', label:'🔍 Searching',   algos:['linearSearch','binarySearch'] },
  { id:'linkedlist',label:'🔗 Linked List', algos:['linkedList'] },
  { id:'tree',      label:'🌳 Tree',        algos:['bstInsert'] },
  { id:'graph',     label:'🕸 Graph',       algos:['bfs','dfs','dijkstra'] },
  { id:'stack',     label:'📚 Stack',       algos:['stack'] },
  { id:'hashmap',   label:'# HashMap',     algos:['hashMap'] },
  { id:'queue',     label:'⏩ Queue',       algos:['normalQueue','circularQueue','deque','priorityQueue'] },
  { id:'recursion', label:'♻ Recursion',   algos:['fibonacci'] },
  { id:'dp',        label:'🧮 DP',          algos:['lcs'] },
]
const ALGO_LABELS = { bubbleSort:'Bubble Sort', selectionSort:'Selection Sort', insertionSort:'Insertion Sort', mergeSort:'Merge Sort', quickSort:'Quick Sort', linearSearch:'Linear Search', binarySearch:'Binary Search', linkedList:'Linked List', bstInsert:'BST Insert', bfs:'BFS', dfs:'DFS', dijkstra:'Dijkstra', stack:'Stack Ops', hashMap:'Hash Map', normalQueue:'Normal Queue', circularQueue:'Circular Queue', deque:'Deque', priorityQueue:'Priority Queue', fibonacci:'Fibonacci', lcs:'LCS' }

const DEFAULT_QUEUE_OPS_NORMAL   = []
const DEFAULT_QUEUE_OPS_CIRCULAR = []
const DEFAULT_QUEUE_OPS_DEQUE    = []
const DEFAULT_QUEUE_OPS_PQUEUE   = []

const QUEUE_OP_COLORS = { enqueue:'#10b981', dequeue:'#ef4444', peek:'#f59e0b', front:'#f59e0b', rear:'#818cf8', isEmpty:'#06b6d4', isFull:'#a855f7', clear:'#64748b', pushFront:'#10b981', pushRear:'#3b82f6', popFront:'#ef4444', popRear:'#f97316', insert:'#10b981', extractMax:'#ef4444' }

function QueueOpBuilder({ queueType, queueOps, setQueueOps, capacity, setCapacity }) {
  const [op, setOp]   = useState('enqueue')
  const [val, setVal] = useState('')

  const OPS_BY_TYPE = {
    normalQueue:   ['enqueue','dequeue','peek','rear','isEmpty','isFull','clear'],
    circularQueue: ['enqueue','dequeue','front','rear','isEmpty','isFull'],
    deque:         ['pushFront','pushRear','popFront','popRear','front','rear'],
    priorityQueue: ['insert','extractMax','peek'],
  }
  const needsVal = ['enqueue','pushFront','pushRear','insert']
  const ops = OPS_BY_TYPE[queueType] || OPS_BY_TYPE.normalQueue

  function add() {
    if (needsVal.includes(op) && !val.trim()) return
    const entry = needsVal.includes(op) ? { op, val: isNaN(Number(val)) ? val.trim() : Number(val) } : { op }
    setQueueOps(prev => [...prev, entry])
    setVal('')
  }

  function reset() {
    const defaults = { normalQueue: DEFAULT_QUEUE_OPS_NORMAL, circularQueue: DEFAULT_QUEUE_OPS_CIRCULAR, deque: DEFAULT_QUEUE_OPS_DEQUE, priorityQueue: DEFAULT_QUEUE_OPS_PQUEUE }
    setQueueOps(defaults[queueType] || DEFAULT_QUEUE_OPS_NORMAL)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
      {queueType !== 'priorityQueue' && (
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10, color:'#64748b' }}>cap:</span>
          <input type="number" min={4} max={20} value={capacity} onChange={e => setCapacity(Number(e.target.value))}
            style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 5px', borderRadius:6, outline:'none', width:44 }}/>
        </div>
      )}
      <div style={{ width:1, height:18, background:'#1e2d45' }}/>
      <select value={op} onChange={e => setOp(e.target.value)}
        style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 6px', borderRadius:6, outline:'none' }}>
        {ops.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {needsVal.includes(op) && (
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key==='Enter'&&add()}
          placeholder="value" maxLength={6}
          style={{ background:'#1a2235', border:'1px solid #1e2d45', color:'#e2e8f0', fontSize:11, padding:'3px 6px', borderRadius:6, outline:'none', width:60 }}/>
      )}
      <button onClick={add}
        style={{ padding:'3px 8px', borderRadius:6, border:'1px solid #334155', background:'rgba(255,255,255,0.05)', color:'#94a3b8', fontSize:11, cursor:'pointer' }}>
        + Add
      </button>
      <span style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>{queueOps.length} op{queueOps.length!==1?'s':''}</span>
      <button onClick={reset}
        style={{ padding:'3px 6px', borderRadius:6, border:'1px solid #1e2d45', background:'transparent', color:'#475569', fontSize:10, cursor:'pointer' }}>
        Reset
      </button>
    </div>
  )
}

const DEFAULT_BST_VALUES = [50, 30, 70, 20, 40, 60, 80]

function BSTInputBuilder({ values, setValues }) {
  const [input, setInput] = useState('')

  function addValue() {
    const num = parseInt(input.trim())
    if (isNaN(num)) return
    if (values.includes(num)) { setInput(''); return }
    setValues(prev => [...prev, num])
    setInput('')
  }

  function removeValue(v) {
    setValues(prev => prev.filter(x => x !== v))
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 360 }}>
        {values.map((v, i) => (
          <div
            key={i}
            onClick={() => removeValue(v)}
            title="Click to remove"
            style={{
              padding: '2px 8px', borderRadius: 4, fontSize: 11,
              fontFamily: 'monospace', cursor: 'pointer', userSelect: 'none',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#a5b4fc',
              fontWeight: 700,
            }}
          >
            {v} ✕
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addValue()}
        placeholder="value"
        type="number"
        style={{
          background: '#1a2235', border: '1px solid #1e2d45',
          color: '#e2e8f0', fontSize: 11, padding: '3px 6px',
          borderRadius: 6, outline: 'none', width: 64,
        }}
      />
      <button
        onClick={addValue}
        style={{
          padding: '3px 8px', borderRadius: 6,
          border: '1px solid #334155', background: 'rgba(255,255,255,0.05)',
          color: '#94a3b8', fontSize: 11, cursor: 'pointer',
        }}
      >
        + Add
      </button>
      <button
        onClick={() => {
          const rand = Array.from(new Set(
            Array.from({ length: 7 }, () => Math.floor(Math.random() * 90) + 5)
          ))
          setValues(rand)
        }}
        style={{
          padding: '3px 8px', borderRadius: 6,
          border: '1px solid #1e2d45', background: 'rgba(255,255,255,0.03)',
          color: '#64748b', fontSize: 11, cursor: 'pointer',
        }}
      >
        🎲
      </button>
      <button
        onClick={() => setValues(DEFAULT_BST_VALUES)}
        style={{
          padding: '3px 6px', borderRadius: 6,
          border: '1px solid #1e2d45', background: 'transparent',
          color: '#475569', fontSize: 10, cursor: 'pointer',
        }}
      >
        Reset
      </button>
      <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>
        insertion order → left to right
      </span>
    </div>
  )
}

function AlgoBar() {
  const { activeAlgorithm, setActiveAlgorithm, visualizerMode, inputData, setInputData, searchTarget, setSearchTarget, setSteps } = useVizStore()
  const [rawInput,  setRawInput]  = useState(inputData.join(', '))
  const [targetVal, setTargetVal] = useState(String(searchTarget))
  const [stackOps,  setStackOps]  = useState(DEFAULT_STACK_OPS)
  const [hmEntries,  setHmEntries]  = useState(DEFAULT_HASHMAP_ENTRIES)
  const [hmSize,     setHmSize]     = useState(8)
  const [queueOps,  setQueueOps]  = useState(DEFAULT_QUEUE_OPS_NORMAL)
  const [queueCap,  setQueueCap]  = useState(5)
  const [bstValues, setBstValues] = useState(DEFAULT_BST_VALUES)
  const [graphNodes, setGraphNodes] = useState(DEFAULT_GRAPH_NODES)
  const [graphEdges, setGraphEdges] = useState(DEFAULT_GRAPH_EDGES)

  const currentMode = MODES.find(m=>m.id===visualizerMode)||MODES[0]

  function run(algo = activeAlgorithm, opts = {}) {
    const arr = rawInput.split(',').map(s=>parseInt(s.trim())).filter(n=>!isNaN(n))
    const tgt = parseInt(targetVal)||0
    let raw = []
    switch(algo) {
      case 'bubbleSort':    raw=genBubble([...arr]);   break
      case 'selectionSort': raw=genSelection([...arr]);break
      case 'insertionSort': raw=genInsertion([...arr]);break
      case 'mergeSort':     raw=genMerge([...arr]);    break
      case 'quickSort':     raw=genQuick([...arr]);    break
      case 'linearSearch':  raw=genLinearSearch([...arr],tgt); break
      case 'binarySearch':  raw=genBinarySearch([...arr],tgt); break
      case 'bfs':      raw=genBFS(opts.graphNodes||graphNodes, opts.graphEdges||graphEdges); break
      case 'dfs':      raw=genDFS(opts.graphNodes||graphNodes, opts.graphEdges||graphEdges); break
      case 'dijkstra': raw=genDijkstra(opts.graphNodes||graphNodes, opts.graphEdges||graphEdges); break
      case 'bstInsert':     raw=genBST(opts.bstValues||bstValues); break
      case 'stack':         raw=genStack(stackOps);    break
      case 'hashMap': {
        const entries = (opts.entries||hmEntries).map(e=>[e.key,e.val])
        const size    = opts.size||hmSize
        raw = genHashMap(entries, size)
        break
      }
      case 'fibonacci':     raw=genFibonacci(Math.min(tgt||6,7)); break
      case 'lcs':           raw=genLCS();              break
      case 'normalQueue':   raw=genNormalQueue(opts.ops||queueOps, opts.cap||queueCap); break
      case 'circularQueue': raw=genCircularQueue(opts.ops||queueOps, opts.cap||queueCap); break
      case 'deque':         raw=genDeque(opts.ops||queueOps, opts.cap||queueCap); break
      case 'priorityQueue': raw=genPriorityQueue(opts.ops||queueOps); break
      default:              raw=genBubble([...arr])
    }
    setSteps(buildSteps(raw, algo))
    setInputData(arr); setSearchTarget(tgt)
  }

  useEffect(()=>{ run('bubbleSort') },[]) // eslint-disable-line

  useEffect(()=>{
    if(visualizerMode==='linkedlist') return
    const first=MODES.find(m=>m.id===visualizerMode)?.algos[0]||'bubbleSort'
    setActiveAlgorithm(first)
    if (visualizerMode === 'queue') {
      const defaults = { normalQueue: DEFAULT_QUEUE_OPS_NORMAL, circularQueue: DEFAULT_QUEUE_OPS_CIRCULAR, deque: DEFAULT_QUEUE_OPS_DEQUE, priorityQueue: DEFAULT_QUEUE_OPS_PQUEUE }
      setQueueOps(defaults[first] || DEFAULT_QUEUE_OPS_NORMAL)
    }
    run(first)
  },[visualizerMode]) // eslint-disable-line

  function handleAlgo(a) {
    setActiveAlgorithm(a)
    if (visualizerMode === 'queue') {
      const defaults = { normalQueue: DEFAULT_QUEUE_OPS_NORMAL, circularQueue: DEFAULT_QUEUE_OPS_CIRCULAR, deque: DEFAULT_QUEUE_OPS_DEQUE, priorityQueue: DEFAULT_QUEUE_OPS_PQUEUE }
      const newOps = defaults[a] || DEFAULT_QUEUE_OPS_NORMAL
      setQueueOps(newOps)
      run(a, { ops: newOps, cap: queueCap })
    } else {
      run(a)
    }
  }
  const safeAlgo = currentMode.algos.includes(activeAlgorithm) ? activeAlgorithm : currentMode.algos[0]

  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderBottom:'1px solid #1e2d45',background:'#0d1117',flexShrink:0,flexWrap:'wrap'}}>
      <select value={safeAlgo} onChange={e=>handleAlgo(e.target.value)} style={S.select}>
        {currentMode.algos.map(a=><option key={a} value={a}>{ALGO_LABELS[a]||a}</option>)}
      </select>
      <div style={{width:1,height:22,background:'#1e2d45'}}/>

      {['sorting','searching'].includes(visualizerMode)&&(
        <><input value={rawInput} onChange={e=>setRawInput(e.target.value)} placeholder="e.g. 5,3,8,1" style={{...S.input,width:160}}/>
        <button onClick={()=>{ const a=Array.from({length:10},()=>Math.floor(Math.random()*90)+10); setRawInput(a.join(', ')); setInputData(a) }} style={{...S.input,cursor:'pointer',padding:'4px 8px'}}>🎲</button></>
      )}
      {visualizerMode==='searching'&&<input value={targetVal} onChange={e=>setTargetVal(e.target.value)} placeholder="Target" style={{...S.input,width:72}}/>}
      {visualizerMode==='recursion'&&<input value={targetVal} onChange={e=>setTargetVal(e.target.value)} placeholder="N (max 8)" style={{...S.input,width:80}}/>}
      {visualizerMode==='stack'&&<StackOpBuilder stackOps={stackOps} setStackOps={setStackOps}/>}
      {visualizerMode==='hashmap'&&(
        <HashMapInputBuilder
          entries={hmEntries} setEntries={setHmEntries}
          tableSize={hmSize}  setTableSize={setHmSize}
        />
      )}
      {visualizerMode==='tree'&&(
        <BSTInputBuilder values={bstValues} setValues={setBstValues}/>
      )}
      {visualizerMode==='queue'&&(
        <QueueOpBuilder
          queueType={safeAlgo}
          queueOps={queueOps}  setQueueOps={ops => { setQueueOps(ops) }}
          capacity={queueCap}  setCapacity={setQueueCap}
        />
      )}
      {visualizerMode==='graph'&&(
        <GraphInputBuilder
          nodes={graphNodes} setNodes={setGraphNodes}
          edges={graphEdges} setEdges={setGraphEdges}
        />
      )}

      <button
        onClick={()=>{
          if (visualizerMode==='hashmap') return run('hashMap', { entries: hmEntries, size: hmSize })
          if (visualizerMode==='queue')   return run(safeAlgo, { ops: queueOps, cap: queueCap })
          if (visualizerMode==='tree')    return run('bstInsert', { bstValues })
          if (visualizerMode==='graph')   return run(safeAlgo, { graphNodes, graphEdges })
          run(safeAlgo)
        }}
        style={{marginLeft:'auto',padding:'5px 14px',borderRadius:8,border:'none',background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 0 12px rgba(59,130,246,0.35)'}}>
        ▶ Visualize
      </button>
    </div>
  )
}

function VisualizerCanvas() {
  const { visualizerMode } = useVizStore()
  switch(visualizerMode) {
    case 'searching':  return <SearchViz/>
    case 'graph':      return <GraphViz/>
    case 'tree':       return <TreeViz/>
    case 'stack':      return <StackViz/>
    case 'hashmap':    return <HashMapViz/>
    case 'queue':      return <QueueViz/>
    case 'recursion':  return <RecursionViz/>
    case 'dp':         return <DPViz/>
    default:           return <SortingViz/>
  }
}

export default function CodeVisualizer() {
  const { activeAlgorithm, visualizerMode, setVisualizerMode, setActiveAlgorithm, setSteps } = useVizStore()
  const [tab, setTab]               = useState('presets')
  const [showCode, setShowCode]     = useState(true)
  const [showMemory, setShowMemory] = useState(true)

  function handleCustomVisualize(det, arr, tgt, n) {
    let raw = []
    switch(det.type) {
      case 'sorting':    { const gens={bubbleSort:genBubble,selectionSort:genSelection,insertionSort:genInsertion,mergeSort:genMerge,quickSort:genQuick}; raw=(gens[det.sub]||genBubble)(arr); break }
      case 'searching':  raw=det.sub==='binarySearch'?genBinarySearch(arr,tgt):genLinearSearch(arr,tgt); break
      case 'recursion':  raw=genFibonacci(n); break
      case 'graph':      raw=det.sub==='dijkstra'?genDijkstra():det.sub==='dfs'?genDFS():genBFS(); break
      case 'dp':         raw=genLCS(); break
      case 'linkedlist': raw=genLinkedList(); break
      case 'stack':      raw=genStack(); break
      case 'hashmap':    raw=genHashMap(); break
      case 'tree':       raw=genBST(); break
      default:           raw=genBubble(arr)
    }
    const modeMap={sorting:'sorting',searching:'searching',recursion:'recursion',graph:'graph',dp:'dp',linkedlist:'linkedlist',stack:'stack',hashmap:'hashmap',tree:'tree'}
    if(modeMap[det.type]) setVisualizerMode(modeMap[det.type])
    setSteps(buildSteps(raw, det.sub||det.type))
  }

  return (
    <div style={S.root}>
      <div style={{...S.header, gap:8, flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#06b6d4,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center'}}><IC.Cpu/></div>
          <span style={{fontSize:13,fontWeight:700,background:'linear-gradient(90deg,#22d3ee,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Code Visualizer</span>
        </div>
        {tab === 'presets' && (
          <div style={{display:'flex',gap:3,flex:1,flexWrap:'wrap'}}>
            {MODES.map(m=>{ const active=visualizerMode===m.id; return (
              <button key={m.id} onClick={()=>{ setVisualizerMode(m.id); setActiveAlgorithm(m.algos[0]) }} style={{...S.modeBtn(active),fontSize:11}}>{m.label}</button>
            )})}
          </div>
        )}
        <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
          <div style={{display:'flex',gap:2,background:'rgba(255,255,255,0.04)',borderRadius:8,padding:2}}>
            {[['presets','Presets'],['custom','Custom Code']].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{padding:'4px 12px',borderRadius:6,border:'none',background:tab===id?(id==='custom'?'rgba(168,85,247,0.2)':'rgba(6,182,212,0.15)'):'transparent',color:tab===id?(id==='custom'?'#c084fc':'#22d3ee'):'#64748b',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                {id==='custom'&&<IC.Code/>}{label}{id==='custom'&&<span style={S.tag}>NEW</span>}
              </button>
            ))}
          </div>
          {visualizerMode !== 'linkedlist' && tab === 'presets' && (
            [['Code',showCode,setShowCode],['Memory',showMemory,setShowMemory]].map(([label,active,set])=>(
              <button key={label} onClick={()=>set(v=>!v)} style={{padding:'4px 10px',borderRadius:6,border:`1px solid ${active?'#334155':'#1e2d45'}`,background:active?'rgba(255,255,255,0.06)':'transparent',color:active?'#e2e8f0':'#475569',fontSize:11,cursor:'pointer'}}>{label}</button>
            ))
          )}
        </div>
      </div>

      {tab==='custom' ? (
        <div style={{flex:1,overflow:'hidden',minHeight:0}}><CustomCodeTab/></div>
      ) : visualizerMode==='linkedlist' ? (
        <div style={{flex:1,overflow:'hidden',minHeight:0}}><LinkedListVisualizer/></div>
      ) : (
        <>
          <AlgoBar/>
          <div style={S.main}>
            {showCode&&(
              <motion.div initial={{width:0,opacity:0}} animate={{width:300,opacity:1}} exit={{width:0,opacity:0}} transition={{duration:0.25}} style={{borderRight:'1px solid #1e2d45',overflow:'hidden',flexShrink:0}}>
                <div style={{width:300,height:'100%'}}><CodePanel algo={activeAlgorithm}/></div>
              </motion.div>
            )}
            <div style={S.center}>
              <div style={S.vizArea}><VisualizerCanvas/></div>
              <VarPanel/>
            </div>
            {showMemory&&(
              <motion.div initial={{width:0,opacity:0}} animate={{width:220,opacity:1}} exit={{width:0,opacity:0}} transition={{duration:0.25}} style={{borderLeft:'1px solid #1e2d45',overflow:'hidden',flexShrink:0}}>
                <div style={{width:220,height:'100%',overflowY:'auto'}}><MemoryPanel/></div>
              </motion.div>
            )}
          </div>
          <Timeline/>
        </>
      )}
    </div>
  )
}