import { useNavigate } from 'react-router-dom'
import { useAsync } from '../lib/useAsync.js'
import { getPortfolioSummary, getDecisionQueue, getAlerts } from '../services/api.js'
import { inr, BAND_TONE } from '../lib/format.js'
import { PageHead } from '../components/shell/PageHead.jsx'
import {
  StatCard, Skeleton, SkeletonRows, ErrorState, EmptyState, ScoreChip, RiskBadge, TypeBadge, Badge, Confidence, Button,
} from '../components/ui/index.jsx'
import { RiskMiniMap } from '../components/ui/charts.jsx'
import { Icon } from '../components/ui/icons.jsx'
import { useStore } from '../state/store.jsx'
import { track } from '../services/telemetry.js'

function KpiStrip() {
  const { loading, error, data, reload } = useAsync(getPortfolioSummary)
  if (error) return <div className="card"><ErrorState onRetry={reload} message={error} /></div>
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--s-md)' }
  if (loading)
    return (
      <div style={grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="stat-card" key={i}><Skeleton w={90} h={12} /><Skeleton w={120} h={30} style={{ marginTop: 12 }} /><Skeleton w={100} h={12} style={{ marginTop: 12 }} /></div>
        ))}
      </div>
    )
  return (
    <div style={grid} className="fade-up">
      <StatCard label="Portfolio outstanding" value={`₹${data.outstanding_cr.toLocaleString('en-IN')} Cr`} trend={data.trend.outstanding} sub="Across 8 districts" />
      <StatCard label="On-time recovery rate" value={`${data.recovery_rate}%`} trend={data.trend.recovery} sub="Weighted district average" />
      <StatCard label="Cases awaiting decision" value={data.awaiting_count} trend={data.trend.awaiting} trendLabel="" sub="In the decision queue" />
      <StatCard label="High-risk exposure" value={`₹${data.high_risk_exposure_cr} Cr`} trend={data.trend.high_risk} trendLabel="" sub={`${data.high_risk_count} cases flagged`} />
    </div>
  )
}

function DecisionQueue() {
  const { loading, error, data, reload } = useAsync(getDecisionQueue)
  const navigate = useNavigate()
  return (
    <div className="card">
      <div className="row between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--hairline)' }}>
        <div>
          <div className="title-md">Decision queue</div>
          <div className="caption">AI-ranked by priority - highest-impact cases first</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/appraisals')}>
          View all <Icon.arrowRight width={15} height={15} />
        </Button>
      </div>
      {loading && <SkeletonRows rows={6} cols={4} />}
      {error && <ErrorState onRetry={reload} message={error} />}
      {data && data.length === 0 && <EmptyState icon="✓" title="Queue clear" body="No cases awaiting decision right now." />}
      {data && data.length > 0 && (
        <div>
          {data.map((c, i) => (
            <button
              key={c.id}
              className="queue-row"
              onClick={() => { track('view_case', { case_id: c.id, from: 'queue' }); navigate(`/appraisals/${c.id}`) }}
              style={{
                width: '100%', textAlign: 'left', display: 'grid',
                gridTemplateColumns: '30px 1fr auto auto', alignItems: 'center', gap: 16,
                padding: '14px 20px', borderBottom: '1px solid var(--hairline-soft)',
                transition: 'background var(--dur-fast) var(--ease)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-soft)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="mono" style={{ fontSize: 13, color: 'var(--muted-soft)', fontWeight: 600 }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{ minWidth: 0 }}>
                <div className="row gap-xs" style={{ marginBottom: 3 }}>
                  <span className="title-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.entity_name}</span>
                  <TypeBadge type={c.entity_type} />
                </div>
                <div className="caption" style={{ display: 'flex', gap: 6 }}>
                  <span className="mono">{c.id}</span> · {c.product} · <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{c.priority_reason}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono title-sm">{inr(c.amount_requested)}</div>
                <div className="caption">{c.tenure_months} mo</div>
              </div>
              <div className="row gap-xs">
                <ScoreChip score={c.arthsetu_score} band={c.risk_band} />
                <RiskBadge band={c.risk_band} />
                <Icon.chevron width={16} height={16} style={{ color: 'var(--muted-soft)' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AlertFeed() {
  const { loading, error, data, reload } = useAsync(getAlerts)
  const navigate = useNavigate()
  const { openSattva } = useStore()
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="row between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--hairline)' }}>
        <div className="row gap-xs"><Icon.spark width={16} height={16} style={{ color: 'var(--badge-violet)' }} /><span className="title-md">AI alert feed</span></div>
      </div>
      {loading && <div style={{ padding: 18 }}><Skeleton h={60} style={{ marginBottom: 10 }} /><Skeleton h={60} /></div>}
      {error && <ErrorState onRetry={reload} message={error} />}
      {data && (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.slice(0, 4).map((a) => (
            <div key={a.id} style={{ padding: 14, borderRadius: 'var(--r-md)', background: 'var(--surface-soft)' }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <Badge tone={a.severity === 'High' ? 'error' : 'warning'}>{a.severity}</Badge>
                <Confidence value={a.confidence} />
              </div>
              <div className="body-sm" style={{ color: 'var(--ink)', fontWeight: 600, marginBottom: 4 }}>{a.signal}</div>
              <div className="caption" style={{ marginBottom: 8 }}>Affects {a.affected} entities · Suggested: {a.action.split(';')[0]}</div>
              <div className="row gap-xs">
                <Button variant="secondary" size="sm" onClick={() => navigate(a.route)}>Review</Button>
                <Button variant="ghost" size="sm" onClick={() => openSattva(null, `Explain this alert: ${a.signal}`)}>Ask Sattva</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DistrictMap() {
  const { loading, data } = useAsync(getPortfolioSummary)
  const { setScope } = useStore()
  const navigate = useNavigate()
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div><div className="title-md">District risk map</div><div className="caption">Recovery rate by district - click to scope</div></div>
        <div className="row gap-md">
          {[['≥92%', 'var(--success)'], ['87-92%', 'var(--warning)'], ['<87%', 'var(--error)']].map(([l, c]) => (
            <span key={l} className="row gap-xxs caption"><span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}</span>
          ))}
        </div>
      </div>
      {loading ? <Skeleton h={140} /> : (
        <RiskMiniMap districts={data.districts} onSelect={(d) => { setScope((s) => ({ ...s, district: d.name })); navigate('/portfolio') }} />
      )}
    </div>
  )
}

export function CommandCenter() {
  return (
    <div className="page">
      <PageHead
        title="Command Center"
        sub="Portfolio health, the priority decision queue, and live risk signals - everything that needs a decision now, in one place."
      />
      <div className="col gap-lg">
        <KpiStrip />
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 'var(--s-lg)', alignItems: 'start' }}>
          <div className="col gap-lg">
            <DecisionQueue />
            <DistrictMap />
          </div>
          <AlertFeed />
        </div>
      </div>
    </div>
  )
}
