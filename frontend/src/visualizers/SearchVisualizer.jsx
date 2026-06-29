import { motion, AnimatePresence } from 'framer-motion'
import useVisualizerStore from '../store/useVisualizerStore'

// ── colour tokens ─────────────────────────────────────────────────────────────
const C = {
  default:  { bg:'#1e3a5f', border:'#2d5a8e', text:'#e2e8f0' },
  visited:  { bg:'#1e293b', border:'#334155', text:'#475569'  },
  active:   { bg:'#92400e', border:'#f59e0b', text:'#fff'     },
  found:    { bg:'#064e3b', border:'#22c55e', text:'#fff'     },
  notfound: { bg:'#450a0a', border:'#7f1d1d', text:'#fca5a5'  },
  lo:       { bg:'#1e3a8a', border:'#3b82f6', text:'#fff'     },
  hi:       { bg:'#881337', border:'#f43f5e', text:'#fff'     },
  mid:      { bg:'#78350f', border:'#fbbf24', text:'#fff'     },
  inRange:  { bg:'#172554', border:'#3b82f6', text:'#bfdbfe'  },
  outRange: { bg:'#0f172a', border:'#1e2d45', text:'#334155'  },
  left:     { bg:'#064e3b', border:'#10b981', text:'#fff'     },
  right:    { bg:'#3b0764', border:'#a78bfa', text:'#fff'     },
}

function Cell({ value, colorKey, size }) {
  const c = C[colorKey] || C.default
  const pop = ['active','mid','lo','hi','left','right','found'].includes(colorKey)
  return (
    <motion.div
      layout
      animate={{ backgroundColor:c.bg, borderColor:c.border, color:c.text, scale: pop ? 1.1 : 1 }}
      transition={{ duration:0.22 }}
      style={{
        width:size, height:size, border:'2px solid', borderRadius:8, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'JetBrains Mono',monospace",
        fontSize: size <= 34 ? 11 : size <= 44 ? 13 : 16,
        fontWeight:700, userSelect:'none',
      }}
    >
      {value}
    </motion.div>
  )
}

function Ptr({ label, color, size }) {
  return (
    <motion.div
      initial={{ opacity:0, y:-5 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0, y:-5 }}
      transition={{ duration:0.2 }}
      style={{ width:size, display:'flex', flexDirection:'column', alignItems:'center', gap:1, flexShrink:0 }}
    >
      <span style={{ color, fontSize:15, lineHeight:1 }}>↑</span>
      <span style={{ color, fontSize:10, fontWeight:700, fontFamily:'monospace', whiteSpace:'nowrap' }}>{label}</span>
    </motion.div>
  )
}

