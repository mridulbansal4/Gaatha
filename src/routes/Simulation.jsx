import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './simulation.css'
import { PageHead } from '../components/shell/PageHead.jsx'
import { Button, Badge, ScoreChip, RiskBadge, StatCard, Meter, Confidence, Skeleton } from '../components/ui/index.jsx'
import { Icon } from '../components/ui/icons.jsx'
import { ScoreGauge, LineChart, FactorBar } from '../components/ui/charts.jsx'
import { STORY } from '../data/simulation.js'
import { inr, pct } from '../lib/format.js'
import { useStore } from '../state/store.jsx'

const PHASES = [
  { id: 0, title: 'Introduction', sub: 'The starting point' },
  { id: 1, title: 'Data Ingestion', sub: 'Fragmented signals' },
  { id: 2, title: 'Financial Profile', sub: 'Cash flow & savings' },
  { id: 3, title: 'Intelligence Graph', sub: 'Entity relationships' },
  { id: 4, title: 'AI Reasoning', sub: 'Evidence-backed factors' },
  { id: 5, title: 'Score Emergence', sub: 'Risk classification' },
  { id: 6, title: 'Risk Overlay', sub: 'Climate intelligence' },
  { id: 7, title: 'Scheme Match', sub: 'Automatic eligibility' },
  { id: 8, title: 'Officer Decision', sub: 'Human-in-the-loop' },
  { id: 9, title: 'Audit & Governance', sub: 'Immutable record' },
  { id: 10, title: 'Ecosystem Learning', sub: 'Portfolio flywheel' },
]

