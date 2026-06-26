// File: src/utils/helpers.js

/**
 * Deep clone an object (handles arrays and plain objects)
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepClone)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]))
}

/**
 * Sleep for ms milliseconds (for async step delays)
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Generate a random integer in [min, max]
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random array of n unique integers in [min, max]
 */
export function randomArray(n = 10, min = 5, max = 95) {
  const set = new Set()
  while (set.size < n) set.add(randInt(min, max))
  return [...set]
}

/**
 * Shuffle array in place (Fisher–Yates)
 */
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Swap two elements in array (immutable)
 */
export function swapArr(arr, i, j) {
  const a = [...arr]
  ;[a[i], a[j]] = [a[j], a[i]]
  return a
}

/**
 * Compute hash for a string key into size buckets
 */
export function hashFn(key, size) {
  let h = 0
  for (const ch of String(key)) {
    h = (h * 31 + ch.charCodeAt(0)) % size
  }
  return h
}

/**
 * Format a number with commas
 */
export function formatNum(n) {
  return Number(n).toLocaleString()
}

/**
 * Hex color + alpha → rgba string
 */
export function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Interpolate between two hex colors at t ∈ [0,1]
 */
export function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16)
  const bh = parseInt(b.slice(1), 16)
  const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff
  const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return `#${((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0')}`
}

/**
 * Compute SVG path for a curved arrow between two points
 */
export function curvedArrow(x1, y1, x2, y2, curvature = 0.3) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const cx = mx - dy * curvature
  const cy = my + dx * curvature
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

/**
 * Compute endpoint of a line from (x,y) toward (tx,ty) stopping r pixels from target
 */
export function lineEndpoint(x, y, tx, ty, r) {
  const dx = tx - x
  const dy = ty - y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return { x: tx, y: ty }
  return {
    x: tx - (dx / len) * r,
    y: ty - (dy / len) * r,
  }
}

/**
 * Build adjacency list from edge list [[u,v,w?], ...]
 */
export function buildAdjList(n, edges) {
  const adj = Array.from({ length: n }, () => [])
  for (const [u, v, w = 1] of edges) {
    adj[u].push({ to: v, weight: w })
    adj[v].push({ to: u, weight: w })
  }
  return adj
}

/**
 * Syntax-highlight a line of JavaScript code (returns HTML string)
 */
export function highlightLine(line) {
  const KEYWORDS = ['function','let','const','var','if','else','while','for','do','return',
    'new','class','this','of','in','true','false','null','undefined','break','continue',
    'switch','case','default','import','export','from','async','await','typeof','instanceof']
  let hl = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Comments
  hl = hl.replace(/(\/\/.*)/g, '<span class="syntax-comment">$1</span>')
  // Strings
  hl = hl.replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, '<span class="syntax-string">$1</span>')
  // Numbers
  hl = hl.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="syntax-number">$1</span>')
  // Keywords
  KEYWORDS.forEach(kw => {
    hl = hl.replace(new RegExp(`\\b(${kw})\\b`, 'g'), '<span class="syntax-keyword">$1</span>')
  })
  // Functions
  hl = hl.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g, '<span class="syntax-function">$1</span>')
  return hl
}

/**
 * Compute tree node layout positions using Reingold-Tilford-style spacing
 */
export function layoutBinaryTree(root, width = 560, startY = 60, levelHeight = 72) {
  if (!root) return {}
  const positions = {}
  const countNodes = (node) => node ? 1 + countNodes(node.left) + countNodes(node.right) : 0
  function assign(node, depth, lo, hi) {
    if (!node) return
    const mid = (lo + hi) / 2
    positions[node.id] = { x: 40 + mid * (width - 80), y: startY + depth * levelHeight }
    assign(node.left, depth + 1, lo, (lo + hi) / 2)
    assign(node.right, depth + 1, (lo + hi) / 2, hi)
  }
  assign(root, 0, 0, 1)
  return positions
}

/**
 * Build a BST node structure from an array of values
 */
export function buildBST(values) {
  let idCounter = 0
  function makeNode(val) {
    return { id: idCounter++, val, left: null, right: null }
  }
  function insert(root, val) {
    if (!root) return makeNode(val)
    if (val < root.val) root.left = insert(root.left, val)
    else if (val > root.val) root.right = insert(root.right, val)
    return root
  }
  let root = null
  for (const v of values) root = insert(root, v)
  return root
}

/**
 * Flatten BST into array of {id, val, parentId, side} for rendering
 */
export function flattenBST(root) {
  const nodes = []
  const edges = []
  function walk(node, parentId = null, side = null) {
    if (!node) return
    nodes.push({ id: node.id, val: node.val, parentId, side })
    if (parentId !== null) edges.push({ from: parentId, to: node.id })
    walk(node.left, node.id, 'left')
    walk(node.right, node.id, 'right')
  }
  walk(root)
  return { nodes, edges }
}

/**
 * Convert ms to display string
 */
export function msToDisplay(ms) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str, max = 20) {
  return str.length > max ? str.slice(0, max) + '…' : str
}