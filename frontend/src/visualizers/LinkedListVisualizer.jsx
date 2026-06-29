import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Match main visualizer palette exactly ─────────────────────────────────────
const C = {
  bg:           '#0b0e17',   // matches S.root background
  panel:        '#0d1117',   // matches S.header / code panel
  panelLight:   '#0f172a',   // slightly lighter panel
  border:       '#1e2d45',   // matches main border
  borderLight:  '#1e2d45',
  nodeBg:       '#1e3a5f',   // matches default bar fill
  nodeActive:   '#1e1b4b',
  nodeBorder:   '#2d5a8e',   // matches default bar border
  nodeActBdr:   '#6366f1',
  nodeHead:     '#0c4a6e',
  nodeHeadBdr:  '#0ea5e9',
  nodeTail:     '#14532d',
  nodeTailBdr:  '#22c55e',
  nodeFound:    '#064e3b',
  nodeFoundBdr: '#10b981',
  nodeDel:      '#7f1d1d',
  nodeDelBdr:   '#ef4444',
  nodeCycleBdr: '#f59e0b',
  arrow:        '#2d4a6e',
  arrowActive:  '#6366f1',
  text:         '#e2e8f0',   // matches main text
  textMuted:    '#64748b',   // matches main muted
  textActive:   '#a5b4fc',
  cyan:         '#22d3ee',   // matches main cyan
  null:         '#ef4444',
  headLabel:    '#38bdf8',
  tailLabel:    '#34d399',
  slowLabel:    '#f59e0b',
  fastLabel:    '#ef4444',
  highlight:    '#1d4ed8',
  highlightBdr: '#3b82f6',
  sectionBg:    '#0d1117',
  inputBg:      '#1a2235',   // matches S.input
}

const CODE = {
  singly_insert: `function insertTail(head, val) {
  const node = { val, next: null }  
  if (!head) return node             
  let cur = head                     
  while (cur.next) {                 
    cur = cur.next
  }
  cur.next = node                   
  return head
}`,
  singly_delete: `function deleteNode(head, val) {
  if (!head) return null
  if (head.val === val)              
    return head.next
  let cur = head
  while (cur.next) {                 
    if (cur.next.val === val) {      
      cur.next = cur.next.next       
      return head
    }
    cur = cur.next
  }
  return head                        
}`,
  singly_search: `function search(head, target) {
  let cur = head
  let idx = 0
  while (cur) {                     
    if (cur.val === target)          
      return idx                     
    cur = cur.next
    idx++
  }
  return -1                         
}`,
  singly_reverse: `function reverse(head) {
  let prev = null
  let cur  = head
  while (cur) {                     
    const next = cur.next           
    cur.next   = prev              
    prev       = cur                
    cur        = next               
  }
  return prev                        
}`,
  doubly_insert: `function insertTail(head, val) {
  const node = { val, prev:null, next:null }
  if (!head) return node
  let cur = head
  while (cur.next) cur = cur.next    
  cur.next  = node                   
  node.prev = cur                    
  return head
}`,
  doubly_delete: `function deleteNode(head, val) {
  let cur = head
  while (cur) {
    if (cur.val === val) {           
      if (cur.prev)                  
        cur.prev.next = cur.next
      if (cur.next)                  
        cur.next.prev = cur.prev
      if (cur === head)
        return cur.next
      return head
    }
    cur = cur.next
  }
  return head
}`,
  circular_insert: `function insertCircular(head, val) {
  const node = { val, next: null }
  if (!head) {
    node.next = node                 
    return node
  }
  let tail = head
  while (tail.next !== head)         
    tail = tail.next
  tail.next = node                   
  node.next = head                   
  return head
}`,
  doubly_circular_insert: `function insert(head, val) {
  const node = { val, prev:null, next:null }
  if (!head) {
    node.next = node.prev = node    
    return node
  }
  const tail = head.prev             
  tail.next  = node                  
  node.prev  = tail                  
  node.next  = head                 
  head.prev  = node                  
  return head
}`,
  cycle_detect: `function hasCycle(head) {
  let slow = head
  let fast = head
  while (fast && fast.next) {
    slow = slow.next                 
    fast = fast.next.next            
    if (slow === fast)               
      return true                    
  }
  return false                       
}`,
}

function snap(base, overrides) {
  return {
    current: -1, highlight: [], deleteIdx: -1, slow: -1, fast: -1,
    vars: {}, stackFrame: {}, heap: [], hasCycle: false, cycleAt: -1,
    codeLine: -1, listType: 'singly', ...base, ...overrides,
  }
}

function parseNodes(str) {
  if (!str) return [10, 20, 30, 40, 50]
  return str.toString().split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n))
}