function SimProgress({ currentPhase, setPhase }) {
  return (
    <div className="sim-rail">
      {PHASES.map((p) => {
        const active = currentPhase === p.id
        const completed = currentPhase > p.id
        return (
          <div
            key={p.id}
            className={`sim-step ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}
            onClick={() => { if (completed || active) setPhase(p.id) }}
          >
            <div className="sim-step-dot">
              {completed ? <Icon.check width={14} height={14} /> : p.id}
            </div>
            <div className="sim-step-line" />
            <div>
              <div className="sim-step-label">{p.title}</div>
              <div className="sim-step-sub">{p.sub}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Working({ text }) {
  return (
    <div className="sim-working">
      <div className="sim-spinner" />
      <span className="body-sm">{text}</span>
    </div>
  )
}

function AnimatedCounter({ value, prefix = '', suffix = '', format = (v) => v }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 1200
    const startTime = performance.now()
    const animate = (time) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * value))
      if (progress < 1) requestAnimationFrame(animate)
      else setCount(value)
    }
    requestAnimationFrame(animate)
  }, [value])
  return <span className="sim-counter">{prefix}{format(count)}{suffix}</span>
}

export function Simulation() {
  const [phase, setPhase] = useState(0)
  const [working, setWorking] = useState(false)
  const contentRef = useRef(null)
  const navigate = useNavigate()

  const advance = (delayMs = 800) => {
    setWorking(true)
    setTimeout(() => {
      setWorking(false)
      setPhase((p) => p + 1)
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }, 100)
    }, delayMs)
  }

  // Derived charts data
  const savingsData = STORY.cashFlow.map((cf, i) => ({
    period: cf.period,
    amount: 140000 + (i * 2000)
  }))

  return (
    <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
      <div style={{ padding: '28px 32px 0' }}>
        <PageHead
          crumbs={[{ label: 'Command Center', to: '/' }, { label: 'Scenario Simulation' }]}
          title="Scenario Simulation"
          sub="Watch ArthSetu appraise a rural enterprise from raw data ingestion to portfolio learning."
          actions={<Button variant="ghost" onClick={() => navigate('/')}>Exit Simulation</Button>}
        />
      </div>

      <div className="sim-page" style={{ padding: '0 32px 32px', margin: 0, maxWidth: 'none' }}>
        <SimProgress currentPhase={phase} setPhase={setPhase} />
        
        <div className="sim-content" ref={contentRef} style={{ paddingRight: 16 }}>
          
          {/* Phase 0: Intro */}
          {phase >= 0 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="row gap-md wrap" style={{ marginBottom: 24 }}>
                <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>SK</div>
                <div>
                  <div className="display-sm">{STORY.president.name}</div>
                  <div className="caption" style={{ fontSize: 14, marginTop: 4 }}>
                    {STORY.president.role}, {STORY.entity.name} · {STORY.entity.village}
                  </div>
                </div>
              </div>
              <div className="body-md text-muted" style={{ maxWidth: 700, marginBottom: 24, lineHeight: 1.6 }}>
                Savitri wants a loan of <strong className="text-ink">{inr(STORY.entity.amount_requested)}</strong> to expand her dairy business from 3 to 6 crossbred cows and add a milk chilling unit. 
                Traditional banking might reject her due to a thin credit file and volatile agricultural cash flows. 
                Let's see how ArthSetu processes her reality.
              </div>
              {phase === 0 && (
                <Button variant="primary" onClick={() => advance(600)}>Begin the Journey <Icon.arrowRight width={16} height={16}/></Button>
              )}
            </div>
          )}

          {/* Phase 1: Ingestion */}
          {phase >= 1 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="title-md" style={{ marginBottom: 16 }}>1. Fragmented Data Ingestion</div>
              <div className="caption" style={{ marginBottom: 24 }}>Pulling raw signals from isolated ecosystem silos.</div>
              <div className="row wrap gap-md sim-stagger">
                {['E-Shakti Register', 'Bank CBS Ledger', 'IMD Climate Feed', 'Credit Bureau', 'DigiLocker'].map(src => (
                  <div key={src} className="card-soft" style={{ padding: '12px 16px', minWidth: 160 }}>
                    <Icon.doc width={16} height={16} style={{ color: 'var(--badge-violet)', marginBottom: 8 }} />
                    <div className="title-sm">{src}</div>
                    <div className="caption" style={{ color: 'var(--success)', marginTop: 4 }}>Connected</div>
                  </div>
                ))}
              </div>
              {phase === 1 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Harmonizing data sources..." /> : <Button onClick={() => advance(1200)}>Build Financial Profile</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 2: Financial */}
          {phase >= 2 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="title-md" style={{ marginBottom: 16 }}>2. Financial Profile Assembly</div>
              <div className="caption" style={{ marginBottom: 24 }}>Deriving cash flow reality from raw ledger entries.</div>
              <div className="row wrap gap-lg" style={{ marginBottom: 32 }}>
                <div className="col gap-xs">
                  <span className="caption">Group Savings Balance</span>
                  <AnimatedCounter value={STORY.entity.savings_balance} format={(v) => inr(v)} />
                </div>
                <div className="col gap-xs">
                  <span className="caption">Repayment Rate</span>
                  <AnimatedCounter value={STORY.entity.recovery_rate * 100} suffix="%" />
                </div>
                <div className="col gap-xs">
                  <span className="caption">Meeting Regularity</span>
                  <AnimatedCounter value={STORY.entity.meeting_regularity * 100} suffix="%" />
                </div>
              </div>
              <div className="caption" style={{ marginBottom: 12 }}>Derived Cash Flow (Milk Sales + Harvest)</div>
              <LineChart data={STORY.cashFlow} height={140} stroke="var(--brand-accent)" valueKey="amount" labelKey="period" />
              {phase === 2 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Generating knowledge graph..." /> : <Button onClick={() => advance(1500)}>Map Intelligence Graph</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 3: Graph */}
          {phase >= 3 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="title-md" style={{ marginBottom: 16 }}>3. Village Knowledge Graph</div>
              <div className="caption" style={{ marginBottom: 24 }}>Contextualising the enterprise within its environment.</div>
              <div className="sim-graph">
                <svg className="sim-edge" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 50 50 Q 25 25 15 30" />
                  <path d="M 50 50 Q 75 25 85 30" />
                  <path d="M 50 50 Q 25 75 20 80" />
                  <path d="M 50 50 Q 75 75 80 80" />
                  <path d="M 50 50 Q 50 25 50 15" />
                  <path d="M 50 50 Q 50 75 50 85" />
                </svg>
                {/* Central Node */}
                <div className="sim-node" style={{ left: '50%', top: '50%', background: 'var(--brand-accent)', borderColor: 'var(--brand-accent)' }}>
                  <Icon.users width={14} height={14} /> {STORY.entity.name}
                </div>
                {/* Satellites */}
                <div className="sim-node" style={{ left: '15%', top: '30%' }}><Icon.users width={14} height={14} /> Savitri (President)</div>
                <div className="sim-node" style={{ left: '85%', top: '30%' }}><Icon.location width={14} height={14} /> Dhoki Village</div>
                <div className="sim-node" style={{ left: '20%', top: '80%' }}><Icon.schemes width={14} height={14} /> SHG-BLP</div>
                <div className="sim-node" style={{ left: '80%', top: '80%' }}><Icon.schemes width={14} height={14} /> ISS Subvention</div>
                <div className="sim-node" style={{ left: '50%', top: '15%' }}><Icon.portfolio width={14} height={14} /> Mah. Gramin Bank</div>
                <div className="sim-node" style={{ left: '50%', top: '85%' }}><Icon.climate width={14} height={14} /> Marathwada Scarcity</div>
              </div>
              {phase === 3 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Running explainable AI models..." /> : <Button onClick={() => advance(2000)}>Run AI Reasoning</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 4: Reasoning */}
          {phase >= 4 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="title-md" style={{ marginBottom: 16 }}>4. AI Reasoning Engine</div>
              <div className="caption" style={{ marginBottom: 24 }}>Computing the 8 evidence-backed factors. No black boxes.</div>
              <div className="col sim-stagger">
                {STORY.factors.map(f => (
                  <div key={f.key} style={{ padding: '16px 0', borderBottom: '1px solid var(--hairline-soft)' }}>
                    <div className="row between gap-md wrap">
                      <div className="row gap-sm" style={{ flex: 1, minWidth: 200 }}>
                        <span className={`badge tone-${f.direction === '+' ? 'success' : f.direction === '−' ? 'error' : 'warning'}`} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', padding: 0, borderRadius: '50%', fontWeight: 700, fontSize: 16 }}>{f.direction}</span>
                        <div>
                          <div className="title-sm">{f.name}</div>
                          <div className="caption">Weight {(f.weight * 100).toFixed(0)}% · <span style={{ fontStyle: 'italic' }}>{f.evidence}</span></div>
                        </div>
                      </div>
                      <div className="row gap-md" style={{ width: 200 }}>
                        <div style={{ flex: 1 }}>
                          <FactorBar value={f.value} direction={f.direction} />
                          <div className="caption" style={{ marginTop: 4, textAlign: 'right' }}>{f.value}/100</div>
                        </div>
                        <Confidence value={f.confidence} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {phase === 4 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Aggregating composite score..." /> : <Button onClick={() => advance(1200)}>Synthesize Score</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Score */}
          {phase >= 5 && (
            <div className="card sim-phase" style={{ padding: 32, background: 'var(--surface-dark)', color: 'var(--on-dark)' }}>
              <div className="row between" style={{ marginBottom: 24 }}>
                <div className="title-md" style={{ color: 'inherit' }}>5. The ArthSetu Score</div>
                <RiskBadge band={STORY.band} />
              </div>
              <div className="row gap-xl wrap" style={{ alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                  <ScoreGauge score={STORY.score} band={STORY.band} size={160} />
                  <div className="display-xl mono" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'grid', placeItems: 'center', margin: 0, color: 'inherit' }}>
                    {STORY.score}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div className="body-md" style={{ color: 'var(--on-dark-soft)', lineHeight: 1.5 }}>{STORY.verdict}</div>
                </div>
              </div>
              {phase === 5 && (
                <div style={{ marginTop: 32 }}>
                  {working ? <Working text="Scanning environment overlays..." /> : <Button variant="secondary" onClick={() => advance(1000)}>Scan Climate Overlays</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 6: Risk Overlay */}
          {phase >= 6 && (
            <div className="card sim-phase" style={{ padding: 32, borderColor: 'var(--error)' }}>
              <div className="row gap-xs" style={{ marginBottom: 16 }}>
                <Icon.alert width={20} height={20} style={{ color: 'var(--error)' }} />
                <div className="title-md">6. Live Climate Overlay</div>
              </div>
              <div className="card-soft" style={{ padding: 20, background: 'var(--error-soft)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <div className="row between wrap gap-sm" style={{ marginBottom: 12 }}>
                  <span className="title-sm" style={{ color: '#991b1b' }}>{STORY.alert.title}</span>
                  <Badge tone="error">High Severity</Badge>
                </div>
                <div className="body-sm" style={{ color: '#7f1d1d', marginBottom: 12 }}>
                  <strong>{STORY.alert.metric}</strong>. Fodder availability is at risk. 
                  {STORY.alert.impact}
                </div>
                <div className="caption" style={{ color: '#991b1b' }}><strong>Mitigation:</strong> {STORY.alert.action}</div>
              </div>
              {phase === 6 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Evaluating NABARD scheme masters..." /> : <Button onClick={() => advance(1200)}>Match Government Schemes</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 7: Schemes */}
          {phase >= 7 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="title-md" style={{ marginBottom: 16 }}>7. Automatic Scheme Matching</div>
              <div className="caption" style={{ marginBottom: 24 }}>Evaluating 14 NABARD/GoI schemes against the enterprise profile.</div>
              <div className="col gap-md sim-stagger">
                {STORY.schemes.map(s => (
                  <div key={s.id} className="row between wrap gap-md" style={{ paddingBottom: 16, borderBottom: '1px solid var(--hairline-soft)' }}>
                    <div>
                      <div className="row gap-sm" style={{ marginBottom: 4 }}>
                        <span className="title-sm">{s.short}</span>
                        <span className="caption text-muted">{s.name}</span>
                      </div>
                      <div className="caption"><Icon.check width={12} height={12} style={{ color: 'var(--success)' }} /> {s.match}</div>
                    </div>
                    <Badge tone={s.status.includes('Eligible') ? 'success' : 'muted'}>{s.status}</Badge>
                  </div>
                ))}
              </div>
              {phase === 7 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Drafting recommendation for officer..." /> : <Button onClick={() => advance(1000)}>Send to Loan Officer</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 8: Decision */}
          {phase >= 8 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="title-md">8. Officer Decision</div>
                <Badge tone="violet"><span className="badge-dot" />Human in the loop</Badge>
              </div>
              <div className="caption" style={{ marginBottom: 24 }}>Perspective shifts to Branch Manager Priya Deshmukh. She reviews the AI's recommendation and makes the final call.</div>
              <div className="card-soft" style={{ padding: 20 }}>
                <div className="row between" style={{ marginBottom: 16 }}>
                  <div className="title-sm">{STORY.decision.recommendedVerb}</div>
                  <div className="mono title-sm">{inr(STORY.decision.recommendedAmount)}</div>
                </div>
                <div className="col gap-xs" style={{ marginBottom: 16 }}>
                  {STORY.decision.conditions.map((c, i) => (
                    <Badge key={i} tone="info" dot={false}>{c}</Badge>
                  ))}
                </div>
                <div className="caption" style={{ fontStyle: 'italic' }}>Note: {STORY.decision.note}</div>
              </div>
              {phase === 8 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Writing to immutable ledger..." /> : <Button onClick={() => advance(1000)}>Confirm & Audit</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 9: Audit */}
          {phase >= 9 && (
            <div className="card sim-phase" style={{ padding: 32, borderColor: 'var(--success)', background: 'var(--success-soft)' }}>
              <div className="row gap-xs" style={{ marginBottom: 16 }}>
                <Icon.audit width={20} height={20} style={{ color: 'var(--success)' }} />
                <div className="title-md">9. Immutable Audit Trail</div>
              </div>
              <div className="body-sm" style={{ marginBottom: 16 }}>Decision locked and written to the governance ledger. Complete transparency achieved.</div>
              <div className="row between wrap gap-lg">
                <div className="col gap-xs">
                  <span className="caption">AI Recommendation</span>
                  <span className="title-sm">{STORY.decision.recommendedVerb}</span>
                </div>
                <div className="col gap-xs">
                  <span className="caption">Human Decision</span>
                  <span className="title-sm">{STORY.decision.recommendedVerb}</span>
                </div>
                <div className="col gap-xs">
                  <span className="caption">Alignment</span>
                  <Badge tone="success">100% Aligned</Badge>
                </div>
              </div>
              {phase === 9 && (
                <div style={{ marginTop: 24 }}>
                  {working ? <Working text="Updating district risk models..." /> : <Button onClick={() => advance(1500)}>Update Ecosystem Flywheel</Button>}
                </div>
              )}
            </div>
          )}

          {/* Phase 10: Flywheel */}
          {phase >= 10 && (
            <div className="card sim-phase" style={{ padding: 32 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="title-md">10. The Learning Ecosystem</div>
                <Icon.command width={20} height={20} style={{ color: 'var(--badge-violet)' }} />
              </div>
              <div className="body-md text-muted" style={{ marginBottom: 24 }}>
                The decision doesn't end here. ArthSetu learns from Savitri's case to improve future appraisals in the district.
              </div>
              <div className="row wrap gap-lg" style={{ marginBottom: 24 }}>
                <div className="card-soft" style={{ padding: 16, flex: 1, minWidth: 200 }}>
                  <div className="caption" style={{ marginBottom: 8 }}>Osmanabad Recovery Rate Model</div>
                  <div className="row gap-sm" style={{ alignItems: 'baseline' }}>
                    <span className="title-md text-muted" style={{ textDecoration: 'line-through' }}>{pct(STORY.portfolioImpact.districts[0].before * 100, 1)}</span>
                    <Icon.arrowRight width={14} height={14} style={{ color: 'var(--muted)' }} />
                    <span className="display-sm text-success">{pct(STORY.portfolioImpact.districts[0].after * 100, 1)}</span>
                  </div>
                </div>
                <div className="card-soft" style={{ padding: 16, flex: 1, minWidth: 200 }}>
                  <div className="caption" style={{ marginBottom: 8 }}>New Intelligence Edge Created</div>
                  <div className="body-sm">{STORY.portfolioImpact.knowledge}</div>
                </div>
              </div>
              <div className="row between wrap gap-md" style={{ padding: 20, background: 'var(--canvas)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)' }}>
                <div>
                  <div className="title-sm">Simulation Complete</div>
                  <div className="caption">You have seen the full lifecycle of an ArthSetu decision.</div>
                </div>
                <div className="row gap-sm">
                  <Button variant="secondary" onClick={() => { setPhase(0); window.scrollTo(0,0) }}>Restart</Button>
                  <Button variant="primary" onClick={() => navigate('/')}>Return to Command Center</Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
