// File: src/utils/algorithms.js
import { deepClone, swapArr, hashFn, buildBST, flattenBST } from './helpers.js'
import { GRAPH_NODES_POSITIONS, GRAPH_EDGES, HASH_TABLE_SIZE } from './constants.js'

// ─── SORTING ────────────────────────────────────────────────────────────────

export function generateBubbleSort(initialArr) {
  const arr = [...initialArr]
  const steps = []
  let comparisons = 0, swaps = 0

  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: [], pivot: -1, message: 'Initial array — ready to sort', comparisons, swaps, line: 0, vars: { arr: [...arr] } })

  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = 0; j < arr.length - 1 - i; j++) {
      comparisons++
      steps.push({ arr: [...arr], comparing: [j, j + 1], swapping: [], sorted: Array.from({ length: i }, (_, k) => arr.length - 1 - k), pivot: -1, message: `Compare arr[${j}]=${arr[j]} with arr[${j+1}]=${arr[j+1]}`, comparisons, swaps, line: 3, vars: { i, j, 'arr[j]': arr[j], 'arr[j+1]': arr[j+1] } })
      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        swaps++
        steps.push({ arr: [...arr], comparing: [], swapping: [j, j + 1], sorted: Array.from({ length: i }, (_, k) => arr.length - 1 - k), pivot: -1, message: `Swap arr[${j}] ↔ arr[${j+1}] → [${arr[j]}, ${arr[j+1]}]`, comparisons, swaps, line: 4, vars: { i, j, swapped: `${arr[j+1]} ↔ ${arr[j]}` } })
      }
    }
  }
  const sorted = arr.map((_, i) => i)
  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted, pivot: -1, message: 'Array fully sorted! ✓', comparisons, swaps, line: 7, vars: { result: [...arr] } })
  return steps
}

export function generateSelectionSort(initialArr) {
  const arr = [...initialArr]
  const steps = []
  let comparisons = 0, swaps = 0

  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: [], minIdx: -1, message: 'Initial array', comparisons, swaps, line: 0, vars: { arr: [...arr] } })

  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i
    steps.push({ arr: [...arr], comparing: [i], swapping: [], sorted: Array.from({ length: i }, (_, k) => k), minIdx, message: `Pass ${i+1}: finding minimum starting at index ${i}`, comparisons, swaps, line: 2, vars: { i, minIdx, 'arr[minIdx]': arr[minIdx] } })
    for (let j = i + 1; j < arr.length; j++) {
      comparisons++
      steps.push({ arr: [...arr], comparing: [j, minIdx], swapping: [], sorted: Array.from({ length: i }, (_, k) => k), minIdx, message: `Compare arr[${j}]=${arr[j]} vs current min arr[${minIdx}]=${arr[minIdx]}`, comparisons, swaps, line: 4, vars: { i, j, minIdx, 'arr[j]': arr[j], min: arr[minIdx] } })
      if (arr[j] < arr[minIdx]) {
        minIdx = j
        steps.push({ arr: [...arr], comparing: [j], swapping: [], sorted: Array.from({ length: i }, (_, k) => k), minIdx, message: `New minimum: arr[${j}]=${arr[j]}`, comparisons, swaps, line: 5, vars: { i, j, minIdx, newMin: arr[minIdx] } })
      }
    }
    if (minIdx !== i) {
      ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
      swaps++
      steps.push({ arr: [...arr], comparing: [], swapping: [i, minIdx], sorted: Array.from({ length: i }, (_, k) => k), minIdx, message: `Place minimum ${arr[i]} at position ${i}`, comparisons, swaps, line: 7, vars: { i, minIdx, placed: arr[i] } })
    }
  }
  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: arr.map((_, i) => i), minIdx: -1, message: 'Sorted! ✓', comparisons, swaps, line: 9, vars: { result: [...arr] } })
  return steps
}

export function generateInsertionSort(initialArr) {
  const arr = [...initialArr]
  const steps = []
  let comparisons = 0, swaps = 0

  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: [0], key: -1, message: 'First element is trivially sorted', comparisons, swaps, line: 0, vars: { arr: [...arr] } })

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i]
    let j = i - 1
    steps.push({ arr: [...arr], comparing: [i], swapping: [], sorted: Array.from({ length: i }, (_, k) => k), key, message: `Key = arr[${i}] = ${key}`, comparisons, swaps, line: 2, vars: { i, key, j } })
    while (j >= 0 && arr[j] > key) {
      comparisons++
      arr[j + 1] = arr[j]
      swaps++
      steps.push({ arr: [...arr], comparing: [j, j+1], swapping: [j+1], sorted: Array.from({ length: i }, (_, k) => k), key, message: `Shift ${arr[j]} right to make room for ${key}`, comparisons, swaps, line: 5, vars: { key, 'arr[j]': arr[j], j } })
      j--
    }
    arr[j + 1] = key
    steps.push({ arr: [...arr], comparing: [], swapping: [j+1], sorted: Array.from({ length: i+1 }, (_, k) => k), key, message: `Insert ${key} at position ${j+1}`, comparisons, swaps, line: 7, vars: { key, insertAt: j+1 } })
  }
  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: arr.map((_, i) => i), key: -1, message: 'Sorted! ✓', comparisons, swaps, line: 9, vars: { result: [...arr] } })
  return steps
}