// ── Step generators (unchanged logic) ────────────────────────────────────────
function genSinglyInsert({ initNodes, insertVal, position, insertIdx }) {
  const values = parseNodes(initNodes), val = Number(insertVal) || 99, steps = []
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : null }))
  steps.push(snap({ list: [...values], message: `Initial list ready — will insert ${val}`, vars: { head: values[0] ?? 'null', insertVal: val, position }, stackFrame: { fn: 'insertTail', head: values[0] ?? 'null', val }, heap: makeHeap(values), listType: 'singly', codeLine: 0 }))
  let list = [...values]
  if (position === 'head') {
    steps.push(snap({ list: [...list], message: `Create node(${val})`, vars: { node: `Node(${val})`, next: list[0] ?? 'null' }, stackFrame: { fn: 'insertHead', node: `Node(${val})` }, heap: makeHeap(list), codeLine: 1 }))
    list = [val, ...list]
    steps.push(snap({ list: [...list], highlight: [0], message: `node.next = old head — new head is ${val}`, vars: { node: `Node(${val})`, head: val }, stackFrame: { fn: 'insertHead', head: val }, heap: makeHeap(list), codeLine: 2 }))
  } else if (position === 'tail') {
    steps.push(snap({ list: [...list], message: `Create node(${val})`, vars: { node: `Node(${val})`, next: 'null' }, stackFrame: { fn: 'insertTail', node: `Node(${val})` }, heap: makeHeap(list), codeLine: 1 }))
    for (let i = 0; i < list.length; i++) steps.push(snap({ list: [...list], current: i, message: `Traverse: cur at node[${i}]=${list[i]}`, vars: { cur: list[i], 'cur.next': list[i + 1] ?? 'null' }, stackFrame: { fn: 'insertTail', cur: list[i], step: i }, heap: makeHeap(list), codeLine: 4 }))
    list = [...list, val]
    steps.push(snap({ list: [...list], highlight: [list.length - 1], current: list.length - 1, message: `cur.next = node(${val}) — attached at tail`, vars: { cur: list[list.length - 2], newNode: val }, stackFrame: { fn: 'insertTail', attached: val }, heap: makeHeap(list), codeLine: 7 }))
  } else {
    const idx = Math.min(Math.max(0, Number(insertIdx) || 0), list.length)
    steps.push(snap({ list: [...list], message: `Create node(${val}) — insert at index ${idx}`, vars: { node: `Node(${val})`, targetIdx: idx }, stackFrame: { fn: 'insertAtIndex', idx }, heap: makeHeap(list), codeLine: 1 }))
    for (let i = 0; i < idx; i++) steps.push(snap({ list: [...list], current: i, message: `Traverse to index ${i}`, vars: { cur: list[i], i }, stackFrame: { fn: 'insertAtIndex', cur: list[i], i }, heap: makeHeap(list), codeLine: 4 }))
    list.splice(idx, 0, val)
    steps.push(snap({ list: [...list], highlight: [idx], current: idx, message: `Inserted ${val} at index ${idx}`, vars: { node: val, idx }, stackFrame: { fn: 'insertAtIndex', inserted: val }, heap: makeHeap(list), codeLine: 7 }))
  }
  steps.push(snap({ list: [...list], message: `✓ Insert complete — ${list.join(' → ')} → null`, vars: { head: list[0], size: list.length }, stackFrame: { fn: 'insertTail', return: list[0] }, heap: makeHeap(list), codeLine: 8 }))
  return steps
}

function genSinglyDelete({ initNodes, deleteBy, deleteVal, deleteIdx }) {
  const values = parseNodes(initNodes), byValue = deleteBy !== 'index', target = byValue ? (Number(deleteVal) || 0) : (Number(deleteIdx) || 0), steps = []
  let list = [...values]
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : null }))
  steps.push(snap({ list: [...list], message: `Delete by ${byValue ? 'value' : 'index'}: ${target}`, vars: { head: list[0] ?? 'null', target }, stackFrame: { fn: 'deleteNode', head: list[0] ?? 'null', val: target }, heap: makeHeap(list), codeLine: 0 }))
  let found = false
  for (let i = 0; i < list.length; i++) {
    const match = byValue ? list[i] === target : i === target
    steps.push(snap({ list: [...list], current: i, message: `Check node[${i}]=${list[i]} — ${match ? 'MATCH!' : 'no match'}`, vars: { cur: list[i], i, match }, stackFrame: { fn: 'deleteNode', cur: list[i], i }, heap: makeHeap(list), codeLine: match ? 6 : 5 }))
    if (match) {
      steps.push(snap({ list: [...list], deleteIdx: i, message: `Unlinking node[${i}]=${list[i]}`, vars: { prev: list[i - 1] ?? 'null', next: list[i + 1] ?? 'null' }, stackFrame: { fn: 'deleteNode', unlink: list[i] }, heap: makeHeap(list), codeLine: 7 }))
      list.splice(i, 1)
      steps.push(snap({ list: [...list], message: `✓ Deleted — ${list.join(' → ')} → null`, vars: { head: list[0] ?? 'null', size: list.length }, stackFrame: { fn: 'deleteNode', return: list[0] ?? 'null' }, heap: makeHeap(list), codeLine: 8 }))
      found = true; break
    }
  }
  if (!found) steps.push(snap({ list: [...list], message: `✗ ${target} not found`, vars: { result: 'not found' }, stackFrame: { fn: 'deleteNode', return: 'head (unchanged)' }, heap: makeHeap(list), codeLine: 10 }))
  return steps
}

function genSinglySearch({ initNodes, searchVal }) {
  const values = parseNodes(initNodes), target = Number(searchVal) || 0, steps = [], list = [...values]
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : null }))
  steps.push(snap({ list, message: `Search for ${target} — start at head`, vars: { target, cur: list[0] ?? 'null', idx: 0 }, stackFrame: { fn: 'search', target, idx: 0 }, heap: makeHeap(list), codeLine: 0 }))
  for (let i = 0; i < list.length; i++) {
    const match = list[i] === target
    steps.push(snap({ list, current: i, message: `Comparing node[${i}]=${list[i]} with target ${target} — ${match ? '✓ FOUND' : 'not equal'}`, vars: { cur: list[i], idx: i, target, match }, stackFrame: { fn: 'search', cur: list[i], idx: i }, heap: makeHeap(list), codeLine: match ? 4 : 3, highlight: match ? [i] : [] }))
    if (match) { steps.push(snap({ list, current: i, highlight: [i], message: `✓ Found ${target} at index ${i}!`, vars: { found: true, idx: i }, stackFrame: { fn: 'search', return: i }, heap: makeHeap(list), codeLine: 5 })); return steps }
  }
  steps.push(snap({ list, message: `✗ ${target} not found — return -1`, vars: { result: -1 }, stackFrame: { fn: 'search', return: -1 }, heap: makeHeap(list), codeLine: 8 }))
  return steps
}

function genSinglyReverse({ initNodes }) {
  const values = parseNodes(initNodes), steps = []
  let list = [...values]
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : null }))
  const original = [...values], reversed = []
  steps.push(snap({ list: [...list], message: `Original: ${list.join(' → ')} → null`, vars: { prev: 'null', cur: list[0] ?? 'null' }, stackFrame: { fn: 'reverse', prev: 'null', cur: list[0] ?? 'null' }, heap: makeHeap(list), codeLine: 1 }))
  for (let i = 0; i < original.length; i++) {
    const nextVal = original[i + 1] ?? 'null'
    steps.push(snap({ list: [...list], current: i, message: `Flip cur(${original[i]}).next → prev`, vars: { prev: i === 0 ? 'null' : original[i - 1], cur: original[i], next: nextVal }, stackFrame: { fn: 'reverse', prev: i === 0 ? 'null' : original[i - 1], cur: original[i], next: nextVal }, heap: makeHeap(list), codeLine: 4 }))
    reversed.unshift(original[i])
    list = [...reversed, ...original.slice(i + 1)]
    steps.push(snap({ list: [...list], current: i, highlight: Array.from({ length: reversed.length }, (_, k) => k), message: `Reversed so far: [${reversed.join(', ')}]`, vars: { prev: original[i], cur: nextVal }, stackFrame: { fn: 'reverse', prev: original[i], cur: nextVal }, heap: makeHeap(list), codeLine: 6 }))
  }
  steps.push(snap({ list: [...reversed], message: `✓ Reverse complete: ${reversed.join(' → ')} → null`, vars: { head: reversed[0] }, stackFrame: { fn: 'reverse', return: reversed[0] }, heap: makeHeap(reversed), codeLine: 8 }))
  return steps
}

