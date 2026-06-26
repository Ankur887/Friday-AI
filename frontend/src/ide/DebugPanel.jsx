// File: src/ide/DebugPanel.jsx
// Premium AI debugger — dry-runs code step by step, detects bugs, suggests & applies fixes
// New: accepts autoAnalyze prop (increments trigger auto dry-run), onToggleExpand, expanded

import React, { useState, useRef, useEffect, useCallback } from 'react'

const getLanguage = (name = '') => {
  const ext = name.toLowerCase().split('.').pop()
  const MAP = {
    py:'python', js:'javascript', jsx:'javascript', ts:'typescript', tsx:'typescript',
    go:'go', rs:'rust', java:'java', cs:'csharp', cpp:'cpp', c:'c',
    rb:'ruby', php:'php', swift:'swift', kt:'kotlin', sh:'shell', bash:'shell',
  }
  return MAP[ext] || 'plaintext'
}

const C = {
  bg:        '#010409',
  surface:   '#0d1117',
  border:    '#21262d',
  border2:   '#30363d',
  text:      '#e6edf3',
  muted:     '#8b949e',
  dim:       '#4b5563',
  accent:    '#f97316',
  accentLo:  'rgba(249,115,22,0.12)',
  green:     '#22c55e',
  greenLo:   'rgba(34,197,94,0.12)',
  red:       '#f87171',
  redLo:     'rgba(248,113,113,0.12)',
  yellow:    '#fbbf24',
  yellowLo:  'rgba(251,191,36,0.12)',
  blue:      '#60a5fa',
  blueLo:    'rgba(96,165,250,0.12)',
  purple:    '#a78bfa',
  purpleLo:  'rgba(167,139,250,0.12)',
  cyan:      '#22d3ee',
  cyanLo:    'rgba(34,211,238,0.10)',
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '2px 6px',
      borderRadius: 4, background: bg, color, border: `1px solid ${color}44`,
      fontFamily: 'monospace',
    }}>
      {label}
    </span>
  )
}

