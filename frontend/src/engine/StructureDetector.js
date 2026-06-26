/**
 * StructureDetector.js
 * Analyses an input value and selects the correct visualizer mode.
 */

export class StructureDetector {
  /**
   * Detect the structure type of a given value.
   * Returns a visualizerMode string matching useVisualizerStore modes.
   */
  static detect(value) {
    if (value === null || value === undefined) return 'unknown'

    // Explicit typed objects
    if (typeof value === 'object' && value.__type) {
      return StructureDetector._fromType(value.__type)
    }

    // Flat number array → sorting
    if (Array.isArray(value) && value.every(v => typeof v === 'number')) {
      return 'sorting'
    }

    // Array of arrays → matrix / DP
    if (Array.isArray(value) && value.every(v => Array.isArray(v))) {
      return 'dp'
    }

    // Object with children/left/right → tree
    if (typeof value === 'object' && ('left' in value || 'right' in value || 'children' in value)) {
      return 'tree'
    }

    // Object with next → linked list
    if (typeof value === 'object' && 'next' in value) {
      return 'linkedlist'
    }

    // Object with nodes + edges → graph
    if (typeof value === 'object' && 'nodes' in value && 'edges' in value) {
      return 'graph'
    }

    // Object with push/pop pattern (array + top pointer) → stack
    if (typeof value === 'object' && 'stack' in value) {
      return 'stack'
    }

    // Object with buckets → hashmap
    if (typeof value === 'object' && 'buckets' in value) {
      return 'hashmap'
    }

    // String → searching
    if (typeof value === 'string') return 'searching'

    return 'sorting'
  }

  static _fromType(t) {
    const map = {
      array:      'sorting',
      linkedlist: 'linkedlist',
      doublylinkedlist: 'linkedlist',
      tree:       'tree',
      bst:        'tree',
      graph:      'graph',
      stack:      'stack',
      queue:      'stack',
      hashmap:    'hashmap',
      dp:         'dp',
      recursion:  'recursion',
      pointer:    'pointer',
    }
    return map[t.toLowerCase()] || 'sorting'
  }

  /**
   * Given a visualizerMode, return the display name.
   */
  static label(mode) {
    const labels = {
      sorting:    'Sorting',
      searching:  'Searching',
      linkedlist: 'Linked List',
      tree:       'Tree / BST',
      graph:      'Graph',
      stack:      'Stack',
      hashmap:    'Hash Map',
      pointer:    'Pointers',
      recursion:  'Recursion',
      dp:         'Dynamic Programming',
    }
    return labels[mode] || mode
  }

  /**
   * Return all known modes.
   */
  static allModes() {
    return ['sorting','searching','linkedlist','tree','graph','stack','hashmap','pointer','recursion','dp']
  }
}