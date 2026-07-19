// Credit cases with explainable factor breakdowns. The ArthSetu Score is a weighted
// composite of factor sub-scores — deterministic, never random at read time.

import { ENTITIES } from './entities.js'
import { zoneById } from './geo.js'
import { makeRng } from './rng.js'

// Product catalogue keyed by entity type
const PRODUCTS = {
  SHG: [
    { product: 'SHG-BLP Cash Credit', purpose: 'Group on-lending & crop inputs', min: 200000, max: 800000 },
    { product: 'SHG Term Loan — Dairy', purpose: 'Milch cattle purchase', min: 300000, max: 900000 },
    { product: 'SHG Micro-enterprise Loan', purpose: 'Tailoring & food processing units', min: 150000, max: 500000 },
  ],
  JLG: [
    { product: 'JLG Crop Loan', purpose: 'Kharif soybean & tur cultivation', min: 120000, max: 600000 },
    { product: 'JLG Allied Activity Loan', purpose: 'Goat rearing & poultry', min: 100000, max: 450000 },
  ],
  FPO: [
    { product: 'FPO Working Capital', purpose: 'Input aggregation & procurement', min: 1500000, max: 9000000 },
    { product: 'FPO Infrastructure Term Loan', purpose: 'Warehouse & grading unit', min: 3000000, max: 15000000 },
  ],
  PACS: [
    { product: 'PACS Crop Loan Refinance', purpose: 'Seasonal agricultural operations', min: 4000000, max: 20000000 },
  ],
}

const FACTOR_DEFS = [
  { key: 'repayment', name: 'Repayment discipline', weight: 0.22, source: 'Bank-linkage + E-Shakti repayment ledger' },
  { key: 'group_health', name: 'Group vintage & meeting regularity', weight: 0.15, source: 'E-Shakti meeting & savings register' },
  { key: 'internal_lending', name: 'Internal lending & recovery', weight: 0.12, source: 'Group internal loan ledger' },
  { key: 'over_indebtedness', name: 'Member over-indebtedness signals', weight: 0.13, source: 'Credit bureau + cross-linkage scan' },
  { key: 'diversification', name: 'Crop & income diversification', weight: 0.10, source: 'Member occupation & cropping pattern' },
  { key: 'climate', name: 'Climate exposure over loan window', weight: 0.15, source: 'IMD block rainfall + agro-advisory feed' },
  { key: 'documentation', name: 'Documentation & KYC completeness', weight: 0.08, source: 'DigiLocker + branch document vault' },
  { key: 'scheme_uplift', name: 'Scheme eligibility uplift', weight: 0.05, source: 'NABARD scheme master match' },
]

function bandFor(score) {
  if (score >= 72) return 'Low'
  if (score >= 55) return 'Watch'
  return 'High'
}