function genDoublyInsert({ initNodes, insertVal }) {
  const values = parseNodes(initNodes), val = Number(insertVal) || 99, steps = []
  let list = [...values]
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : null, prev: i > 0 ? i - 1 : null }))
  steps.push(snap({ list: [...list], message: `Doubly LL — insert ${val} at tail`, vars: { head: list[0] ?? 'null', val }, stackFrame: { fn: 'insertTail', head: list[0] ?? 'null', val }, heap: makeHeap(list), listType: 'doubly', codeLine: 0 }))
  for (let i = 0; i < list.length; i++) steps.push(snap({ list: [...list], current: i, message: `Walk to tail — cur at node[${i}]=${list[i]}`, vars: { cur: list[i] }, stackFrame: { fn: 'insertTail', cur: list[i] }, heap: makeHeap(list), listType: 'doubly', codeLine: 3 }))
  list = [...list, val]
  const last = list.length - 1
  steps.push(snap({ list: [...list], current: last, highlight: [last], message: `cur.next = node(${val}), node.prev = cur`, vars: { cur: list[last - 1], newNode: val }, stackFrame: { fn: 'insertTail', attached: val }, heap: makeHeap(list), listType: 'doubly', codeLine: 5 }))
  steps.push(snap({ list: [...list], message: `✓ Doubly insert complete`, vars: { head: list[0], size: list.length }, stackFrame: { fn: 'insertTail', return: list[0] }, heap: makeHeap(list), listType: 'doubly', codeLine: 7 }))
  return steps
}

function genDoublyDelete({ initNodes, deleteVal }) {
  const values = parseNodes(initNodes), target = Number(deleteVal) || 0, steps = []
  let list = [...values]
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : null, prev: i > 0 ? i - 1 : null }))
  steps.push(snap({ list: [...list], message: `Doubly LL — delete value ${target}`, vars: { target }, stackFrame: { fn: 'deleteNode', head: list[0] ?? 'null', val: target }, heap: makeHeap(list), listType: 'doubly', codeLine: 0 }))
  for (let i = 0; i < list.length; i++) {
    const match = list[i] === target
    steps.push(snap({ list: [...list], current: i, message: `Check node[${i}]=${list[i]} — ${match ? 'MATCH' : 'skip'}`, vars: { cur: list[i] }, stackFrame: { fn: 'deleteNode', cur: list[i], i }, heap: makeHeap(list), listType: 'doubly', codeLine: match ? 3 : 2 }))
    if (match) {
      steps.push(snap({ list: [...list], deleteIdx: i, message: `Fix pointers: prev.next = node.next; node.next.prev = prev`, vars: { prev: list[i - 1] ?? 'null', next: list[i + 1] ?? 'null' }, stackFrame: { fn: 'deleteNode' }, heap: makeHeap(list), listType: 'doubly', codeLine: 5 }))
      list.splice(i, 1)
      steps.push(snap({ list: [...list], message: `✓ Deleted — ${list.join(' ⟷ ')}`, vars: { head: list[0] ?? 'null', size: list.length }, stackFrame: { fn: 'deleteNode', return: list[0] ?? 'null' }, heap: makeHeap(list), listType: 'doubly', codeLine: 10 }))
      return steps
    }
  }
  steps.push(snap({ list: [...list], message: `✗ ${target} not found`, vars: { result: 'not found' }, stackFrame: { fn: 'deleteNode', return: 'head (unchanged)' }, heap: makeHeap(list), listType: 'doubly', codeLine: 12 }))
  return steps
}

function genCircularInsert({ initNodes, insertVal }) {
  const values = parseNodes(initNodes), val = Number(insertVal) || 99, steps = []
  let list = [...values]
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : 0 }))
  steps.push(snap({ list: [...list], message: `Circular LL — insert ${val}`, vars: { head: list[0] ?? 'null', val }, stackFrame: { fn: 'insertCircular', head: list[0] ?? 'null', val }, heap: makeHeap(list), listType: 'circular', codeLine: 0 }))
  for (let i = 0; i < list.length; i++) steps.push(snap({ list: [...list], current: i, message: `Find tail — node[${i}]=${list[i]}`, vars: { tail: list[i] }, stackFrame: { fn: 'insertCircular', tail: list[i] }, heap: makeHeap(list), listType: 'circular', codeLine: 5 }))
  list = [...list, val]
  steps.push(snap({ list: [...list], current: list.length - 1, highlight: [list.length - 1, 0], message: `tail.next = node(${val}), node.next = head(${list[0]})`, vars: { newNode: val, 'node.next': list[0] }, stackFrame: { fn: 'insertCircular' }, heap: makeHeap(list), listType: 'circular', codeLine: 8 }))
  steps.push(snap({ list: [...list], message: `✓ Circular insert complete`, vars: { head: list[0], size: list.length }, stackFrame: { fn: 'insertCircular', return: list[0] }, heap: makeHeap(list), listType: 'circular', codeLine: 10 }))
  return steps
}

