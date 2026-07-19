import './ui.css'
import { BAND_TONE } from '../../lib/format.js'

// ---- Button ----
export function Button({ variant = 'primary', size, className = '', children, ...rest }) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', className].filter(Boolean).join(' ')
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}

// ---- Badge ----
export function Badge({ tone = 'muted', dot = true, children }) {
  return (
    <span className={`badge tone-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}

export function TypeBadge({ type }) {
  return <span className="type-badge">{type}</span>
}

// ---- Score chip ----
export function ScoreChip({ score, band }) {
  const cls = band === 'Low' ? 'score-low' : band === 'Watch' ? 'score-watch' : 'score-high'
  return (
    <span className={`score-chip ${cls}`} title={`ArthSetu Score ${score}/100 · ${band} risk`}>
      {score}
      <span className="score-max">/100</span>
    </span>
  )
}

export function RiskBadge({ band }) {
  return <Badge tone={BAND_TONE[band]}>{band} risk</Badge>
}

// ---- Stat card ----
export function StatCard({ label, value, trend, trendLabel, sub }) {
  const dir = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'
  const arrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '→'
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend !== undefined && (
        <div className={`stat-trend trend-${dir}`}>
          <span>{arrow}</span>
          <span>{Math.abs(trend)}{trendLabel || '%'}</span>
          <span className="text-muted" style={{ fontWeight: 500 }}>vs last quarter</span>
        </div>
      )}
      {sub && <div className="caption" style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ---- Meter ----
export function Meter({ value, tone = 'var(--ink)', max = 100 }) {
  return (
    <div className="meter">
      <div className="meter-fill" style={{ width: `${(value / max) * 100}%`, background: tone }} />
    </div>
  )
}

// ---- Skeleton ----
export function Skeleton({ w = '100%', h = 14, r, style }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

export function SkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <div className="col gap-sm" style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row gap-md">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} w={j === 0 ? 140 : `${100 / cols}%`} h={16} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ---- Empty / error states ----
export function EmptyState({ icon = '◇', title, body, action }) {
  return (
    <div className="state-block fade-in">
      <div className="state-icon" style={{ fontSize: 20 }}>{icon}</div>
      <div className="title-sm text-ink">{title}</div>
      {body && <div className="body-sm text-muted" style={{ maxWidth: 320 }}>{body}</div>}
      {action}
    </div>
  )
}

export function ErrorState({ onRetry, message }) {
  return (
    <div className="state-block fade-in">
      <div className="state-icon" style={{ color: 'var(--error)', background: 'var(--error-soft)', fontSize: 20 }}>!</div>
      <div className="title-sm text-ink">Couldn't load data</div>
      <div className="body-sm text-muted" style={{ maxWidth: 340 }}>{message || 'Something went wrong reaching ArthSetu data services.'}</div>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

// ---- Segmented control ----
export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        return (
          <button
            key={val}
            role="tab"
            aria-selected={value === val}
            className={value === val ? 'active' : ''}
            onClick={() => onChange(val)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ---- Confidence pill ----
export function Confidence({ value }) {
  const tone = value >= 80 ? 'success' : value >= 60 ? 'warning' : 'error'
  return <Badge tone={tone} dot>{value}% confidence</Badge>
}