function fmtDate(rng, y0, y1) {
  const y = rng.int(y0, y1)
  const m = String(rng.int(1, 12)).padStart(2, '0')
  const d = String(rng.int(1, 28)).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Build a 12-point repayment event series for the evidence chart
function repaymentSeries(rng, discipline) {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return months.map((mo, i) => {
    const roll = rng.next()
    let status = 'paid'
    if (roll > discipline + 0.06) status = 'missed'
    else if (roll > discipline - 0.04) status = 'late'
    return { period: mo, amount: rng.int(8000, 14000), status: i < 2 ? 'paid' : status }
  })
}

function savingsSeries(rng, base) {
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  let bal = base * 0.6
  return months.map((mo) => {
    bal += rng.int(3000, 9000)
    return { period: mo, amount: Math.round(bal) }
  })
}

function factorFor(def, rng, ctx) {
  // context-aware sub-score so factors correlate with the entity's real attributes
  let value
  const evidenceMap = {}
  switch (def.key) {
    case 'repayment':
      value = Math.round(ctx.recovery * 100)
      evidenceMap.evidence = `${ctx.recovery >= 0.9 ? 'On-time' : 'Mixed'} repayment across last 12 instalments; recovery rate ${(ctx.recovery * 100).toFixed(0)}%.`
      break
    case 'group_health':
      value = Math.round(ctx.meeting * 100)
      evidenceMap.evidence = `Meeting regularity ${(ctx.meeting * 100).toFixed(0)}%, group vintage ${ctx.vintageYears} years, savings compounding steadily.`
      break
    case 'internal_lending':
      value = Math.round(ctx.recovery * 94)
      evidenceMap.evidence = `Internal loans of ₹${(ctx.internal / 1000).toFixed(0)}k rotate within group; internal recovery ${ctx.recovery >= 0.9 ? 'healthy' : ctx.recovery >= 0.8 ? 'adequate' : 'strained'}.`
      break
    case 'over_indebtedness':
      value = Math.round(100 - ctx.flagRatio * 105)
      evidenceMap.evidence = `${ctx.flaggedMembers} of ${ctx.roster} sampled members carry external credit flags (MFI / gold / KCC).`
      break
    case 'diversification':
      value = Math.round(40 + ctx.cropCount * 13)
      evidenceMap.evidence = `Income spread across ${ctx.cropCount} crop line(s) plus allied activities; ${ctx.cropCount >= 2 ? 'good' : 'thin'} diversification.`
      break
    case 'climate':
      value = Math.round((1 - ctx.climateRisk) * 100)
      evidenceMap.evidence = `${ctx.zoneLabel}: base climate risk ${(ctx.climateRisk * 100).toFixed(0)}% over the loan window; ${ctx.climateRisk > 0.6 ? 'rainfall deficit exposure elevated' : 'exposure moderate'}.`
      break
    case 'documentation':
      value = ctx.docComplete
      evidenceMap.evidence = ctx.docComplete >= 90 ? 'All KYC, resolutions and passbooks verified via DigiLocker.' : `${100 - ctx.docComplete}% of required documents pending or unverified.`
      break
    case 'scheme_uplift':
      value = ctx.schemeMatch ? 88 : 40
      evidenceMap.evidence = ctx.schemeMatch ? 'Eligible for interest subvention / guarantee uplift on prompt repayment.' : 'No material scheme uplift currently applicable.'
      break
    default:
      value = 70
  }
  value = Math.max(6, Math.min(98, value))
  const direction = value >= 66 ? '+' : value >= 50 ? '~' : '−'
  const confidence = Math.round(Math.min(0.97, 0.72 + value / 400 + rng.float(0, 0.12)) * 100)
  return {
    key: def.key,
    name: def.name,
    weight: def.weight,
    value,
    direction,
    confidence,
    source: def.source,
    evidence: evidenceMap.evidence,
    note:
      direction === '+'
        ? 'Strengthens the case; sustains score if maintained.'
        : direction === '−'
        ? 'Drags the score; principal moderation or mitigation advised.'
        : 'Neutral-to-watch; monitor over the loan window.',
  }
}

function scoreFrom(factors) {
  const total = factors.reduce((s, f) => s + f.weight, 0)
  const raw = factors.reduce((s, f) => s + f.value * f.weight, 0) / total
  return Math.round(raw)
}

function recommendedAction(score, band, amount, schemeMatch) {
  if (band === 'Low') {
    return {
      verb: 'Approve',
      amount: amount,
      text: `Approve ₹${(amount / 100000).toFixed(1)}L as requested${schemeMatch ? ', attach interest subvention under SHG-BLP' : ''}. Standard half-yearly monitoring.`,
    }
  }
  if (band === 'Watch') {
    const trimmed = Math.round((amount * 0.78) / 10000) * 10000
    return {
      verb: 'Approve with conditions',
      amount: trimmed,
      text: `Approve ₹${(trimmed / 100000).toFixed(1)}L (of ₹${(amount / 100000).toFixed(1)}L requested) with quarterly monitoring${schemeMatch ? ' and 3% interest subvention' : ''}. Release second tranche on repayment milestone.`,
    }
  }
  return {
    verb: 'Refer to committee',
    amount: Math.round((amount * 0.5) / 10000) * 10000,
    text: `Refer to credit committee. If approved, cap exposure at 50% with monthly monitoring and a climate-mitigation covenant before disbursal.`,
  }
}

function verdictLine(score, band, entity) {
  if (band === 'Low') return `Well-disciplined ${entity.type} with strong repayment and group health — low-risk lend.`
  if (band === 'Watch') return `Fundamentally sound ${entity.type}, but climate and indebtedness signals warrant a moderated, monitored exposure.`
  return `Elevated risk: repayment or climate stress concentrates here — committee review recommended before any disbursal.`
}

// ---- Hero case, authored so the demo's three walked factors land precisely ----
function buildHeroCase() {
  const entity = ENTITIES[0] // Jai Kisan
  const factors = [
    { key: 'repayment', name: 'Repayment discipline', weight: 0.22, value: 97, direction: '+', confidence: 96,
      source: 'Bank-linkage + E-Shakti repayment ledger',
      evidence: '34 of 35 instalments paid on time since Feb 2019; single 6-day delay in Oct 2023 during festival week. Recovery rate 97%.',
      note: 'Strongest positive driver. Sustains the score as long as discipline holds.' },
    { key: 'group_health', name: 'Group vintage & meeting regularity', weight: 0.15, value: 92, direction: '+', confidence: 94,
      source: 'E-Shakti meeting & savings register',
      evidence: '6-year vintage, 94% meeting attendance, savings balance ₹2.18L growing every quarter. 22 of last 24 monthly meetings held.',
      note: 'Mature, disciplined group — a durable positive.' },
    { key: 'internal_lending', name: 'Internal lending & recovery', weight: 0.12, value: 89, direction: '+', confidence: 91,
      source: 'Group internal loan ledger',
      evidence: '₹0.96L internal loans rotating among 8 members; 100% internal recovery over last cycle.',
      note: 'Signals strong intra-group trust and repayment culture.' },
    { key: 'over_indebtedness', name: 'Member over-indebtedness signals', weight: 0.13, value: 71, direction: '+', confidence: 83,
      source: 'Credit bureau + cross-linkage scan',
      evidence: '2 of 12 members carry external credit (1 MFI loan ₹18k, 1 gold loan). No multiple-SHG membership detected.',
      note: 'Contained exposure; watch the two flagged members.' },
    { key: 'diversification', name: 'Crop & income diversification', weight: 0.10, value: 74, direction: '+', confidence: 80,
      source: 'Member occupation & cropping pattern',
      evidence: 'Income across dairy, soybean, tur, tailoring and vending — not single-crop dependent.',
      note: 'Diversification cushions a bad crop season.' },
    { key: 'climate', name: 'Climate exposure over loan window', weight: 0.15, value: 34, direction: '−', confidence: 88,
      source: 'IMD block rainfall + agro-advisory feed',
      evidence: 'Osmanabad (Marathwada scarcity belt): rainfall deficit >40% forecast to overlap the Sep–Nov repayment window. Soybean yield risk elevated.',
      note: 'The single largest drag. Principal moderation or a climate covenant is advised.' },
    { key: 'documentation', name: 'Documentation & KYC completeness', weight: 0.08, value: 95, direction: '+', confidence: 97,
      source: 'DigiLocker + branch document vault',
      evidence: 'Group resolution, 6-month passbook, meeting register and office-bearer KYC all verified via DigiLocker.',
      note: 'Complete — no documentation gap.' },
    { key: 'scheme_uplift', name: 'Scheme eligibility uplift', weight: 0.05, value: 88, direction: '+', confidence: 90,
      source: 'NABARD scheme master match',
      evidence: 'Meets SHG-BLP prompt-repayment criteria → 3% interest subvention. Interest Subvention Scheme also applies on the crop-input portion.',
      note: 'Lowers effective borrowing cost; strengthens repayment capacity.' },
  ]
  const score = scoreFrom(factors)
  const band = bandFor(score)
  const rng = makeRng(4821)
  const rec = { verb: 'Approve with conditions', amount: 450000,
    text: 'Approve ₹4.5L (of ₹6.0L requested) with quarterly monitoring; attach 3% interest subvention under SHG-BLP and a rainfall-linked covenant releasing the final ₹1.5L tranche on the November repayment milestone.' }
  return {
    id: 'CASE-OSM-1042',
    entity_id: entity.id,
    entity_name: entity.name,
    entity_type: 'SHG',
    district: 'Osmanabad',
    block: 'Osmanabad',
    village: 'Yedshi',
    product: 'SHG-BLP Cash Credit',
    purpose: 'Group on-lending for kharif inputs & dairy working capital',
    amount_requested: 600000,
    tenure_months: 18,
    status: 'New',
    priority: 1,
    priority_reason: 'High amount + rainfall-deficit alert overlaps the repayment window',
    arthsetu_score: score,
    risk_band: band,
    confidence: 87,
    verdict:
      'A well-disciplined group with excellent repayment and group health — but a forecast rainfall deficit on the Sep–Nov repayment window justifies moderating the principal and attaching a climate covenant rather than sanctioning the full ask.',
    factors,
    recommended_action: rec,
    sla_due: '2026-07-22',
    submitted_on: '2026-07-16',
    officer: 'Priya Deshmukh',
    repayment_series: repaymentSeries(rng, 0.94),
    savings_series: savingsSeries(rng, entity.savings_balance),
    scheme_match: true,
    documents: [
      { name: 'Group resolution (Jul 2018).pdf', status: 'Verified', size: '212 KB' },
      { name: 'Savings passbook — 6 months.pdf', status: 'Verified', size: '1.1 MB' },
      { name: 'Meeting register extract.pdf', status: 'Verified', size: '486 KB' },
      { name: 'Office-bearer KYC (DigiLocker).pdf', status: 'Verified', size: '340 KB' },
      { name: 'Dairy activity estimate.pdf', status: 'Verified', size: '158 KB' },
    ],
  }
}

function buildCase(rng, index) {
  const entity = ENTITIES[rng.int(1, ENTITIES.length - 1)]
  const catalogue = PRODUCTS[entity.type]
  const prod = rng.pick(catalogue)
  const amount = Math.round(rng.int(prod.min, prod.max) / 10000) * 10000
  const zone = zoneById(entity.climate_zone_id)
  const roster = entity.members.length
  const flagged = entity.members.filter((m) => m.individual_flags.length).length
  const vintageYears = 2026 - Number(entity.formed_on.slice(0, 4))

  // Target a risk tier per case (~45% Low, ~33% Watch, ~22% High) and shape the point-in-time
  // appraisal context to match — keeps factors, score and band internally consistent while
  // guaranteeing a realistic spread across the portfolio.
  const roll = rng.next()
  const tier = roll < 0.22 ? 'High' : roll < 0.55 ? 'Watch' : 'Low'
  const shape = {
    Low: { recovery: [0.9, 0.99], meeting: [0.85, 0.99], climate: [0.26, 0.48], flag: [0, 0.12], doc: [90, 100], scheme: 0.72 },
    Watch: { recovery: [0.78, 0.9], meeting: [0.68, 0.85], climate: [0.5, 0.72], flag: [0.2, 0.42], doc: [78, 93], scheme: 0.55 },
    High: { recovery: [0.5, 0.72], meeting: [0.42, 0.66], climate: [0.7, 0.92], flag: [0.45, 0.78], doc: [62, 83], scheme: 0.3 },
  }[tier]
  const flaggedApprox = Math.max(flagged, Math.round(roster * rng.float(shape.flag[0], shape.flag[1])))
  const ctx = {
    recovery: Math.round(rng.float(shape.recovery[0], shape.recovery[1]) * 100) / 100,
    meeting: Math.round(rng.float(shape.meeting[0], shape.meeting[1]) * 100) / 100,
    internal: entity.internal_loans,
    flagRatio: rng.float(shape.flag[0], shape.flag[1]),
    flaggedMembers: Math.min(roster, flaggedApprox),
    roster,
    cropCount: entity.crops.length,
    climateRisk: Math.max(zone.baseRisk * 0.7, rng.float(shape.climate[0], shape.climate[1])),
    zoneLabel: zone.label,
    docComplete: rng.int(shape.doc[0], shape.doc[1]),
    schemeMatch: rng.chance(shape.scheme),
    vintageYears,
  }
  const factors = FACTOR_DEFS.map((d) => factorFor(d, rng, ctx))
  const score = scoreFrom(factors)
  const band = bandFor(score)
  const confidence = Math.round(factors.reduce((s, f) => s + f.confidence, 0) / factors.length)
  const statuses = ['New', 'New', 'In review', 'In review', 'Awaiting committee', 'Decided', 'Decided']
  const status = band === 'High' && rng.chance(0.5) ? 'Awaiting committee' : rng.pick(statuses)
  const rec = recommendedAction(score, band, amount, ctx.schemeMatch)

  return {
    id: `CASE-${entity.district.slice(0, 3).toUpperCase()}-${1050 + index}`,
    entity_id: entity.id,
    entity_name: entity.name,
    entity_type: entity.type,
    district: entity.district,
    block: entity.block,
    village: entity.village,
    product: prod.product,
    purpose: prod.purpose,
    amount_requested: amount,
    tenure_months: rng.pick([12, 18, 24, 36]),
    status,
    priority: score < 55 ? rng.int(2, 5) : rng.int(4, 12),
    priority_reason:
      band === 'High'
        ? 'Low score + high exposure — needs decision'
        : band === 'Watch'
        ? 'Climate signal overlaps repayment window'
        : 'Routine appraisal within SLA',
    arthsetu_score: score,
    risk_band: band,
    confidence,
    verdict: verdictLine(score, band, entity),
    factors,
    recommended_action: rec,
    sla_due: fmtDate(rng, 2026, 2026),
    submitted_on: fmtDate(rng, 2026, 2026),
    officer: rng.pick(['Priya Deshmukh', 'S. Kulkarni', 'A. Rane', 'M. Jadhav']),
    repayment_series: repaymentSeries(rng, ctx.recovery),
    savings_series: savingsSeries(rng, entity.savings_balance / (entity.type === 'FPO' ? 20 : 1)),
    scheme_match: ctx.schemeMatch,
    documents: [
      { name: 'Loan application.pdf', status: 'Verified', size: '198 KB' },
      { name: 'KYC bundle (DigiLocker).pdf', status: ctx.docComplete >= 90 ? 'Verified' : 'Pending', size: '620 KB' },
      { name: 'Financial statements.pdf', status: ctx.docComplete >= 82 ? 'Verified' : 'Pending', size: '410 KB' },
      { name: 'Activity estimate.pdf', status: 'Verified', size: '176 KB' },
    ],
  }
}

function generateCases() {
  const rng = makeRng(99887766)
  const hero = buildHeroCase()
  const rest = Array.from({ length: 63 }, (_, i) => buildCase(rng, i))
  return [hero, ...rest]
}

export const CASES = generateCases()

export function caseById(id) { return CASES.find((c) => c.id === id) }
export function casesForEntity(entityId) { return CASES.filter((c) => c.entity_id === entityId) }
export const HERO_CASE_ID = 'CASE-OSM-1042'
export { bandFor, FACTOR_DEFS }