function genDoublyCircularInsert({ initNodes, insertVal }) {
  const values = parseNodes(initNodes), val = Number(insertVal) || 99, steps = []
  let list = [...values]
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : 0, prev: i > 0 ? i - 1 : l.length - 1 }))
  steps.push(snap({ list: [...list], message: `Doubly Circular LL — insert ${val}`, vars: { head: list[0] ?? 'null', val }, stackFrame: { fn: 'insert', head: list[0] ?? 'null', val }, heap: makeHeap(list), listType: 'doubly_circular', codeLine: 0 }))
  if (list.length > 0) steps.push(snap({ list: [...list], current: list.length - 1, message: `tail = head.prev = node[${list.length - 1}] (O(1) access)`, vars: { tail: list[list.length - 1] }, stackFrame: { fn: 'insert', tail: list[list.length - 1] }, heap: makeHeap(list), listType: 'doubly_circular', codeLine: 6 }))
  list = [...list, val]
  steps.push(snap({ list: [...list], current: list.length - 1, highlight: [0, list.length - 1], message: `Link node(${val}): tail.next=node, node.prev=tail, node.next=head, head.prev=node`, vars: { newNode: val, 'node.next': list[0], 'node.prev': list[list.length - 2] }, stackFrame: { fn: 'insert' }, heap: makeHeap(list), listType: 'doubly_circular', codeLine: 8 }))
  steps.push(snap({ list: [...list], message: `✓ Doubly Circular complete`, vars: { head: list[0], size: list.length }, stackFrame: { fn: 'insert', return: list[0] }, heap: makeHeap(list), listType: 'doubly_circular', codeLine: 11 }))
  return steps
}

function genCycleDetect({ initNodes }) {
  const values = parseNodes(initNodes).length > 0 ? parseNodes(initNodes) : [1, 2, 3, 4, 5]
  const list = [...values], steps = [], cycleAt = Math.floor(list.length / 2)
  const makeHeap = (l) => l.map((v, i) => ({ id: i, val: v, next: i + 1 < l.length ? i + 1 : cycleAt }))
  steps.push(snap({ list, slow: 0, fast: 0, message: `Floyd's cycle detection — slow=fast=head(${list[0]}). Cycle at index ${cycleAt}`, vars: { slow: list[0], fast: list[0] }, stackFrame: { fn: 'hasCycle', slow: list[0], fast: list[0] }, heap: makeHeap(list), listType: 'cycle', hasCycle: true, cycleAt, codeLine: 1 }))
  let s = 0, f = 0
  for (let iter = 0; iter < list.length * 2; iter++) {
    s = (s + 1) % list.length; f = (f + 2) % list.length
    const meeting = s === f
    steps.push(snap({ list, slow: s, fast: f, current: s, highlight: [s, f], message: meeting ? `🔴 Cycle detected! slow === fast at node(${list[s]})` : `Iter ${iter + 1}: slow→node(${list[s]}), fast→node(${list[f]})`, vars: { slow: list[s], fast: list[f], meeting }, stackFrame: { fn: 'hasCycle', slow: list[s], fast: list[f] }, heap: makeHeap(list), listType: 'cycle', hasCycle: true, cycleAt, codeLine: meeting ? 6 : 4 }))
    if (meeting) { steps.push(snap({ list, slow: s, fast: f, highlight: [s, f], message: `✓ return true — cycle confirmed`, vars: { result: true }, stackFrame: { fn: 'hasCycle', return: true }, heap: makeHeap(list), listType: 'cycle', hasCycle: true, cycleAt, codeLine: 7 })); break }
  }
  return steps
}

const OPERATIONS = [
  { id: 'singly_insert',          label: 'Singly — Insert',          codeKey: 'singly_insert',          gen: genSinglyInsert,          defaultControls: { initNodes: '10,20,30,40', insertVal: '50', position: 'tail', insertIdx: '2' } },
  { id: 'singly_delete',          label: 'Singly — Delete',          codeKey: 'singly_delete',          gen: genSinglyDelete,          defaultControls: { initNodes: '10,20,30,40,50', deleteBy: 'value', deleteVal: '30', deleteIdx: '2' } },
  { id: 'singly_search',          label: 'Singly — Search',          codeKey: 'singly_search',          gen: genSinglySearch,          defaultControls: { initNodes: '10,20,30,40,50', searchVal: '30' } },
  { id: 'singly_reverse',         label: 'Singly — Reverse',         codeKey: 'singly_reverse',         gen: genSinglyReverse,         defaultControls: { initNodes: '10,20,30,40,50' } },
  { id: 'doubly_insert',          label: 'Doubly — Insert',          codeKey: 'doubly_insert',          gen: genDoublyInsert,          defaultControls: { initNodes: '10,20,30', insertVal: '40' } },
  { id: 'doubly_delete',          label: 'Doubly — Delete',          codeKey: 'doubly_delete',          gen: genDoublyDelete,          defaultControls: { initNodes: '10,20,30,40', deleteVal: '20' } },
  { id: 'circular_insert',        label: 'Circular — Insert',        codeKey: 'circular_insert',        gen: genCircularInsert,        defaultControls: { initNodes: '10,20,30', insertVal: '40' } },
  { id: 'doubly_circular_insert', label: 'Doubly Circular — Insert', codeKey: 'doubly_circular_insert', gen: genDoublyCircularInsert,  defaultControls: { initNodes: '10,20,30', insertVal: '40' } },
  { id: 'cycle_detect',           label: 'Cycle Detection',          codeKey: 'cycle_detect',           gen: genCycleDetect,           defaultControls: { initNodes: '1,2,3,4,5' } },
]

