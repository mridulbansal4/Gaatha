# ArthSetu

**The decision-intelligence layer for rural India's credit.** A prototype for the NABARD Hackathon / Global Fintech Fest.

ArthSetu sits between rural borrowers and the officers who lend to them. It turns each credit case - an SHG loan, a JLG top-up, an FPO working-capital line - into a single, explainable decision surface: an evidence-backed ArthSetu Score, the factors behind it, the confidence in it, a recommended action, and a human-in-the-loop approval logged end to end.

## Run

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # production bundle
```

## The 5-minute demo path

1. **Command Center** (`/`) - portfolio health, the AI-ranked decision queue, and a red climate alert.
2. Open the top priority case → **Credit Appraisal** (`/appraisals/CASE-OSM-1042`). The ArthSetu Score reveals.
3. Walk three factors - repayment discipline (+), climate exposure (−), scheme uplift (+) - each with evidence and confidence.
4. **Override the AI**: approve a lower amount with conditions, add a note, confirm → success + audit stamp.
5. Ask **Sattva** "Is this group eligible for interest subvention, and what's missing?" → cited answer + confidence.
6. Open the **Audit Log** (`/audit`) - the decision is there, AI-vs-human, override reason captured.

## Architecture

Single-page React app (Vite), client-side routing, **no backend** - a mock service layer (`src/services/api.js`) returns deterministic seed data with realistic latency and loading / empty / error states. Sattva's answers (`src/services/ai.js`) are deterministic, keyed to intent + case context, and always shaped by the AI behaviour contract.

```
src/
  data/        Deterministic mock datasets (entities, cases+factors, schemes, climate, audit, knowledge)
  services/    api.js (mock service layer) · ai.js (Sattva) · telemetry.js
  state/       store.jsx - scope, audit trail, decisions, copilot thread, toasts
  lib/         useAsync, formatters
  components/  ui/ (primitives + SVG charts) · shell/ (rail, topbar, layout) · sattva/ (copilot)
  routes/      CommandCenter · Appraisals · AppraisalDetail · Portfolio · EntityProfile · Climate · Schemes · AuditLog
  styles/      tokens.css (design system) · global.css
```

## Design system

All visual decisions derive from the Cal.com design system (`DESIGN-cal.md`): white canvas, near-black primary CTAs, Inter display type with tight tracking, 8/12/16px radius hierarchy, semantic colour reserved for risk state only, and a single scarce dark surface per screen (the featured ArthSetu Score block; the footer strip).

## AI behaviour contract

Every AI surface answers with: **answer → why → evidence (linkable sources) → confidence → possible impact → human review**. No factor without evidence, no score without confidence, no decision without a human and an audit entry.
