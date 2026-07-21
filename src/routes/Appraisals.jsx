import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync.js'
import { getCases } from '../services/api.js'
import { inr, dateLabel, STATUS_TONE } from '../lib/format.js'
import { PageHead } from '../components/shell/PageHead.jsx'
import {
  Button, Badge, TypeBadge, ScoreChip, RiskBadge, SkeletonRows, ErrorState, EmptyState, Segmented,
} from '../components/ui/index.jsx'
import { Icon } from '../components/ui/icons.jsx'
import { useStore } from '../state/store.jsx'
import { DISTRICTS } from '../data/geo.js'
import { track } from '../services/telemetry.js'

const TYPES = ['All', 'SHG', 'JLG', 'FPO', 'PACS']
const BANDS = ['All', 'Low', 'Watch', 'High']
const STATUSES = ['All', 'New', 'In review', 'Awaiting committee', 'Decided']
const SORTS = [
  { value: 'priority', label: 'AI priority' },
  { value: 'amount', label: 'Amount' },
  { value: 'score', label: 'Score (low→high)' },
  { value: 'sla', label: 'SLA due' },
]

export function Appraisals() {
  const navigate = useNavigate()
  const { scope, pushToast } = useStore()
  const [params] = useSearchParams()
  const [type, setType] = useState('All')
  const [band, setBand] = useState('All')
  const [status, setStatus] = useState('All')
  const [district, setDistrict] = useState('All')
  const [sort, setSort] = useState('priority')
  const [search, setSearch] = useState(params.get('q') || '')
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    if (scope.district && district === 'All') setDistrict(scope.district)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.district])

  const filters = useMemo(
    () => ({
      type: type === 'All' ? null : type,
      band: band === 'All' ? null : band,
      status: status === 'All' ? null : status,
      district: district === 'All' ? null : district,
      sort,
      search: search.trim() || null,
    }),
    [type, band, status, district, sort, search],
  )

  const { loading, error, data, reload } = useAsync(() => getCases(filters), [filters])

  function toggle(id) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function exportSel() {
    track('export', { count: selected.size || (data?.length ?? 0) })
    pushToast({ kind: 'info', title: 'Export ready', body: `${selected.size || data?.length || 0} cases exported to appraisals.csv (simulated).` })
  }

  const activeFilters = [type, band, status, district].filter((v) => v !== 'All').length

  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: 'Appraisals' }]}
        title="Appraisal queue"
        sub="Every credit case across SHGs, JLGs, FPOs and PACS - filter, sort and open any case to appraise."
        actions={
          <Button variant="secondary" onClick={exportSel}>
            <Icon.download width={15} height={15} /> Export{selected.size ? ` (${selected.size})` : ''}
          </Button>
        }
      />

      {/* filter bar */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="row wrap gap-sm" style={{ alignItems: 'center' }}>
          <div className="global-search" style={{ width: 260, height: 40, background: 'var(--surface-soft)' }}>
            <Icon.search width={15} height={15} style={{ color: 'var(--muted)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Case ID, group or village…" aria-label="Search cases" />
          </div>
          <Segmented options={TYPES} value={type} onChange={setType} />
          <select className="select" value={band} onChange={(e) => setBand(e.target.value)} aria-label="Risk band">
            {BANDS.map((b) => <option key={b} value={b}>{b === 'All' ? 'All risk bands' : `${b} risk`}</option>)}
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
          </select>
          <select className="select" value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="District">
            <option value="All">All districts</option>
            {DISTRICTS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <div className="grow" />
          <div className="row gap-xs">
            <span className="caption">Sort</span>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort" style={{ height: 40 }}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setType('All'); setBand('All'); setStatus('All'); setDistrict('All'); setSearch('') }}>
              Clear ({activeFilters})
            </Button>
          )}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading && <SkeletonRows rows={8} cols={6} />}
        {error && <ErrorState onRetry={reload} message={error} />}
        {data && data.length === 0 && <EmptyState icon="◇" title="No matching cases" body="Try widening the filters or clearing the search." />}
        {data && data.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}></th>
                  <th>Case</th>
                  <th>Entity</th>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Score</th>
                  <th>Risk</th>
                  <th>SLA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} onClick={() => { track('view_case', { case_id: c.id, from: 'queue' }); navigate(`/appraisals/${c.id}`) }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} aria-label={`Select ${c.id}`} />
                    </td>
                    <td className="mono" style={{ fontSize: 12.5, color: 'var(--muted)' }}>{c.id}</td>
                    <td>
                      <div className="row gap-xs">
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.entity_name}</span>
                        <TypeBadge type={c.entity_type} />
                      </div>
                      <div className="caption">{c.village}, {c.district}</div>
                    </td>
                    <td className="body-sm">{c.product}</td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{inr(c.amount_requested)}</td>
                    <td><ScoreChip score={c.gaatha_score} band={c.risk_band} /></td>
                    <td><RiskBadge band={c.risk_band} /></td>
                    <td className="caption">{dateLabel(c.sla_due)}</td>
                    <td><Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.length > 0 && (
          <div className="row between" style={{ padding: '12px 16px', borderTop: '1px solid var(--hairline)' }}>
            <span className="caption">{data.length} cases{activeFilters ? ' · filtered' : ''}</span>
            <span className="caption">{selected.size} selected</span>
          </div>
        )}
      </div>
    </div>
  )
}