// ─── DROP-IN REPLACEMENT for generateMergeSort in src/utils/algorithms.js ───
// Replace the existing generateMergeSort function with this one.

export function generateMergeSort(initialArr) {
  const arr = [...initialArr]
  const steps = []
  let comparisons = 0, merges = 0

  steps.push({
    arr: [...arr],
    comparing: [], merging: [], sorted: [], left: [], right: [],
    message: 'Start Merge Sort — divide and conquer',
    comparisons, merges, line: 0,
    vars: { arr: [...arr] },
  })

  // Iterative bottom-up merge sort so offset tracking is exact.
  // We also record recursive splits as "left/right highlight" steps first,
  // then merge steps as bars light up cyan.
  function mergeSortRec(lo, hi) {
    if (hi - lo < 1) return          // single element — already sorted

    const mid = Math.floor((lo + hi) / 2)
    const leftIdx  = Array.from({ length: mid - lo + 1 }, (_, i) => lo + i)
    const rightIdx = Array.from({ length: hi - mid },     (_, i) => mid + 1 + i)

    // ── Split step ──────────────────────────────────────────────────────────
    steps.push({
      arr: [...arr],
      comparing: [], merging: [], sorted: [],
      left: leftIdx, right: rightIdx,
      message: `Split [${arr.slice(lo, hi + 1)}] → left:[${arr.slice(lo, mid + 1)}]  right:[${arr.slice(mid + 1, hi + 1)}]`,
      comparisons, merges, line: 3,
      vars: { lo, mid, hi },
    })

    mergeSortRec(lo, mid)
    mergeSortRec(mid + 1, hi)

    // ── Merge step ──────────────────────────────────────────────────────────
    const L = arr.slice(lo, mid + 1)
    const R = arr.slice(mid + 1, hi + 1)
    let i = 0, j = 0, k = lo

    while (i < L.length && j < R.length) {
      comparisons++
      // highlight which two elements are being compared
      steps.push({
        arr: [...arr],
        comparing: [lo + i, mid + 1 + j],
        merging: [], sorted: [], left: [], right: [],
        message: `Merge: compare L[${i}]=${L[i]} vs R[${j}]=${R[j]}`,
        comparisons, merges, line: 10,
        vars: { lo, mid, hi, i, j },
      })

      if (L[i] <= R[j]) arr[k++] = L[i++]
      else              arr[k++] = R[j++]
    }
    while (i < L.length) arr[k++] = L[i++]
    while (j < R.length) arr[k++] = R[j++]

    merges++
    const mergedIndices = Array.from({ length: hi - lo + 1 }, (_, x) => lo + x)

    steps.push({
      arr: [...arr],
      comparing: [], merging: mergedIndices, sorted: [], left: [], right: [],
      message: `Merged → [${arr.slice(lo, hi + 1)}]`,
      comparisons, merges, line: 12,
      vars: { lo, hi, result: arr.slice(lo, hi + 1) },
    })
  }

  mergeSortRec(0, arr.length - 1)

  steps.push({
    arr: [...arr],
    comparing: [], merging: [], sorted: arr.map((_, i) => i), left: [], right: [],
    message: 'Sorted! ✓',
    comparisons, merges, line: 14,
    vars: { result: [...arr] },
  })

  return steps
}

// Keep the alias in sync at the bottom of algorithms.js:
// export const generateMergeSortSteps = generateMergeSort

