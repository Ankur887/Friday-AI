// CodeAlgorithmDetector.js
// Detects algorithm type by analysing CODE STRUCTURE, not just keywords.
// Priority: structural signals >> keyword signals
// Returns { type, subtype, confidence, language, keywords, pointers }

export default class CodeAlgorithmDetector {

  static detect(code) {
    if (!code || !code.trim()) {
      return { type: 'sorting', subtype: 'bubble', confidence: 0.1, language: 'javascript', keywords: [], pointers: [] };
    }

    const src = code.toLowerCase();
    const lines = code.split('\n').map(l => l.trim()).filter(Boolean);

    // ── structural signals ──────────────────────────────────────────────────
    const sig = {
      // loops
      hasForLoop:       /\bfor\s*\(/.test(src),
      hasWhileLoop:     /\bwhile\s*\(/.test(src),
      loopCount:        (src.match(/\bfor\s*\(/g) || []).length,
      nestedFor:        /for\s*\([^)]*\)[^{]*\{[^}]*for\s*\(/.test(src),

      // swap: classic temp swap OR destructuring swap
      hasSwap:          /\btemp\b/.test(src) ||
                        /\[.*\]\s*=\s*\[.*\]/.test(src) ||
                        /arr\[.*\]\s*=\s*arr\[.*\]/.test(src),

      // return -1 / return false patterns (search)
      returnsMinusOne:  /return\s+-1/.test(src),
      returnsIndex:     /return\s+\w*(i|idx|index|mid|lo|hi)\w*\s*[;,)]/.test(src),

      // binary search signals: lo/hi/mid variables
      hasMid:           /\bmid\b/.test(src),
      hasLoHi:          /\blo\b/.test(src) && /\bhi\b/.test(src),
      hasMidCalc:       /mid\s*=\s*.*\(.*lo.*hi|mid\s*=\s*.*\(.*left.*right|mid\s*=\s*.*\(.*start.*end/.test(src),

      // linear search signals: simple loop with equality check
      hasEqualityCheck: /===\s*target|==\s*target|target\s*===|target\s*==/.test(src) ||
                        /arr\[.*\]\s*[=!]=/.test(src),
      hasReturnI:       /return\s+i\b/.test(src),

      // recursion signals
      hasSelfCall:      CodeAlgorithmDetector._hasSelfCall(code),
      hasBaseCase:      /if\s*\(.*[<=!]=.*[01]/.test(src) || /if\s*\(n\s*[<=]=\s*1/.test(src),

      // graph signals
      hasQueue:         /queue|deque|\bq\b/.test(src),
      hasStack:         /\bstack\b/.test(src) && !/stack overflow/i.test(src),
      hasVisited:       /visited|seen/.test(src),
      hasAdjacency:     /adj|graph\[|edges|neighbors/.test(src),

      // tree signals
      hasNodeClass:     /class\s+\w*node|treenode|\.left\b|\.right\b/.test(src),
      hasBSTInsert:     /insert|\.left\s*=|\.right\s*=/.test(src),

      // linked list
      hasNext:          /\.next\b/.test(src) && !/nextstep|nextindex/i.test(src),
      hasHead:          /\bhead\b/.test(src),

      // dp signals
      hasDPTable:       /dp\[/.test(src),
      has2DDP:          /dp\[i\]\[j\]/.test(src),

      // hashmap
      hasHashMap:       /hashmap|hashtable|\.set\(|\.get\(|map\s*=\s*new\s*map/i.test(src),

      // pivot (quicksort/partition)
      hasPivot:         /\bpivot\b/.test(src),

      // merge signal
      hasMerge:         /\bmerge\b/.test(src) || /left\s*=.*slice|right\s*=.*slice/.test(src),

      // target parameter (search)
      hasTarget:        /\btarget\b/.test(src) || /\bkey\b/.test(src),
    };

    // ── scoring ─────────────────────────────────────────────────────────────
    const scores = {
      'searching:binary':   0,
      'searching:linear':   0,
      'sorting:bubble':     0,
      'sorting:quick':      0,
      'sorting:merge':      0,
      'sorting:insertion':  0,
      'sorting:selection':  0,
      'recursion:fibonacci':0,
      'recursion:factorial':0,
      'recursion:hanoi':    0,
      'graph:bfs':          0,
      'graph:dfs':          0,
      'graph:dijkstra':     0,
      'tree:bst':           0,
      'linkedlist:singly':  0,
      'stack:lifo':         0,
      'hashmap:open':       0,
      'dp:lcs':             0,
      'dp:knapsack':        0,
    };

    // ── BINARY SEARCH ────────────────────────────────────────────────────────
    if (sig.hasMid)           scores['searching:binary'] += 30;
    if (sig.hasLoHi)          scores['searching:binary'] += 30;
    if (sig.hasMidCalc)       scores['searching:binary'] += 25;
    if (sig.hasTarget)        scores['searching:binary'] += 10;
    if (sig.returnsMinusOne)  scores['searching:binary'] += 15;
    if (sig.hasWhileLoop)     scores['searching:binary'] += 5;

    // ── LINEAR SEARCH ────────────────────────────────────────────────────────
    if (sig.hasEqualityCheck && sig.hasTarget) scores['searching:linear'] += 40;
    if (sig.returnsMinusOne)                   scores['searching:linear'] += 20;
    if (sig.hasReturnI)                        scores['searching:linear'] += 20;
    if (sig.hasForLoop && sig.loopCount === 1) scores['searching:linear'] += 10;
    if (!sig.hasSwap)                          scores['searching:linear'] += 5;
    if (!sig.hasMid && !sig.hasLoHi)           scores['searching:linear'] += 15;

    // linear search PENALTY if binary signals present
    if (sig.hasMid || sig.hasLoHi) scores['searching:linear'] -= 30;

    // ── BUBBLE SORT ──────────────────────────────────────────────────────────
    if (sig.nestedFor)        scores['sorting:bubble'] += 30;
    if (sig.hasSwap)          scores['sorting:bubble'] += 25;
    if (!sig.hasTarget)       scores['sorting:bubble'] += 10;
    if (sig.loopCount >= 2)   scores['sorting:bubble'] += 10;
    // penalise if search signals present
    if (sig.returnsMinusOne || sig.hasTarget) scores['sorting:bubble'] -= 25;

    // ── QUICK SORT ───────────────────────────────────────────────────────────
    if (sig.hasPivot)         scores['sorting:quick'] += 40;
    if (sig.hasSwap)          scores['sorting:quick'] += 15;
    if (sig.hasSelfCall)      scores['sorting:quick'] += 10;

    // ── MERGE SORT ───────────────────────────────────────────────────────────
    if (sig.hasMerge)         scores['sorting:merge'] += 35;
    if (sig.hasSelfCall)      scores['sorting:merge'] += 20;

    // ── INSERTION SORT ───────────────────────────────────────────────────────
    if (/\bkey\b/.test(src) && sig.nestedFor && sig.hasSwap) scores['sorting:insertion'] += 40;
    if (/while.*j\s*>=\s*0/.test(src))                       scores['sorting:insertion'] += 20;

    // ── SELECTION SORT ───────────────────────────────────────────────────────
    if (/min.?idx|min.?index|min_idx/.test(src) && sig.nestedFor) scores['sorting:selection'] += 50;

    // ── FIBONACCI ────────────────────────────────────────────────────────────
    if (/fib\s*\(.*n\s*-\s*1|fib\s*\(.*n\s*-\s*2/.test(src)) scores['recursion:fibonacci'] += 60;
    if (sig.hasSelfCall && sig.hasBaseCase)                    scores['recursion:fibonacci'] += 20;

    // ── FACTORIAL ────────────────────────────────────────────────────────────
    if (/factorial|fact\s*\(.*n\s*-\s*1/.test(src)) scores['recursion:factorial'] += 60;

    // ── HANOI ────────────────────────────────────────────────────────────────
    if (/hanoi/.test(src)) scores['recursion:hanoi'] += 80;

    // ── BFS ──────────────────────────────────────────────────────────────────
    if (sig.hasQueue && sig.hasVisited)  scores['graph:bfs'] += 50;
    if (sig.hasAdjacency)               scores['graph:bfs'] += 20;
    if (/\.shift\(\)|dequeue/.test(src)) scores['graph:bfs'] += 15;

    // ── DFS ──────────────────────────────────────────────────────────────────
    if (sig.hasStack && sig.hasVisited && !sig.hasQueue)  scores['graph:dfs'] += 40;
    if (sig.hasSelfCall && sig.hasVisited)                scores['graph:dfs'] += 30;
    if (sig.hasAdjacency)                                 scores['graph:dfs'] += 20;

    // ── DIJKSTRA ─────────────────────────────────────────────────────────────
    if (/dist\[|distance\[/.test(src) && sig.hasAdjacency) scores['graph:dijkstra'] += 60;

    // ── BST ──────────────────────────────────────────────────────────────────
    if (sig.hasNodeClass && sig.hasBSTInsert) scores['tree:bst'] += 50;
    if (/\.left\b/.test(src) && /\.right\b/.test(src)) scores['tree:bst'] += 25;

    // ── LINKED LIST ──────────────────────────────────────────────────────────
    if (sig.hasNext && sig.hasHead) scores['linkedlist:singly'] += 60;
    if (/\.next\s*=/.test(src))     scores['linkedlist:singly'] += 20;

    // ── STACK ────────────────────────────────────────────────────────────────
    if (sig.hasStack && /\.push\(|\.pop\(/.test(src) && !sig.hasAdjacency) scores['stack:lifo'] += 50;

    // ── HASHMAP ──────────────────────────────────────────────────────────────
    if (sig.hasHashMap) scores['hashmap:open'] += 70;

    // ── DP ───────────────────────────────────────────────────────────────────
    if (sig.has2DDP)  scores['dp:lcs'] += 40;
    if (sig.hasDPTable && /weight|capacity|knapsack/.test(src)) scores['dp:knapsack'] += 60;
    if (sig.hasDPTable && /lis|longest.*increasing/.test(src))  scores['dp:lcs'] += 30;

    // ── pick winner ──────────────────────────────────────────────────────────
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    const [typeSubtype, topScore] = best;
    const [type, subtype] = typeSubtype.split(':');

    const confidence = Math.min(topScore / 100, 1.0);

    // collect keywords that fired
    const keywords = [];
    if (sig.hasMid)           keywords.push('mid');
    if (sig.hasLoHi)          keywords.push('lo/hi');
    if (sig.hasTarget)        keywords.push('target');
    if (sig.hasSwap)          keywords.push('swap');
    if (sig.nestedFor)        keywords.push('nested-loop');
    if (sig.hasSelfCall)      keywords.push('recursion');
    if (sig.hasQueue)         keywords.push('queue');
    if (sig.hasVisited)       keywords.push('visited');
    if (sig.hasMidCalc)       keywords.push('mid-calculation');
    if (sig.returnsMinusOne)  keywords.push('return -1');

    return {
      type,
      subtype,
      confidence,
      language: CodeAlgorithmDetector._detectLanguage(code),
      keywords,
      pointers: [],
      scores, // expose for debugging
    };
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  // Check if a function calls itself (recursion) — extracts function name then
  // checks if it appears in the body
  static _hasSelfCall(code) {
    const fnMatch = code.match(/function\s+(\w+)\s*\(/) ||
                    code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(.*\)\s*=>)/);
    if (!fnMatch) return false;
    const name = fnMatch[1];
    // Count occurrences: one is the declaration, 2+ means self-call
    const occurrences = (code.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length;
    return occurrences >= 2;
  }

  static _detectLanguage(code) {
    if (/def\s+\w+\s*\(/.test(code))   return 'python';
    if (/public\s+\w+\s+\w+\s*\(/.test(code)) return 'java';
    return 'javascript';
  }
}