import { useEffect, useRef } from 'react'
import useVisualizerStore from '../store/useVisualizerStore'
import { CODE_SNIPPETS } from '../data/examples'

const SNIPPETS = {
  // ── sorting ──────────────────────────────────────────────────────────────────
  bubbleSort: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // swap
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,

  selectionSort: `function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i)
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}`,

  insertionSort: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,

  mergeSort: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid   = Math.floor(arr.length / 2);
  const left  = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}
function merge(l, r) {
  const res = [];
  let i = 0, j = 0;
  while (i < l.length && j < r.length)
    res.push(l[i] <= r[j] ? l[i++] : r[j++]);
  return res.concat(l.slice(i), r.slice(j));
}`,

  quickSort: `function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo < hi) {
    const pi = partition(arr, lo, hi);
    quickSort(arr, lo, pi - 1);
    quickSort(arr, pi + 1, hi);
  }
  return arr;
}
function partition(arr, lo, hi) {
  const pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
  return i + 1;
}`,

  // ── searching ────────────────────────────────────────────────────────────────
  linearSearch: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}`,

  binarySearch: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target)   lo  = mid + 1;
    else                     hi  = mid - 1;
  }
  return -1;
}`,

  // ── graph ────────────────────────────────────────────────────────────────────
  bfs: `function bfs(graph, start) {
  const visited = new Set([start]);
  const queue   = [start];
  while (queue.length > 0) {
    const node = queue.shift();
    for (const nb of graph[node] || []) {
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push(nb);
      }
    }
  }
}`,

  dfs: `function dfs(graph, node, visited = new Set()) {
  visited.add(node);
  for (const nb of graph[node] || []) {
    if (!visited.has(nb))
      dfs(graph, nb, visited);
  }
}`,

  dijkstra: `function dijkstra(graph, src) {
  const dist    = {};
  const visited = new Set();
  for (const n in graph) dist[n] = Infinity;
  dist[src] = 0;
  while (true) {
    let u = null;
    for (const n in dist)
      if (!visited.has(n) && (u === null || dist[n] < dist[u])) u = n;
    if (!u || dist[u] === Infinity) break;
    visited.add(u);
    for (const [v, w] of graph[u] || [])
      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  return dist;
}`,

  // ── tree ─────────────────────────────────────────────────────────────────────
  bstInsert: `function insert(root, val) {
  if (!root) return { val, left: null, right: null };
  if (val < root.val)
    root.left  = insert(root.left,  val);
  else if (val > root.val)
    root.right = insert(root.right, val);
  return root;
}`,

  inorder: `function inorder(root, result = []) {
  if (!root) return result;
  inorder(root.left,  result);
  result.push(root.val);
  inorder(root.right, result);
  return result;
}`,

  // ── stack ────────────────────────────────────────────────────────────────────
  pushStack: `class Stack {
  constructor() { this.items = []; }
  push(val) { this.items.push(val); }
  pop()     { return this.items.pop(); }
  peek()    { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
}`,

  popStack: `class Stack {
  constructor() { this.items = []; }
  push(val) { this.items.push(val); }
  pop()     { return this.items.pop(); }
  peek()    { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
}`,

  // ── linked list — FIX: added all LL op keys ──────────────────────────────────
  // These match the opId values used in LinkedListVisualizer.jsx.
  // CodeEditor is hidden for LL mode, but these prevent the bubbleSort
  // fallback from showing if the guard ever fails.

  linkedList: `// Select an operation from the Linked List panel`,

  singly_insert: `function insertTail(head, val) {
  const node = { val, next: null };
  if (!head) return node;
  let cur = head;
  while (cur.next) {
    cur = cur.next;
  }
  cur.next = node;
  return head;
}`,

  singly_delete: `function deleteNode(head, val) {
  if (!head) return null;
  if (head.val === val) return head.next;
  let cur = head;
  while (cur.next) {
    if (cur.next.val === val) {
      cur.next = cur.next.next;
      return head;
    }
    cur = cur.next;
  }
  return head;
}`,

  singly_search: `function search(head, target) {
  let cur = head;
  let idx = 0;
  while (cur) {
    if (cur.val === target) return idx;
    cur = cur.next;
    idx++;
  }
  return -1;
}`,

  singly_reverse: `function reverse(head) {
  let prev = null, cur = head;
  while (cur) {
    const next = cur.next;
    cur.next   = prev;
    prev       = cur;
    cur        = next;
  }
  return prev;
}`,

  doubly_insert: `function insertTail(head, val) {
  const node = { val, prev: null, next: null };
  if (!head) return node;
  let cur = head;
  while (cur.next) cur = cur.next;
  cur.next  = node;
  node.prev = cur;
  return head;
}`,

  doubly_delete: `function deleteNode(head, val) {
  let cur = head;
  while (cur) {
    if (cur.val === val) {
      if (cur.prev) cur.prev.next = cur.next;
      if (cur.next) cur.next.prev = cur.prev;
      if (cur === head) return cur.next;
      return head;
    }
    cur = cur.next;
  }
  return head;
}`,

  circular_insert: `function insertCircular(head, val) {
  const node = { val, next: null };
  if (!head) { node.next = node; return node; }
  let tail = head;
  while (tail.next !== head) tail = tail.next;
  tail.next = node;
  node.next = head;
  return head;
}`,

  doubly_circular_insert: `function insert(head, val) {
  const node = { val, prev: null, next: null };
  if (!head) { node.next = node.prev = node; return node; }
  const tail = head.prev;
  tail.next  = node;
  node.prev  = tail;
  node.next  = head;
  head.prev  = node;
  return head;
}`,

  cycle_detect: `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,

  // ── recursion ────────────────────────────────────────────────────────────────
  fibonacci: `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,

  factorial: `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}`,

  // ── dp ───────────────────────────────────────────────────────────────────────
  lcs: `function lcs(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m + 1 },
               () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1])
        dp[i][j] = dp[i-1][j-1] + 1;
      else
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}`,

  // ── hashmap ──────────────────────────────────────────────────────────────────
  insertHash: `class HashMap {
  constructor(size = 8) {
    this.size    = size;
    this.buckets = Array.from({ length: size }, () => []);
  }
  hash(key) {
    let h = 0;
    for (const c of String(key))
      h = (h * 31 + c.charCodeAt(0)) % this.size;
    return h;
  }
  set(key, val) {
    const i    = this.hash(key);
    const slot = this.buckets[i];
    const hit  = slot.find(([k]) => k === key);
    if (hit) hit[1] = val;
    else slot.push([key, val]);
  }
  get(key) {
    return this.buckets[this.hash(key)]
      .find(([k]) => k === key)?.[1];
  }
}`,

  // ── pointers ─────────────────────────────────────────────────────────────────
  pointerDemo: `// Pointer & memory demo
int x    = 10;        // stack: 0x1000
int y    = 20;        // stack: 0x1004
int *p   = &x;        // p holds 0x1000
int **pp = &p;        // pp holds addr of p

*p  = 99;             // x is now 99
**pp = 42;            // x is now 42

int *q = new int(7);  // heap allocation
delete q;             // free heap memory`,


  // ── Queue ─────────────────────────────────────────────────────────────────
  enquque: `//Enqueue Operation Demo
  class Queue {
    constructor() {
        this.items = [];
    }
  
    enqueue(element){
      this.items.push(element);
    }
}`,

  dequeue: `//Dequeue Operation Demo
  class Queue {
    constructor() {
        this.items = []
      }
    
    isEmpty(){
      return this.items.length == 0;
    }
      dequeue(){
      if(isEmpty()){
        return 'Queue is Empty';
      }
      return this.items.shift();
    }
}`,

}    

// merge with CODE_SNIPPETS from examples.js (examples.js takes precedence)
const ALL_SNIPPETS = { ...SNIPPETS, ...(CODE_SNIPPETS || {}) }

// ── safe tokenizer ─────────────────────────────────────────────────────────────
function tokenizeLine(raw) {
  const TOKENS = [
    { type: 'comment', re: /^(\/\/.*)/ },
    { type: 'string',  re: /^("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|`[^`\\]*(?:\\.[^`\\]*)*`)/ },
    { type: 'keyword', re: /^(function|return|const|let|var|if|else|while|for|of|in|new|class|this|true|false|null|undefined|break|continue|import|export|default|async|await|typeof|instanceof|void|delete|throw|try|catch|finally|switch|case|do)\b/ },
    { type: 'number',  re: /^(\b\d+\.?\d*\b)/ },
    { type: 'ident',   re: /^([A-Za-z_$][\w$]*)/ },
    { type: 'space',   re: /^(\s+)/ },
    { type: 'punct',   re: /^(.)/ },
  ]
  const COLOR = {
    comment: '#475569', string: '#86efac',
    keyword: '#c084fc', number: '#fb923c',
    ident: null, space: null, punct: '#67e8f9',
  }
  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }
  let pos = 0, html = ''
  while (pos < raw.length) {
    const rest = raw.slice(pos)
    let matched = false
    for (const { type, re } of TOKENS) {
      const m = rest.match(re)
      if (!m) continue
      const text = m[1], color = COLOR[type], safe = esc(text)
      if (color) {
        const fw = type === 'keyword' ? ';font-weight:600' : ''
        html += `<span style="color:${color}${fw}">${safe}</span>`
      } else {
        html += safe
      }
      pos += text.length; matched = true; break
    }
    if (!matched) { html += esc(raw[pos]); pos++ }
  }
  return html
}

// ── component ─────────────────────────────────────────────────────────────────
export default function CodeEditor() {
  const { steps, currentStep, activeAlgorithm, customCode } = useVisualizerStore()
  const activeLine = steps[currentStep]?.line ?? -1
  const lineRef    = useRef(null)

  const snippetKey = activeAlgorithm || 'bubbleSort'
  // FIX: fall back to bubbleSort only — never fall back to an LL snippet
  // that might be stale from a previous session.
  const code = (customCode?.trim())
    ? customCode
    : (ALL_SNIPPETS[snippetKey] || ALL_SNIPPETS.bubbleSort || '')

  const lines = code.split('\n')

  useEffect(() => {
    lineRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeLine])

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0d1117', overflow: 'hidden',
      fontFamily: "'JetBrains Mono','Fira Code','Consolas',monospace",
    }}>
      <div style={{
        padding: '7px 14px', borderBottom: '1px solid #1e2d45',
        background: '#0f172a', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Code
        </span>
        <span style={{ color: '#334155', fontSize: 10 }}>{snippetKey}.js</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {lines.map((line, idx) => {
          const isActive = idx === activeLine
          return (
            <div key={idx} ref={isActive ? lineRef : null}
              style={{
                display: 'flex', alignItems: 'stretch', minHeight: 22,
                background:  isActive ? 'rgba(59,130,246,0.13)' : 'transparent',
                borderLeft:  isActive ? '3px solid #3b82f6' : '3px solid transparent',
                transition:  'background 0.18s, border-color 0.18s',
              }}
            >
              <div style={{
                minWidth: 40, paddingRight: 10, paddingLeft: 8, paddingTop: 3,
                textAlign: 'right', flexShrink: 0, userSelect: 'none',
                color: isActive ? '#3b82f6' : '#2d3f55', fontSize: 11,
              }}>
                {idx + 1}
              </div>
              <pre style={{
                margin: 0, padding: '2px 20px 2px 2px',
                fontSize: 13, lineHeight: '1.6',
                whiteSpace: 'pre', flex: 1,
                color: isActive ? '#e2e8f0' : '#8b9cb8',
              }}
                dangerouslySetInnerHTML={{ __html: tokenizeLine(line) }}
              />
            </div>
          )
        })}
      </div>

      <div style={{
        padding: '4px 14px', borderTop: '1px solid #1e2d45',
        background: '#0f172a', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8, minHeight: 26,
      }}>
        {activeLine >= 0 && (
          <>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
            <span style={{ color: '#475569', fontSize: 10 }}>Ln {activeLine + 1}</span>
            <span style={{ color: '#1e3a5f', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {steps[currentStep]?.message || ''}
            </span>
          </>
        )}
      </div>
    </div>
  )
}