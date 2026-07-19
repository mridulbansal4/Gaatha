import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHead } from '../components/shell/PageHead.jsx'
import { Button, Badge, EmptyState, StatCard } from '../components/ui/index.jsx'
import { Icon } from '../components/ui/icons.jsx'
import { useStore } from '../state/store.jsx'
import { inr, dateLabel } from '../lib/format.js'

const DECISION_TYPES = [
  'All',
  'Approved',
  'Approved with conditions',
  'Referred to committee',
  'Declined',
]

const DECISION_TONE = {
  Approved: 'success',
  'Approved with conditions': 'warning',
  'Referred to committee': 'violet',
  Declined: 'error',
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const isOverride = (e) => e.override_reason != null || e.aligned === false

export function AuditLog() {
  const { audit, pushToast } = useStore()
  const navigate = useNavigate()

  const [type, setType] = useState('All')
  const [query, setQuery] = useState('')
  const [overridesOnly, setOverridesOnly] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const overrideCount = useMemo(() => audit.filter(isOverride).length, [audit])
  const alignedRate = audit.length
    ? Math.round((audit.filter((e) => e.aligned).length / audit.length) * 100)
    : 0

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return audit.filter((e) => {
      if (type !== 'All' && e.human_decision !== type) return false
      if (overridesOnly && !isOverride(e)) return false
      if (q && !(`${e.case_id} ${e.entity_name}`.toLowerCase().includes(q))) return false
      return true
    })
  }, [audit, type, overridesOnly, query])

  const exportCsv = () => {
    pushToast({
      kind: 'info',
      title: 'Export ready',
      body: `audit-trail.csv simulated (${filtered.length} rows)`,
    })
  }

  return (
    <div className="page">
      <PageHead
        title="Audit Log"
        sub="Immutable, append-only record of every credit decision — AI recommendation versus human judgement, with override reasons captured."
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Icon.download width={16} height={16} />
            Export CSV
          </Button>
        }
      />

      {/* Governance strip */}
      <div
        className="card-soft row gap-md"
        style={{ padding: 'var(--s-md) var(--s-lg)', alignItems: 'flex-start', marginBottom: 'var(--s-lg)' }}
      >
        <div
          className="row"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--r-md)',
            background: 'var(--canvas)',
            border: '1px solid var(--hairline)',
            justifyContent: 'center',
            color: 'var(--ink)',
            flexShrink: 0,
          }}
        >
          <Icon.audit width={18} height={18} />
        </div>
        <div>
          <div className="title-sm text-ink">Immutable governance trail</div>
          <div className="body-sm text-muted" style={{ marginTop: 2, maxWidth: 640 }}>
            Every decision is written once and never edited or removed. This append-only ledger is the
            governance proof — showing what ArthSetu recommended, what the officer decided, and why any
            override was made.
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--s-md)',
          marginBottom: 'var(--s-lg)',
        }}
      >
        <StatCard label="Total decisions" value={audit.length} sub="Entries in the ledger" />
        <StatCard label="Overrides" value={overrideCount} sub="Human departed from AI" />
        <StatCard label="AI-aligned rate" value={`${alignedRate}%`} sub="Followed the recommendation" />
      </div>

      {/* Filters */}
      <div
        className="card row wrap gap-sm"
        style={{ padding: 'var(--s-sm)', marginBottom: 'var(--s-md)', alignItems: 'center' }}
      >
        <div className="row gap-xs grow" style={{ minWidth: 200 }}>
          <Icon.search width={16} height={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input
            className="input grow"
            style={{ border: 'none', height: 32, paddingLeft: 0 }}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search case ID or entity…"
            aria-label="Search by case ID or entity name"
          />
        </div>

        <select
          className="select"
          style={{ height: 36 }}
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Filter by decision type"
        >
          {DECISION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All decisions' : t}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`btn btn-sm ${overridesOnly ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={overridesOnly}
          onClick={() => setOverridesOnly((v) => !v)}
        >
          <Icon.alert width={15} height={15} />
          Overrides only
        </button>
      </div>

      {/* Trail */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="◇"
            title="No decisions match"
            body="Adjust the filters or search to see entries in the audit trail."
          />
        </div>
      ) : (
        <div className="col gap-sm">
          {filtered.map((e) => {
            const open = expanded === e.id
            const override = isOverride(e)
            const panelId = `audit-panel-${e.id}`
            return (
              <div key={e.id} className="card fade-in" style={{ overflow: 'hidden' }}>
                {/* Header (accordion toggle) */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setExpanded(open ? null : e.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      setExpanded(open ? null : e.id)
                    }
                  }}
                  className="row between wrap gap-md"
                  style={{ padding: 'var(--s-md)', cursor: 'pointer' }}
                >
                  <div className="row gap-sm" style={{ minWidth: 0 }}>
                    <div className="avatar avatar-sm" title={e.officer}>
                      {initials(e.officer)}
                    </div>
                    <div className="col" style={{ minWidth: 0 }}>
                      <div className="row gap-xs">
                        <span className="title-sm text-ink">{e.officer}</span>
                        <span className="caption">·</span>
                        <span className="caption">{dateLabel(e.timestamp)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          navigate(`/appraisals/${e.case_id}`)
                        }}
                        className="row gap-xs"
                        style={{ marginTop: 2 }}
                        title={`Open ${e.case_id}`}
                      >
                        <span className="body-sm text-ink" style={{ fontWeight: 600 }}>
                          {e.entity_name}
                        </span>
                        <span className="caption mono">{e.case_id}</span>
                        <Icon.external width={12} height={12} style={{ color: 'var(--muted)' }} />
                      </button>
                    </div>
                  </div>

                  <div className="row gap-xs wrap" style={{ justifyContent: 'flex-end' }}>
                    <Badge tone={DECISION_TONE[e.human_decision] || 'muted'}>{e.human_decision}</Badge>
                    <Badge tone={override ? 'warning' : 'success'}>
                      {override ? 'Override' : 'Followed AI'}
                    </Badge>
                    <Icon.chevronDown
                      width={18}
                      height={18}
                      style={{
                        color: 'var(--muted)',
                        transition: 'transform var(--dur-fast) var(--ease)',
                        transform: open ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Expanded panel */}
                {open && (
                  <div
                    id={panelId}
                    className="col gap-md fade-in"
                    style={{ padding: 'var(--s-md)', borderTop: '1px solid var(--hairline)' }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 'var(--s-md)',
                      }}
                    >
                      <div className="card-soft col gap-xs" style={{ padding: 'var(--s-md)' }}>
                        <div className="row gap-xs">
                          <Icon.spark width={14} height={14} style={{ color: 'var(--brand-accent)' }} />
                          <span className="caption">AI recommendation</span>
                        </div>
                        <div className="body-sm text-ink">{e.ai_recommendation}</div>
                        <div className="display-sm text-ink" style={{ marginTop: 4 }}>
                          {inr(e.ai_amount)}
                        </div>
                      </div>

                      <div className="card-soft col gap-xs" style={{ padding: 'var(--s-md)' }}>
                        <div className="row gap-xs">
                          <Icon.users width={14} height={14} style={{ color: 'var(--muted)' }} />
                          <span className="caption">Human decision</span>
                        </div>
                        <div className="body-sm text-ink">{e.human_decision}</div>
                        <div className="display-sm text-ink" style={{ marginTop: 4 }}>
                          {inr(e.amount_final)}
                        </div>
                      </div>
                    </div>

                    <div className="col gap-xs">
                      <span className="caption">Conditions attached</span>
                      {e.conditions && e.conditions.length ? (
                        <div className="row gap-xs wrap">
                          {e.conditions.map((c, i) => (
                            <Badge key={i} tone="info" dot={false}>
                              {c}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="body-sm text-muted">None recorded.</span>
                      )}
                    </div>

                    {e.override_reason && (
                      <div
                        className="col gap-xxs"
                        style={{
                          padding: 'var(--s-sm) var(--s-md)',
                          background: 'var(--warning-soft)',
                          borderRadius: 'var(--r-md)',
                          border: '1px solid var(--warning)',
                        }}
                      >
                        <div className="row gap-xs">
                          <Icon.alert width={14} height={14} style={{ color: 'var(--warning)' }} />
                          <span className="caption" style={{ color: 'var(--ink)' }}>
                            Override reason
                          </span>
                        </div>
                        <div className="body-sm text-ink">{e.override_reason}</div>
                      </div>
                    )}

                    {e.note && (
                      <div className="col gap-xxs">
                        <span className="caption">Officer note</span>
                        <div className="body-sm text-muted">{e.note}</div>
                      </div>
                    )}

                    <div className="caption mono text-muted-soft">
                      Ledger ref {e.id} · recorded {e.timestamp}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
