// File: src/engine/ExecutionEngine.js

export class ExecutionEngine {
  static build(rawSteps, options = {}) {
    if (!rawSteps || rawSteps.length === 0) return []

    return rawSteps.map((step, idx) => {
      // FIXED: normalise every field name variation so visualizers
      // can all read step.array regardless of what the generator emits
      const array = step.array ?? step.arr ?? []

      const normalized = {
        ...step,
        array,
        // search compat: lo/hi/mid
        lo:  step.lo  ?? step.low  ?? undefined,
        hi:  step.hi  ?? step.high ?? undefined,
        // description compat
        description: step.description ?? step.message ?? '',
        // comparing/swapping arrays — support both naming styles
        comparing: step.comparing ?? step.compare ?? [],
        swapping:  step.swapping  ?? step.swap    ?? [],
        sorted:    step.sorted    ?? [],
      }

      const variables   = ExecutionEngine._extractVariables(normalized, options)
      const { stackFrames, heapObjects } = ExecutionEngine._extractMemory(normalized, options)

      return {
        ...normalized,
        stepIndex:   idx,
        comparisons: normalized.comparisons ?? 0,
        swaps:       normalized.swaps       ?? 0,
        accesses:    normalized.accesses    ?? 0,
        variables,
        stackFrames,
        heapObjects,
        progress: rawSteps.length > 1 ? (idx / (rawSteps.length - 1)) * 100 : 100,
      }
    })
  }

  static _extractVariables(step, options) {
    const vars = []
    const add = (name, type, value) => {
      if (value !== undefined) vars.push({ name, type, value: typeof value === 'object' ? JSON.stringify(value) : String(value) })
    }

    if (step.array?.length) add('array', 'Array', step.array)
    add('i',       'number', step.i)
    add('j',       'number', step.j)
    add('lo',      'number', step.lo)
    add('hi',      'number', step.hi)
    add('mid',     'number', step.mid)
    add('pivot',   'number', step.pivot !== -1 ? step.pivot : undefined)
    add('target',  'number', step.target)
    add('found',   'any',    step.found !== undefined && step.found !== -1 ? step.found : undefined)
    add('current', 'node',   step.current !== -1 ? step.current : undefined)
    add('key',     'string', step.key)
    add('hash',    'number', step.hash !== -1 ? step.hash : undefined)
    add('n',       'number', step.n)
    add('result',  'any',    step.result)

    // Merge in step.vars object (already labelled by algorithm)
    if (step.vars && typeof step.vars === 'object') {
      for (const [k, v] of Object.entries(step.vars)) {
        if (!vars.find(x => x.name === k) && v !== undefined) {
          vars.push({ name: k, type: typeof v, value: typeof v === 'object' ? JSON.stringify(v) : String(v) })
        }
      }
    }

    return vars
  }

  static _extractMemory(step, options) {
    const stackFrames = []
    const heapObjects = []
    const algo = options.algorithm || 'main'

    // Recursion call stack
    if (step.callStack?.length) {
      step.callStack.forEach((frame, i) => {
        stackFrames.push({
          id: `frame_${i}`,
          name: typeof frame === 'string' ? frame : frame.fn || `frame_${i}`,
          vars: frame.vars || [],
          active: i === step.callStack.length - 1,
        })
      })
    }
    // Sorting/searching — show algo frame
    else if (step.array?.length) {
      stackFrames.push({
        id: 'main', name: `${algo}()`, active: true,
        vars: [
          { name: 'n',     value: step.array.length },
          step.i     !== undefined ? { name: 'i',      value: step.i }     : null,
          step.j     !== undefined ? { name: 'j',      value: step.j }     : null,
          step.lo    !== undefined ? { name: 'lo',     value: step.lo }    : null,
          step.hi    !== undefined ? { name: 'hi',     value: step.hi }    : null,
          step.mid   !== undefined ? { name: 'mid',    value: step.mid }   : null,
          step.pivot !== undefined && step.pivot !== -1 ? { name: 'pivot', value: step.pivot } : null,
        ].filter(Boolean),
      })
      heapObjects.push({ id: 'arr', type: 'Array', value: step.array, refs: [] })
    }
    // Stack DS
    else if (step.stack) {
      stackFrames.push({
        id: 'stack', name: 'Stack', active: true,
        vars: step.stack.map((v, i) => ({ name: `[${i}]`, value: v })),
      })
    }
    // Tree / graph
    else if (step.nodes) {
      stackFrames.push({
        id: 'traversal', name: `${algo}()`, active: true,
        vars: [
          { name: 'nodes',   value: step.nodes.length },
          step.current !== undefined ? { name: 'current', value: step.current } : null,
          step.visited ? { name: 'visited', value: step.visited.length } : null,
        ].filter(Boolean),
      })
    }
    // Linked list
    else if (step.list) {
      stackFrames.push({
        id: 'list', name: `${algo}()`, active: true,
        vars: [
          { name: 'size', value: step.list.length },
          { name: 'head', value: step.list[0] ?? 'null' },
        ],
      })
      heapObjects.push({ id: 'list', type: 'LinkedList', value: step.list, refs: [] })
    }
    // Pointer demo
    else if (step.heap?.length) {
      step.heap.forEach(obj => {
        heapObjects.push({ id: `heap_${obj.id}`, type: obj.type || 'Object', value: obj.fields || obj, refs: [] })
      })
      if (step.stack?.length) {
        stackFrames.push({
          id: 'ptr', name: 'main()', active: true,
          vars: step.stack.map(v => ({ name: v.name, value: `${v.val} @ ${v.addr}` })),
        })
      }
    }
    // Hash map
    else if (step.table) {
      heapObjects.push({ id: 'hashTable', type: 'HashMap', value: step.table, refs: [] })
      stackFrames.push({
        id: 'hash', name: `${algo}()`, active: true,
        vars: [
          { name: 'key',  value: step.key  || '' },
          { name: 'hash', value: step.hash ?? -1 },
        ],
      })
    }
    // DP
    else if (step.dp) {
      stackFrames.push({
        id: 'dp', name: 'lcs()', active: true,
        vars: [
          { name: 's1', value: step.s1 },
          { name: 's2', value: step.s2 },
          step.ci !== undefined ? { name: 'i', value: step.ci } : null,
          step.cj !== undefined ? { name: 'j', value: step.cj } : null,
        ].filter(Boolean),
      })
      heapObjects.push({ id: 'dp', type: '2D Array', value: step.dp, refs: [] })
    }
    // Recursion tree
    else if (step.tree) {
      const active = step.tree.find(n => n.id === step.current)
      stackFrames.push({
        id: 'rec', name: active ? `fib(${active.n})` : 'fib()', active: true,
        vars: active ? [
          { name: 'n',      value: active.n },
          { name: 'result', value: active.result ?? '...' },
          { name: 'depth',  value: active.depth },
        ] : [],
      })
    }

    return { stackFrames, heapObjects }
  }
}