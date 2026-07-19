// Entity master: SHGs, JLGs, FPOs, PACS with member rosters. Deterministic generation
// keeps the dataset stable and internally consistent across every module.

import { DISTRICTS, VILLAGES, CROPS, OCCUPATIONS } from './geo.js'
import { FEMALE_FIRST, MALE_FIRST, SURNAMES, SHG_NAME_PARTS, FPO_NAME_PARTS, JLG_NAME_PARTS } from './names.js'
import { makeRng } from './rng.js'

const FLAGS = [
  'Existing KCC loan ₹0.4L',
  'Second SHG membership',
  'Gold loan outstanding',
  'Late savings 2 months',
  'MFI loan ₹18k',
  'Migrated seasonally',
  'Widow-headed household',
  'New member (<6 mo)',
]

function fmtDate(rng, minYear, maxYear) {
  const y = rng.int(minYear, maxYear)
  const m = String(rng.int(1, 12)).padStart(2, '0')
  const d = String(rng.int(1, 28)).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function makeMembers(rng, count, female, seedActivity) {
  const roles = ['President', 'Secretary', 'Treasurer']
  return Array.from({ length: count }, (_, i) => {
    const first = female ? rng.pick(FEMALE_FIRST) : rng.pick(MALE_FIRST)
    const flags = rng.chance(0.22) ? rng.picks(FLAGS, rng.int(1, 2)) : []
    return {
      id: `mem-${rng.int(10000, 99999)}-${i}`,
      name: `${first} ${rng.pick(SURNAMES)}`,
      role: i < 3 ? roles[i] : 'Member',
      age: rng.int(24, 58),
      primary_occupation: i === 0 ? seedActivity : rng.pick(OCCUPATIONS),
      individual_flags: flags,
    }
  })
}

// ---- Hero entity, authored in full for the demo path ----
const HERO_SHG = {
  id: 'SHG-MH-04821',
  type: 'SHG',
  name: 'Jai Kisan Mahila Bachat Gat',
  village: 'Yedshi',
  block: 'Osmanabad',
  district_id: 'dst-osmanabad',
  district: 'Osmanabad',
  state: 'Maharashtra',
  formed_on: '2018-07-14',
  bank_linkage_since: '2019-02-20',
  linkage_bank: 'Maharashtra Gramin Bank',
  climate_zone_id: 'cz-marathwada-scarce',
  savings_balance: 218400,
  internal_loans: 96500,
  meeting_regularity: 0.94,
  recovery_rate: 0.97,
  primary_activity: 'Dairy & soybean cultivation',
  members: [
    { id: 'mem-h-1', name: 'Sunita Deshmukh', role: 'President', age: 43, primary_occupation: 'Dairy', individual_flags: [] },
    { id: 'mem-h-2', name: 'Lakshmi Jadhav', role: 'Secretary', age: 39, primary_occupation: 'Farming', individual_flags: [] },
    { id: 'mem-h-3', name: 'Kalpana Patil', role: 'Treasurer', age: 47, primary_occupation: 'Tailoring', individual_flags: [] },
    { id: 'mem-h-4', name: 'Shobha Kadam', role: 'Member', age: 35, primary_occupation: 'Goat rearing', individual_flags: ['MFI loan ₹18k'] },
    { id: 'mem-h-5', name: 'Rekha Shinde', role: 'Member', age: 51, primary_occupation: 'Farming', individual_flags: [] },
    { id: 'mem-h-6', name: 'Vaishali More', role: 'Member', age: 29, primary_occupation: 'Vegetable vending', individual_flags: [] },
    { id: 'mem-h-7', name: 'Archana Pawar', role: 'Member', age: 44, primary_occupation: 'Dairy', individual_flags: [] },
    { id: 'mem-h-8', name: 'Sarita Gaikwad', role: 'Member', age: 38, primary_occupation: 'Papad/pickle making', individual_flags: ['Gold loan outstanding'] },
    { id: 'mem-h-9', name: 'Ujwala Chavan', role: 'Member', age: 33, primary_occupation: 'Farm labour', individual_flags: [] },
    { id: 'mem-h-10', name: 'Manisha Salunkhe', role: 'Member', age: 41, primary_occupation: 'Farming', individual_flags: [] },
    { id: 'mem-h-11', name: 'Pushpa Kamble', role: 'Member', age: 55, primary_occupation: 'Farming', individual_flags: ['Widow-headed household'] },
    { id: 'mem-h-12', name: 'Anita Bhosale', role: 'Member', age: 31, primary_occupation: 'Tailoring', individual_flags: [] },
  ],
  member_count: 12,
  crops: ['Soybean', 'Tur (Pigeon Pea)'],
  authored: true,
}

function nameFor(type, rng) {
  if (type === 'SHG') return `${rng.pick(SHG_NAME_PARTS)} Mahila Bachat Gat`
  if (type === 'JLG') return `${rng.pick(JLG_NAME_PARTS)} Joint Liability Group`
  if (type === 'FPO') return `${rng.pick(FPO_NAME_PARTS)} Producer Company Ltd`
  return `${rng.pick(VILLAGES)} PACS`
}

function buildEntity(rng, type, index) {
  // Round-robin districts so every district carries a handful of entities - keeps the
  // district map, portfolio and climate-signal coverage consistent (no empty districts).
  const district = DISTRICTS[index % DISTRICTS.length]
  const block = rng.pick(district.blocks)
  const village = rng.pick(VILLAGES)
  const female = type === 'SHG'
  let memberCount
  let sampleRoster
  if (type === 'SHG') memberCount = rng.int(10, 16)
  else if (type === 'JLG') memberCount = rng.int(4, 9)
  else if (type === 'FPO') memberCount = rng.int(180, 820)
  else memberCount = rng.int(420, 1400)
  const rosterN = type === 'FPO' || type === 'PACS' ? 8 : memberCount
  const activity = rng.pick(OCCUPATIONS)
  sampleRoster = makeMembers(rng, rosterN, female, activity)

  const meeting = rng.float(0.6, 0.99)
  const recovery = rng.float(0.72, 0.99)
  const idPrefix = { SHG: 'SHG', JLG: 'JLG', FPO: 'FPO', PACS: 'PAC' }[type]

  return {
    id: `${idPrefix}-MH-${String(4800 + index * 7 + rng.int(1, 6)).padStart(5, '0')}`,
    type,
    name: nameFor(type, rng),
    village,
    block,
    district_id: district.id,
    district: district.name,
    state: 'Maharashtra',
    formed_on: fmtDate(rng, type === 'PACS' ? 1998 : 2015, 2022),
    bank_linkage_since: fmtDate(rng, 2017, 2023),
    linkage_bank: rng.pick(['Maharashtra Gramin Bank', 'Bank of Maharashtra', 'Osmanabad DCCB', 'Latur DCCB', 'SBI RRB']),
    climate_zone_id: district.climate_zone_id,
    savings_balance: type === 'FPO' || type === 'PACS' ? rng.int(800000, 9500000) : rng.int(48000, 340000),
    internal_loans: type === 'FPO' || type === 'PACS' ? rng.int(400000, 6000000) : rng.int(20000, 180000),
    meeting_regularity: Math.round(meeting * 100) / 100,
    recovery_rate: Math.round(recovery * 100) / 100,
    primary_activity: activity,
    members: sampleRoster,
    member_count: memberCount,
    crops: rng.picks(CROPS, rng.int(1, 3)),
  }
}

function generateEntities() {
  const rng = makeRng(20260719)
  const plan = [
    ...Array(13).fill('SHG'),
    ...Array(6).fill('JLG'),
    ...Array(4).fill('FPO'),
    ...Array(2).fill('PACS'),
  ]
  const list = plan.map((type, i) => buildEntity(rng, type, i))
  return [HERO_SHG, ...list]
}

export const ENTITIES = generateEntities()

// annotate district entity counts
for (const d of DISTRICTS) d.entities = ENTITIES.filter((e) => e.district_id === d.id).length

export function entityById(id) { return ENTITIES.find((e) => e.id === id) }
export function entitiesByType(type) { return ENTITIES.filter((e) => e.type === type) }
