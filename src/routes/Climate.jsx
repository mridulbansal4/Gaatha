import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHead } from '../components/shell/PageHead.jsx'
import { Button, Badge, Confidence, StatCard, EmptyState, ErrorState, Skeleton } from '../components/ui/index.jsx'
import { RiskMiniMap } from '../components/ui/charts.jsx'
import { useAsync } from '../lib/useAsync.js'
import { SEVERITY_TONE, dateLabel } from '../lib/format.js'
import { getClimateSignals } from '../services/api.js'
import { entityById } from '../data/entities.js'
import { DISTRICTS } from '../data/geo.js'
import { useStore } from '../state/store.jsx'

const CARD_PAD = 20

function SummaryTiles({ signals }) {
  const active = signals.length
  const highSeverity = signals.filter((s) => s.severity === 'High').length
  const windowsAtRisk = signals.reduce((sum, s) => sum + s.repayment_windows_at_risk, 0)
  const affected = new Set()
  for (const s of signals) for (const id of s.affected_entity_ids) affected.add(id)

  const tiles = [
    { label: 'Active signals', value: active },
    { label: 'High-severity', value: highSeverity },
    { label: 'Repayment windows at risk', value: windowsAtRisk },
    { label: 'Entities affected', value: affected.size },
  ]
  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--s-md)' }}
    >
      {tiles.map((t) => (
        <StatCard key={t.label} label={t.label} value={t.value} />
      ))}
    </div>
  )
}

function EntityChip({ id, name }) {
  return (
    <Link
      to={`/portfolio/${id}`}
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink)',
        padding: '5px 10px',
        borderRadius: 'var(--r-pill)',
        border: '1px solid var(--hairline)',
        background: 'var(--surface-card)',
        transition: 'border-color var(--dur-fast) var(--ease)',
      }}
      title={name}
    >
      {name}
    </Link>
  )
}

function SignalCard({ signal, highlighted, cardRef }) {
  const navigate = useNavigate()
  const { openSattva } = useStore()

  const entities = signal.affected_entity_ids.map(entityById).filter(Boolean)
  const shown = entities.slice(0, 5)
  const extra = entities.length - shown.length

  return (
    <article
      ref={cardRef}
      className="card fade-up"
      style={{
        padding: CARD_PAD,
        border: highlighted ? '1.5px solid var(--ink)' : undefined,
        scrollMarginTop: 24,
      }}
    >
      {/* Header */}
      <div className="row between wrap" style={{ gap: 'var(--s-sm)' }}>
        <div className="col" style={{ gap: 2 }}>
          <div className="title-md">{signal.type}</div>
          <div className="caption">
            {signal.block} block · {signal.district} district
          </div>
        </div>
        <Badge tone={SEVERITY_TONE[signal.severity]}>{signal.severity} severity</Badge>
      </div>

      {/* Metric line */}
      <div className="mono text-ink" style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>
        {signal.metric}
      </div>

      {/* Facts row */}
      <div className="row wrap" style={{ gap: 'var(--s-lg)', marginTop: 14 }}>
        <div className="col" style={{ gap: 2 }}>
          <span className="caption">Exposure window</span>
          <span className="body-sm text-ink" style={{ fontWeight: 600 }}>
            {dateLabel(signal.window_start)} - {dateLabel(signal.window_end)}
          </span>
        </div>
        <div className="col" style={{ gap: 2 }}>
          <span className="caption">Repayment windows at risk</span>
          <span className="body-sm text-ink" style={{ fontWeight: 600 }}>
            {signal.repayment_windows_at_risk}
          </span>
        </div>
        <div className="col" style={{ gap: 2 }}>
          <span className="caption">Model confidence</span>
          <Confidence value={signal.confidence} />
        </div>
      </div>

      {/* Affected entities */}
      {entities.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="caption" style={{ marginBottom: 8 }}>
            Affected entities ({entities.length})
          </div>
          <div className="row wrap gap-xs">
            {shown.map((e) => (
              <EntityChip key={e.id} id={e.id} name={e.name} />
            ))}
            {extra > 0 && (
              <span
                className="caption"
                style={{ alignSelf: 'center', fontWeight: 600, color: 'var(--muted)' }}
              >
                +{extra} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mitigation */}
      <div
        style={{
          marginTop: 16,
          padding: 'var(--s-md)',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-card)',
        }}
      >
        <div className="caption" style={{ marginBottom: 4 }}>
          Suggested mitigation
        </div>
        <div className="body-sm text-ink">{signal.mitigation}</div>
      </div>

      {/* Actions */}
      <div className="row wrap gap-sm" style={{ marginTop: 16 }}>
        <Button variant="secondary" size="sm" onClick={() => navigate('/appraisals')}>
          View affected cases
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            openSattva(
              null,
              `Explain the ${signal.type} risk in ${signal.block} and what mitigation to attach`,
            )
          }
        >
          Ask Sattva
        </Button>
      </div>
    </article>
  )
}

export function Climate() {
  const [params] = useSearchParams()
  const activeSignal = params.get('signal')
  const { setScope } = useStore()
  const { loading, error, data, reload } = useAsync(getClimateSignals, [])
  const highlightRef = useRef(null)

  useEffect(() => {
    if (data && activeSignal && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [data, activeSignal])

  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: 'Workspace', to: '/' }, { label: 'Climate & Risk' }]}
        title="Climate & Risk"
        sub="Block-level climate signals overlaid on portfolio exposure - the early-warning layer that feeds ArthSetu's alert engine and appraisal climate factor."
      />

      {loading && (
        <div className="col gap-lg">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--s-md)' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} h={92} r="var(--r-lg)" />
            ))}
          </div>
          <Skeleton h={200} r="var(--r-lg)" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} h={220} r="var(--r-lg)" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState
          icon="◇"
          title="No active climate signals"
          body="No block-level advisories are currently overlaying the portfolio. This view updates at each fortnightly IMD refresh."
        />
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="col gap-lg">
          <SummaryTiles signals={data} />

          <section className="card" style={{ padding: CARD_PAD }}>
            <div className="title-md" style={{ marginBottom: 4 }}>
              District recovery map
            </div>
            <div className="caption" style={{ marginBottom: 16 }}>
              Recovery rate by district - climate exposure is read against these repayment baselines.
            </div>
            <RiskMiniMap
              districts={DISTRICTS}
              activeId={null}
              onSelect={(d) => setScope((s) => ({ ...s, district: d.name }))}
            />
          </section>

          <div className="col gap-md">
            {data.map((signal) => {
              const highlighted = activeSignal === signal.id
              return (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  highlighted={highlighted}
                  cardRef={highlighted ? highlightRef : null}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