function StepCard({ step, index, isActive, onClick }) {
  const statusColor = { ok: C.green, warning: C.yellow, error: C.red, info: C.blue }[step.status] || C.muted
  const statusBg    = { ok: C.greenLo, warning: C.yellowLo, error: C.redLo, info: C.blueLo }[step.status] || 'transparent'
  return (
    <div onClick={onClick} style={{ margin:'0 0 4px', borderRadius:8, border:`1px solid ${isActive ? statusColor : C.border}`, background:isActive ? statusBg : C.surface, cursor:'pointer', transition:'all 0.15s', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px' }}>
        <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, background:isActive ? statusColor : C.border2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:isActive ? '#000' : C.muted, fontFamily:'monospace' }}>
          {index + 1}
        </div>
        {step.line && (
          <span style={{ fontSize:10, fontFamily:'monospace', color:C.accent, background:C.accentLo, padding:'1px 5px', borderRadius:4, flexShrink:0 }}>L{step.line}</span>
        )}
        <span style={{ fontSize:12, color:C.text, fontWeight:500, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{step.title}</span>
        <Badge label={step.status} color={statusColor} bg={statusBg} />
      </div>
      {isActive && (
        <div style={{ padding:'0 10px 10px', borderTop:`1px solid ${C.border}` }}>
          <p style={{ margin:'8px 0 0', fontSize:12, color:C.muted, lineHeight:1.65, fontFamily:'monospace' }}>{step.description}</p>
          {step.vars && Object.keys(step.vars).length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', color:C.dim, textTransform:'uppercase', marginBottom:4 }}>Variables</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(step.vars).map(([k, v]) => (
                  <div key={k} style={{ fontSize:11, fontFamily:'monospace', padding:'2px 7px', borderRadius:4, background:C.purpleLo, border:`1px solid ${C.purple}44`, color:C.purple }}>
                    <span style={{ color:C.muted }}>{k}</span>
                    <span style={{ color:C.dim }}> = </span>
                    <span style={{ color:C.cyan }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step.output && (
            <pre style={{ margin:'8px 0 0', padding:'7px 10px', borderRadius:6, background:'#010409', border:`1px solid ${C.border}`, fontSize:11, color:C.green, fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-all', maxHeight:120, overflowY:'auto' }}>
              {step.output}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function BugCard({ bug, onApplyFix, applying }) {
  const [expanded, setExpanded] = useState(false)
  const sevColor = { critical:C.red, high:C.red, medium:C.yellow, low:C.blue, info:C.muted }[bug.severity] || C.muted
  const sevBg    = { critical:C.redLo, high:C.redLo, medium:C.yellowLo, low:C.blueLo, info:'transparent' }[bug.severity] || 'transparent'
  return (
    <div style={{ marginBottom:8, borderRadius:8, border:`1px solid ${sevColor}55`, background:C.surface, overflow:'hidden' }}>
      <div onClick={() => setExpanded(v => !v)} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'9px 12px', cursor:'pointer' }}>
        <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>
          {{ critical:'🔴', high:'🟠', medium:'🟡', low:'🔵', info:'ℹ️' }[bug.severity] || '⚠️'}
        </span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{bug.title}</span>
            <Badge label={bug.severity} color={sevColor} bg={sevBg} />
            {bug.line && <span style={{ fontSize:10, color:C.accent, fontFamily:'monospace', background:C.accentLo, padding:'1px 5px', borderRadius:4 }}>Line {bug.line}</span>}
            {bug.type && <span style={{ fontSize:10, color:C.purple, fontFamily:'monospace' }}>{bug.type}</span>}
          </div>
          <p style={{ margin:'3px 0 0', fontSize:11, color:C.muted, lineHeight:1.55, fontFamily:'monospace' }}>{bug.description}</p>
        </div>
        <span style={{ color:C.dim, fontSize:11, flexShrink:0 }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ padding:'0 12px 12px', borderTop:`1px solid ${C.border}` }}>
          {bug.buggyCode && (
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:9, color:C.red, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>❌ Buggy Code</div>
              <pre style={{ margin:0, padding:'8px 10px', borderRadius:6, background:'#1a0a0a', border:`1px solid ${C.red}33`, fontSize:11.5, color:C.red, fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{bug.buggyCode}</pre>
            </div>
          )}
          {bug.fixedCode && (
            <div style={{ marginTop:8 }}>
              <div style={{ fontSize:9, color:C.green, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>✅ Fixed Code</div>
              <pre style={{ margin:0, padding:'8px 10px', borderRadius:6, background:'#0a1a0a', border:`1px solid ${C.green}33`, fontSize:11.5, color:C.green, fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{bug.fixedCode}</pre>
            </div>
          )}
          {bug.explanation && (
            <p style={{ margin:'8px 0 0', fontSize:11.5, color:C.muted, lineHeight:1.65, fontFamily:'monospace' }}>💡 {bug.explanation}</p>
          )}
          {bug.fullFixedFile && (
            <button onClick={() => onApplyFix(bug)} disabled={applying}
              style={{ marginTop:10, padding:'6px 14px', borderRadius:6, background:applying ? C.border2 : C.green, border:'none', color:applying ? C.muted : '#000', fontSize:12, fontWeight:700, cursor:applying ? 'not-allowed' : 'pointer', fontFamily:'monospace', display:'flex', alignItems:'center', gap:6 }}>
              {applying ? '⏳ Applying…' : '⚡ Apply Fix to File'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryBar({ result }) {
  if (!result) return null
  const items = [
    { label:'Steps traced', value:result.steps?.length || 0,  color:C.cyan   },
    { label:'Bugs found',   value:result.bugs?.length  || 0,  color:result.bugs?.length ? C.red : C.green },
    { label:'Complexity',   value:result.complexity    || '—', color:C.purple },
    { label:'Performance',  value:result.performance   || '—', color:C.yellow },
  ]
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', padding:'8px 12px', background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'5px 12px', borderRadius:7, background:C.bg, border:`1px solid ${C.border}`, minWidth:64 }}>
          <span style={{ fontSize:16, fontWeight:700, color, fontFamily:'monospace' }}>{value}</span>
          <span style={{ fontSize:9, color:C.dim, marginTop:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
        </div>
      ))}
      {result.verdict && (
        <div style={{ flex:1, display:'flex', alignItems:'center', padding:'5px 12px', borderRadius:7, background:result.hasBugs ? C.redLo : C.greenLo, border:`1px solid ${result.hasBugs ? C.red : C.green}44` }}>
          <span style={{ fontSize:12, color:result.hasBugs ? C.red : C.green, fontFamily:'monospace', fontWeight:600 }}>
            {result.hasBugs ? '🐛' : '✅'} {result.verdict}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// Props:
//   activeFile       — current open file { name, content, path }
//   onClose          — called when × is clicked
//   onApplyEdit      — (path, newCode) => void
//   autoAnalyze      — number; every time it increments a new dry-run starts automatically
//   onToggleExpand   — called when ⊞/⊟ is clicked
//   expanded         — bool, whether the panel is in full-height mode
export default function DebugPanel({ activeFile, onClose, onApplyEdit, autoAnalyze = 0, onToggleExpand, expanded = false }) {
  const [status,      setStatus]      = useState('idle')
  const [result,      setResult]      = useState(null)
  const [activeStep,  setActiveStep]  = useState(null)
  const [activeTab,   setActiveTab]   = useState('steps')
  const [applying,    setApplying]    = useState(false)
  const [progress,    setProgress]    = useState('')
  const [breakpoints, setBreakpoints] = useState([])
  const [bpInput,     setBpInput]     = useState('')
  const bottomRef = useRef(null)

  // Track the last autoAnalyze value we acted on so we only fire once per increment
  const lastAutoAnalyze = useRef(0)

  useEffect(() => {
    if (result) bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [result])

  const handleAnalyze = useCallback(async () => {
    if (!activeFile || status === 'analyzing') return
    setStatus('analyzing')
    setResult(null)
    setActiveStep(null)
    setProgress('Sending code to backend for deep analysis…')
    try {
      const lang = getLanguage(activeFile.name)
      setProgress('AI is dry-running your code step by step…')
      const response = await fetch('http://127.0.0.1:8000/debug-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code:        activeFile.content,
          filename:    activeFile.name,
          language:    lang,
          breakpoints: breakpoints,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${response.status}`)
      }
      setProgress('Parsing debug trace…')
      const parsed = await response.json()
      if (parsed.error) throw new Error(parsed.error)
      setResult(parsed)
      setActiveTab(parsed.hasBugs ? 'bugs' : 'steps')
      setStatus('done')
      setProgress('')
    } catch (err) {
      console.error('[DebugPanel]', err)
      setStatus('error')
      setProgress(`Analysis failed: ${err.message}`)
    }
  }, [activeFile, breakpoints, status])

  // Auto-analyze whenever the parent increments autoAnalyze
  useEffect(() => {
    if (autoAnalyze > 0 && autoAnalyze !== lastAutoAnalyze.current && activeFile) {
      lastAutoAnalyze.current = autoAnalyze
      handleAnalyze()
    }
  }, [autoAnalyze, activeFile, handleAnalyze])

  const handleApplyFix = useCallback(async (bug) => {
    if (!bug.fullFixedFile || !activeFile || !onApplyEdit) return
    setApplying(true)
    onApplyEdit(activeFile.path, bug.fullFixedFile)
    setTimeout(() => setApplying(false), 800)
  }, [activeFile, onApplyEdit])

  const handleApplyAllFixes = useCallback(() => {
    if (!result?.fullFixedFile || !activeFile || !onApplyEdit) return
    setApplying(true)
    onApplyEdit(activeFile.path, result.fullFixedFile)
    setTimeout(() => setApplying(false), 800)
  }, [result, activeFile, onApplyEdit])

  const addBreakpoint = () => {
    const lines = bpInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0)
    setBreakpoints(prev => [...new Set([...prev, ...lines])])
    setBpInput('')
  }

  const bugCount  = result?.bugs?.length  || 0
  const stepCount = result?.steps?.length || 0

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:C.bg, fontFamily:"'Segoe UI',system-ui,sans-serif", overflow:'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0, flexWrap:'wrap' }}>

        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:14 }}>🐛</span>
          <span style={{ fontSize:12, fontWeight:700, color:C.accent, textTransform:'uppercase', letterSpacing:'0.08em' }}>Debug</span>
          {activeFile && <span style={{ fontSize:10, color:C.dim, fontFamily:'monospace' }}>{activeFile.name}</span>}
        </div>

        {/* Breakpoints */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:10, color:C.dim }}>BP:</span>
          <input
            value={bpInput}
            onChange={e => setBpInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addBreakpoint()}
            placeholder="5,12"
            style={{ width:56, padding:'2px 6px', background:'#161b22', border:`1px solid ${C.border2}`, borderRadius:4, color:C.text, fontSize:11, outline:'none', fontFamily:'monospace' }}
          />
          <button onClick={addBreakpoint}
            style={{ padding:'2px 6px', background:'transparent', border:`1px solid ${C.border2}`, borderRadius:4, color:C.muted, fontSize:10, cursor:'pointer', fontFamily:'monospace' }}>
            +
          </button>
          {breakpoints.map(bp => (
            <span key={bp} onClick={() => setBreakpoints(prev => prev.filter(b => b !== bp))}
              style={{ fontSize:10, background:C.accent, color:'#fff', padding:'1px 5px', borderRadius:3, cursor:'pointer', fontFamily:'monospace' }} title="Click to remove">
              L{bp}
            </span>
          ))}
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!activeFile || status === 'analyzing'}
          style={{
            padding:'4px 14px', borderRadius:6,
            background: status === 'analyzing' ? C.border2 : C.accent,
            border:'none', color: status === 'analyzing' ? C.muted : '#fff',
            fontSize:12, fontWeight:700, cursor:(!activeFile || status === 'analyzing') ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', display:'flex', alignItems:'center', gap:5,
          }}
        >
          {status === 'analyzing' ? <><Spinner /> Analyzing…</> : '▶ Analyze'}
        </button>

        {/* Apply all fixes */}
        {result?.hasBugs && result?.fullFixedFile && (
          <button onClick={handleApplyAllFixes} disabled={applying}
            style={{ padding:'4px 12px', borderRadius:6, background:applying ? C.border2 : C.green, border:'none', color:applying ? C.muted : '#000', fontSize:12, fontWeight:700, cursor:applying ? 'not-allowed' : 'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
            {applying ? '⏳ Applying…' : `⚡ Apply All Fixes (${bugCount})`}
          </button>
        )}

        {/* Right controls: expand/collapse + close */}
        <div style={{ marginLeft:'auto', display:'flex', gap:4, alignItems:'center' }}>
          {/* Expand / collapse */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={expanded ? 'Restore panel size' : 'Expand to full height'}
              style={{ padding:'3px 8px', background:'transparent', border:`1px solid ${C.border}`, color:C.dim, borderRadius:4, fontSize:12, cursor:'pointer', lineHeight:1 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}
            >
              {expanded ? '⊟' : '⊞'}
            </button>
          )}
          {/* Close */}
          <button onClick={onClose}
            style={{ padding:'3px 8px', background:'transparent', border:`1px solid ${C.border}`, color:C.dim, borderRadius:4, fontSize:14, cursor:'pointer', lineHeight:1 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}>
            ×
          </button>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <SummaryBar result={result} />

      {/* ── Tabs ── */}
      {result && (
        <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.surface }}>
          {[
            { id:'steps',   label:`Trace (${stepCount})` },
            { id:'bugs',    label:`Bugs (${bugCount})`, alert:bugCount > 0 },
            { id:'summary', label:'Summary' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding:'7px 16px', border:'none', background:'transparent', borderBottom:`2px solid ${activeTab === tab.id ? C.accent : 'transparent'}`, color:activeTab === tab.id ? C.accent : C.muted, fontSize:12, fontWeight:activeTab === tab.id ? 700 : 400, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
              {tab.label}
              {tab.alert && <span style={{ width:6, height:6, borderRadius:'50%', background:C.red, display:'inline-block' }}/>}
            </button>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:'auto', padding:12, minHeight:0 }}>

        {status === 'idle' && !result && (
          <div style={{ textAlign:'center', padding:'32px 16px', color:C.dim }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🐛</div>
            <p style={{ fontSize:13, color:C.muted, margin:'0 0 6px', fontWeight:600 }}>
              {activeFile ? `Ready to debug ${activeFile.name}` : 'Open a file to debug'}
            </p>
            <p style={{ fontSize:11, color:C.dim, margin:0, fontFamily:'monospace' }}>
              Claude will dry-run your code step by step,<br/>trace all variables, and find every bug.
            </p>
            {activeFile && (
              <button onClick={handleAnalyze}
                style={{ marginTop:16, padding:'8px 20px', borderRadius:7, background:C.accent, border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                ▶ Start Deep Analysis
              </button>
            )}
          </div>
        )}

        {status === 'analyzing' && (
          <div style={{ textAlign:'center', padding:'32px 16px' }}>
            <div style={{ margin:'0 auto 12px', width:36, height:36 }}>
              <Spinner size={36} color={C.accent} />
            </div>
            <p style={{ fontSize:13, color:C.accent, fontWeight:700, fontFamily:'monospace', margin:'0 0 6px' }}>Analyzing…</p>
            <p style={{ fontSize:11, color:C.dim, fontFamily:'monospace', margin:0 }}>{progress}</p>
            <div style={{ marginTop:16, display:'flex', gap:4, justifyContent:'center' }}>
              {['Tracing execution', 'Checking logic', 'Hunting bugs', 'Verifying fixes'].map((label, i) => (
                <span key={label} style={{ fontSize:9, padding:'3px 7px', borderRadius:10, background:C.accentLo, color:C.accent, border:`1px solid ${C.accent}44`, fontFamily:'monospace', animation:`fadeIn 0.4s ${i*0.3}s both` }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding:16, borderRadius:8, background:C.redLo, border:`1px solid ${C.red}44` }}>
            <p style={{ margin:0, fontSize:12, color:C.red, fontFamily:'monospace' }}>{progress || 'Analysis failed. Check the console for details.'}</p>
            <button onClick={handleAnalyze} style={{ marginTop:10, padding:'5px 12px', borderRadius:5, background:C.red, border:'none', color:'#fff', fontSize:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>Retry</button>
          </div>
        )}

        {result && activeTab === 'steps' && (
          <div>
            {result.steps?.length === 0 && <p style={{ color:C.dim, fontSize:12, fontFamily:'monospace' }}>No execution steps traced.</p>}
            {result.steps?.map((step, i) => (
              <StepCard key={i} step={step} index={i} isActive={activeStep === i} onClick={() => setActiveStep(activeStep === i ? null : i)} />
            ))}
          </div>
        )}

        {result && activeTab === 'bugs' && (
          <div>
            {bugCount === 0 ? (
              <div style={{ textAlign:'center', padding:24 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
                <p style={{ color:C.green, fontSize:13, fontWeight:700, fontFamily:'monospace', margin:0 }}>No bugs found!</p>
                <p style={{ color:C.dim, fontSize:11, fontFamily:'monospace', marginTop:4 }}>Code looks clean.</p>
              </div>
            ) : (
              result.bugs.map((bug, i) => <BugCard key={i} bug={bug} onApplyFix={handleApplyFix} applying={applying} />)
            )}
          </div>
        )}

        {result && activeTab === 'summary' && (
          <div style={{ padding:4 }}>
            <div style={{ padding:'12px 14px', borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, marginBottom:12 }}>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', color:C.dim, textTransform:'uppercase', marginBottom:6 }}>Analysis Summary</div>
              <p style={{ margin:0, fontSize:12.5, color:C.muted, lineHeight:1.75, fontFamily:'monospace' }}>{result.summary}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { label:'Time Complexity', value:result.complexity,  icon:'⏱', color:C.purple },
                { label:'Performance',     value:result.performance, icon:'⚡', color:C.yellow },
                { label:'Language',        value:result.language,    icon:'🌐', color:C.blue   },
                { label:'Bug Count',       value:bugCount,           icon:'🐛', color:bugCount > 0 ? C.red : C.green },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ padding:'10px 12px', borderRadius:8, background:C.surface, border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:9, color:C.dim, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{icon} {label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color, fontFamily:'monospace' }}>{value ?? '—'}</div>
                </div>
              ))}
            </div>
            <button onClick={handleAnalyze}
              style={{ marginTop:14, width:'100%', padding:'8px', borderRadius:7, background:C.accentLo, border:`1px solid ${C.accent}44`, color:C.accent, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              🔄 Re-analyze
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }
        @keyframes spin    { to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}

function Spinner({ size = 14, color = '#fff' }) {
  return (
    <span style={{
      display:'inline-block', width:size, height:size,
      border:`2px solid ${color}33`, borderTopColor:color,
      borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0,
    }} />
  )
}