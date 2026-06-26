// File: src/utils/constants.js

export const ALGO_CATEGORIES = {
  SORTING: 'Sorting',
  SEARCHING: 'Searching',
  TREES: 'Trees',
  GRAPHS: 'Graphs',
  DATA_STRUCTURES: 'Data Structures',
  RECURSION: 'Recursion',
  DP: 'Dynamic Programming',
  MEMORY: 'Memory',
}

export const ALGORITHMS = [
  { id: 'bubble',     label: 'Bubble Sort',      category: ALGO_CATEGORIES.SORTING,          complexity: { time: 'O(n²)', space: 'O(1)' } },
  { id: 'selection',  label: 'Selection Sort',    category: ALGO_CATEGORIES.SORTING,          complexity: { time: 'O(n²)', space: 'O(1)' } },
  { id: 'insertion',  label: 'Insertion Sort',    category: ALGO_CATEGORIES.SORTING,          complexity: { time: 'O(n²)', space: 'O(1)' } },
  { id: 'merge',      label: 'Merge Sort',        category: ALGO_CATEGORIES.SORTING,          complexity: { time: 'O(n log n)', space: 'O(n)' } },
  { id: 'quick',      label: 'Quick Sort',        category: ALGO_CATEGORIES.SORTING,          complexity: { time: 'O(n log n)', space: 'O(log n)' } },
  { id: 'linear',     label: 'Linear Search',     category: ALGO_CATEGORIES.SEARCHING,        complexity: { time: 'O(n)', space: 'O(1)' } },
  { id: 'binary',     label: 'Binary Search',     category: ALGO_CATEGORIES.SEARCHING,        complexity: { time: 'O(log n)', space: 'O(1)' } },
  { id: 'bst',        label: 'BST Operations',    category: ALGO_CATEGORIES.TREES,            complexity: { time: 'O(log n)', space: 'O(n)' } },
  { id: 'bfs',        label: 'BFS',               category: ALGO_CATEGORIES.GRAPHS,           complexity: { time: 'O(V+E)', space: 'O(V)' } },
  { id: 'dfs',        label: 'DFS',               category: ALGO_CATEGORIES.GRAPHS,           complexity: { time: 'O(V+E)', space: 'O(V)' } },
  { id: 'dijkstra',   label: "Dijkstra's",        category: ALGO_CATEGORIES.GRAPHS,           complexity: { time: 'O((V+E) log V)', space: 'O(V)' } },
  { id: 'linkedlist', label: 'Linked List',       category: ALGO_CATEGORIES.DATA_STRUCTURES,  complexity: { time: 'O(n)', space: 'O(n)' } },
  { id: 'stack',      label: 'Stack',             category: ALGO_CATEGORIES.DATA_STRUCTURES,  complexity: { time: 'O(1)', space: 'O(n)' } },
  { id: 'hashmap',    label: 'Hash Map',          category: ALGO_CATEGORIES.DATA_STRUCTURES,  complexity: { time: 'O(1) avg', space: 'O(n)' } },
  { id: 'fibonacci',  label: 'Fibonacci',         category: ALGO_CATEGORIES.RECURSION,        complexity: { time: 'O(2ⁿ)', space: 'O(n)' } },
  { id: 'lcs',        label: 'LCS (DP)',          category: ALGO_CATEGORIES.DP,               complexity: { time: 'O(mn)', space: 'O(mn)' } },
  { id: 'pointers',   label: 'Pointers & Memory', category: ALGO_CATEGORIES.MEMORY,           complexity: { time: 'O(1)', space: 'O(1)' } },
]

export const VISUALIZER_MAP = {
  bubble:     'sorting',
  selection:  'sorting',
  insertion:  'sorting',
  merge:      'sorting',
  quick:      'sorting',
  linear:     'search',
  binary:     'search',
  bst:        'tree',
  bfs:        'graph',
  dfs:        'graph',
  dijkstra:   'graph',
  linkedlist: 'linkedlist',
  stack:      'stack',
  hashmap:    'hashmap',
  fibonacci:  'recursion',
  lcs:        'dp',
  pointers:   'pointers',
}

export const COLORS = {
  // Bar states
  DEFAULT:    '#334155',
  COMPARING:  '#6366f1',
  SWAPPING:   '#f43f5e',
  SORTED:     '#10b981',
  PIVOT:      '#f59e0b',
  SELECTED:   '#06b6d4',
  MERGED:     '#8b5cf6',
  LEFT:       '#6366f1',
  RIGHT:      '#f43f5e',
  // Node states
  NODE_DEFAULT:  '#1e293b',
  NODE_ACTIVE:   '#312e81',
  NODE_VISITED:  '#1e3a5f',
  NODE_FOUND:    '#14532d',
  NODE_QUEUE:    '#1c2a4a',
  NODE_PATH:     '#3b0764',
  NODE_HIGHLIGHT:'#7c2d12',
  // Edge states
  EDGE_DEFAULT:  '#334155',
  EDGE_ACTIVE:   '#6366f1',
  EDGE_VISITED:  '#10b981',
  EDGE_PATH:     '#f59e0b',
  // Stroke colors
  STROKE_DEFAULT:  '#475569',
  STROKE_ACTIVE:   '#6366f1',
  STROKE_VISITED:  '#10b981',
  STROKE_FOUND:    '#10b981',
  STROKE_QUEUE:    '#3b82f6',
  STROKE_PATH:     '#8b5cf6',
  STROKE_HIGHLIGHT:'#f97316',
  // Text colors
  TEXT_DEFAULT:  '#94a3b8',
  TEXT_ACTIVE:   '#c4b5fd',
  TEXT_VISITED:  '#6ee7b7',
  TEXT_FOUND:    '#86efac',
  TEXT_BRIGHT:   '#e2e8f0',
  // DP table
  DP_EMPTY:    '#1a2036',
  DP_FILLED:   '#1e3a5f',
  DP_ACTIVE:   '#312e81',
  DP_DIAGONAL: '#14532d',
}

export const SPEEDS = {
  1:  2000,
  2:  1400,
  3:  900,
  4:  600,
  5:  400,
  6:  250,
  7:  150,
  8:  80,
  9:  40,
  10: 16,
}

export const GRAPH_NODES_POSITIONS = [
  { id: 0, label: 'A', x: 280, y: 80  },
  { id: 1, label: 'B', x: 140, y: 180 },
  { id: 2, label: 'C', x: 420, y: 180 },
  { id: 3, label: 'D', x: 70,  y: 300 },
  { id: 4, label: 'E', x: 210, y: 300 },
  { id: 5, label: 'F', x: 350, y: 300 },
  { id: 6, label: 'G', x: 490, y: 300 },
  { id: 7, label: 'H', x: 140, y: 400 },
  { id: 8, label: 'I', x: 420, y: 400 },
]

export const GRAPH_EDGES = [
  [0, 1, 4], [0, 2, 3],
  [1, 3, 2], [1, 4, 5],
  [2, 5, 1], [2, 6, 6],
  [4, 7, 3], [5, 8, 2],
  [3, 7, 1], [6, 8, 4],
]

export const HASH_TABLE_SIZE = 8