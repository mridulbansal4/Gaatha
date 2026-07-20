import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { SEED_AUDIT } from '../data/audit.js'
import { track } from '../services/telemetry.js'

const StoreContext = createContext(null)

let auditSeq = 100

export function StoreProvider({ children }) {
  const [scope, setScope] = useState({ state: 'Maharashtra', district: null, block: null })
  const [audit, setAudit] = useState(SEED_AUDIT)
  const [decisions, setDecisions] = useState({}) // caseId -> decision record
  const [sattva, setSattva] = useState({ open: false, thread: [], caseId: null })
  const [toasts, setToasts] = useState([])

  const pushToast = useCallback((toast) => {
    const id = `t-${auditSeq++}`
    setToasts((t) => [...t, { id, ...toast }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const recordDecision = useCallback(
    ({ caseCase, action, amountFinal, conditions, note, overrideReason }) => {
      const rec = caseCase.recommended_action
      const aligned = action === rec.verb && amountFinal === rec.amount
      const now = new Date()
      const stamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`
      const entry = {
        id: `AUD-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(auditSeq++).padStart(4, '0')}`,
        timestamp: stamp,
        officer: 'Priya Deshmukh',
        case_id: caseCase.id,
        entity_name: caseCase.entity_name,
        ai_recommendation: `${rec.verb} ₹${(rec.amount / 100000).toFixed(1)}L (${caseCase.risk_band}, score ${caseCase.gaatha_score})`,
        human_decision: action,
        amount_final: amountFinal,
        ai_amount: rec.amount,
        conditions: conditions || [],
        override_reason: overrideReason || null,
        note: note || null,
        aligned,
      }
      setAudit((a) => [entry, ...a])
      setDecisions((d) => ({ ...d, [caseCase.id]: { ...entry, action } }))
      track('decision_made', { case_id: caseCase.id, action, amount_final: amountFinal, aligned })
      if (overrideReason) track('override_made', { case_id: caseCase.id, ai_amount: rec.amount, human_amount: amountFinal })
      pushToast({ kind: 'success', title: 'Decision recorded', body: `${action} - written to audit trail as ${entry.id}` })
      return entry
    },
    [pushToast],
  )

  const openSattva = useCallback((caseId = null, seedPrompt = null) => {
    setSattva((s) => ({ ...s, open: true, caseId: caseId ?? s.caseId, seedPrompt }))
    track('copilot_open', { case_id: caseId })
  }, [])
  const closeSattva = useCallback(() => setSattva((s) => ({ ...s, open: false })), [])
  const setThread = useCallback((updater) => setSattva((s) => ({ ...s, thread: typeof updater === 'function' ? updater(s.thread) : updater })), [])

  const value = useMemo(
    () => ({
      scope, setScope,
      audit, recordDecision,
      decisions,
      sattva, openSattva, closeSattva, setThread, setSattva,
      toasts, pushToast,
    }),
    [scope, audit, decisions, sattva, toasts, recordDecision, openSattva, closeSattva, setThread, pushToast],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
