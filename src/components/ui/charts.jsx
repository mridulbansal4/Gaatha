// Hand-built SVG charts — self-contained, theme-token colored, no external library.

export function LineChart({ data, height = 120, valueKey = 'amount', labelKey = 'period', stroke = 'var(--ink)', fill = true }) {
  const w = 100
  const h = 100
  const vals = data.map((d) => d[valueKey])
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((d[valueKey] - min) / range) * (h - 12) - 6
    return [x, y]
  })
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
        {fill && (
          <>
            <defs>
              <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.14" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#lc-grad)" />
          </>
        )}
        <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.4" fill={stroke} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="row between" style={{ marginTop: 4 }}>
        <span className="caption">{data[0][labelKey]}</span>
        <span className="caption">{data[data.length - 1][labelKey]}</span>
      </div>
    </div>
  )
}

const STATUS_COLOR = { paid: 'var(--success)', late: 'var(--warning)', missed: 'var(--error)' }

export function RepaymentBars({ data, height = 96 }) {
  return (
    <div>
      <div className="row" style={{ gap: 6, alignItems: 'flex-end', height }}>
        {data.map((d, i) => {
          const barH = 30 + (d.amount / 14000) * 60
          return (
            <div key={i} className="col" style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <div
                title={`${d.period}: ${d.status} · ₹${d.amount.toLocaleString('en-IN')}`}
                style={{ width: '100%', maxWidth: 20, height: `${barH}%`, minHeight: 8, background: STATUS_COLOR[d.status], borderRadius: 'var(--r-xs)', transition: 'height 500ms var(--ease)' }}
              />
              <span className="caption" style={{ fontSize: 10 }}>{d.period}</span>
            </div>
          )
        })}
      </div>
      <div className="row gap-md" style={{ marginTop: 10 }}>
        {['paid', 'late', 'missed'].map((s) => (
          <span key={s} className="row gap-xxs caption" style={{ textTransform: 'capitalize' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLOR[s], display: 'inline-block' }} /> {s}
          </span>
        ))}
      </div>
    </div>
  )
}

// Radial score gauge used inside the featured dark score block
export function ScoreGauge({ score, band, size = 160 }) {
  const r = 68
  const c = 2 * Math.PI * r
  const pctFill = score / 100
  const color = band === 'Low' ? 'var(--success)' : band === 'Watch' ? 'var(--warning)' : 'var(--error)'
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
      <circle
        cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pctFill)}
        style={{ transition: 'stroke-dashoffset 900ms var(--ease)' }}
      />
    </svg>
  )
}

// Small factor bar (0-100) with +/- direction color
export function FactorBar({ value, direction }) {
  const color = direction === '+' ? 'var(--success)' : direction === '−' ? 'var(--error)' : 'var(--warning)'
  return (
    <div className="meter" style={{ width: '100%' }}>
      <div className="meter-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

// Choropleth-style district risk grid (schematic map)
export function RiskMiniMap({ districts, onSelect, activeId }) {
  function tone(rate) {
    if (rate >= 0.92) return 'var(--success)'
    if (rate >= 0.87) return 'var(--warning)'
    return 'var(--error)'
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {districts.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect?.(d)}
          title={`${d.name}: recovery ${(d.recovery_rate * 100).toFixed(1)}%`}
          style={{
            textAlign: 'left', padding: 12, borderRadius: 'var(--r-md)',
            border: activeId === d.id ? '1.5px solid var(--ink)' : '1px solid var(--hairline)',
            background: 'var(--canvas)', transition: 'all var(--dur-fast) var(--ease)',
          }}
        >
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="caption" style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.name}</span>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: tone(d.recovery_rate) }} />
          </div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{(d.recovery_rate * 100).toFixed(1)}%</div>
          <div className="caption" style={{ fontSize: 11 }}>recovery</div>
        </button>
      ))}
    </div>
  )
}
