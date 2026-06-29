// src/engine/CustomCodeEngine.js
// Generates step arrays for all detected algorithm types.
// Named export so both `import { CustomCodeEngine }` and `import CustomCodeEngine` work.

export class CustomCodeEngine {

  // ─── public entry point ─────────────────────────────────────────────────────
  static generate(code, detection) {
    const { type, subtype } = detection;
    const params = CustomCodeEngine._extractParams(code, type, subtype);

    switch (type) {
      case 'sorting':    return CustomCodeEngine._sorting(subtype, params);
      case 'searching':  return CustomCodeEngine._searching(subtype, params);
      case 'recursion':  return CustomCodeEngine._recursion(subtype, params);
      case 'graph':      return CustomCodeEngine._graph(subtype, params);
      case 'tree':       return CustomCodeEngine._tree(subtype, params);
      case 'linkedlist': return CustomCodeEngine._linkedList(params);
      case 'stack':      return CustomCodeEngine._stack(params);
      case 'hashmap':    return CustomCodeEngine._hashMap(params);
      case 'dp':         return CustomCodeEngine._dp(subtype, params);
      default:           return CustomCodeEngine._sorting('bubble', params);
    }
  }

  // ─── _extractParams ──────────────────────────────────────────────────────────
  static _extractParams(code, type, subtype) {
    const params = {};

    const arrayMatches = [...code.matchAll(/\[\s*([-\d\s,.]+)\]/g)];
    let bestArray = null;
    for (const m of arrayMatches) {
      const nums = m[1].split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      if (nums.length > 1 && (!bestArray || nums.length > bestArray.length)) bestArray = nums;
    }
    if (bestArray) params.array = bestArray;

    const targetPatterns = [
      /\btarget\s*=\s*(-?\d+)/,
      /\bkey\s*=\s*(-?\d+)/,
      /\bsearchFor\s*=\s*(-?\d+)/,
      /search\s*\(\s*\w+\s*,\s*(-?\d+)\s*\)/,
      /binarySearch\s*\(\s*\w+\s*,\s*(-?\d+)\s*\)/,
      /linearSearch\s*\(\s*\w+\s*,\s*(-?\d+)\s*\)/,
    ];
    for (const pat of targetPatterns) {
      const m = code.match(pat);
      if (m) { params.target = parseInt(m[1], 10); break; }
    }

    const nPatterns = [
      /fib\s*\(\s*(\d+)\s*\)/,
      /fibonacci\s*\(\s*(\d+)\s*\)/,
      /factorial\s*\(\s*(\d+)\s*\)/,
      /\bn\s*=\s*(\d+)/,
    ];
    for (const pat of nPatterns) {
      const m = code.match(pat);
      if (m) { params.n = parseInt(m[1], 10); break; }
    }

    if (!params.array) {
      if (type === 'sorting')   params.array = [64, 34, 25, 12, 22, 11, 90];
      if (type === 'searching') params.array = subtype === 'binary'
        ? [11, 12, 22, 25, 34, 64, 90]
        : [2, 4, 0, 1, 9, 7, 3, 8, 5, 6];
    }
    if (params.target === undefined && type === 'searching')
      params.target = params.array[Math.floor(params.array.length * 0.6)];
    if (!params.n) params.n = subtype === 'factorial' ? 6 : 7;

    if (type === 'searching' && subtype === 'binary')
      params.array = [...params.array].sort((a, b) => a - b);

    return params;
  }

  static _snap(payload, opts = {}) {
    return {
      ...payload,
      variables:   Object.entries(opts.vars || {}).map(([name, value]) => ({ name, value })),
      stackFrames: opts.stackFrames || [],
      heapObjects: opts.heapObjects || [],
    };
  }

  // ─── SORTING ─────────────────────────────────────────────────────────────────
  static _sorting(subtype, params) {
    const arr = [...(params.array || [64, 34, 25, 12, 22, 11, 90])];
    let steps;
    switch (subtype) {
      case 'quick':     steps = CustomCodeEngine._quickSort([...arr]); break;
      case 'merge':     steps = CustomCodeEngine._mergeSort([...arr]); break;
      case 'insertion': steps = CustomCodeEngine._insertionSort([...arr]); break;
      case 'selection': steps = CustomCodeEngine._selectionSort([...arr]); break;
      default:          steps = CustomCodeEngine._bubbleSort([...arr]); break;
    }
    return { steps, type: 'sorting', subtype: subtype || 'bubble' };
  }

