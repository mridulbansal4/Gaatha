import { Link } from 'react-router-dom'
import { Icon } from '../ui/icons.jsx'

export function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} className="row" style={{ gap: 7 }}>
          {i > 0 && <Icon.chevron className="sep" width={13} height={13} />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span style={{ color: 'var(--body)' }}>{it.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function PageHead({ crumbs, title, sub, actions }) {
  return (
    <div className="page-head">
      {crumbs && <Breadcrumb items={crumbs} />}
      <div className="row between wrap" style={{ gap: 16 }}>
        <div>
          <h1 className="display-md">{title}</h1>
          {sub && <p className="body-md text-muted" style={{ marginTop: 6, maxWidth: 620 }}>{sub}</p>}
        </div>
        {actions && <div className="row gap-sm wrap">{actions}</div>}
      </div>
    </div>
  )
}