// ── Shared input style ────────────────────────────────────────────────────────
const inp = { background: '#1a2235', border: '1px solid #1e2d45', color: '#e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 12, outline: 'none', fontFamily: 'inherit' }

// ── Controls Panel ────────────────────────────────────────────────────────────
function ControlsPanel({ opId, controls, onChange, onVisualize, isPlaying }) {
  const field = (label, key, type = 'text', placeholder = '') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      <input type={type} value={controls[key] ?? ''} placeholder={placeholder} onChange={e => onChange(key, e.target.value)} style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
    </div>
  )
  const radio = (label, key, options) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(({ value, label: lbl }) => (
          <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: controls[key] === value ? '#60a5fa' : '#64748b', fontFamily: 'monospace' }}>
            <input type="radio" name={key} value={value} checked={controls[key] === value} onChange={() => onChange(key, value)} style={{ accentColor: '#3b82f6' }} />{lbl}
          </label>
        ))}
      </div>
    </div>
  )
  const fields = {
    singly_insert:          () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30,40')}{field('Insert Value', 'insertVal', 'number', '50')}{radio('Position', 'position', [{ value: 'head', label: 'Head' }, { value: 'tail', label: 'Tail' }, { value: 'index', label: 'At Index' }])}{controls.position === 'index' && field('Index', 'insertIdx', 'number', '2')}</>,
    singly_delete:          () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30,40,50')}{radio('Delete By', 'deleteBy', [{ value: 'value', label: 'Value' }, { value: 'index', label: 'Index' }])}{controls.deleteBy === 'index' ? field('Delete Index', 'deleteIdx', 'number', '2') : field('Delete Value', 'deleteVal', 'number', '30')}</>,
    singly_search:          () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30,40,50')}{field('Search Value', 'searchVal', 'number', '30')}</>,
    singly_reverse:         () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30,40,50')}</>,
    doubly_insert:          () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30')}{field('Insert Value', 'insertVal', 'number', '40')}</>,
    doubly_delete:          () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30,40')}{field('Delete Value', 'deleteVal', 'number', '20')}</>,
    circular_insert:        () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30')}{field('Insert Value', 'insertVal', 'number', '40')}</>,
    doubly_circular_insert: () => <>{field('Initial Nodes', 'initNodes', 'text', '10,20,30')}{field('Insert Value', 'insertVal', 'number', '40')}</>,
    cycle_detect:           () => <>{field('List Nodes', 'initNodes', 'text', '1,2,3,4,5')}</>,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {fields[opId]?.()}
      <button onClick={onVisualize} disabled={isPlaying}
        style={{ marginTop: 4, padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: isPlaying ? 'not-allowed' : 'pointer', fontFamily: 'monospace', background: isPlaying ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', color: isPlaying ? '#64748b' : '#fff', boxShadow: isPlaying ? 'none' : '0 0 12px rgba(59,130,246,0.35)' }}>
        {isPlaying ? '▶ Running…' : '▶ Visualize'}
      </button>
    </div>
  )
}

// ── Code Panel ────────────────────────────────────────────────────────────────
const KW = ['function','let','const','var','if','else','while','for','return','new','null']
function hlCode(line) {
  let h = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  h = h.replace(/(\/\/.*$)/gm, '<span style="color:#3d5166;font-style:italic">$1</span>')
  h = h.replace(/('[^']*'|"[^"]*")/g, '<span style="color:#4ade80">$1</span>')
  h = h.replace(/(?<![a-zA-Z_$])\b(\d+)\b/g, '<span style="color:#4ade80">$1</span>')
  h = h.replace(/\b(const|let|var)\s+([a-zA-Z_$][\w$]*)/g, '<span style="color:#c084fc">$1</span> <span style="color:#facc15">$2</span>')
  KW.forEach(k => { h = h.replace(new RegExp(`\\b(${k})\\b(?![^<]*>)`, 'g'), '<span style="color:#c084fc">$1</span>') })
  h = h.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()(?![^<]*>)/g, '<span style="color:#67e8f9">$1</span>')
  return h
}

function CodePanel({ opId, activeLine }) {
  const op = OPERATIONS.find(o => o.id === opId)
  const snippet = CODE[op?.codeKey] || ''
  const lines = snippet.split('\n')
  const activeRef = useRef(null)
  useEffect(() => { activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [activeLine])
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.panel }}>
      {/* mac dots title bar — matches main CodePanel */}
      <div style={{ padding: '7px 10px', borderBottom: `1px solid #161f2e`, flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center', background: C.panel }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ marginLeft: 6, fontSize: 11, color: '#3d5166', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
          {op?.label || 'Code'}.js
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 12.5, lineHeight: '1.7' }}>
        {lines.map((line, i) => {
          const isActive = i === activeLine
          return (
            <div key={i} ref={isActive ? activeRef : null}
              style={{ display: 'flex', alignItems: 'stretch', background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent', borderLeft: `3px solid ${isActive ? '#6366f1' : 'transparent'}`, transition: 'background 0.15s' }}>
              <div style={{ userSelect: 'none', width: 36, paddingRight: 12, paddingLeft: 6, textAlign: 'right', flexShrink: 0, color: isActive ? '#6366f1' : '#2a3a50', fontSize: 11, lineHeight: '1.7', fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>{i + 1}</div>
              <div style={{ flex: 1, paddingRight: 16, whiteSpace: 'pre', color: isActive ? '#e2e8f0' : '#4a6080', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: hlCode(line) }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Node component ────────────────────────────────────────────────────────────
function LLNode({ val, idx, isHead, isTail, isActive, isDelete, isHighlight, isSlow, isFast, listType }) {
  const isDoubly = listType === 'doubly' || listType === 'doubly_circular'
  let bg = C.nodeBg, border = C.nodeBorder, color = C.text
  if (isDelete)              { bg = '#7f1d1d'; border = '#ef4444'; color = '#fca5a5' }
  else if (isSlow && isFast) { bg = '#450a24'; border = '#ec4899'; color = '#fbcfe8' }
  else if (isSlow)           { bg = '#78350f'; border = '#f59e0b'; color = '#fde68a' }
  else if (isFast)           { bg = '#7f1d1d'; border = '#ef4444'; color = '#fca5a5' }
  else if (isActive)         { bg = '#1e1b4b'; border = '#6366f1'; color = '#a5b4fc' }
  else if (isHead)           { bg = '#0c4a6e'; border = '#0ea5e9'; color = '#bae6fd' }
  else if (isTail)           { bg = '#14532d'; border = '#22c55e'; color = '#bbf7d0' }
  else if (isHighlight)      { bg = '#1e3a5f'; border = '#3b82f6'; color = '#93c5fd' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ height: 16, display: 'flex', gap: 4, justifyContent: 'center' }}>
        {isHead && <span style={{ fontSize: 9, color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>HEAD</span>}
        {isTail && <span style={{ fontSize: 9, color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>TAIL</span>}
        {isSlow && isFast && <span style={{ fontSize: 9, color: '#ec4899', fontFamily: 'monospace', fontWeight: 700 }}>MEET</span>}
        {isSlow && !isFast && <span style={{ fontSize: 9, color: '#f59e0b', fontFamily: 'monospace', fontWeight: 700 }}>SLOW</span>}
        {isFast && !isSlow && <span style={{ fontSize: 9, color: '#ef4444', fontFamily: 'monospace', fontWeight: 700 }}>FAST</span>}
      </div>
      <motion.div layout initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.2 }}
        style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: `2px solid ${border}`, boxShadow: (isActive || isSlow || isFast) ? `0 0 16px ${border}99` : 'none', fontFamily: 'monospace' }}>
        {isDoubly && <div style={{ padding: '8px 6px', background: '#0d1117', color: '#475569', fontSize: 10, display: 'flex', alignItems: 'center' }}>←</div>}
        <div style={{ padding: '8px 14px', background: bg, color, fontWeight: 700, fontSize: 15, minWidth: 40, textAlign: 'center' }}>{val}</div>
        <div style={{ padding: '8px 6px', background: '#0d1117', color: '#475569', fontSize: 10, display: 'flex', alignItems: 'center' }}>→</div>
      </motion.div>
      <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>[{idx}]</span>
    </div>
  )
}

function Arrow({ isActive, isDoubly }) {
  const color = isActive ? '#6366f1' : '#2d4a6e'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 24, gap: 2 }}>
      {isDoubly && <div style={{ fontSize: 9, color, lineHeight: 1 }}>←</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <div style={{ height: 2, width: 20, background: color, borderRadius: 1 }} />
        <div style={{ color, fontSize: 11, lineHeight: 1 }}>▶</div>
      </div>
    </div>
  )
}

// ── Cycle SVG ─────────────────────────────────────────────────────────────────
function CycleCanvas({ step }) {
  const list = step.list ?? [], slow = step.slow ?? -1, fast = step.fast ?? -1, cycleAt = step.cycleAt ?? -1
  const NODE_W = 64, NODE_H = 40, ARROW_W = 32, LEFT_PAD = 40, TOP_PAD = 90, ARC_H = 72
  const n = list.length, stride = NODE_W + ARROW_W, svgW = LEFT_PAD + n * stride + 20, svgH = TOP_PAD + NODE_H + ARC_H + 40
  const cx = (i) => LEFT_PAD + i * stride + NODE_W / 2
  const ny = TOP_PAD
  const arcPath = () => {
    if (cycleAt < 0 || cycleAt >= n) return ''
    const x1 = cx(n - 1) + NODE_W / 2, x2 = cx(cycleAt) - NODE_W / 2 + 6, y = ny + NODE_H / 2, arcY = ny + NODE_H + ARC_H
    return `M ${x1} ${y} C ${x1 + 20} ${arcY}, ${x2 - 20} ${arcY}, ${x2} ${y}`
  }
  const nodeColor = (idx) => {
    if (idx === slow && idx === fast) return { bg: '#450a24', border: '#ec4899', text: '#fbcfe8' }
    if (idx === slow) return { bg: '#78350f', border: '#f59e0b', text: '#fde68a' }
    if (idx === fast) return { bg: '#7f1d1d', border: '#ef4444', text: '#fca5a5' }
    if (idx === 0) return { bg: '#0c4a6e', border: '#0ea5e9', text: '#bae6fd' }
    if (idx === n - 1) return { bg: '#14532d', border: '#22c55e', text: '#bbf7d0' }
    return { bg: '#1e3a5f', border: '#2d5a8e', text: '#e2e8f0' }
  }
  const labelOf = (idx) => { if (idx === slow && idx === fast) return 'MEET'; if (idx === slow) return 'SLOW'; if (idx === fast) return 'FAST'; if (idx === 0) return 'HEAD'; if (idx === n - 1) return 'TAIL'; return '' }
  const labelColor = (idx) => { if (idx === slow && idx === fast) return '#ec4899'; if (idx === slow) return '#f59e0b'; if (idx === fast) return '#ef4444'; if (idx === 0) return '#38bdf8'; if (idx === n - 1) return '#34d399'; return 'transparent' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, overflowX: 'auto', padding: '8px 16px' }}>
      <svg width={svgW} height={svgH} style={{ overflow: 'visible' }}>
        {list.map((_, idx) => { if (idx >= n - 1) return null; const x1 = cx(idx) + NODE_W / 2, x2 = cx(idx + 1) - NODE_W / 2, y = ny + NODE_H / 2; return (<g key={`a-${idx}`}><line x1={x1} y1={y} x2={x2 - 7} y2={y} stroke="#2d4a6e" strokeWidth={2} /><polygon points={`${x2},${y} ${x2 - 8},${y - 4} ${x2 - 8},${y + 4}`} fill="#2d4a6e" /></g>) })}
        {cycleAt >= 0 && cycleAt < n && (<g><path d={arcPath()} fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" />{(() => { const x2 = cx(cycleAt) - NODE_W / 2 + 6, y = ny + NODE_H / 2; return <polygon points={`${x2},${y} ${x2 - 9},${y - 4} ${x2 - 9},${y + 4}`} fill="#f59e0b" /> })()}<text x={(cx(n - 1) + cx(cycleAt)) / 2} y={ny + NODE_H + ARC_H + 18} textAnchor="middle" fill="#f59e0b" fontSize={10} fontFamily="monospace" fontWeight={700}>tail.next → node[{cycleAt}] (cycle!)</text></g>)}
        {list.map((val, idx) => { const { bg, border, text } = nodeColor(idx); const x = cx(idx) - NODE_W / 2; const label = labelOf(idx); const lColor = labelColor(idx); const glow = (idx === slow || idx === fast) ? `drop-shadow(0 0 8px ${border})` : 'none'; return (<g key={`n-${idx}`} style={{ filter: glow }}>{label && <text x={cx(idx)} y={ny - 10} textAnchor="middle" fill={lColor} fontSize={9} fontFamily="monospace" fontWeight={700}>{label}</text>}<rect x={x} y={ny} width={NODE_W} height={NODE_H} rx={6} fill={bg} stroke={border} strokeWidth={2} /><text x={cx(idx)} y={ny + NODE_H / 2 + 5} textAnchor="middle" fill={text} fontSize={14} fontFamily="monospace" fontWeight={700}>{val}</text><line x1={x + NODE_W - 14} y1={ny + 4} x2={x + NODE_W - 14} y2={ny + NODE_H - 4} stroke={border} strokeWidth={1} opacity={0.5} /><text x={x + NODE_W - 7} y={ny + NODE_H / 2 + 4} textAnchor="middle" fill="#475569" fontSize={9} fontFamily="monospace">→</text><text x={cx(idx)} y={ny + NODE_H + 14} textAnchor="middle" fill="#64748b" fontSize={9} fontFamily="monospace">[{idx}]</text></g>) })}
      </svg>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['#38bdf8','head'],['#34d399','tail'],['#f59e0b','slow ptr'],['#ef4444','fast ptr'],['#ec4899','meeting pt'],['#f59e0b','cycle arc']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
            <span style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Canvas ────────────────────────────────────────────────────────────────────
function LLCanvas({ step }) {
  const list = step.list ?? [], current = step.current ?? -1, highlight = step.highlight ?? [], deleteIdx = step.deleteIdx ?? -1
  const slow = step.slow ?? -1, fast = step.fast ?? -1, listType = step.listType ?? 'singly'
  const isDoubly = listType === 'doubly' || listType === 'doubly_circular'
  const isCircular = listType === 'circular' || listType === 'doubly_circular'
  if (!list.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 36, opacity: 0.3 }}>🔗</span>
      <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 14 }}>head → null</span>
      <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 11, opacity: 0.5 }}>Configure and click ▶ Visualize</span>
    </div>
  )
  if (listType === 'cycle') return <CycleCanvas step={step} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, overflowX: 'auto', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 0 }}>
        <AnimatePresence>
          {list.map((val, idx) => (
            <React.Fragment key={`node-${idx}-${val}`}>
              <LLNode val={val} idx={idx} isHead={idx === 0} isTail={idx === list.length - 1} isActive={idx === current} isDelete={idx === deleteIdx} isHighlight={highlight.includes(idx) && idx !== current && idx !== deleteIdx} isSlow={idx === slow} isFast={idx === fast} listType={listType} />
              {idx < list.length - 1 && <Arrow isActive={highlight.includes(idx) && highlight.includes(idx + 1)} isDoubly={isDoubly} />}
            </React.Fragment>
          ))}
        </AnimatePresence>
        {!isCircular && <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}><Arrow isActive={false} isDoubly={false} /><span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, marginLeft: 4 }}>null</span></div>}
        {isCircular && list.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 1 }}><div style={{ height: 2, width: 16, background: '#6366f1', borderRadius: 1 }} /><span style={{ color: '#6366f1', fontSize: 11 }}>▶</span></div><span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>HEAD ({list[0]})</span></div>}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['#0ea5e9','head'],['#22c55e','tail'],['#6366f1','cursor'],['#ef4444','deleting'],['#3b82f6','highlight']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
            <span style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Right panels — match main MemoryPanel style ───────────────────────────────