export function generateQuickSort(initialArr) {
  const arr = [...initialArr]
  const steps = []
  let comparisons = 0, swaps = 0

  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: [], pivot: -1, message: 'Start Quick Sort', comparisons, swaps, line: 0, vars: { arr: [...arr] } })

  function quickSort(lo, hi) {
    if (lo >= hi) return
    const pivotVal = arr[hi]
    steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: [], pivot: hi, message: `Pivot = arr[${hi}] = ${pivotVal}`, comparisons, swaps, line: 8, vars: { pivot: pivotVal, lo, hi } })
    let i = lo - 1
    for (let j = lo; j < hi; j++) {
      comparisons++
      steps.push({ arr: [...arr], comparing: [j, hi], swapping: [], sorted: [], pivot: hi, message: `arr[${j}]=${arr[j]} ≤ pivot(${pivotVal})?`, comparisons, swaps, line: 11, vars: { j, 'arr[j]': arr[j], pivot: pivotVal, i } })
      if (arr[j] <= pivotVal) {
        i++
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        swaps++
        steps.push({ arr: [...arr], comparing: [], swapping: [i, j], sorted: [], pivot: hi, message: `Yes → swap arr[${i}] ↔ arr[${j}]`, comparisons, swaps, line: 12, vars: { i, j } })
      }
    }
    ;[arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]]
    swaps++
    const pivotIdx = i + 1
    steps.push({ arr: [...arr], comparing: [], swapping: [i+1, hi], sorted: [pivotIdx], pivot: pivotIdx, message: `Pivot ${pivotVal} in final position ${pivotIdx}`, comparisons, swaps, line: 14, vars: { pivotIdx } })
    quickSort(lo, pivotIdx - 1)
    quickSort(pivotIdx + 1, hi)
  }

  quickSort(0, arr.length - 1)
  steps.push({ arr: [...arr], comparing: [], swapping: [], sorted: arr.map((_, i) => i), pivot: -1, message: 'Sorted! ✓', comparisons, swaps, line: 5, vars: { result: [...arr] } })
  return steps
}

// ─── SEARCHING ───────────────────────────────────────────────────────────────

export function generateLinearSearch(arr, target) {
  const steps = []
  steps.push({ arr, current: -1, found: -1, target, visited: [], message: `Search for ${target} — start from index 0`, comparisons: 0, line: 0, vars: { target, arr } })
  let comparisons = 0
  for (let i = 0; i < arr.length; i++) {
    comparisons++
    steps.push({ arr, current: i, found: -1, target, visited: Array.from({ length: i }, (_, k) => k), message: `Check arr[${i}]=${arr[i]} == ${target}?`, comparisons, line: 3, vars: { i, 'arr[i]': arr[i], target } })
    if (arr[i] === target) {
      steps.push({ arr, current: i, found: i, target, visited: Array.from({ length: i+1 }, (_, k) => k), message: `Found! ${target} at index ${i} ✓`, comparisons, line: 4, vars: { found: i, target, comparisons } })
      return steps
    }
  }
  steps.push({ arr, current: -1, found: -2, target, visited: arr.map((_, i) => i), message: `${target} not found after ${arr.length} comparisons`, comparisons, line: 7, vars: { result: -1 } })
  return steps
}

export function generateBinarySearch(sortedArr, target) {
  const arr = [...sortedArr].sort((a, b) => a - b)
  const steps = []
  steps.push({ arr, lo: 0, hi: arr.length - 1, mid: -1, found: -1, target, message: `Binary search for ${target}`, comparisons: 0, line: 0, vars: { lo: 0, hi: arr.length - 1, target } })
  let lo = 0, hi = arr.length - 1, comparisons = 0
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    comparisons++
    steps.push({ arr, lo, hi, mid, found: -1, target, message: `mid=${mid}, arr[mid]=${arr[mid]}`, comparisons, line: 3, vars: { lo, hi, mid, 'arr[mid]': arr[mid], target } })
    if (arr[mid] === target) {
      steps.push({ arr, lo, hi, mid, found: mid, target, message: `Found ${target} at index ${mid} ✓`, comparisons, line: 4, vars: { found: mid, comparisons } })
      return steps
    } else if (arr[mid] < target) {
      lo = mid + 1
      steps.push({ arr, lo, hi, mid, found: -1, target, message: `arr[mid]=${arr[mid]} < ${target} → search right half`, comparisons, line: 5, vars: { lo, hi } })
    } else {
      hi = mid - 1
      steps.push({ arr, lo, hi, mid, found: -1, target, message: `arr[mid]=${arr[mid]} > ${target} → search left half`, comparisons, line: 6, vars: { lo, hi } })
    }
  }
  steps.push({ arr, lo, hi: lo - 1, mid: -1, found: -2, target, message: `${target} not found`, comparisons, line: 9, vars: { result: -1 } })
  return steps
}

// ─── TREES ───────────────────────────────────────────────────────────────────

