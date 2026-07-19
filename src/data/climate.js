// Live climate signals feeding the alert engine and the Appraisal climate factor.

import { ENTITIES } from './entities.js'

function entitiesInBlock(block, ...extra) {
  const ids = ENTITIES.filter((e) => e.block === block).map((e) => e.id)
  return [...new Set([...ids, ...extra])]
}

// Broader net for flagship signals: everything in a district, plus explicit extras.
function entitiesInDistrict(district, ...extra) {
  const ids = ENTITIES.filter((e) => e.district === district).map((e) => e.id)
  return [...new Set([...ids, ...extra])]
}

export const CLIMATE_SIGNALS = [
  {
    id: 'sig-osm-rain',
    block: 'Osmanabad',
    district: 'Osmanabad',
    type: 'Rainfall deficit',
    severity: 'High',
    metric: '−43% vs normal (Jun-Jul)',
    window_start: '2026-07-01',
    window_end: '2026-11-15',
    affected_entity_ids: entitiesInDistrict('Osmanabad', 'SHG-MH-04821'),
    repayment_windows_at_risk: 7,
    mitigation: 'Stagger repayment schedules to post-rabi; attach rainfall-linked covenant; promote drought-tolerant seed via CRAF.',
    confidence: 88,
  },
  {
    id: 'sig-beed-heat',
    block: 'Georai',
    district: 'Beed',
    type: 'Heat stress advisory',
    severity: 'Medium',
    metric: 'Max temp >42°C for 9 days',
    window_start: '2026-07-05',
    window_end: '2026-08-20',
    affected_entity_ids: entitiesInDistrict('Beed'),
    repayment_windows_at_risk: 3,
    mitigation: 'Advisory on cattle heat management for dairy SHGs; monitor milk-yield-linked cash flows.',
    confidence: 76,
  },
  {
    id: 'sig-yvt-pest',
    block: 'Pusad',
    district: 'Yavatmal',
    type: 'Pink bollworm advisory',
    severity: 'High',
    metric: 'Pest incidence above ETL in 12 villages',
    window_start: '2026-07-10',
    window_end: '2026-10-30',
    affected_entity_ids: entitiesInDistrict('Yavatmal'),
    repayment_windows_at_risk: 4,
    mitigation: 'Cotton JLGs advised pheromone traps + timely spray; pre-emptively flag crop-loan repayment risk.',
    confidence: 81,
  },
  {
    id: 'sig-latur-excess',
    block: 'Ausa',
    district: 'Latur',
    type: 'Rainfall excess / waterlogging',
    severity: 'Medium',
    metric: '+38% vs normal, localized flooding',
    window_start: '2026-07-08',
    window_end: '2026-09-10',
    affected_entity_ids: entitiesInDistrict('Latur'),
    repayment_windows_at_risk: 2,
    mitigation: 'Field verification of soybean damage; consider crop-insurance claim facilitation before recovery.',
    confidence: 72,
  },
  {
    id: 'sig-jalna-dry',
    block: 'Bhokardan',
    district: 'Jalna',
    type: 'Dry spell',
    severity: 'Medium',
    metric: '18-day dry spell in tur belt',
    window_start: '2026-07-02',
    window_end: '2026-08-25',
    affected_entity_ids: entitiesInDistrict('Jalna'),
    repayment_windows_at_risk: 3,
    mitigation: 'Protective-irrigation advisory; watch tur-dependent JLG cash flows.',
    confidence: 70,
  },
  {
    id: 'sig-nanded-rain',
    block: 'Kinwat',
    district: 'Nanded',
    type: 'Rainfall deficit',
    severity: 'Low',
    metric: '−16% vs normal',
    window_start: '2026-07-01',
    window_end: '2026-09-30',
    affected_entity_ids: entitiesInDistrict('Nanded'),
    repayment_windows_at_risk: 1,
    mitigation: 'Monitor; no immediate action. Re-assess at next fortnightly IMD update.',
    confidence: 68,
  },
]

export function signalById(id) { return CLIMATE_SIGNALS.find((s) => s.id === id) }