function VariablesPanel({ vars }) {
  const entries = Object.entries(vars || {})
  return (
    <div style={{ height: '100%', background: C.sectionBg, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase', padding: '12px 12px 6px', fontFamily: 'monospace' }}>Variables</div>
      <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {entries.length === 0 ? <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>No variables yet</span>
          : entries.map(([k, v]) => (
            <div key={k} style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
              <span style={{ color: '#94a3b8' }}>{k}</span><span style={{ color: '#475569' }}> = </span><span style={{ color: '#fcd34d' }}>{JSON.stringify(v)}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

function StackPanel({ stackFrame }) {
  const entries = Object.entries(stackFrame || {})
  const fn = stackFrame?.fn || ''
  const rest = entries.filter(([k]) => k !== 'fn')
  return (
    <div style={{ height: '100%', background: C.sectionBg, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase', padding: '12px 12px 6px', fontFamily: 'monospace' }}>Call Stack</div>
      <div style={{ padding: '0 12px 8px' }}>
        {fn ? (
          <div style={{ padding: '5px 8px', background: 'rgba(6,182,212,0.06)', borderRadius: 6, border: '1px solid rgba(6,182,212,0.3)' }}>
            <div style={{ fontSize: 11, color: '#22d3ee', fontWeight: 600, fontFamily: 'monospace', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', display: 'inline-block' }} />{fn}()
            </div>
            {rest.map(([k, v]) => (
              <div key={k} style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', paddingLeft: 11 }}>
                <span style={{ color: '#94a3b8' }}>{k}</span><span style={{ color: '#475569' }}> : </span><span style={{ color: '#fcd34d' }}>{JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        ) : <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>Empty stack</span>}
      </div>
    </div>
  )
}

function HeapPanel({ heap, listType }) {
  const isDoubly = listType === 'doubly' || listType === 'doubly_circular'
  return (
    <div style={{ height: '100%', background: C.sectionBg, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase', padding: '12px 12px 6px', fontFamily: 'monospace' }}>Heap — Nodes</div>
      <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(!heap || heap.length === 0) ? <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>No nodes</span>
          : heap.map((node, i) => (
            <div key={i} style={{ padding: '5px 8px', background: 'rgba(168,85,247,0.05)', borderRadius: 6, border: '1px solid rgba(168,85,247,0.2)', fontFamily: 'monospace' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#c084fc', marginBottom: 3 }}>Node[{node.id}]</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>  val: <span style={{ color: '#22d3ee' }}>{node.val}</span></div>
              {isDoubly && node.prev !== undefined && <div style={{ fontSize: 10, color: '#64748b' }}>{'  prev: '}<span style={{ color: '#a5b4fc' }}>{node.prev === null ? 'null' : `Node[${node.prev}]`}</span></div>}
              <div style={{ fontSize: 10, color: '#64748b' }}>{'  next: '}<span style={{ color: '#a5b4fc' }}>{node.next === null ? 'null' : `Node[${node.next}]`}</span></div>
            </div>
          ))}
      </div>
    </div>
  )
}

function TimelinePanel({ steps, currentStep, onJump }) {
  const containerRef = useRef(null)
  useEffect(() => { if (containerRef.current) { const el = containerRef.current.children[currentStep]; if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) } }, [currentStep])
  return (
    <div style={{ height: '100%', background: C.sectionBg, overflowY: 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase', padding: '12px 12px 6px', fontFamily: 'monospace' }}>Timeline — {steps.length} steps</div>
      <div ref={containerRef} style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {steps.length === 0 ? <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace', padding: '4px 2px' }}>No events yet</span>
          : steps.map((s, i) => {
            const active = i === currentStep
            return (
              <div key={i} onClick={() => onJump(i)}
                style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 6px', borderRadius: 5, cursor: 'pointer', background: active ? 'rgba(99,102,241,0.18)' : 'transparent', borderLeft: active ? '2px solid #6366f1' : '2px solid transparent', transition: 'background 0.1s' }}>
                <span style={{ fontSize: 9, color: active ? '#6366f1' : '#2a3a50', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 10, color: active ? '#22d3ee' : '#64748b', fontFamily: 'monospace', lineHeight: 1.4 }}>{s.message || `Step ${i + 1}`}</span>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function LinkedListVisualizer() {
  const [opId, setOpId]               = useState('singly_insert')
  const [steps, setSteps]             = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying]     = useState(false)
  const [speed, setSpeed]             = useState(700)
  const [controls, setControls]       = useState(OPERATIONS[0].defaultControls)
  const timerRef = useRef(null)

  const stopPlay = useCallback(() => { clearInterval(timerRef.current); setIsPlaying(false) }, [])

  const startPlay = useCallback(() => {
    setIsPlaying(true)
    timerRef.current = setInterval(() => {
      setCurrentStep(prev => { if (prev >= steps.length - 1) { clearInterval(timerRef.current); setIsPlaying(false); return prev } return prev + 1 })
    }, speed)
  }, [steps, speed])

  useEffect(() => () => clearInterval(timerRef.current), [])

  const switchOp = useCallback((id) => {
    stopPlay(); setOpId(id); setSteps([]); setCurrentStep(0)
    const op = OPERATIONS.find(o => o.id === id)
    setControls(op?.defaultControls || {})
  }, [stopPlay])

  const handleVisualize = useCallback(() => {
    stopPlay()
    const op = OPERATIONS.find(o => o.id === opId)
    if (!op) return
    const generated = op.gen(controls)
    setSteps(generated); setCurrentStep(0)
  }, [opId, controls, stopPlay])

  useEffect(() => { handleVisualize() }, []) // eslint-disable-line

  const step = steps[currentStep] || {}
  const message = step.message || ''

  const handlePrev = () => { stopPlay(); setCurrentStep(p => Math.max(0, p - 1)) }
  const handleNext = () => { stopPlay(); setCurrentStep(p => Math.min(steps.length - 1, p + 1)) }
  const handleJump = (i) => { stopPlay(); setCurrentStep(i) }
  const handleControlChange = (key, val) => setControls(prev => ({ ...prev, [key]: val }))

  // progress bar
  const pct = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0b0e17', overflow: 'hidden', fontFamily: '"Inter",system-ui,sans-serif' }}>

      {/* ── Operation selector — styled like AlgoBar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderBottom: '1px solid #1e2d45', background: '#0d1117', flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: 4, fontFamily: 'monospace', flexShrink: 0 }}>Operation:</span>
        <select
          value={opId}
          onChange={e => switchOp(e.target.value)}
          style={{ background: '#1a2235', border: '1px solid #1e2d45', color: '#e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          {OPERATIONS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
        </select>
        <button onClick={handleVisualize} disabled={isPlaying}
          style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: isPlaying ? 'not-allowed' : 'pointer', boxShadow: '0 0 12px rgba(59,130,246,0.35)', opacity: isPlaying ? 0.5 : 1 }}>
          ▶ Visualize
        </button>
      </div>

      {/* ── Message + timeline bar — styled like main Timeline ── */}
      <div style={{ padding: '8px 12px', background: '#0b0f1a', borderBottom: '1px solid #1e2d45', flexShrink: 0 }}>
        {/* progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', width: 64, textAlign: 'right', flexShrink: 0 }}>{currentStep + 1}/{Math.max(1, steps.length)}</span>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative' }}
            onClick={e => { const r = e.currentTarget.getBoundingClientRect(); stopPlay(); setCurrentStep(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * (steps.length - 1))) }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#06b6d4,#8b5cf6)', width: `${pct}%`, transition: 'width 0.2s' }} />
          </div>
          <span style={{ fontSize: 11, color: '#475569', width: 36, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
        </div>
        {/* message + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <motion.p key={currentStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
              style={{ fontSize: 11, color: '#22d3ee', fontFamily: 'monospace', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', margin: 0 }}>
              {message || '—'}
            </motion.p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {[
              { label: '⏮', action: () => { stopPlay(); setCurrentStep(0) }, title: 'Reset' },
              { label: '◀', action: handlePrev, title: 'Prev' },
              { label: isPlaying ? '⏸' : '▶', action: isPlaying ? stopPlay : startPlay, title: isPlaying ? 'Pause' : 'Play' },
              { label: '▶', action: handleNext, title: 'Next' },
              { label: '⏭', action: () => { stopPlay(); setCurrentStep(steps.length - 1) }, title: 'End' },
            ].map(({ label, action, title }) => (
              <button key={title} onClick={action} title={title}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: title === (isPlaying ? 'Pause' : 'Play') ? 'linear-gradient(135deg,#06b6d4,#8b5cf6)' : 'rgba(255,255,255,0.04)', color: '#cbd5e1', cursor: 'pointer', fontSize: label.length > 1 ? 13 : 15 }}>
                {label}
              </button>
            ))}
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
              style={{ background: '#1a2235', border: '1px solid #1e2d45', color: '#64748b', borderRadius: 8, padding: '3px 6px', fontSize: 11, outline: 'none', fontFamily: 'monospace', cursor: 'pointer' }}>
              <option value={1200}>0.5×</option>
              <option value={700}>1×</option>
              <option value={350}>2×</option>
              <option value={150}>4×</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Code + Controls */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid #1e2d45', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 55%', overflow: 'hidden', borderBottom: '1px solid #1e2d45' }}>
            <CodePanel opId={opId} activeLine={step.codeLine ?? -1} />
          </div>
          <div style={{ flex: '0 0 45%', overflowY: 'auto', padding: '10px', background: '#0f172a' }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'monospace', marginBottom: 8 }}>Controls</div>
            <ControlsPanel opId={opId} controls={controls} onChange={handleControlChange} onVisualize={handleVisualize} isPlaying={isPlaying} />
          </div>
        </div>

        {/* CENTER: Canvas */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#0b0e17' }}>
          <LLCanvas step={step} />
        </div>

        {/* RIGHT: Variables | Stack | Heap | Timeline */}
        <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid #1e2d45', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 25%', borderBottom: '1px solid #1e2d45', overflow: 'hidden' }}><VariablesPanel vars={step.vars} /></div>
          <div style={{ flex: '0 0 25%', borderBottom: '1px solid #1e2d45', overflow: 'hidden' }}><StackPanel stackFrame={step.stackFrame} /></div>
          <div style={{ flex: '0 0 25%', borderBottom: '1px solid #1e2d45', overflow: 'hidden' }}><HeapPanel heap={step.heap} listType={step.listType} /></div>
          <div style={{ flex: '0 0 25%', overflow: 'hidden' }}><TimelinePanel steps={steps} currentStep={currentStep} onJump={handleJump} /></div>
        </div>
      </div>
    </div>
  )
}