  static _bubbleSort(arr) {
    const steps = [], n = arr.length;
    let comparisons = 0, swaps = 0;
    const sorted = new Set();
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        comparisons++;
        steps.push(CustomCodeEngine._snap({
          array: [...arr], arr: [...arr],
          comparing: [j, j+1], swapping: [], sorted: [...sorted],
          comparisons, swaps,
          message: `Comparing arr[${j}]=${arr[j]} and arr[${j+1}]=${arr[j+1]}`,
        }, { vars: { i, j, comparisons, swaps } }));
        if (arr[j] > arr[j+1]) {
          [arr[j], arr[j+1]] = [arr[j+1], arr[j]]; swaps++;
          steps.push(CustomCodeEngine._snap({
            array: [...arr], arr: [...arr],
            comparing: [], swapping: [j, j+1], sorted: [...sorted],
            comparisons, swaps,
            message: `Swapped → arr[${j}]=${arr[j]}, arr[${j+1}]=${arr[j+1]}`,
          }, { vars: { i, j, comparisons, swaps } }));
        }
      }
      sorted.add(n - 1 - i);
    }
    sorted.add(0);
    steps.push(CustomCodeEngine._snap({
      array: [...arr], arr: [...arr],
      comparing: [], swapping: [], sorted: arr.map((_, k) => k),
      comparisons, swaps, message: 'Array sorted!',
    }, { vars: { comparisons, swaps } }));
    return steps;
  }

  static _selectionSort(arr) {
    const steps = [], n = arr.length;
    let comparisons = 0, swaps = 0;
    const sorted = new Set();
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        comparisons++;
        steps.push(CustomCodeEngine._snap({
          array: [...arr], arr: [...arr],
          comparing: [j, minIdx], swapping: [], sorted: [...sorted], pivot: minIdx,
          comparisons, swaps, message: `Finding min in [${i}..${n-1}], min=${arr[minIdx]}`,
        }, { vars: { i, j, minIdx, comparisons, swaps } }));
        if (arr[j] < arr[minIdx]) minIdx = j;
      }
      if (minIdx !== i) { [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]; swaps++; }
      sorted.add(i);
    }
    sorted.add(n - 1);
    steps.push(CustomCodeEngine._snap({
      array: [...arr], arr: [...arr],
      comparing: [], swapping: [], sorted: arr.map((_, k) => k),
      comparisons, swaps, message: 'Sorted!',
    }, { vars: { comparisons, swaps } }));
    return steps;
  }

  static _insertionSort(arr) {
    const steps = [], n = arr.length;
    let comparisons = 0, swaps = 0;
    for (let i = 1; i < n; i++) {
      const key = arr[i]; let j = i - 1;
      steps.push(CustomCodeEngine._snap({
        array: [...arr], arr: [...arr],
        comparing: [i], swapping: [], sorted: Array.from({length:i},(_,k)=>k),
        comparisons, swaps, message: `Inserting key=${key}`,
      }, { vars: { i, j, key, comparisons, swaps } }));
      while (j >= 0 && arr[j] > key) {
        comparisons++; arr[j+1] = arr[j]; swaps++; j--;
        steps.push(CustomCodeEngine._snap({
          array: [...arr], arr: [...arr],
          comparing: [j+1], swapping: [j+2], sorted: Array.from({length:i},(_,k)=>k),
          comparisons, swaps, message: `Shifting right`,
        }, { vars: { i, j, key, comparisons, swaps } }));
      }
      arr[j+1] = key;
    }
    steps.push(CustomCodeEngine._snap({
      array: [...arr], arr: [...arr],
      comparing: [], swapping: [], sorted: arr.map((_, k) => k),
      comparisons, swaps, message: 'Sorted!',
    }, { vars: { comparisons, swaps } }));
    return steps;
  }

  static _quickSort(arr) {
    const steps = []; let comparisons = 0, swaps = 0;
    const partition = (lo, hi) => {
      const pivot = arr[hi]; let i = lo - 1;
      for (let j = lo; j < hi; j++) {
        comparisons++;
        steps.push(CustomCodeEngine._snap({
          array: [...arr], arr: [...arr],
          comparing: [j], swapping: [], sorted: [], pivot: hi,
          comparisons, swaps, message: `Pivot=${pivot}, comparing arr[${j}]=${arr[j]}`,
        }, { vars: { lo, hi, i, j, pivot, comparisons, swaps } }));
        if (arr[j] <= pivot) { i++; [arr[i], arr[j]] = [arr[j], arr[i]]; swaps++; }
      }
      [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]]; swaps++;
      return i + 1;
    };
    const qsort = (lo, hi) => { if (lo < hi) { const p = partition(lo, hi); qsort(lo, p-1); qsort(p+1, hi); } };
    qsort(0, arr.length - 1);
    steps.push(CustomCodeEngine._snap({
      array: [...arr], arr: [...arr],
      comparing: [], swapping: [], sorted: arr.map((_, k) => k),
      comparisons, swaps, message: 'Sorted!',
    }, { vars: { comparisons, swaps } }));
    return steps;
  }

  static _mergeSort(arr) {
    const steps = []; let comparisons = 0, swaps = 0;
    const merge = (lo, mid, hi) => {
      const left = arr.slice(lo, mid+1), right = arr.slice(mid+1, hi+1);
      let i = 0, j = 0, k = lo;
      while (i < left.length && j < right.length) {
        comparisons++;
        if (left[i] <= right[j]) arr[k++] = left[i++]; else { arr[k++] = right[j++]; swaps++; }
        steps.push(CustomCodeEngine._snap({
          array: [...arr], arr: [...arr],
          comparing: [], swapping: [], sorted: [], merging: Array.from({length:k-lo},(_,x)=>lo+x),
          comparisons, swaps, message: `Merging [${lo}..${mid}] and [${mid+1}..${hi}]`,
        }, { vars: { lo, mid, hi, comparisons, swaps } }));
      }
      while (i < left.length) arr[k++] = left[i++];
      while (j < right.length) arr[k++] = right[j++];
    };
    const msort = (lo, hi) => { if (lo < hi) { const mid = Math.floor((lo+hi)/2); msort(lo, mid); msort(mid+1, hi); merge(lo, mid, hi); } };
    msort(0, arr.length - 1);
    steps.push(CustomCodeEngine._snap({
      array: [...arr], arr: [...arr],
      comparing: [], swapping: [], sorted: arr.map((_, k) => k),
      comparisons, swaps, message: 'Sorted!',
    }, { vars: { comparisons, swaps } }));
    return steps;
  }

  // ─── SEARCHING ───────────────────────────────────────────────────────────────
  static _searching(subtype, params) {
    if (subtype === 'binary') return CustomCodeEngine._binarySearch(params);
    return CustomCodeEngine._linearSearch(params);
  }

  static _linearSearch(params) {
    const array = params.array || [2, 4, 0, 1, 9, 7, 3, 8, 5, 6];
    const target = params.target ?? array[Math.floor(array.length * 0.6)];
    const steps = []; const visited = []; let comparisons = 0;
    for (let i = 0; i < array.length; i++) {
      comparisons++; visited.push(i);
      const found = array[i] === target;
      steps.push(CustomCodeEngine._snap({
        array, arr: array, current: i, found: found ? i : -1, target,
        visited: [...visited], comparisons,
        message: found ? `Found ${target} at index ${i}!` : `arr[${i}]=${array[i]} ≠ ${target}`,
      }, { vars: { i, target, comparisons, found } }));
      if (found) break;
    }
    return { steps, type: 'searching', subtype: 'linear' };
  }

  static _binarySearch(params) {
    const array = [...(params.array || [11, 12, 22, 25, 34, 64, 90])].sort((a, b) => a - b);
    const target = params.target ?? array[Math.floor(array.length / 2)];
    const steps = []; let lo = 0, hi = array.length - 1, comparisons = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2); comparisons++;
      const found = array[mid] === target;
      steps.push(CustomCodeEngine._snap({
        array, arr: array, lo, hi, mid, found: found ? mid : -1, target, comparisons,
        message: found ? `Found ${target} at index ${mid}!`
          : array[mid] < target ? `arr[${mid}]=${array[mid]} < ${target} → right`
                                 : `arr[${mid}]=${array[mid]} > ${target} → left`,
      }, { vars: { lo, hi, mid, target, comparisons, found } }));
      if (found) break;
      if (array[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    return { steps, type: 'searching', subtype: 'binary' };
  }

  // ─── RECURSION ───────────────────────────────────────────────────────────────
  static _recursion(subtype, params) {
    if (subtype === 'factorial') return CustomCodeEngine._factorial(params);
    return CustomCodeEngine._fibonacci(params);
  }

  static _fibonacci(params) {
    const n = Math.min(params.n || 7, 10);
    const steps = [], memo = {}, tree = [];
    const fib = (k, depth = 0, parentId = -1) => {
      const id = tree.length;
      const node = { id, n: k, depth, parentId, result: null };
      tree.push(node);
      const activeFrames = () => tree.filter(x => x.result === null).map(x => ({ name: `fib(${x.n})`, depth: x.depth, vars: { n: x.n } }));
      steps.push(CustomCodeEngine._snap({ tree: tree.map(x => ({ ...x })), currentId: id, message: `Calling fib(${k})` }, { vars: { n: k, depth }, stackFrames: activeFrames() }));
      let result;
      if (k <= 1) result = k;
      else if (memo[k] !== undefined) result = memo[k];
      else { result = fib(k-1, depth+1, id) + fib(k-2, depth+1, id); memo[k] = result; }
      node.result = result;
      steps.push(CustomCodeEngine._snap({ tree: tree.map(x => ({ ...x })), currentId: id, message: `fib(${k}) = ${result}` }, { vars: { n: k, depth, result }, stackFrames: activeFrames() }));
      return result;
    };
    fib(n);
    return { steps, type: 'recursion', subtype: 'fibonacci' };
  }

  static _factorial(params) {
    const n = Math.min(params.n || 6, 12);
    const steps = [], callStack = [];
    const fact = (k) => {
      callStack.push({ name: `fact(${k})`, depth: callStack.length, vars: { n: k } });
      steps.push(CustomCodeEngine._snap({ n: k, message: `Calling factorial(${k})` }, { vars: { n: k }, stackFrames: [...callStack] }));
      const result = k <= 1 ? 1 : k * fact(k - 1);
      callStack.pop();
      steps.push(CustomCodeEngine._snap({ n: k, result, message: `factorial(${k}) = ${result}` }, { vars: { n: k, result }, stackFrames: [...callStack] }));
      return result;
    };
    fact(n);
    return { steps, type: 'recursion', subtype: 'factorial' };
  }

  // ─── GRAPH ───────────────────────────────────────────────────────────────────
  static _graph(subtype, params) {
    if (subtype === 'dfs')      return CustomCodeEngine._dfs();
    if (subtype === 'dijkstra') return CustomCodeEngine._dijkstra();
    return CustomCodeEngine._bfs();
  }

  static _bfs() {
    const nodes = ['A','B','C','D','E','F'];
    const edges = [['A','B'],['A','C'],['B','D'],['B','E'],['C','F']];
    const adj = {}; nodes.forEach(n => adj[n] = []); edges.forEach(([u,v]) => { adj[u].push(v); adj[v].push(u); });
    const steps = [], visited = new Set(['A']), queue = ['A'];
    while (queue.length) {
      const node = queue.shift();
      steps.push(CustomCodeEngine._snap({ nodes, edges, visited: [...visited], current: node, queue: [...queue], message: `Visiting ${node}` }, { vars: { current: node, queueSize: queue.length } }));
      for (const nb of adj[node]) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
      }
    }
    return { steps, type: 'graph', subtype: 'bfs' };
  }

  static _dfs() {
    const nodes = ['A','B','C','D','E','F'];
    const edges = [['A','B'],['A','C'],['B','D'],['B','E'],['C','F']];
    const adj = {}; nodes.forEach(n => adj[n] = []); edges.forEach(([u,v]) => { adj[u].push(v); adj[v].push(u); });
    const steps = [], visited = new Set(), callStack = [];
    const dfs = (node, depth = 0) => {
      visited.add(node); callStack.push({ name: `dfs(${node})`, depth, vars: { node } });
      steps.push(CustomCodeEngine._snap({ nodes, edges, visited: [...visited], current: node, message: `DFS visiting ${node}` }, { vars: { current: node, depth }, stackFrames: [...callStack] }));
      for (const nb of adj[node]) { if (!visited.has(nb)) dfs(nb, depth+1); }
      callStack.pop();
    };
    dfs('A');
    return { steps, type: 'graph', subtype: 'dfs' };
  }

  static _dijkstra() {
    const nodes = ['A','B','C','D','E','F'];
    const edges = [['A','B',4],['A','C',2],['B','D',5],['B','E',1],['C','F',8],['E','F',2]];
    const dist = {}; nodes.forEach(n => dist[n] = Infinity); dist['A'] = 0;
    const visited = new Set(), steps = [];
    for (let iter = 0; iter < nodes.length; iter++) {
      let u = null; nodes.forEach(n => { if (!visited.has(n) && (u === null || dist[n] < dist[u])) u = n; });
      if (!u || dist[u] === Infinity) break;
      visited.add(u);
      steps.push(CustomCodeEngine._snap({ nodes, edges, visited: [...visited], current: u, dist: { ...dist }, message: `Processing ${u}, dist=${dist[u]}` }, { vars: { current: u, dist_u: dist[u] } }));
      for (const [a, b, w] of edges) {
        const nb = a === u ? b : b === u ? a : null;
        if (nb && !visited.has(nb) && dist[u] + w < dist[nb]) {
          dist[nb] = dist[u] + w;
          steps.push(CustomCodeEngine._snap({ nodes, edges, visited: [...visited], current: u, dist: { ...dist }, message: `Relaxed ${u}→${nb}, dist=${dist[nb]}` }, { vars: { current: u, neighbour: nb, newDist: dist[nb] } }));
        }
      }
    }
    return { steps, type: 'graph', subtype: 'dijkstra' };
  }

  // ─── TREE ────────────────────────────────────────────────────────────────────
  static _tree(subtype, params) {
    const values = params.array || [5, 3, 7, 1, 4, 6, 8];
    const steps = []; let nodeId = 0; const heapObjects = [];
    const root = { id: nodeId++, val: values[0], left: null, right: null };
    heapObjects.push({ id: `node_${root.id}`, type: 'TreeNode', label: `Node(${root.val})`, fields: { val: root.val, left: 'null', right: 'null' } });
    steps.push(CustomCodeEngine._snap({ tree: root, highlighted: root.id, message: `Insert root ${root.val}` }, { vars: { inserting: root.val }, heapObjects: [...heapObjects] }));
    const insert = (val) => {
      const newNode = { id: nodeId++, val, left: null, right: null };
      heapObjects.push({ id: `node_${newNode.id}`, type: 'TreeNode', label: `Node(${val})`, fields: { val, left: 'null', right: 'null' } });
      let cur = root;
      while (true) {
        if (val < cur.val) { if (!cur.left) { cur.left = newNode; break; } cur = cur.left; }
        else               { if (!cur.right) { cur.right = newNode; break; } cur = cur.right; }
      }
      steps.push(CustomCodeEngine._snap({ tree: root, highlighted: newNode.id, message: `Inserted ${val}` }, { vars: { inserted: val }, heapObjects: [...heapObjects] }));
    };
    for (let i = 1; i < values.length; i++) insert(values[i]);
    return { steps, type: 'tree', subtype: subtype || 'bst' };
  }

  // ─── LINKED LIST ─────────────────────────────────────────────────────────────
  static _linkedList(params) {
    const values = params.array || [1, 2, 3, 4, 5];
    const steps = []; const list = []; let heapObjects = [];
    const makeNode = (v, nextId) => ({ id: `node_${v}`, type: 'ListNode', label: `Node(${v})`, fields: { val: v, next: nextId || 'null' } });
    for (let i = 0; i < values.length; i++) {
      list.push(values[i]);
      heapObjects = list.map((v, idx) => makeNode(v, idx+1 < list.length ? `node_${list[idx+1]}` : null));
      steps.push(CustomCodeEngine._snap({ list: [...list], current: i, operation: 'insert', message: `Insert node with value ${values[i]}` }, { vars: { val: values[i], size: list.length }, heapObjects: [...heapObjects] }));
    }
    for (let i = 0; i < list.length; i++) {
      steps.push(CustomCodeEngine._snap({ list: [...list], current: i, operation: 'traverse', message: `Visiting node ${list[i]} at index ${i}` }, { vars: { current: i, val: list[i] }, heapObjects: [...heapObjects] }));
    }
    return { steps, type: 'linkedlist', subtype: 'singly' };
  }

  // ─── STACK ───────────────────────────────────────────────────────────────────
  static _stack(params) {
    const arr = params.array || [10, 20, 30, 40];
    const steps = [], stack = [];
    for (const val of arr) {
      stack.push(val);
      steps.push(CustomCodeEngine._snap({ stack: [...stack], operation: 'push', value: val, message: `PUSH ${val} → size=${stack.length}` }, { vars: { operation: 'push', value: val, size: stack.length, top: stack[stack.length-1] } }));
    }
    while (stack.length) {
      const popped = stack.pop();
      steps.push(CustomCodeEngine._snap({ stack: [...stack], operation: 'pop', value: popped, message: `POP ${popped} → size=${stack.length}` }, { vars: { operation: 'pop', value: popped, size: stack.length } }));
    }
    return { steps, type: 'stack', subtype: 'lifo' };
  }

  // ─── HASHMAP ─────────────────────────────────────────────────────────────────
  static _hashMap(params) {
    const steps = [], buckets = new Array(7).fill(null).map(() => []), heapObjects = [];
    const hash = key => { let h = 0; for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) % buckets.length; return h; };
    const entries = [['name','Alice'],['age',30],['city','NY'],['lang','JS'],['role','dev']];
    for (const [k, v] of entries) {
      const h = hash(k); buckets[h].push([k, v]);
      heapObjects.push({ id: `entry_${k}`, type: 'Entry', label: `"${k}": "${v}"`, fields: { key: k, value: v, bucket: h } });
      steps.push(CustomCodeEngine._snap({ table: buckets.map(b => [...b]), buckets: buckets.map(b => [...b]), key: k, value: v, hashIndex: h, current: h, message: `hash("${k}") = ${h} → insert` }, { vars: { key: k, value: v, hashIndex: h }, heapObjects: [...heapObjects] }));
    }
    return { steps, type: 'hashmap', subtype: 'open' };
  }

  // ─── DYNAMIC PROGRAMMING ─────────────────────────────────────────────────────
  static _dp(subtype, params) {
    if (subtype === 'knapsack') return CustomCodeEngine._knapsack(params);
    if (subtype === 'lis')      return CustomCodeEngine._lis(params);
    return CustomCodeEngine._lcs(params);
  }

  static _lcs(params) {
    const s1 = 'ABCBDAB', s2 = 'BDCAB';
    const m = s1.length, n = s2.length;
    const dp = Array.from({ length: m+1 }, () => new Array(n+1).fill(0));
    const steps = [];
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i-1] === s2[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
        else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        steps.push(CustomCodeEngine._snap({ dp: dp.map(r => [...r]), i, j, ci: i, cj: j, s1, s2, lcs: dp[m][n], match: s1[i-1] === s2[j-1], message: s1[i-1] === s2[j-1] ? `Match '${s1[i-1]}' → dp[${i}][${j}]=${dp[i][j]}` : `No match → dp[${i}][${j}]=${dp[i][j]}` }, { vars: { i, j, 's1[i-1]': s1[i-1], 's2[j-1]': s2[j-1], 'dp[i][j]': dp[i][j] } }));
      }
    }
    return { steps, type: 'dp', subtype: 'lcs' };
  }

  static _knapsack(params) {
    const weights = [1,3,4,5], values = [1,4,5,7], W = 7;
    const n = weights.length;
    const dp = Array.from({ length: n+1 }, () => new Array(W+1).fill(0));
    const steps = [];
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= W; w++) {
        dp[i][w] = weights[i-1] <= w ? Math.max(dp[i-1][w], values[i-1] + dp[i-1][w-weights[i-1]]) : dp[i-1][w];
        steps.push(CustomCodeEngine._snap({ dp: dp.map(r => [...r]), i, j: w, ci: i, cj: w, message: `Item ${i} (w=${weights[i-1]},v=${values[i-1]}), cap=${w} → ${dp[i][w]}` }, { vars: { item: i, weight: weights[i-1], value: values[i-1], capacity: w, 'dp[i][w]': dp[i][w] } }));
      }
    }
    return { steps, type: 'dp', subtype: 'knapsack' };
  }

  static _lis(params) {
    const arr = params.array || [10, 9, 2, 5, 3, 7, 101, 18];
    const n = arr.length, dp = new Array(n).fill(1);
    const steps = [];
    for (let i = 1; i < n; i++) {
      for (let j = 0; j < i; j++) { if (arr[j] < arr[i] && dp[j]+1 > dp[i]) dp[i] = dp[j]+1; }
      steps.push(CustomCodeEngine._snap({ array: arr, arr, dp: [...dp], current: i, lis: Math.max(...dp), message: `dp[${i}]=${dp[i]}, LIS=${Math.max(...dp)}` }, { vars: { i, 'arr[i]': arr[i], 'dp[i]': dp[i], lis: Math.max(...dp) } }));
    }
    return { steps, type: 'dp', subtype: 'lis' };
  }
}

export default CustomCodeEngine;