// Mock telemetry - logs analytics events to console for the "we measure everything" story.
const buffer = []

export function track(event, payload = {}) {
  const entry = { event, ...payload, at: new Date().toISOString() }
  buffer.push(entry)
  // eslint-disable-next-line no-console
  console.log(`%c[ArthSetu·telemetry] ${event}`, 'color:#3b82f6;font-weight:600', payload)
  return entry
}

export function getEvents() { return [...buffer] }
