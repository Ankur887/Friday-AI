/**
 * EventRecorder.js
 * Lightweight event bus used by the execution engine to record
 * every significant moment during algorithm execution so the
 * Timeline can replay them in order.
 */

export class EventRecorder {
  constructor() {
    this.events  = []
    this.current = 0
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  record(type, payload = {}) {
    this.events.push({
      id:        this.events.length,
      type,      // 'compare' | 'swap' | 'visit' | 'assign' | 'push' | 'pop' | 'found' | 'info'
      payload,
      timestamp: Date.now(),
    })
  }

  compare(a, b, indices)     { this.record('compare', { a, b, indices }) }
  swap(i, j, array)          { this.record('swap',    { i, j, array: [...array] }) }
  visit(node, extra = {})    { this.record('visit',   { node, ...extra }) }
  assign(name, value)        { this.record('assign',  { name, value }) }
  push(value, stack)         { this.record('push',    { value, stack: [...stack] }) }
  pop(value, stack)          { this.record('pop',     { value, stack: [...stack] }) }
  found(target, index)       { this.record('found',   { target, index }) }
  info(message, extra = {})  { this.record('info',    { message, ...extra }) }

  // ── Playback ──────────────────────────────────────────────────────────────
  reset()              { this.current = 0 }
  hasNext()            { return this.current < this.events.length }
  next()               { return this.events[this.current++] || null }
  getAll()             { return this.events }
  getAt(idx)           { return this.events[idx] || null }
  count()              { return this.events.length }

  // ── Filtering ─────────────────────────────────────────────────────────────
  getByType(type)      { return this.events.filter(e => e.type === type) }

  // ── Serialization ─────────────────────────────────────────────────────────
  toJSON()             { return JSON.stringify(this.events, null, 2) }

  static fromJSON(json) {
    const rec = new EventRecorder()
    rec.events = JSON.parse(json)
    return rec
  }
}