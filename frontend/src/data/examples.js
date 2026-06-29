export const SORTING_EXAMPLES = {
  small:   [5, 3, 8, 1, 9, 2, 7, 4, 6],
  medium:  [64, 34, 25, 12, 22, 11, 90, 45, 73, 18, 56, 37],
  large:   [38, 27, 43, 3, 9, 82, 10, 54, 21, 67, 15, 88, 42, 71, 6, 95, 33, 50],
  sorted:  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reverse: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  random:  () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 1),
}
 
export const SEARCH_EXAMPLES = {
  array:  [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91],
  target: 23,
  targets: [2, 23, 91, 99],
}
 
export const LINKED_LIST_EXAMPLES = {
  basic:    [1, 2, 3, 4, 5],
  extended: [10, 20, 30, 40, 50, 60],
}
 
export const TREE_EXAMPLES = {
  bst: {
    insertOrder: [50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45],
    searchTarget: 40,
  },
  balanced: {
    insertOrder: [4, 2, 6, 1, 3, 5, 7],
  },
}
 
export const GRAPH_EXAMPLES = {
  undirected: {
    nodes: [
      { id: 'A', label: 'A' },
      { id: 'B', label: 'B' },
      { id: 'C', label: 'C' },
      { id: 'D', label: 'D' },
      { id: 'E', label: 'E' },
      { id: 'F', label: 'F' },
    ],
    edges: [
      { source: 'A', target: 'B', weight: 4 },
      { source: 'A', target: 'C', weight: 2 },
      { source: 'B', target: 'C', weight: 1 },
      { source: 'B', target: 'D', weight: 5 },
      { source: 'C', target: 'E', weight: 10 },
      { source: 'D', target: 'E', weight: 2 },
      { source: 'D', target: 'F', weight: 6 },
      { source: 'E', target: 'F', weight: 3 },
    ],
    start: 'A',
  },
}
 
export const STACK_EXAMPLES = {
  initial: [1, 2, 3, 4, 5],
  pushValues: [6, 7, 8],
}
 
export const HASHMAP_EXAMPLES = {
  pairs: [
    { key: 'apple',  value: 1 },
    { key: 'banana', value: 2 },
    { key: 'cherry', value: 3 },
    { key: 'date',   value: 4 },
    { key: 'elder',  value: 5 },
    { key: 'fig',    value: 6 },
  ],
  tableSize: 7,
}
 
export const POINTER_EXAMPLES = {
  variables: [
    { name: 'x',    address: '0x1000', value: 42,        type: 'int' },
    { name: 'y',    address: '0x1004', value: 17,        type: 'int' },
    { name: 'ptr',  address: '0x1008', value: '0x1000',  type: 'int*', pointsTo: 'x' },
    { name: 'ptr2', address: '0x100C', value: '0x1004',  type: 'int*', pointsTo: 'y' },
  ],
  heap: [
    { name: 'obj',  address: '0x2000', value: '{ a: 1, b: 2 }', type: 'Object' },
    { name: 'ref',  address: '0x100C', value: '0x2000',           type: 'Object*', pointsTo: 'obj' },
  ],
}
 
export const RECURSION_EXAMPLES = {
  fibonacci: { n: 6 },
  factorial: { n: 5 },
}
 
export const DP_EXAMPLES = {
  lcs: {
    s1: 'ABCBDAB',
    s2: 'BDCAB',
  },
  knapsack: {
    weights:  [1, 3, 4, 5],
    values:   [1, 4, 5, 7],
    capacity: 7,
  },
}
 
// Algorithm code snippets shown in the CodeEditor
export const CODE_SNIPPETS = {
  bubbleSort: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap
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
  const mid  = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right= mergeSort(arr.slice(mid));
  return merge(left, right);
}
 
function merge(l, r) {
  const result = [];
  let i = 0, j = 0;
  while (i < l.length && j < r.length) {
    if (l[i] <= r[j]) result.push(l[i++]);
    else               result.push(r[j++]);
  }
  return result.concat(l.slice(i), r.slice(j));
}`,
 
  quickSort: `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}
 
function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}`,
 
  linearSearch: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`,
 
  binarySearch: `function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target)  return mid;
    if (arr[mid] < target)    low  = mid + 1;
    else                      high = mid - 1;
  }
  return -1;
}`,
 
  bfs: `function bfs(graph, start) {
  const visited = new Set();
  const queue   = [start];
  visited.add(start);
  while (queue.length > 0) {
    const node = queue.shift();
    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`,
 
  dfs: `function dfs(graph, node, visited = new Set()) {
  visited.add(node);
  for (const neighbor of graph[node] || []) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
}`,
 
  fibonacci: `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,

  memoisation: `function memo(n, dp={}){
  if (n in dp) return dp[n];  
  if(n <= 1) return n;
  dp[n] = memo(n-1,dp) + memo(n-2,dp);
  return dp[n];
}`,
 
  lcs: `function lcs(s1, s2) {
  const m = s1.length, n = s2.length;
  const dp = Array.from({ length: m+1 }, () => Array(n+1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i-1] === s2[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
      else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  return dp[m][n];
}`,
}