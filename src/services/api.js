// Mock service layer — returns seed data with realistic latency so loading/empty/error
// states are exercised for real. No backend. A small failure rate can be forced for demos.

import { CASES, caseById, casesForEntity } from '../data/cases.js'
import { ENTITIES, entityById } from '../data/entities.js'
import { DISTRICTS } from '../data/geo.js'
import { SCHEMES } from '../data/schemes.js'
import { CLIMATE_SIGNALS } from '../data/climate.js'

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }
function jitter(min, max) { return min + Math.floor(Math.random() * (max - min)) }

// Force-error switch (toggled from UI error-state demos). Off by default.
let FORCE_ERROR = false
export function setForceError(v) { FORCE_ERROR = v }

async function respond(data, { min = 240, max = 620 } = {}) {
  await delay(jitter(min, max))
  if (FORCE_ERROR) throw new Error('Network error: could not reach ArthSetu data services.')
  return data
}

// ---- Portfolio / Command Center ----
export async function getPortfolioSummary() {
  const outstanding = DISTRICTS.reduce((s, d) => s + d.outstanding_cr, 0)
  const awaiting = CASES.filter((c) => c.status !== 'Decided').length
  const highRisk = CASES.filter((c) => c.risk_band === 'High')
  const highExposure = highRisk.reduce((s, c) => s + c.amount_requested, 0)
  const onTime = DISTRICTS.reduce((s, d) => s + d.recovery_rate, 0) / DISTRICTS.length
  return respond({
    outstanding_cr: Math.round(outstanding * 10) / 10,
    recovery_rate: Math.round(onTime * 1000) / 10,
    awaiting_count: awaiting,
    high_risk_exposure_cr: Math.round((highExposure / 10000000) * 10) / 10,
    high_risk_count: highRisk.length,
    trend: { outstanding: +6.4, recovery: +1.2, awaiting: -3, high_risk: +2 },
    districts: DISTRICTS,
  })
}

export async function getDecisionQueue() {
  const queue = CASES.filter((c) => c.status !== 'Decided')
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 8)
  return respond(queue)
}

// ---- Cases ----
export async function getCases(filters = {}) {
  let list = CASES.slice()
  if (filters.type) list = list.filter((c) => c.entity_type === filters.type)
  if (filters.product) list = list.filter((c) => c.product === filters.product)
  if (filters.band) list = list.filter((c) => c.risk_band === filters.band)
  if (filters.district) list = list.filter((c) => c.district === filters.district)
  if (filters.status) list = list.filter((c) => c.status === filters.status)
  if (filters.minAmount) list = list.filter((c) => c.amount_requested >= filters.minAmount)
  if (filters.maxAmount) list = list.filter((c) => c.amount_requested <= filters.maxAmount)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(
      (c) => c.id.toLowerCase().includes(q) || c.entity_name.toLowerCase().includes(q) || c.village.toLowerCase().includes(q),
    )
  }
  if (filters.sort === 'amount') list.sort((a, b) => b.amount_requested - a.amount_requested)
  else if (filters.sort === 'score') list.sort((a, b) => a.arthsetu_score - b.arthsetu_score)
  else if (filters.sort === 'sla') list.sort((a, b) => a.sla_due.localeCompare(b.sla_due))
  else list.sort((a, b) => a.priority - b.priority)
  return respond(list)
}

export async function getCase(id) {
  const c = caseById(id)
  if (!c) return respond(null)
  // simulate the score-computing step
  return respond(c, { min: 500, max: 900 })
}

// ---- Entities ----
export async function getEntities(filters = {}) {
  let list = ENTITIES.slice()
  if (filters.type) list = list.filter((e) => e.type === filters.type)
  if (filters.district) list = list.filter((e) => e.district === filters.district)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.village.toLowerCase().includes(q))
  }
  return respond(list)
}

export async function getEntity(id) {
  const e = entityById(id)
  if (!e) return respond(null)
  const cases = casesForEntity(id)
  return respond({ ...e, cases })
}

// ---- Schemes ----
export async function getSchemes() { return respond(SCHEMES) }

// Eligibility matcher — evaluates rules against an entity + optional case
export async function matchSchemes(entityId) {
  const e = entityById(entityId)
  await delay(jitter(300, 600))
  if (!e) return []
  const vintageMonths = (2026 - Number(e.formed_on.slice(0, 4))) * 12
  return SCHEMES.map((s) => {
    const results = s.eligibility_rules.map((rule) => {
      let pass = true
      let detail = ''
      switch (rule.key) {
        case 'entity_type':
          pass = s.short === 'SHG-BLP' || s.short === 'E-Shakti' ? e.type === 'SHG'
            : s.short === 'JLG' ? e.type === 'JLG'
            : s.short === 'FPO-CGS' ? e.type === 'FPO'
            : s.short === 'PACS-C' ? e.type === 'PACS'
            : true
          detail = pass ? `${e.type} matches` : `Requires ${s.short} entity type`
          break
        case 'vintage':
          pass = vintageMonths >= (s.short === 'FPO-CGS' ? 12 : 6)
          detail = `${vintageMonths} months active`
          break
        case 'grading':
        case 'repayment':
          pass = e.meeting_regularity >= 0.8 && e.recovery_rate >= 0.85
          detail = `Meeting ${(e.meeting_regularity * 100).toFixed(0)}%, recovery ${(e.recovery_rate * 100).toFixed(0)}%`
          break
        case 'account':
          pass = !!e.bank_linkage_since
          detail = `Linked since ${e.bank_linkage_since}`
          break
        case 'size':
          pass = e.member_count >= 4 && e.member_count <= 10
          detail = `${e.member_count} members`
          break
        case 'members':
          pass = e.member_count >= 100
          detail = `${e.member_count} members`
          break
        case 'zone':
          pass = true
          detail = 'Vulnerable climate zone'
          break
        default:
          pass = null // manual / needs officer confirmation
          detail = 'Officer to confirm'
      }
      return { ...rule, pass, detail }
    })
    const hard = results.filter((r) => r.pass === false)
    const manual = results.filter((r) => r.pass === null)
    const status = hard.length ? 'Not eligible' : manual.length ? 'Eligible — confirm docs' : 'Eligible'
    return { scheme: s, results, status, missing_docs: status !== 'Eligible' ? s.docs_required.slice(0, 2) : [] }
  })
}

// ---- Climate ----
export async function getClimateSignals() { return respond(CLIMATE_SIGNALS) }

// ---- Alerts (derived from climate + high-risk cases) ----
export async function getAlerts() {
  const alerts = CLIMATE_SIGNALS.filter((s) => s.severity !== 'Low').map((s) => ({
    id: `alert-${s.id}`,
    signal: `${s.type} in ${s.block} block (${s.metric})`,
    affected: s.affected_entity_ids.length,
    action: s.mitigation,
    confidence: s.confidence,
    severity: s.severity,
    route: `/climate?signal=${s.id}`,
  }))
  return respond(alerts, { min: 200, max: 400 })
}