function Stat({ label, value, color='#e2e8f0' }) {
  return (
    <div style={{ background:'#0f172a', border:'1px solid #1e3a5f', borderRadius:8, padding:'7px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:76 }}>
      <span style={{ color:'#64748b', fontSize:10, fontFamily:'monospace' }}>{label}</span>
      <span style={{ color, fontSize:18, fontWeight:700, fontFamily:'monospace' }}>{value ?? '—'}</span>
    </div>
  )
}

function ResultBanner({ found, target, index }) {
  if (found === undefined || found === -1) return null
  const ok = found >= 0
  return (
    <motion.div
      initial={{ opacity:0, scale:0.92 }}
      animate={{ opacity:1, scale:1 }}
      style={{
        padding:'10px 28px', borderRadius:12,
        background: ok ? 'rgba(6,78,59,0.6)' : 'rgba(69,10,10,0.6)',
        border:`1px solid ${ok ? '#22c55e' : '#ef4444'}`,
        color: ok ? '#4ade80' : '#f87171',
        fontFamily:'monospace', fontWeight:700, fontSize:15,
      }}
    >
      {ok ? `✓  Found ${target} at index ${index}` : `✗  ${target} not found`}
    </motion.div>
  )
}

// shared array + pointer row + index row
function ArrayRow({ array, size, getColorKey, ptrsAt={} }) {
  return (
    <div style={{ overflowX:'auto', width:'100%', display:'flex', justifyContent:'center', paddingBottom:4 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {/* cells */}
        <div style={{ display:'flex', gap:5 }}>
          {array.map((v,i) => <Cell key={i} value={v} colorKey={getColorKey(i)} size={size} />)}
        </div>
        {/* pointer row */}
        <div style={{ display:'flex', gap:5, marginTop:4 }}>
          {array.map((_,i) => {
            const ptrs = ptrsAt[i]
            return (
              <div key={i} style={{ width:size, flexShrink:0, minHeight:36, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start' }}>
                <AnimatePresence>
                  {ptrs && ptrs.map(({ label, color }) => (
                    <Ptr key={label} label={label} color={color} size={size} />
                  ))}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
        {/* index numbers */}
        <div style={{ display:'flex', gap:5 }}>
          {array.map((_,i) => (
            <div key={i} style={{ width:size, flexShrink:0, textAlign:'center', color:'#2d3f55', fontSize:9, fontFamily:'monospace', marginTop:2 }}>{i}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LINEAR SEARCH
// ─────────────────────────────────────────────────────────────────────────────
function LinearSearch({ step }) {
  const { array=[], current, found=-1, target, visited=[], comparisons=0, message='' } = step
  const n    = array.length
  const size = n <= 12 ? 56 : n <= 20 ? 44 : n <= 30 ? 34 : 26

  const getColorKey = (i) => {
    if (found >= 0 && i === current) return 'found'
    if (found === -2 && visited.includes(i)) return 'notfound'
    if (i === current) return 'active'
    if (visited.includes(i)) return 'visited'
    return 'default'
  }

  // single pointer arrow under the active index
  const ptrsAt = {}
  if (current >= 0 && current < n) {
    if (found >= 0) {
      ptrsAt[current] = [{ label:'found!', color:'#22c55e' }]
    } else if (found !== -2) {
      ptrsAt[current] = [{ label:`i = ${current}`, color:'#f59e0b' }]
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28, width:'100%' }}>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
        <Stat label="TARGET"      value={target}                        color="#f59e0b" />
        <Stat label="INDEX  i"    value={current >= 0 ? current : '—'}  color="#fbbf24" />
        <Stat label="COMPARISONS" value={comparisons}                    color="#94a3b8" />
        <Stat label="SIZE"        value={n}                              color="#60a5fa" />
      </div>

      <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
        {[
          { label:'current (i)', color:'#f59e0b' },
          { label:'visited',     color:'#334155' },
          { label:'found',       color:'#22c55e' },
          { label:'not found',   color:'#7f1d1d' },
          { label:'unvisited',   color:'#2d5a8e' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:color }} />
            <span style={{ color:'#64748b', fontSize:11, fontFamily:'monospace' }}>{label}</span>
          </div>
        ))}
      </div>

      <ArrayRow array={array} size={size} getColorKey={getColorKey} ptrsAt={ptrsAt} />
      <ResultBanner found={found} target={target} index={current} />

      {message && (
        <div style={{ color:'#94a3b8', fontSize:13, fontFamily:'monospace', textAlign:'center', maxWidth:520, padding:'8px 16px', background:'#0f172a', borderRadius:8, border:'1px solid #1e293b' }}>
          {message}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BINARY SEARCH
// ─────────────────────────────────────────────────────────────────────────────
function BinarySearch({ step }) {
  const { array=[], lo, hi, mid, found=-1, target, comparisons=0, message='' } = step
  const n    = array.length
  const size = n <= 12 ? 56 : n <= 20 ? 44 : n <= 30 ? 34 : 26

  const getColorKey = (i) => {
    if (found >= 0 && i === mid) return 'found'
    if (found === -2)            return 'outRange'
    if (i === mid)               return 'mid'
    if (i === lo && lo === hi)   return 'mid'
    if (i === lo)                return 'lo'
    if (i === hi)                return 'hi'
    if (lo !== undefined && hi !== undefined && i >= lo && i <= hi) return 'inRange'
    return 'outRange'
  }

  const ptrsAt = {}
  const addPtr = (idx, label, color) => {
    if (idx === undefined || idx < 0 || idx >= n) return
    if (!ptrsAt[idx]) ptrsAt[idx] = []
    if (!ptrsAt[idx].find(p => p.label === label)) ptrsAt[idx].push({ label, color })
  }

  if (found >= 0) {
    addPtr(mid, 'found!', '#22c55e')
  } else if (found !== -2) {
    addPtr(lo,  'lo',  '#3b82f6')
    addPtr(hi,  'hi',  '#f43f5e')
    addPtr(mid, 'mid', '#fbbf24')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28, width:'100%' }}>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
        <Stat label="TARGET"      value={target}      color="#f59e0b" />
        <Stat label="LO"          value={lo ?? '—'}   color="#3b82f6" />
        <Stat label="MID"         value={mid ?? '—'}  color="#fbbf24" />
        <Stat label="HI"          value={hi ?? '—'}   color="#f43f5e" />
        <Stat label="COMPARISONS" value={comparisons} color="#94a3b8" />
      </div>

      <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
        {[
          { label:'lo',           color:'#3b82f6' },
          { label:'mid',          color:'#fbbf24' },
          { label:'hi',           color:'#f43f5e' },
          { label:'search range', color:'#172554', border:'#3b82f6' },
          { label:'out of range', color:'#0f172a', border:'#1e2d45' },
        ].map(({ label, color, border }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:12, height:12, borderRadius:3, background:color, border:`1px solid ${border||color}` }} />
            <span style={{ color:'#64748b', fontSize:11, fontFamily:'monospace' }}>{label}</span>
          </div>
        ))}
      </div>

      <ArrayRow array={array} size={size} getColorKey={getColorKey} ptrsAt={ptrsAt} />
      <ResultBanner found={found} target={target} index={mid} />

      {message && (
        <div style={{ color:'#94a3b8', fontSize:13, fontFamily:'monospace', textAlign:'center', maxWidth:560, padding:'8px 16px', background:'#0f172a', borderRadius:8, border:'1px solid #1e293b' }}>
          {message}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT — detection based on algorithm key, not step shape
// ─────────────────────────────────────────────────────────────────────────────
export default function SearchVisualizer() {
  const steps          = useVisualizerStore(s => s.steps)
  const currentStep    = useVisualizerStore(s => s.currentStep)
  const activeAlgorithm = useVisualizerStore(s => s.activeAlgorithm)
  const step = steps[currentStep] || {}

  // ── FIXED: detect by algorithm key first, fall back to step shape ──────────
  const isBinary = activeAlgorithm === 'binarySearch'
    || (activeAlgorithm !== 'linearSearch' && (
         typeof step.lo === 'number' || typeof step.hi === 'number'
       ))

  const label = isBinary ? 'Binary Search' : 'Linear Search'

  if (!steps.length) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, color:'#475569' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p style={{ fontSize:14 }}>Select an algorithm and press <span style={{ color:'#38bdf8', fontWeight:700 }}>Visualize</span></p>
      </div>
    )
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 20px', gap:20, overflowY:'auto' }}>
      {/* mode badge */}
      <div style={{ background:'#0f172a', border:'1px solid #1e3a5f', borderRadius:20, padding:'4px 18px', color:'#3b82f6', fontSize:12, fontWeight:700, fontFamily:'monospace', letterSpacing:'0.08em', textTransform:'uppercase' }}>
        {label}
      </div>

      {isBinary
        ? <BinarySearch step={step} />
        : <LinearSearch step={step} />
      }
    </div>
  )
}