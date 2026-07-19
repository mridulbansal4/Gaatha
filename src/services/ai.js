// Sattva — the explainable copilot engine. Deterministic responses keyed to intent +
// case context, always shaped by the AI behaviour contract (PRD §7):
// answer → why → evidence(sources) → confidence → possible impact → human review.

import { searchKnowledge, KNOWLEDGE } from '../data/knowledge.js'
import { caseById } from '../data/cases.js'
import { entityById } from '../data/entities.js'

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }

function kb(id) { return KNOWLEDGE.find((k) => k.id === id) }

function classify(q) {
  const s = q.toLowerCase()
  if (/(eligib|subvention|scheme|guarantee|craf|missing)/.test(s)) return 'scheme'
  if (/(climate|rainfall|drought|weather|pull the score|pulled)/.test(s)) return 'climate'
  if (/(condition|approve|lower|trim|covenant|disburs)/.test(s)) return 'recommend'
  if (/(repayment|history|late|missed|overdue|discipline)/.test(s)) return 'repayment'
  if (/(why|score|factor|breakdown|explain)/.test(s)) return 'explain'
  return 'search'
}

// Build a contract-shaped answer object
function answer({ text, why, evidence, confidence, impact, humanReview, sources = [] }) {
  return { text, why, evidence, confidence, impact, humanReview, sources }
}

export async function askSattva(query, ctx = {}) {
  await delay(700 + Math.random() * 700)
  const intent = classify(query)
  const c = ctx.caseId ? caseById(ctx.caseId) : null
  const entity = c ? entityById(c.entity_id) : null

  if (intent === 'scheme' && c) {
    const eligible = c.scheme_match
    const src = kb('kb-blp-subvention')
    return answer({
      text: eligible
        ? `Yes — ${c.entity_name} is eligible for the 3% interest subvention under SHG-BLP, contingent on continued prompt repayment.`
        : `${c.entity_name} does not currently clear the prompt-repayment bar for interest subvention.`,
      why: eligible
        ? 'The group has paid 34 of 35 instalments on time and meets the SHG-BLP prompt-repayment condition. The Interest Subvention Scheme additionally applies to the crop-input portion of the loan.'
        : 'A recent overdue instalment forfeits the prompt-repayment incentive for the current cycle.',
      evidence: [
        'Repayment ledger: 97% recovery, single 6-day delay (Oct 2023).',
        'Scheme master: SHG-BLP + ISS both matched on entity type and loan purpose.',
        'Missing to finalise: updated savings passbook page for the current quarter.',
      ],
      confidence: 90,
      impact: 'Attaching the subvention lowers the effective borrowing rate by ~3%, improving repayment capacity and the climate-window cushion.',
      humanReview: true,
      sources: [src, kb('kb-eshakti')].filter(Boolean),
    })
  }

  if (intent === 'climate' && c) {
    const cf = c.factors.find((f) => f.key === 'climate')
    return answer({
      text: `The climate factor is the single largest drag on ${c.entity_name}'s score — sub-score ${cf?.value ?? 34}/100.`,
      why: 'A forecast rainfall deficit greater than 40% overlaps the Sep–Nov repayment window in the Marathwada scarcity belt, raising soybean yield risk exactly when instalments fall due.',
      evidence: [
        cf?.evidence || 'IMD block rainfall shows −43% vs normal over the loan window.',
        'Active climate signal sig-osm-rain flags 7 repayment windows at risk in Osmanabad block.',
      ],
      confidence: cf?.confidence ?? 88,
      impact: 'Moderating principal to ₹4.5L and attaching a rainfall-linked covenant (final tranche on the November milestone) offsets most of this exposure.',
      humanReview: true,
      sources: [kb('kb-climate-craf')].filter(Boolean),
    })
  }

  if (intent === 'recommend' && c) {
    const rec = c.recommended_action
    return answer({
      text: `Recommended: ${rec.verb} — ₹${(rec.amount / 100000).toFixed(1)}L.`,
      why: rec.text,
      evidence: [
        `ArthSetu Score ${c.arthsetu_score}/100 (${c.risk_band}), confidence ${c.confidence}%.`,
        'Strongest drivers: repayment discipline (+), group health (+); largest drag: climate exposure (−).',
      ],
      confidence: c.confidence,
      impact: 'Conditions cap downside if the rainfall deficit materialises while preserving the group\'s access to working capital.',
      humanReview: true,
      sources: [kb('kb-blp-subvention'), kb('kb-climate-craf')].filter(Boolean),
    })
  }

  if (intent === 'repayment' && c) {
    const paid = c.repayment_series.filter((r) => r.status === 'paid').length
    const late = c.repayment_series.filter((r) => r.status === 'late').length
    const missed = c.repayment_series.filter((r) => r.status === 'missed').length
    return answer({
      text: `Over the last 12 instalments: ${paid} paid on time, ${late} late, ${missed} missed.`,
      why: 'Repayment discipline is weighted 22% in the score — the heaviest single factor. This group\'s record is strong and stable.',
      evidence: [
        `Recovery rate ${(entity?.recovery_rate * 100 || 97).toFixed(0)}%.`,
        'No instalment overdue beyond a week; delays cluster around festival cash-flow gaps, not distress.',
      ],
      confidence: 92,
      impact: 'A sustained record like this is what keeps the group in the Low/Watch band and unlocks subvention.',
      humanReview: false,
      sources: [kb('kb-eshakti')].filter(Boolean),
    })
  }

  if (intent === 'explain' && c) {
    const top = [...c.factors].sort((a, b) => b.value * b.weight - a.value * a.weight)[0]
    const bottom = [...c.factors].sort((a, b) => a.value - b.value)[0]
    return answer({
      text: `The score is ${c.arthsetu_score}/100 (${c.risk_band}). It is a weighted composite of 8 evidence-backed factors.`,
      why: `The biggest lift is "${top.name}" (+); the biggest drag is "${bottom.name}" (${bottom.direction}). No factor enters the score without a linked source record.`,
      evidence: c.factors.slice(0, 3).map((f) => `${f.name}: ${f.value}/100 — ${f.evidence}`),
      confidence: c.confidence,
      impact: 'Understanding the drivers lets you act on the specific weak factor rather than the headline number.',
      humanReview: true,
      sources: [kb('kb-overindebtedness')].filter(Boolean),
    })
  }

  // Generic knowledge search
  const hits = searchKnowledge(query)
  if (hits.length) {
    const top = hits[0]
    return answer({
      text: top.body.split('. ')[0] + '.',
      why: `Drawn from ${top.authority}. This is policy guidance, not a case-specific decision.`,
      evidence: [top.body],
      confidence: 84,
      impact: 'Use this to frame the officer decision; the final call and any exception remain with you.',
      humanReview: true,
      sources: hits.slice(0, 2),
    })
  }

  return answer({
    text: "I don't have a grounded answer for that yet.",
    why: 'I only answer from NABARD scheme masters, the case ledger, and the policy knowledge base — I won\'t invent authority.',
    evidence: ['No matching policy or case record found for this query.'],
    confidence: 30,
    impact: 'Rephrase toward a scheme, a factor, or this case, or route it to a human reviewer.',
    humanReview: true,
    sources: [],
  })
}
