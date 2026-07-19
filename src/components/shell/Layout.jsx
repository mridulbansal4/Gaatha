import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './shell.css'
import { Icon } from '../ui/icons.jsx'
import { useStore } from '../../state/store.jsx'
import { DISTRICTS } from '../../data/geo.js'
import { CASES } from '../../data/cases.js'
import { SattvaDrawer } from '../sattva/SattvaDrawer.jsx'
import { ToastStack } from './ToastStack.jsx'

const NAV = [
  { to: '/', label: 'Command Center', icon: 'command', end: true },
  { to: '/appraisals', label: 'Appraisals', icon: 'appraisal', count: CASES.filter((c) => c.status !== 'Decided').length },
  { to: '/portfolio', label: 'Portfolio', icon: 'portfolio' },
  { to: '/climate', label: 'Climate & Risk', icon: 'climate' },
  { to: '/schemes', label: 'Schemes', icon: 'schemes' },
  { to: '/audit', label: 'Audit Log', icon: 'audit' },
]

function Sidebar({ open }) {
  return (
    <aside className={`rail ${open ? 'open' : ''}`}>
      <div className="rail-brand">
        <div className="rail-logo">
          <svg width="18" height="18" viewBox="0 0 32 32"><path d="M9 22 L16 9 L23 22" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /><line x1="12" y1="17" x2="20" y2="17" stroke="white" strokeWidth="2.4" strokeLinecap="round" /></svg>
        </div>
        <span className="rail-wordmark">ArthSetu</span>
      </div>
      <nav className="rail-nav">
        <div className="rail-section">Workspace</div>
        {NAV.map((item) => {
          const I = Icon[item.icon]
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <I className="nav-icon" />
              <span>{item.label}</span>
              {item.count != null && <span className="nav-count">{item.count}</span>}
            </NavLink>
          )
        })}
      </nav>
      <div className="rail-foot">
        <div className="rail-officer">
          <div className="avatar avatar-sm">PD</div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Priya Deshmukh</div>
            <div className="caption" style={{ fontSize: 11 }}>Branch Credit Officer · RRB</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Topbar({ onMenu }) {
  const { scope, setScope } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [scopeOpen, setScopeOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  function onSearch(e) {
    e.preventDefault()
    if (q.trim()) navigate(`/appraisals?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onMenu} style={{ display: 'none' }} aria-label="Menu"><Icon.menu /></button>
      <form className="global-search" onSubmit={onSearch}>
        <Icon.search width={16} height={16} style={{ color: 'var(--muted)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases, groups, villages…" aria-label="Global search" />
      </form>

      <div className="grow" />

      <div style={{ position: 'relative' }}>
        <button className="scope-selector" onClick={() => setScopeOpen((o) => !o)}>
          <Icon.location width={15} height={15} style={{ color: 'var(--muted)' }} />
          <span className="scope-crumb" style={{ fontWeight: 600, color: 'var(--ink)' }}>{scope.state}</span>
          <span className="sep">/</span>
          <span className="scope-crumb pickable">{scope.district || 'All districts'}</span>
          <Icon.chevronDown width={14} height={14} style={{ color: 'var(--muted)' }} />
        </button>
        {scopeOpen && (
          <div className="popover" style={{ top: 46, right: 0, maxHeight: 320, overflowY: 'auto' }}>
            <div className="popover-head">Set scope</div>
            <div className="popover-item" onClick={() => { setScope((s) => ({ ...s, district: null })); setScopeOpen(false) }}>All districts</div>
            {DISTRICTS.map((d) => (
              <div key={d.id} className="popover-item" onClick={() => { setScope((s) => ({ ...s, district: d.name })); setScopeOpen(false) }}>
                {d.name} <span className="caption" style={{ marginLeft: 'auto' }}>{d.entities} entities</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">
          <Icon.bell width={19} height={19} />
          <span className="notif-dot" />
        </button>
        {notifOpen && (
          <div className="popover" style={{ top: 46, right: 0, minWidth: 300 }}>
            <div className="popover-head">Notifications</div>
            <div className="popover-item" onClick={() => { navigate('/climate'); setNotifOpen(false) }}>
              <Icon.alert width={15} height={15} style={{ color: 'var(--error)' }} />
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>Rainfall deficit - Osmanabad</div><div className="caption">7 repayment windows at risk</div></div>
            </div>
            <div className="popover-item" onClick={() => { navigate('/appraisals'); setNotifOpen(false) }}>
              <Icon.appraisal width={15} height={15} style={{ color: 'var(--warning)' }} />
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>3 cases nearing SLA</div><div className="caption">Decision due within 48h</div></div>
            </div>
          </div>
        )}
      </div>

      <div className="avatar">PD</div>
    </header>
  )
}

export function Layout({ children }) {
  const [railOpen, setRailOpen] = useState(false)
  const { sattva, openSattva } = useStore()
  const loc = useLocation()

  return (
    <div className="app-shell">
      <Sidebar open={railOpen} />
      <div className="content-area">
        <Topbar onMenu={() => setRailOpen((o) => !o)} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }} key={loc.pathname}>
          {children}
        </main>
        <footer className="foot-strip">
          <span>ArthSetu · Decision-intelligence layer for rural credit - prototype for NABARD</span>
          <span className="mono" style={{ color: 'var(--on-dark-soft)' }}>DPI-ready · AA · DigiLocker · E-Shakti · v1.0</span>
        </footer>
      </div>

      {!sattva.open && (
        <button className="sattva-fab" onClick={() => openSattva()}>
          <span className="sattva-spark"><Icon.spark width={13} height={13} style={{ color: 'white' }} /></span>
          Ask Sattva
        </button>
      )}
      <SattvaDrawer />
      <ToastStack />
    </div>
  )
}