export function generateBSTSteps(values) {
  const steps = []
  let idCounter = 0
  const nodeList = []
  const edgeList = []
  const posMap = {}

  function relayout(root, depth, lo, hi) {
    if (!root) return
    const mid = (lo + hi) / 2
    posMap[root.id] = { x: 40 + mid * 520, y: 60 + depth * 70 }
    relayout(root.left, depth + 1, lo, mid)
    relayout(root.right, depth + 1, mid, hi)
  }

  function insertNode(root, val, parentId = -1, side = null) {
    if (!root) {
      const node = { id: idCounter++, val, left: null, right: null, parentId, side }
      nodeList.push(node)
      if (parentId >= 0) edgeList.push({ from: parentId, to: node.id })
      return node
    }
    if (val < root.val) root.left = insertNode(root.left, val, root.id, 'left')
    else if (val > root.val) root.right = insertNode(root.right, val, root.id, 'right')
    return root
  }

  function inorder(node, result = []) {
    if (!node) return result
    inorder(node.left, result)
    result.push(node.id)
    inorder(node.right, result)
    return result
  }

  steps.push({ nodes: [], edges: [], positions: {}, current: -1, path: [], visited: [], message: 'Empty BST — start inserting', line: 0, vars: {} })

  let root = null
  for (const val of values) {
    const path = []
    let cur = root
    while (cur) {
      path.push(cur.id)
      steps.push({ nodes: nodeList.map(n => ({ ...n })), edges: [...edgeList], positions: { ...posMap }, current: cur.id, path: [...path], visited: [], message: `Insert ${val}: compare with ${cur.val} → go ${val < cur.val ? 'left' : 'right'}`, line: val < cur.val ? 2 : 4, vars: { val, node: cur.val, direction: val < cur.val ? 'left' : 'right' } })
      cur = val < cur.val ? cur.left : cur.right
    }
    root = insertNode(root, val, path.length ? path[path.length - 1] : -1, null)
    relayout(root, 0, 0, 1)
    const newId = idCounter - 1
    steps.push({ nodes: nodeList.map(n => ({ ...n })), edges: [...edgeList], positions: { ...posMap }, current: newId, path: [...path, newId], visited: [newId], message: `Inserted ${val}${path.length ? ` as ${val < nodeList[path[path.length-1]].val ? 'left' : 'right'} child of ${nodeList[path[path.length-1]].val}` : ' as root'}`, line: 1, vars: { val, inserted: true } })
  }

  const traversalOrder = inorder(root)
  const traversed = []
  steps.push({ nodes: nodeList.map(n => ({ ...n })), edges: [...edgeList], positions: { ...posMap }, current: -1, path: [], visited: [], message: 'Now performing Inorder traversal (Left → Root → Right)', line: 0, vars: {} })
  for (const id of traversalOrder) {
    traversed.push(id)
    steps.push({ nodes: nodeList.map(n => ({ ...n })), edges: [...edgeList], positions: { ...posMap }, current: id, path: traversed, visited: [...traversed], message: `Visit node ${nodeList[id].val} — inorder so far: [${traversed.map(i => nodeList[i].val)}]`, line: 4, vars: { visited: traversed.map(i => nodeList[i].val), current: nodeList[id].val } })
  }
  steps.push({ nodes: nodeList.map(n => ({ ...n })), edges: [...edgeList], positions: { ...posMap }, current: -1, path: traversalOrder, visited: traversalOrder, message: `Inorder result: [${traversalOrder.map(i => nodeList[i].val).join(', ')}] — sorted! ✓`, line: 7, vars: { inorderResult: traversalOrder.map(i => nodeList[i].val) } })

  return steps
}

// ─── GRAPHS ──────────────────────────────────────────────────────────────────

export function generateBFS(nodes = GRAPH_NODES_POSITIONS, edges = GRAPH_EDGES) {
  const steps = []
  const adj = Array.from({ length: nodes.length }, () => [])
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u) }

  const visited = new Set()
  const queue = [0]
  const order = []
  visited.add(0)

  steps.push({ nodes, edges, visited: [], queue: [0], current: -1, order: [], activeEdge: null, message: 'BFS from node A — enqueue start node', line: 1, vars: { queue: ['A'], visited: new Set() } })

  while (queue.length) {
    const cur = queue.shift()
    order.push(cur)
    steps.push({ nodes, edges, visited: [...visited], queue: [...queue], current: cur, order: [...order], activeEdge: null, message: `Dequeue ${nodes[cur].label} — visiting neighbors`, line: 4, vars: { current: nodes[cur].label, queue: queue.map(i => nodes[i].label), visited: [...visited].map(i => nodes[i].label) } })
    for (const nb of adj[cur]) {
      steps.push({ nodes, edges, visited: [...visited], queue: [...queue], current: cur, order: [...order], activeEdge: [cur, nb], message: `Check neighbor ${nodes[nb].label} — ${visited.has(nb) ? 'already visited' : 'not visited → enqueue'}`, line: 7, vars: { from: nodes[cur].label, to: nodes[nb].label, enqueued: !visited.has(nb) } })
      if (!visited.has(nb)) {
        visited.add(nb)
        queue.push(nb)
        steps.push({ nodes, edges, visited: [...visited], queue: [...queue], current: cur, order: [...order], activeEdge: [cur, nb], message: `Enqueue ${nodes[nb].label}`, line: 9, vars: { enqueued: nodes[nb].label, queue: queue.map(i => nodes[i].label) } })
      }
    }
  }
  steps.push({ nodes, edges, visited: [...visited], queue: [], current: -1, order: [...order], activeEdge: null, message: `BFS complete: ${order.map(i => nodes[i].label).join(' → ')}`, line: 12, vars: { order: order.map(i => nodes[i].label) } })
  return steps
}

