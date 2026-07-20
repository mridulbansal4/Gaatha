import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './appraisal.css'
import { useAsync } from '../lib/useAsync.js'
import { getCase } from '../services/api.js'
import { inr, inrFull, dateLabel, BAND_TONE } from '../lib/format.js'
import { Breadcrumb } from '../components/shell/PageHead.jsx'
import {
  Button, Badge, RiskBadge, TypeBadge, Confidence, Skeleton, ErrorState, EmptyState, Meter,
} from '../components/ui/index.jsx'
import { ScoreGauge, RepaymentBars, LineChart, FactorBar } from '../components/ui/charts.jsx'
import { Icon } from '../components/ui/icons.jsx'
import { useStore } from '../state/store.jsx'
import { track } from '../services/telemetry.js'

const DIR_CLASS = { '+': 'dir-pos', '−': 'dir-neg', '~': 'dir-neu' }

function ScoreBlock({ c }) {
  return (
    <div className="score-block">
      <div className="row between" style={{ marginBottom: 4 }}>
        <span className="caption" style={{ color: 'var(--on-dark-soft)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 11 }}>Gaatha Score</span>
        <span className="badge" style={{ background: 'var(--surface-dark-elevated)', color: 'var(--on-dark)' }}><span className="badge-dot" style={{ background: c.risk_band === 'Low' ? 'var(--success)' : c.risk_band === 'Watch' ? 'var(--warning)' : 'var(--error)' }} />{c.risk_band} risk</span>
      </div>
      <div className="row gap-lg" style={{ alignItems: 'center' }}>
        <div className="score-gauge-wrap">
          <ScoreGauge score={c.gaatha_score} band={c.risk_band} size={148} />
          <div className="score-gauge-center">
            <div>
              <div className="score-num">{c.gaatha_score}</div>
              <div className="caption" style={{ color: 'var(--on-dark-soft)', fontSize: 11 }}>of 100</div>
            </div>
          </div>
        </div>
        <div className="grow">
          <div className="score-verdict" style={{ marginBottom: 14 }}>{c.verdict}</div>
          <div className="row gap-xs">
            <div className="score-meta-chip grow">
              <div className="caption" style={{ color: 'var(--on-dark-soft)', fontSize: 11 }}>Confidence</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{c.confidence}%</div>
            </div>
            <div className="score-meta-chip grow">
              <div className="caption" style={{ color: 'var(--on-dark-soft)', fontSize: 11 }}>Requested</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>{inr(c.amount_requested)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FactorBreakdown({ c }) {
  const [open, setOpen] = useState({ climate: true })
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div className="title-md">Factor breakdown</div>
        <span className="caption">8 factors · every factor carries its evidence, weight & confidence</span>
      </div>
      <div style={{ marginTop: 8 }}>
        {c.factors.map((f) => {
          const isOpen = open[f.key]
          return (
            <div className="factor-row" key={f.key}>
              <div
                className="factor-head"
                role="button"
                tabIndex={0}
                onClick={() => setOpen((o) => ({ ...o, [f.key]: !o[f.key] }))}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => ({ ...o, [f.key]: !o[f.key] })) } }}
              >
                <span className={`factor-dir ${DIR_CLASS[f.direction]}`}>{f.direction}</span>
                <div>
                  <div className="title-sm">{f.name}</div>
                  <div className="factor-weight">Weight {(f.weight * 100).toFixed(0)}% · {f.source}</div>
                </div>
                <div><FactorBar value={f.value} direction={f.direction} /><div className="caption" style={{ marginTop: 4, fontSize: 11 }}>{f.value}/100</div></div>
                <Confidence value={f.confidence} />
                <Icon.chevronDown width={16} height={16} style={{ color: 'var(--muted-soft)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast) var(--ease)' }} />
              </div>
              {isOpen && (
                <div className="factor-detail">
                  <div className="caption" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 11, color: 'var(--muted-soft)', marginBottom: 4 }}>Evidence</div>
                  <div className="body-sm" style={{ marginBottom: 10 }}>{f.evidence}</div>
                  <div className="row between wrap gap-sm">
                    <span className="body-sm text-muted" style={{ fontStyle: 'italic' }}>Impact: {f.note}</span>
                    <span className="source-chip" style={{ background: 'var(--canvas)', border: '1px solid var(--hairline)' }}><Icon.external width={12} height={12} /> {f.source}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EvidencePanel({ c }) {
  const flagged = c && null
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="title-md" style={{ marginBottom: 14 }}>Evidence</div>
      <div className="evidence-grid">
        <div>
          <div className="caption" style={{ marginBottom: 8, fontWeight: 600, color: 'var(--ink)' }}>Repayment history - last 12 instalments</div>
          <RepaymentBars data={c.repayment_series} />
        </div>
        <div>
          <div className="caption" style={{ marginBottom: 8, fontWeight: 600, color: 'var(--ink)' }}>Savings balance trend</div>
          <LineChart data={c.savings_series} stroke="var(--brand-accent)" height={110} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="caption" style={{ marginBottom: 10, fontWeight: 600, color: 'var(--ink)' }}>Documents</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {c.documents.map((d) => (
            <div className="doc-row" key={d.name}>
              <Icon.doc width={16} height={16} style={{ color: 'var(--muted)' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="body-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{d.name}</div>
                <div className="caption" style={{ fontSize: 11 }}>{d.size}</div>
              </div>
              <Badge tone={d.status === 'Verified' ? 'success' : 'warning'}>{d.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MemberRoster({ entityId }) {
  // lightweight - pull members via entityById
  return null
}

function RecommendedAction({ c }) {
  const rec = c.recommended_action
  return (
    <div className="card" style={{ padding: 20, borderColor: 'var(--ink)' }}>
      <div className="row gap-xs" style={{ marginBottom: 8 }}>
        <Icon.spark width={16} height={16} style={{ color: 'var(--badge-violet)' }} />
        <span className="title-md">Recommended action</span>
      </div>
      <div className="row gap-xs" style={{ marginBottom: 10 }}>
        <span className="badge tone-info"><span className="badge-dot" />{rec.verb}</span>
        <span className="mono title-sm">{inr(rec.amount)}</span>
      </div>
      <div className="body-sm">{rec.text}</div>
    </div>
  )
}

const ACTIONS = [
  { verb: 'Approve', sub: 'Sanction as recommended' },
  { verb: 'Approve with conditions', sub: 'Sanction with covenants / monitoring' },
  { verb: 'Refer to committee', sub: 'Escalate for committee review' },
  { verb: 'Decline', sub: 'Reject the application' },
]

function DecisionPanel({ c }) {
  const { recordDecision, decisions, openSattva } = useStore()
  const rec = c.recommended_action
  const existing = decisions[c.id]
  const [action, setAction] = useState(rec.verb)
  const [amount, setAmount] = useState(rec.amount)
  const [conditions, setConditions] = useState(
    rec.verb === 'Approve with conditions'
      ? ['Quarterly monitoring', '3% interest subvention (SHG-BLP)', 'Final tranche on Nov repayment milestone']
      : rec.verb === 'Approve'
      ? ['Half-yearly monitoring']
      : [],
  )
  const [condDraft, setCondDraft] = useState('')
  const [note, setNote] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  const isDecline = action === 'Decline' || action === 'Refer to committee'
  const effectiveAmount = isDecline ? 0 : amount
  const isOverride = action !== rec.verb || (!isDecline && amount !== rec.amount)
  const needsReason = isOverride
  const canConfirm = !needsReason || overrideReason.trim().length > 3

  if (existing) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div className="row gap-xs" style={{ marginBottom: 12 }}><Icon.check width={18} height={18} style={{ color: 'var(--success)' }} /><span className="title-md">Decision recorded</span></div>
        <div className="decided-stamp">
          <div className="row between" style={{ marginBottom: 6 }}>
            <span className="title-sm">{existing.human_decision}</span>
            <span className="mono" style={{ fontWeight: 600 }}>{inr(existing.amount_final)}</span>
          </div>
          <div className="caption">Audit entry <span className="mono">{existing.id}</span> · {existing.timestamp}</div>
          {existing.override_reason && <div className="body-sm" style={{ marginTop: 8 }}>Override: {existing.override_reason}</div>}
        </div>
        <div className="row gap-xs" style={{ marginTop: 14 }}>
          <Button variant="secondary" size="sm" onClick={() => window.location.assign('/audit')}>View in Audit Log</Button>
          <Button variant="ghost" size="sm" onClick={() => openSattva(c.id)}>Ask Sattva</Button>
        </div>
      </div>
    )
  }

  function confirm() {
    if (!canConfirm) return
    recordDecision({
      caseCase: c,
      action,
      amountFinal: effectiveAmount,
      conditions,
      note,
      overrideReason: isOverride ? overrideReason : null,
    })
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between" style={{ marginBottom: 4 }}>
        <div className="title-md">Your decision</div>
        <span className="badge tone-violet"><span className="badge-dot" />Human-in-the-loop</span>
      </div>
      <div className="caption" style={{ marginBottom: 14 }}>AI proposes, you dispose. Overrides are captured in the audit trail.</div>

      <div className="col gap-xs" style={{ marginBottom: 16 }}>
        {ACTIONS.map((a) => (
          <div
            key={a.verb}
            className={`decision-action ${action === a.verb ? 'selected' : ''}`}
            role="radio"
            aria-checked={action === a.verb}
            tabIndex={0}
            onClick={() => setAction(a.verb)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setAction(a.verb) } }}
          >
            <span className="da-title">{a.verb}{a.verb === rec.verb && <span className="caption" style={{ marginLeft: 6, color: 'var(--badge-violet)' }}>· AI recommends</span>}</span>
            <span className="da-sub">{a.sub}</span>
          </div>
        ))}
      </div>

      {!isDecline && (
        <div style={{ marginBottom: 16 }}>
          <label className="label" style={{ display: 'block', marginBottom: 6 }}>Sanction amount</label>
          <div className="amount-input-wrap">
            <span className="mono" style={{ color: 'var(--muted)', fontSize: 18 }}>₹</span>
            <input
              type="number" value={amount} step={10000}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              aria-label="Sanction amount"
            />
          </div>
          <div className="row between" style={{ marginTop: 6 }}>
            <span className="caption">Requested {inr(c.amount_requested)} · AI {inr(rec.amount)}</span>
            {amount !== rec.amount && <span className="caption" style={{ color: 'var(--warning)', fontWeight: 600 }}>Override of AI amount</span>}
          </div>
        </div>
      )}

      {(action === 'Approve' || action === 'Approve with conditions') && (
        <div style={{ marginBottom: 16 }}>
          <label className="label" style={{ display: 'block', marginBottom: 6 }}>Conditions</label>
          <div className="row wrap gap-xs" style={{ marginBottom: 8 }}>
            {conditions.map((cd, i) => (
              <span className="condition-chip" key={i}>{cd}<button onClick={() => setConditions((c2) => c2.filter((_, j) => j !== i))} aria-label="Remove"><Icon.close width={12} height={12} /></button></span>
            ))}
            {conditions.length === 0 && <span className="caption">No conditions attached</span>}
          </div>
          <div className="row gap-xs">
            <input className="input" style={{ flex: 1 }} value={condDraft} placeholder="Add a condition…" onChange={(e) => setCondDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && condDraft.trim()) { setConditions((c2) => [...c2, condDraft.trim()]); setCondDraft('') } }} />
            <Button variant="secondary" size="sm" onClick={() => { if (condDraft.trim()) { setConditions((c2) => [...c2, condDraft.trim()]); setCondDraft('') } }}>Add</Button>
          </div>
        </div>
      )}

      {needsReason && (
        <div style={{ marginBottom: 16 }}>
          <label className="label" style={{ display: 'block', marginBottom: 6 }}>Override reason <span style={{ color: 'var(--error)' }}>*</span></label>
          <textarea className="textarea" value={overrideReason} placeholder="Why are you departing from the AI recommendation? (captured in audit)" onChange={(e) => setOverrideReason(e.target.value)} />
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label className="label" style={{ display: 'block', marginBottom: 6 }}>Officer note</label>
        <textarea className="textarea" value={note} placeholder="Optional note for the record…" onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button variant="primary" className="btn-block" disabled={!canConfirm} onClick={confirm}>
        Confirm decision{isOverride ? ' (override)' : ''}
      </Button>
      {needsReason && !canConfirm && <div className="caption" style={{ marginTop: 8, color: 'var(--error)' }}>An override reason is required before you can confirm.</div>}
    </div>
  )
}

function LoadingScore() {
  return (
    <div className="page">
      <Skeleton w={280} h={14} style={{ marginBottom: 16 }} />
      <div className="appraisal-grid">
        <div className="appraisal-main">
          <div className="score-block" style={{ display: 'grid', placeItems: 'center', minHeight: 180 }}>
            <div className="col gap-sm" style={{ alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--surface-dark-elevated)', borderTopColor: 'var(--on-dark-soft)', animation: 'spin 0.9s linear infinite' }} />
              <span className="caption" style={{ color: 'var(--on-dark-soft)' }}>Computing Gaatha Score…</span>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}><Skeleton h={20} w={200} /><div style={{ marginTop: 16 }}><Skeleton h={48} style={{ marginBottom: 10 }} /><Skeleton h={48} style={{ marginBottom: 10 }} /><Skeleton h={48} /></div></div>
        </div>
        <div className="appraisal-side"><div className="card" style={{ padding: 20 }}><Skeleton h={280} /></div></div>
      </div>
    </div>
  )
}

export function AppraisalDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openSattva } = useStore()
  const { loading, error, data: c, reload } = useAsync(() => getCase(id), [id])

  useEffect(() => { if (c) track('view_case', { case_id: c.id }) }, [c])

  if (loading) return <LoadingScore />
  if (error) return <div className="page"><ErrorState onRetry={reload} message={error} /></div>
  if (!c) return <div className="page"><EmptyState icon="◇" title="Case not found" body={`No appraisal exists for ${id}.`} action={<Button variant="secondary" onClick={() => navigate('/appraisals')}>Back to queue</Button>} /></div>

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Appraisals', to: '/appraisals' }, { label: `${c.id} · ${c.entity_name}` }]} />
      <div className="row between wrap" style={{ gap: 16, marginBottom: 20 }}>
        <div>
          <div className="row gap-xs" style={{ marginBottom: 6 }}>
            <h1 className="display-sm">{c.entity_name}</h1>
            <TypeBadge type={c.entity_type} />
            <Badge tone="muted">{c.status}</Badge>
          </div>
          <div className="row gap-md caption wrap">
            <span className="mono">{c.id}</span>
            <span className="row gap-xxs"><Icon.location width={13} height={13} />{c.village}, {c.block}, {c.district}</span>
            <span>{c.product} · {inr(c.amount_requested)} · {c.tenure_months} mo</span>
            <span className="row gap-xxs"><Icon.clock width={13} height={13} />SLA {dateLabel(c.sla_due)}</span>
          </div>
        </div>
        <div className="row gap-xs">
          <Button variant="secondary" onClick={() => openSattva(c.id, `Explain the Gaatha Score for ${c.entity_name} and its main drivers.`)}>
            <Icon.spark width={15} height={15} /> Ask Sattva about this case
          </Button>
        </div>
      </div>

      <div className="appraisal-grid">
        <div className="appraisal-main">
          <ScoreBlock c={c} />
          <RecommendedAction c={c} />
          <FactorBreakdown c={c} />
          <EvidencePanel c={c} />
        </div>
        <div className="appraisal-side">
          <DecisionPanel c={c} />
        </div>
      </div>
    </div>
  )
}
