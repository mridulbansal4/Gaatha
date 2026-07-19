import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PageHead } from '../components/shell/PageHead.jsx'
import {
  Button,
  Badge,
  TypeBadge,
  ScoreChip,
  RiskBadge,
  Meter,
  Skeleton,
  SkeletonRows,
  EmptyState,
  ErrorState,
} from '../components/ui/index.jsx'
import { LineChart } from '../components/ui/charts.jsx'
import { useAsync } from '../lib/useAsync.js'
import { inr, inrFull, pct, dateLabel, STATUS_TONE } from '../lib/format.js'
import { getEntity, matchSchemes } from '../services/api.js'
import { zoneById } from '../data/geo.js'
import { useStore } from '../state/store.jsx'

const SCHEME_TONE = {
  Eligible: 'success',
  'Eligible — confirm docs': 'warning',
  'Not eligible': 'muted',
}

const SERIES_MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

function Card({ title, sub, children, style }) {
  return (
    <div className="card" style={{ padding: 'var(--s-lg)', ...style }}>
      {title && (
        <div className="col" style={{ gap: 2, marginBottom: 'var(--s-md)' }}>
          <div className="title-md">{title}</div>
          {sub && <div className="caption">{sub}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="col" style={{ gap: 3 }}>
      <span className="caption">{label}</span>
      <span className="body-md text-ink" style={{ fontWeight: 500 }}>{children}</span>
    </div>
  )
}

function MeterField({ label, value }) {
  const v = value * 100
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="row between">
        <span className="caption">{label}</span>
        <span className="caption mono" style={{ color: 'var(--body)' }}>{pct(v, 0)}</span>
      </div>
      <Meter value={v} tone={v >= 90 ? 'var(--success)' : v >= 80 ? 'var(--warning)' : 'var(--error)'} />
    </div>
  )
}

// ---- Scheme eligibility (own async load) ----
function SchemeEligibility({ entityId }) {
  const { loading, error, data, reload } = useAsync(() => matchSchemes(entityId), [entityId])

  return (
    <Card title="Scheme eligibility" sub="NABARD / GoI programme match">
      {loading ? (
        <div className="col gap-sm">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h={44} r={8} />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} message={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="◇" title="No schemes evaluated" body="No programme rules applied to this entity." />
      ) : (
        <div className="col gap-sm">
          {data.slice(0, 5).map(({ scheme, status, missing_docs }) => (
            <div key={scheme.id} className="col" style={{ gap: 6, paddingBottom: 'var(--s-sm)', borderBottom: '1px solid var(--hairline-soft)' }}>
              <div className="row between gap-sm">
                <span className="title-sm" title={scheme.name}>{scheme.short}</span>
                <Badge tone={SCHEME_TONE[status] || 'muted'}>{status}</Badge>
              </div>
              {missing_docs && missing_docs.length > 0 && (
                <span className="caption">Pending: {missing_docs.join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function EntityProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openSattva } = useStore()

  const { loading, error, data: entity, reload } = useAsync(() => getEntity(id), [id])

  const savingsSeries = useMemo(() => {
    if (!entity) return []
    const base = entity.savings_balance
    return SERIES_MONTHS.map((period, i) => ({
      period,
      amount: Math.round(base * (0.55 + (0.45 * i) / (SERIES_MONTHS.length - 1))),
    }))
  }, [entity])

  if (loading) {
    return (
      <div className="page">
        <div className="col gap-sm" style={{ marginBottom: 24 }}>
          <Skeleton w={200} h={14} />
          <Skeleton w={320} h={28} />
        </div>
        <div className="card"><SkeletonRows rows={6} cols={3} /></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="card" style={{ overflow: 'hidden' }}>
          <ErrorState onRetry={reload} message={error} />
        </div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="page">
        <EmptyState
          icon="◇"
          title="Entity not found"
          body="This entity may have been merged or removed from the directory."
          action={<Link to="/portfolio"><Button variant="secondary" size="sm">Back to Portfolio</Button></Link>}
        />
      </div>
    )
  }

  const zone = zoneById(entity.climate_zone_id)
  const cases = entity.cases || []
  const firstCaseId = cases.length ? cases[0].id : null
  const isPooled = entity.type === 'FPO' || entity.type === 'PACS'

  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: 'Portfolio', to: '/portfolio' }, { label: entity.name }]}
        title={entity.name}
        sub={`${entity.type} · ${entity.village}, ${entity.block}, ${entity.district}`}
        actions={
          <Button variant="secondary" onClick={() => openSattva(firstCaseId)}>
            Ask Sattva about this group
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: 'var(--s-lg)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Main column */}
        <div className="col" style={{ gap: 'var(--s-lg)', flex: '2 1 460px', minWidth: 300 }}>
          {/* Overview */}
          <Card title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--s-md)' }}>
              <Field label="Formed on">{dateLabel(entity.formed_on)}</Field>
              <Field label="Bank linkage since">{dateLabel(entity.bank_linkage_since)}</Field>
              <Field label="Linkage bank">{entity.linkage_bank}</Field>
              <Field label="Climate zone">{zone ? zone.label : '—'}</Field>
              <Field label="Primary activity">{entity.primary_activity}</Field>
              <Field label="Members">{entity.member_count.toLocaleString('en-IN')}</Field>
            </div>

            <div className="col" style={{ gap: 6, marginTop: 'var(--s-md)' }}>
              <span className="caption">Crops</span>
              <div className="row wrap gap-xs">
                {entity.crops.length ? entity.crops.map((c) => <TypeBadge key={c} type={c} />) : <span className="body-sm text-muted">—</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--s-lg)', marginTop: 'var(--s-lg)' }}>
              <MeterField label="Meeting regularity" value={entity.meeting_regularity} />
              <MeterField label="Recovery rate" value={entity.recovery_rate} />
            </div>
          </Card>

          {/* Financial history */}
          <Card title="Financial history" sub="Group savings & internal lending">
            <div className="row wrap gap-lg" style={{ marginBottom: 'var(--s-lg)' }}>
              <div className="col" style={{ gap: 3 }}>
                <span className="caption">Savings balance</span>
                <span className="display-sm mono">{inrFull(entity.savings_balance)}</span>
              </div>
              <div className="col" style={{ gap: 3 }}>
                <span className="caption">Internal loans</span>
                <span className="display-sm mono">{inrFull(entity.internal_loans)}</span>
              </div>
            </div>
            <span className="caption">Savings balance trend (8 months)</span>
            <div style={{ marginTop: 8 }}>
              <LineChart data={savingsSeries} height={120} stroke="var(--success)" />
            </div>
          </Card>

          {/* Member roster */}
          <Card
            title="Member roster"
            sub={isPooled ? `Showing sampled board of ${entity.members.length} of ${entity.member_count.toLocaleString('en-IN')} members` : undefined}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Age</th>
                  <th>Occupation</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {entity.members.map((m) => (
                  <tr key={m.id} style={{ cursor: 'default' }}>
                    <td className="title-sm">{m.name}</td>
                    <td><Badge tone="muted" dot={false}>{m.role}</Badge></td>
                    <td className="mono" style={{ textAlign: 'right' }}>{m.age}</td>
                    <td className="body-sm">{m.primary_occupation}</td>
                    <td>
                      {m.individual_flags.length ? (
                        <div className="row wrap gap-xs">
                          {m.individual_flags.map((f) => (
                            <Badge key={f} tone="warning" dot={false}>{f}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="caption">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Appraisal history */}
          <Card title="Appraisal history" sub="Credit cases raised for this entity">
            {cases.length === 0 ? (
              <EmptyState icon="◇" title="No appraisals yet" body="This entity has no credit cases on record." />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Case</th>
                    <th>Product</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Score</th>
                    <th>Risk</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open appraisal ${c.id}`}
                      onClick={() => navigate(`/appraisals/${c.id}`)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault()
                          navigate(`/appraisals/${c.id}`)
                        }
                      }}
                    >
                      <td className="mono" style={{ fontSize: 13 }}>{c.id}</td>
                      <td className="body-sm">{c.product}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{inr(c.amount_requested)}</td>
                      <td><ScoreChip score={c.arthsetu_score} band={c.risk_band} /></td>
                      <td><RiskBadge band={c.risk_band} /></td>
                      <td><Badge tone={STATUS_TONE[c.status] || 'muted'}>{c.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Side column */}
        <div className="col" style={{ gap: 'var(--s-lg)', flex: '1 1 280px', minWidth: 260 }}>
          <SchemeEligibility entityId={entity.id} />
        </div>
      </div>
    </div>
  )
}