export function generateDFS(nodes = GRAPH_NODES_POSITIONS, edges = GRAPH_EDGES) {
  const steps = []
  const adj = Array.from({ length: nodes.length }, () => [])
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u) }

  const visited = new Set()
  const stack = []
  const order = []

  steps.push({ nodes, edges, visited: [], stack: [], current: -1, order: [], activeEdge: null, message: 'DFS from node A — push start node', line: 0, vars: {} })

  function dfs(cur, depth = 0) {
    visited.add(cur)
    order.push(cur)
    stack.push(cur)
    steps.push({ nodes, edges, visited: [...visited], stack: [...stack], current: cur, order: [...order], activeEdge: null, message: `Visit ${nodes[cur].label} (depth ${depth})`, line: 1, vars: { node: nodes[cur].label, depth, stack: stack.map(i => nodes[i].label) } })
    for (const nb of adj[cur].sort()) {
      if (!visited.has(nb)) {
        steps.push({ nodes, edges, visited: [...visited], stack: [...stack], current: cur, order: [...order], activeEdge: [cur, nb], message: `Explore edge ${nodes[cur].label} → ${nodes[nb].label}`, line: 4, vars: { from: nodes[cur].label, to: nodes[nb].label } })
        dfs(nb, depth + 1)
      }
    }
    stack.pop()
    steps.push({ nodes, edges, visited: [...visited], stack: [...stack], current: cur, order: [...order], activeEdge: null, message: `Backtrack from ${nodes[cur].label}`, line: 6, vars: { node: nodes[cur].label, stack: stack.map(i => nodes[i].label) } })
  }

  dfs(0)
  steps.push({ nodes, edges, visited: [...visited], stack: [], current: -1, order: [...order], activeEdge: null, message: `DFS complete: ${order.map(i => nodes[i].label).join(' → ')}`, line: 8, vars: { order: order.map(i => nodes[i].label) } })
  return steps
}

export function generateDijkstra(nodes = GRAPH_NODES_POSITIONS, edges = GRAPH_EDGES) {
  const n = nodes.length
  const INF = Infinity
  const adj = Array.from({ length: n }, () => [])
  for (const [u, v, w = 1] of edges) { adj[u].push([v, w]); adj[v].push([u, w]) }

  const dist = Array(n).fill(INF)
  const prev = Array(n).fill(-1)
  dist[0] = 0
  const visited = new Set()
  const steps = []

  steps.push({ nodes, edges, dist: [...dist], visited: [], current: -1, prev: [...prev], activeEdge: null, message: `Dijkstra from ${nodes[0].label} — dist[A]=0, all others ∞`, line: 3, vars: { dist: Object.fromEntries(nodes.map((n, i) => [n.label, dist[i] === INF ? '∞' : dist[i]])) } })

  for (let iter = 0; iter < n; iter++) {
    let u = -1
    for (let i = 0; i < n; i++) if (!visited.has(i) && (u === -1 || dist[i] < dist[u])) u = i
    if (u === -1 || dist[u] === INF) break
    visited.add(u)
    steps.push({ nodes, edges, dist: [...dist], visited: [...visited], current: u, prev: [...prev], activeEdge: null, message: `Process ${nodes[u].label} (dist=${dist[u]})`, line: 6, vars: { node: nodes[u].label, dist: dist[u] } })
    for (const [v, w] of adj[u]) {
      const alt = dist[u] + w
      steps.push({ nodes, edges, dist: [...dist], visited: [...visited], current: u, prev: [...prev], activeEdge: [u, v], message: `Relax ${nodes[u].label}→${nodes[v].label}: dist=${dist[u]}+${w}=${alt} vs current ${dist[v] === INF ? '∞' : dist[v]}`, line: 9, vars: { from: nodes[u].label, to: nodes[v].label, alt, current: dist[v] } })
      if (alt < dist[v]) {
        dist[v] = alt
        prev[v] = u
        steps.push({ nodes, edges, dist: [...dist], visited: [...visited], current: u, prev: [...prev], activeEdge: [u, v], message: `Update dist[${nodes[v].label}] = ${alt}`, line: 10, vars: Object.fromEntries(nodes.map((nd, i) => [nd.label, dist[i] === INF ? '∞' : dist[i]])) })
      }
    }
  }
  steps.push({ nodes, edges, dist: [...dist], visited: [...visited], current: -1, prev: [...prev], activeEdge: null, message: `Shortest distances from ${nodes[0].label}: ${nodes.map((nd, i) => `${nd.label}=${dist[i]}`).join(', ')}`, line: 15, vars: Object.fromEntries(nodes.map((nd, i) => [`dist[${nd.label}]`, dist[i] === INF ? '∞' : dist[i]])) })
  return steps
}

