import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHead } from '../components/shell/PageHead.jsx'
import {
  Segmented,
  TypeBadge,
  Meter,
  SkeletonRows,
  EmptyState,
  ErrorState,
} from '../components/ui/index.jsx'
import { Icon } from '../components/ui/icons.jsx'
import { useAsync } from '../lib/useAsync.js'
import { inr, pct } from '../lib/format.js'
import { getEntities } from '../services/api.js'
import { ENTITIES } from '../data/entities.js'
import { useStore } from '../state/store.jsx'

const TYPES = ['All', 'SHG', 'JLG', 'FPO', 'PACS']

function StatTile({ label, value, active }) {
  return (
    <div
      className="card"
      style={{
        padding: 'var(--s-md)',
        flex: '1 1 120px',
        minWidth: 120,
        borderColor: active ? 'var(--ink)' : 'var(--hairline)',
      }}
    >
      <div className="caption">{label}</div>
      <div className="display-sm" style={{ marginTop: 4 }}>{value}</div>
    </div>
  )
}

export function Portfolio() {
  const navigate = useNavigate()
  const { scope } = useStore()
  const [type, setType] = useState('All')
  const [search, setSearch] = useState('')

  const district = scope.district || undefined
  const typeFilter = type === 'All' ? undefined : type

  const { loading, error, data, reload } = useAsync(
    () => getEntities({ type: typeFilter, district }),
    [typeFilter, district],
  )

  // Client-side text filter so the search box stays responsive without re-fetching
  // (and re-flashing skeletons) on every keystroke.
  const rows = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.village.toLowerCase().includes(q),
    )
  }, [data, search])

  // Summary counts are computed from the full master list, independent of filters.
  const counts = useMemo(() => {
    const by = { All: ENTITIES.length, SHG: 0, JLG: 0, FPO: 0, PACS: 0 }
    for (const e of ENTITIES) by[e.type] = (by[e.type] || 0) + 1
    return by
  }, [])

  function open(id) {
    navigate(`/portfolio/${id}`)
  }

  return (
    <div className="page">
      <PageHead
        crumbs={[{ label: 'Command Center', to: '/' }, { label: 'Portfolio' }]}
        title="Portfolio"
        sub="The entity directory across every SHG, JLG, FPO and PACS — savings, recovery and bank linkage at a glance."
      />

      {/* Summary strip: counts by type */}
      <div className="row wrap gap-md" style={{ marginBottom: 'var(--s-lg)' }}>
        <StatTile label="All entities" value={counts.All} active={type === 'All'} />
        <StatTile label="SHGs" value={counts.SHG} active={type === 'SHG'} />
        <StatTile label="JLGs" value={counts.JLG} active={type === 'JLG'} />
        <StatTile label="FPOs" value={counts.FPO} active={type === 'FPO'} />
        <StatTile label="PACS" value={counts.PACS} active={type === 'PACS'} />
      </div>

      {/* Controls */}
      <div className="row between wrap gap-md" style={{ marginBottom: 'var(--s-md)' }}>
        <Segmented options={TYPES} value={type} onChange={setType} />
        <div className="row" style={{ position: 'relative' }}>
          <Icon.search
            width={16}
            height={16}
            style={{ position: 'absolute', left: 12, color: 'var(--muted)', pointerEvents: 'none' }}
          />
          <input
            className="input"
            style={{ paddingLeft: 34, width: 260 }}
            type="search"
            placeholder="Search name, ID or village"
            aria-label="Search entities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <SkeletonRows rows={6} cols={6} />
        ) : error ? (
          <ErrorState onRetry={reload} message={error} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="◇"
            title="No entities match"
            body="Try a different entity type or clear the search to see the full directory."
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Entity</th>
                <th>District</th>
                <th style={{ textAlign: 'right' }}>Members</th>
                <th style={{ textAlign: 'right' }}>Savings balance</th>
                <th style={{ width: 160 }}>Recovery rate</th>
                <th>Linkage bank</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const recovery = e.recovery_rate * 100
                return (
                  <tr
                    key={e.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${e.name}`}
                    onClick={() => open(e.id)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        open(e.id)
                      }
                    }}
                  >
                    <td>
                      <div className="col" style={{ gap: 4 }}>
                        <span className="row gap-xs" style={{ flexWrap: 'wrap' }}>
                          <span className="title-sm">{e.name}</span>
                          <TypeBadge type={e.type} />
                        </span>
                        <span className="caption">{e.village}, {e.block}</span>
                      </div>
                    </td>
                    <td>{e.district}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{e.member_count.toLocaleString('en-IN')}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{inr(e.savings_balance)}</td>
                    <td>
                      <div className="col" style={{ gap: 5 }}>
                        <span className="caption mono" style={{ color: 'var(--body)' }}>{pct(recovery, 1)}</span>
                        <Meter
                          value={recovery}
                          tone={recovery >= 90 ? 'var(--success)' : recovery >= 80 ? 'var(--warning)' : 'var(--error)'}
                        />
                      </div>
                    </td>
                    <td><span className="body-sm">{e.linkage_bank}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
