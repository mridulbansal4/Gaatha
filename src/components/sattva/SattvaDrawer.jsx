import { useEffect, useRef, useState } from 'react'
import './sattva.css'
import { useStore } from '../../state/store.jsx'
import { askSattva } from '../../services/ai.js'
import { caseById } from '../../data/cases.js'
import { SUGGESTED_PROMPTS } from '../../data/knowledge.js'
import { Icon } from '../ui/icons.jsx'
import { SattvaAnswer } from './SattvaAnswer.jsx'
import { track } from '../../services/telemetry.js'

export function SattvaDrawer() {
  const { sattva, closeSattva, setThread, setSattva, pushToast } = useStore()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef(null)
  const activeCase = sattva.caseId ? caseById(sattva.caseId) : null

  useEffect(() => {
    if (sattva.open && sattva.seedPrompt) {
      send(sattva.seedPrompt)
      setSattva((s) => ({ ...s, seedPrompt: null }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sattva.open, sattva.seedPrompt])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [sattva.thread, busy])

  async function send(text) {
    const q = (text || '').trim()
    if (!q || busy) return
    setThread((t) => [...t, { role: 'user', text: q }])
    setDraft('')
    setBusy(true)
    track('copilot_query', { query: q, case_id: sattva.caseId })
    const ans = await askSattva(q, { caseId: sattva.caseId })
    setThread((t) => [...t, { role: 'ai', answer: ans }])
    setBusy(false)
  }

  if (!sattva.open) return null

  return (
    <>
      <div className="drawer-scrim" onClick={closeSattva} />
      <div className="drawer" role="dialog" aria-label="Sattva copilot">
        <div className="sattva-head">
          <div className="sattva-brand"><Icon.spark width={16} height={16} style={{ color: 'white' }} /></div>
          <div style={{ flex: 1 }}>
            <div className="title-sm">Sattva</div>
            <div className="caption" style={{ fontSize: 11 }}>Explainable credit copilot</div>
          </div>
          <button className="icon-btn" onClick={closeSattva} aria-label="Close"><Icon.close width={18} height={18} /></button>
        </div>

        <div className="sattva-body" ref={bodyRef}>
          {activeCase && (
            <div className="sattva-context">
              <Icon.appraisal width={14} height={14} />
              Context: {activeCase.id} · {activeCase.entity_name}
            </div>
          )}

          {sattva.thread.length === 0 && (
            <div className="col gap-md">
              <div className="body-sm text-muted">
                I answer from NABARD scheme masters, the case ledger and policy knowledge - every answer carries its evidence, confidence and whether a human should review. Try:
              </div>
              <div className="col gap-xs">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button key={p} className="prompt-chip" onClick={() => send(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {sattva.thread.map((m, i) =>
            m.role === 'user' ? (
              <div className="msg-user" key={i}>{m.text}</div>
            ) : (
              <div className="msg-ai" key={i}>
                <SattvaAnswer answer={m.answer} onSource={(s) => pushToast({ kind: 'info', title: s.title, body: s.authority })} />
              </div>
            ),
          )}

          {busy && (
            <div className="msg-ai">
              <div className="answer-card"><div className="thinking"><span /><span /><span /></div></div>
            </div>
          )}
        </div>

        <div className="sattva-foot">
          <form
            className="sattva-input-row"
            onSubmit={(e) => { e.preventDefault(); send(draft) }}
          >
            <textarea
              className="sattva-input"
              rows={1}
              value={draft}
              placeholder="Ask about this case, a scheme, or policy…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) } }}
            />
            <button className="sattva-send" disabled={!draft.trim() || busy} aria-label="Send"><Icon.send width={17} height={17} /></button>
          </form>
        </div>
      </div>
    </>
  )
}