// ─── LINKED LIST ─────────────────────────────────────────────────────────────

export function generateLinkedListSteps() {
  const steps = []
  let list = []
  let ops = 0

  const snapshot = (msg, current = -1, line = 0, vars = {}) => {
    ops++
    steps.push({ list: [...list], current, highlighted: current >= 0 ? [current] : [], message: msg, ops, line, vars })
  }

  snapshot('Empty linked list — head = null', -1, 0, { head: 'null' })

  const inserts = [10, 20, 30, 40, 50]
  for (const val of inserts) {
    list.push(val)
    snapshot(`Insert ${val} at tail — traverse to end, link new node`, list.length - 1, 9, { val, size: list.length })
  }

  const delIdx = list.indexOf(30)
  snapshot(`Find 30 to delete — traverse from head`, delIdx, 18, { searching: 30 })
  list.splice(delIdx, 1)
  snapshot(`Deleted 30 — previous.next = 30.next`, -1, 20, { deleted: 30, size: list.length })

  list.unshift(5)
  snapshot(`Insert 5 at head — new node points to old head`, 0, 12, { val: 5, atHead: true })

  const rev = [...list].reverse()
  list = rev
  snapshot(`Reverse list — traverse, re-link all pointers`, -1, 25, { list: [...list] })

  steps.push({ list: [...list], current: -1, highlighted: [], message: `Final list: ${list.join(' → ')} → null`, ops, line: 30, vars: { list: [...list] } })
  return steps
}

// ─── STACK ───────────────────────────────────────────────────────────────────

export function generateStackSteps() {
  const steps = []
  let stack = []

  const snap = (msg, op, val = null, line = 0) => {
    steps.push({ stack: [...stack], op, val, message: msg, size: stack.length, line, vars: { stack: [...stack], top: stack.length ? stack[stack.length - 1] : 'empty', size: stack.length } })
  }

  snap('Empty stack — LIFO structure', 'init', null, 0)
  const ops = [
    { op: 'push', val: 'A' }, { op: 'push', val: 'B' }, { op: 'push', val: 'C' },
    { op: 'peek' }, { op: 'pop' }, { op: 'push', val: 'D' }, { op: 'push', val: 'E' },
    { op: 'pop' }, { op: 'pop' },
  ]
  for (const { op, val } of ops) {
    if (op === 'push') {
      stack.push(val)
      snap(`push("${val}") — add to top, size=${stack.length}`, 'push', val, 3)
    } else if (op === 'pop') {
      const popped = stack.pop()
      snap(`pop() → returns "${popped}", size=${stack.length}`, 'pop', popped, 6)
    } else if (op === 'peek') {
      snap(`peek() → "${stack[stack.length - 1]}" (no removal)`, 'peek', stack[stack.length - 1], 9)
    }
  }
  snap('Stack operations complete', 'done', null, 12)
  return steps
}

export function generateMonotonicStackSteps() {
  const steps = []
  let stack = []
  
}

// ─── RECURSION ───────────────────────────────────────────────────────────────

