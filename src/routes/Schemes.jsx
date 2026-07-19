import { useState, useRef } from 'react'
import { PageHead } from '../components/shell/PageHead.jsx'
import { Button, Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/index.jsx'
import { Icon } from '../components/ui/icons.jsx'
import { useAsync } from '../lib/useAsync.js'
import { getSchemes, matchSchemes } from '../services/api.js'
import { ENTITIES, entityById } from '../data/entities.js'
import { useStore } from '../state/store.jsx'

const STATUS_TONE = {
  Eligible: 'success',
  'Eligible - confirm docs': 'warning',
  'Not eligible': 'muted',
}

// ---- Catalogue card ----
function SchemeCard({ scheme, onCheck }) {
  return (
    <div className="card fade-up" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row between" style={{ gap: 8 }}>
        <Badge tone="info">{scheme.short}</Badge>
        <span className="caption">{scheme.authority}</span>
      </div>

      <div className="title-md">{scheme.name}</div>
      <p className="body-sm text-muted">{scheme.summary}</p>

      <div className="card-soft" style={{ padding: 12 }}>
        <div className="label" style={{ fontSize: 12, color: 'var(--muted)' }}>Uplift</div>
        <div className="body-sm text-ink" style={{ marginTop: 3 }}>{scheme.uplift}</div>
      </div>

      <div>
        <Badge tone="neutral" dot={false}>{scheme.benefit_type}</Badge>
      </div>

      <div className="row between" style={{ gap: 12, marginTop: 'auto', paddingTop: 4 }}>
        <span className="caption">{scheme.docs_required.length} documents required</span>
        <Button variant="secondary" size="sm" onClick={() => onCheck(scheme.id)}>Check eligibility</Button>
      </div>
    </div>
  )
}

function SchemeCardSkeleton() {
  return (
    <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row between">
        <Skeleton w={72} h={20} r="var(--r-pill)" />
        <Skeleton w={64} h={12} />
      </div>
      <Skeleton w="80%" h={18} />
      <Skeleton w="100%" h={40} />
      <Skeleton w="100%" h={52} r="var(--r-lg)" />
      <div className="row between" style={{ marginTop: 6 }}>
        <Skeleton w={120} h={12} />
        <Skeleton w={96} h={32} r="var(--r-md)" />
      </div>
    </div>
  )
}

// ---- Matcher rule line ----
function RuleLine({ rule }) {
  const mark =
    rule.pass === true ? (
      <Icon.check width={16} height={16} style={{ color: 'var(--success)' }} />
    ) : rule.pass === false ? (
      <Icon.close width={16} height={16} style={{ color: 'var(--error)' }} />
    ) : (
      <span className="badge-dot" style={{ background: 'var(--muted-soft)' }} />
    )
  return (
    <div className="row gap-sm" style={{ alignItems: 'flex-start' }}>
      <span className="row" style={{ width: 16, height: 20, justifyContent: 'center', flexShrink: 0 }}>{mark}</span>
      <div>
        <div className="body-sm text-ink">
          {rule.label}
          {rule.pass === null && <span className="caption" style={{ marginLeft: 6 }}>confirm</span>}
        </div>
        <div className="caption">{rule.detail}</div>
      </div>
    </div>
  )
}

// ---- Matcher result row ----
function MatchRow({ result, open, onToggle }) {
  const { scheme, results, status, missing_docs } = result
  return (
    <div className="card-soft" style={{ overflow: 'hidden' }}>
      <button
        className="row between"
        onClick={onToggle}
        aria-expanded={open}
        style={{ width: '100%', gap: 12, padding: '14px 16px', textAlign: 'left' }}
      >
        <span className="row gap-sm wrap">
          <span className="title-sm">{scheme.short}</span>
          <Badge tone={STATUS_TONE[status] || 'muted'}>{status}</Badge>
        </span>
        <Icon.chevronDown
          width={16}
          height={16}
          style={{ color: 'var(--muted)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast) var(--ease)' }}
        />
      </button>

      {open && (
        <div className="col gap-sm" style={{ padding: '0 16px 16px' }}>
          {results.map((rule) => (
            <RuleLine key={rule.key} rule={rule} />
          ))}
          {missing_docs.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <div className="label" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Missing documentation</div>
              <div className="col gap-xxs">
                {missing_docs.map((doc) => (
                  <div key={doc} className="row gap-xs">
                    <Icon.doc width={14} height={14} style={{ color: 'var(--muted-soft)', flexShrink: 0 }} />
                    <span className="body-sm text-muted">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Schemes() {
  const { openSattva } = useStore()
  const matcherRef = useRef(null)

  const catalogue = useAsync(getSchemes, [])

  const [entityId, setEntityId] = useState(ENTITIES[0].id)
  const match = useAsync(() => matchSchemes(entityId), [entityId])
  const selectedEntity = entityById(entityId)

  const [expanded, setExpanded] = useState({})
  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))

  function checkEligibility(schemeId) {
    matcherRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setExpanded((e) => ({ ...e, [schemeId]: true }))
  }

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 'var(--s-lg)',
  }

  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: 'Workspace', to: '/' }, { label: 'Schemes' }]}
        title="Schemes"
        sub="Catalogue of NABARD and Government of India rural-credit schemes, with an eligibility matcher that evaluates each scheme's rules against a registered entity."
      />

      <div className="col" style={{ gap: 'var(--s-xl)' }}>
        {/* ---- Scheme catalogue ---- */}
        <section>
          <div style={{ marginBottom: 16 }}>
            <div className="title-lg">Scheme catalogue</div>
            <div className="caption" style={{ marginTop: 4 }}>Benefit type, uplift and documentation for every supported scheme.</div>
          </div>

          {catalogue.loading && (
            <div style={gridStyle}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SchemeCardSkeleton key={i} />
              ))}
            </div>
          )}

          {catalogue.error && <ErrorState message={catalogue.error} onRetry={catalogue.reload} />}

          {!catalogue.loading && !catalogue.error && catalogue.data && (
            catalogue.data.length === 0 ? (
              <EmptyState icon="◇" title="No schemes available" body="The scheme master returned no records." />
            ) : (
              <div style={gridStyle}>
                {catalogue.data.map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} onCheck={checkEligibility} />
                ))}
              </div>
            )
          )}
        </section>

        {/* ---- Eligibility matcher ---- */}
        <section ref={matcherRef}>
          <div className="card" style={{ padding: 24 }}>
            <div className="row between wrap" style={{ gap: 16, marginBottom: 20 }}>
              <div>
                <div className="title-lg">Eligibility matcher</div>
                <div className="caption" style={{ marginTop: 4 }}>Scheme rules evaluated against the selected entity in real time.</div>
              </div>
              <div className="row gap-sm wrap">
                <label className="row gap-xs">
                  <span className="label" style={{ fontSize: 12, color: 'var(--muted)' }}>Entity</span>
                  <select
                    className="select"
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    aria-label="Select entity for eligibility matching"
                    style={{ maxWidth: 320 }}
                  >
                    {ENTITIES.map((e) => (
                      <option key={e.id} value={e.id}>{`${e.name} - ${e.type}, ${e.village}`}</option>
                    ))}
                  </select>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    openSattva(null, `Which schemes apply to ${selectedEntity.name} and what documentation is missing?`)
                  }
                >
                  <Icon.spark width={14} height={14} />
                  Ask Sattva
                </Button>
              </div>
            </div>

            {match.loading && (
              <div className="col gap-sm">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} w="100%" h={50} r="var(--r-lg)" />
                ))}
              </div>
            )}

            {match.error && <ErrorState message={match.error} onRetry={match.reload} />}

            {!match.loading && !match.error && match.data && (
              match.data.length === 0 ? (
                <EmptyState icon="◇" title="No matches to show" body="Select an entity to evaluate scheme eligibility." />
              ) : (
                <div className="col gap-sm">
                  {match.data.map((result) => (
                    <MatchRow
                      key={result.scheme.id}
                      result={result}
                      open={!!expanded[result.scheme.id]}
                      onToggle={() => toggle(result.scheme.id)}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