export function generateFibonacciSteps(n = 5) {
  const steps = []
  const tree = []
  let callId = 0

  const snap = (id, msg, line, vars) => {
    steps.push({ tree: tree.map(n => ({ ...n })), current: id, message: msg, line, vars, callStack: tree.filter(n => n.result === null).map(n => `fib(${n.n})`) })
  }

  function fib(val, parentId = -1, depth = 0) {
    const id = callId++
    tree.push({ id, n: val, parentId, depth, result: null, x: 0, y: 0 })
    snap(id, `fib(${val}) called`, 0, { n: val, depth, parentId })
    let result
    if (val <= 1) {
      result = val
      tree[id].result = result
      snap(id, `Base case: fib(${val}) = ${val}`, 1, { n: val, result })
    } else {
      const a = fib(val - 1, id, depth + 1)
      const b = fib(val - 2, id, depth + 1)
      result = a + b
      tree[id].result = result
      snap(id, `fib(${val}) = fib(${val-1}) + fib(${val-2}) = ${a} + ${b} = ${result}`, 2, { n: val, 'fib(n-1)': a, 'fib(n-2)': b, result })
    }
    return result
  }

  fib(n)
  snap(-1, `fib(${n}) = ${tree[0].result} — memoize to avoid recomputation!`, 5, { result: tree[0].result })
  return steps
}

// ─── DYNAMIC PROGRAMMING ─────────────────────────────────────────────────────

export function generateLCSSteps(s1 = 'ABCBDAB', s2 = 'BDCAB') {
  const m = s1.length, n = s2.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  const steps = []

  steps.push({ dp: dp.map(r => [...r]), s1, s2, ci: -1, cj: -1, match: false, message: 'Initialize DP table — all zeros', line: 1, vars: { s1, s2, m, n } })

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const match = s1[i - 1] === s2[j - 1]
      if (match) dp[i][j] = dp[i-1][j-1] + 1
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1])
      steps.push({ dp: dp.map(r => [...r]), s1, s2, ci: i, cj: j, match, message: `s1[${i-1}]='${s1[i-1]}' ${match ? '==' : '≠'} s2[${j-1}]='${s2[j-1]}' → dp[${i}][${j}]=${dp[i][j]}`, line: match ? 5 : 7, vars: { i, j, 'dp[i][j]': dp[i][j], match } })
    }
  }
  steps.push({ dp: dp.map(r => [...r]), s1, s2, ci: m, cj: n, match: false, message: `LCS length = ${dp[m][n]}`, line: 10, vars: { result: dp[m][n], LCS: dp[m][n] } })
  return steps
}

// ─── HASH MAP ────────────────────────────────────────────────────────────────

// ─── HASH MAP ────────────────────────────────────────────────────────────────
// Drop-in replacement for generateHashMapSteps in src/utils/algorithms.js
//
// Changes vs original:
//  1. Accepts optional `customEntries` array and `customSize` so the
//     visualizer can pass user-supplied data.
//  2. Line numbers are now mapped to the actual code shown in the code panel:
//       line 0  → line 1  (function declaration / init)
//       line 5  → line 15 (hash(key) called)
//       line 16 → line 16 (collision check)
//       line 17 → line 17 (collision counter bumped)
//       line 12 → line 18 (table[h].push)
//       line 15 → line 21 (return / done)

export function generateHashMapSteps(customEntries, customSize) {
  const SIZE = customSize ?? HASH_TABLE_SIZE
  const table = Array.from({ length: SIZE }, () => [])
  const steps = []
  let collisions = 0

  // Init step
  steps.push({
    table:   table.map(b => [...b]),
    current: -1,
    key:     '',
    hash:    -1,
    collisions: 0,
    message: `Empty hash table — ${SIZE} buckets`,
    line:    0,
    vars:    { SIZE, collisions: 0 },
  })

  const entries = customEntries ?? [
    ['name', 'Alice'], ['age', 30], ['city', 'NYC'],
    ['job', 'Engineer'], ['lang', 'JavaScript'], ['os', 'Linux'], ['team', 'Backend'],
  ]

  for (const [key, val] of entries) {
    const h = hashFn(String(key), SIZE)

    // Step: computing the hash
    steps.push({
      table:   table.map(b => [...b]),
      current: h,
      key:     String(key),
      hash:    h,
      collisions,
      message: `hash("${key}") = ${h}`,
      line:    5,   // → code line 15
      vars:    { key, hash: h, formula: `(h*31 + charCode) % ${SIZE}` },
    })

    const hadCollision = table[h].length > 0

    if (hadCollision) {
      // Step: collision detected (check)
      steps.push({
        table:   table.map(b => [...b]),
        current: h,
        key:     String(key),
        hash:    h,
        collisions,
        message: `Bucket ${h} already has ${table[h].length} item(s) — collision!`,
        line:    16,  // → code line 16
        vars:    { bucket: h, existing: table[h].length },
      })
      collisions++
      // Step: collision counter bumped
      steps.push({
        table:   table.map(b => [...b]),
        current: h,
        key:     String(key),
        hash:    h,
        collisions,
        message: `collisions++ → ${collisions}`,
        line:    17,  // → code line 17
        vars:    { collisions },
      })
    }

    table[h].push([String(key), String(val)])

    // Step: stored in bucket
    steps.push({
      table:   table.map(b => [...b]),
      current: h,
      key:     String(key),
      hash:    h,
      collisions,
      message: `Store "${key}" → "${val}" at bucket ${h}${hadCollision ? ' (chained)' : ''}`,
      line:    12,  // → code line 18
      vars:    { key, val, bucket: h, collision: hadCollision, collisions },
    })
  }

  // Done step
  steps.push({
    table:   table.map(b => [...b]),
    current: -1,
    key:     '',
    hash:    -1,
    collisions,
    message: `Done! ${entries.length} entries inserted, ${collisions} collision${collisions !== 1 ? 's' : ''}`,
    line:    15,  // → code line 21
    vars:    { total: entries.length, collisions },
  })

  return steps
}


// ─── POINTERS / MEMORY ────────────────────────────────────────────────────────

export function generatePointerSteps() {
  const steps = []

  const makeVar  = (name, type, val, addr) => ({ name, type, val, addr })
  const makeHeap = (id, type, fields, addr) => ({ id, type, fields, addr })

  const stack = []
  const heap  = []
  let stepCount = 0

  const snap = (msg, line, vars = {}, stackMem = null, heapMem = null, pointers = []) => {
    stepCount++
    steps.push({ stack: stackMem || [...stack], heap: heapMem || [...heap], pointers, message: msg, line, vars })
  }

  snap('Start program — stack and heap are empty', 0, {})
  stack.push(makeVar('x', 'int', 10, '0x1000'))
  snap('int x = 10; — allocated on stack at 0x1000', 1, { x: 10 }, [...stack], [...heap])
  stack.push(makeVar('y', 'int', 20, '0x1004'))
  snap('int y = 20; — allocated on stack at 0x1004', 2, { x: 10, y: 20 }, [...stack], [...heap])
  stack.push(makeVar('*p', 'int*', '0x1000', '0x1008'))
  snap('int *p = &x; — pointer p stores address of x (0x1000)', 3, { p: '0x1000', '*p': 10 }, [...stack], [...heap], [{ from: '0x1008', to: '0x1000', label: 'p → x' }])
  stack.push(makeVar('**pp', 'int**', '0x1008', '0x100C'))
  snap('int **pp = &p; — double pointer pp stores address of p', 4, { pp: '0x1008', '*pp': '0x1000', '**pp': 10 }, [...stack], [...heap], [{ from: '0x100C', to: '0x1008', label: 'pp → p' }, { from: '0x1008', to: '0x1000', label: 'p → x' }])
  heap.push(makeHeap(1, 'int', [{ name: 'value', val: 42 }], '0x2000'))
  snap('int *q = new int(42); — heap allocation at 0x2000', 6, { q: '0x2000', '*q': 42 }, [...stack, makeVar('*q', 'int*', '0x2000', '0x1010')], [...heap], [{ from: '0x1010', to: '0x2000', label: 'q → heap', heap: true }])
  heap.push(makeHeap(2, 'Node', [{ name: 'data', val: 99 }, { name: 'next', val: 'null' }], '0x3000'))
  snap('Node *n = new Node(99); — struct on heap at 0x3000', 8, { n: '0x3000' }, [...stack], [...heap])
  snap('Memory visualization complete — stack vs heap', 10, { stackSize: stack.length, heapObjects: heap.length })
  return steps
}

// ─── ALIASES — exported under every name that other files may import ──────────
// Sorting
export const generateBubbleSortSteps    = generateBubbleSort
export const generateSelectionSortSteps = generateSelectionSort
export const generateInsertionSortSteps = generateInsertionSort
export const generateMergeSortSteps     = generateMergeSort
export const generateQuickSortSteps     = generateQuickSort

// Searching
export const generateLinearSearchSteps  = generateLinearSearch
export const generateBinarySearchSteps  = generateBinarySearch

// Graph
export const generateBFSSteps           = generateBFS
export const generateDFSSteps           = generateDFS
export const generateDijkstraSteps      = generateDijkstra

// Tree
export const generateTreeSteps          = generateBSTSteps
export const generateBSTInsertSteps     = generateBSTSteps

// Linked List
export const generateLinkedList         = generateLinkedListSteps

// Stack
export const generateStack              = generateStackSteps

// Recursion
export const generateFibSteps           = generateFibonacciSteps
export const generateRecursionSteps     = generateFibonacciSteps

// DP
export const generateLCS                = generateLCSSteps
export const generateDPSteps            = generateLCSSteps

// HashMap
export const generateHashMap            = generateHashMapSteps 
// Pointers
export const generatePointers           = generatePointerSteps

