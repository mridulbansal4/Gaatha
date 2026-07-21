// Scenario Simulation Data - Savitri Kamble's Dairy Enterprise Journey

export const STORY = {
  entity: {
    id: 'SHG-MH-05510',
    type: 'SHG',
    name: 'Annapurna Mahila Bachat Gat',
    village: 'Dhoki',
    block: 'Osmanabad',
    district: 'Osmanabad',
    formed_on: '2019-04-12',
    bank_linkage_since: '2020-01-15',
    linkage_bank: 'Maharashtra Gramin Bank',
    members: 10,
    savings_balance: 164000,
    meeting_regularity: 0.92,
    recovery_rate: 0.96,
    crops: ['Soybean', 'Dairy'],
    product: 'SHG Term Loan - Dairy',
    purpose: 'Expand from 3 to 6 crossbred cows + mini milk chilling unit',
    amount_requested: 480000,
    tenure_months: 36,
  },

  president: {
    name: 'Savitri Kamble',
    age: 41,
    role: 'President',
    occupation: 'Dairy & Farming',
    flags: [],
  },

  // Simulated cash flow points for 12 months (milk sales + kharif harvest)
  cashFlow: [
    { period: 'Jan', amount: 18500, type: 'milk' },
    { period: 'Feb', amount: 19200, type: 'milk' },
    { period: 'Mar', amount: 20500, type: 'milk' },
    { period: 'Apr', amount: 21000, type: 'milk' },
    { period: 'May', amount: 16000, type: 'milk' }, // summer dip
    { period: 'Jun', amount: 14500, type: 'milk' },
    { period: 'Jul', amount: 15200, type: 'milk' },
    { period: 'Aug', amount: 17000, type: 'milk' },
    { period: 'Sep', amount: 19500, type: 'milk' },
    { period: 'Oct', amount: 48000, type: 'harvest' }, // soybean harvest + milk
    { period: 'Nov', amount: 22000, type: 'milk' },
    { period: 'Dec', amount: 21500, type: 'milk' },
  ],

  // Knowledge Graph representation
  graph: {
    nodes: [
      { id: 'n1', label: 'Savitri Kamble', type: 'person' },
      { id: 'n2', label: 'Annapurna SHG', type: 'entity' },
      { id: 'n3', label: 'Dhoki Village', type: 'location' },
      { id: 'n4', label: 'Marathwada Scarcity Belt', type: 'climate' },
      { id: 'n5', label: 'Maharashtra Gramin Bank', type: 'bank' },
      { id: 'n6', label: 'SHG-BLP Scheme', type: 'scheme' },
      { id: 'n7', label: 'CRAF Scheme', type: 'scheme' },
    ],
    edges: [
      { source: 'n1', target: 'n2', label: 'President of' },
      { source: 'n2', target: 'n3', label: 'Based in' },
      { source: 'n3', target: 'n4', label: 'Located in' },
      { source: 'n2', target: 'n5', label: 'Linked to' },
      { source: 'n2', target: 'n6', label: 'Eligible for' },
      { source: 'n2', target: 'n7', label: 'Eligible for' },
    ]
  },

  // 8 factors with explicit reasoning
  factors: [
    { key: 'repayment', name: 'Repayment discipline', weight: 0.22, value: 96, direction: '+', confidence: 95,
      source: 'E-Shakti + Bank ledger',
      evidence: '35 of 36 instalments paid on time. Single 12-day delay in May 2023 (summer fodder scarcity). Recovery rate 96%.',
      note: 'Extremely strong anchor for the score.' },
    { key: 'group_health', name: 'Group vintage & meetings', weight: 0.15, value: 89, direction: '+', confidence: 92,
      source: 'E-Shakti register',
      evidence: 'Active for 7 years. 92% meeting attendance. Group savings compounding steadily at ₹1.64L.',
      note: 'Durable positive indicator of group cohesion.' },
    { key: 'internal_lending', name: 'Internal lending & recovery', weight: 0.12, value: 85, direction: '+', confidence: 88,
      source: 'Internal loan ledger',
      evidence: '₹84,000 currently rotating among 6 members. 100% recovery over the last 3 cycles.',
      note: 'Signals trust and active credit rotation within the group.' },
    { key: 'over_indebtedness', name: 'Member over-indebtedness', weight: 0.13, value: 68, direction: '~', confidence: 85,
      source: 'Credit bureau scan',
      evidence: '2 of 10 members carry external flags (1 gold loan, 1 active KCC). No multiple-SHG memberships.',
      note: 'Exposure is contained, but monitor the two flagged members.' },
    { key: 'diversification', name: 'Income diversification', weight: 0.10, value: 76, direction: '+', confidence: 82,
      source: 'Cropping pattern + Occupation',
      evidence: 'Dual-income stream: daily milk sales cushion the seasonal kharif (soybean) harvest risks.',
      note: 'Dairy provides vital cash-flow smoothing.' },
    { key: 'climate', name: 'Climate exposure', weight: 0.15, value: 42, direction: '−', confidence: 89,
      source: 'IMD rainfall + Advisory',
      evidence: 'Marathwada scarcity belt. 38% rainfall deficit forecast this monsoon impacts fodder availability.',
      note: 'Significant drag on the score. Fodder inflation could strain dairy margins.' },
    { key: 'documentation', name: 'KYC & Documentation', weight: 0.08, value: 92, direction: '+', confidence: 98,
      source: 'DigiLocker',
      evidence: 'Group resolution, updated passbook, and President/Secretary KYC securely verified.',
      note: 'No documentation friction.' },
    { key: 'scheme_uplift', name: 'Scheme eligibility', weight: 0.05, value: 85, direction: '+', confidence: 91,
      source: 'NABARD scheme master',
      evidence: 'Qualifies for 3% interest subvention under SHG-BLP due to prompt repayment track record.',
      note: 'Improves repayment capacity.' },
  ],

  // Score computation results
  score: 78,
  band: 'Low',
  confidence: 90,
  verdict: 'A highly disciplined group with excellent repayment history. Cash flows are diversified (dairy + crop), but forecast rainfall deficit elevates fodder cost risks.',

  // Climate Alert Overlay
  alert: {
    title: 'Fodder Scarcity Risk',
    metric: '−38% rainfall vs normal (Jun-Aug)',
    action: 'Recommend partial financing for hydroponic fodder or attach CRAF concessional rate.',
    impact: 'Lowers effective score by 8 points on a 36-month dairy term loan.'
  },

  // Scheme evaluation
  schemes: [
    { id: 'sch-shg-blp', short: 'SHG-BLP', name: 'SHG-Bank Linkage Programme', status: 'Eligible', match: 'Type = SHG, Vintage > 6m, Bank Linked' },
    { id: 'sch-subvention', short: 'ISS', name: 'Interest Subvention Scheme', status: 'Eligible', match: 'Prompt repayment rate 96%' },
    { id: 'sch-climate-agri', short: 'CRAF', name: 'Climate-Resilient Agri Fund', status: 'Eligible - confirm docs', match: 'Climate Zone = Marathwada Scarcity' }
  ],

  // Final officer decision scenario
  decision: {
    recommendedAmount: 480000,
    recommendedVerb: 'Approve with conditions',
    conditions: ['3% interest subvention (SHG-BLP)', 'Release 30% of funds for fodder/feed advance'],
    note: 'Savitri runs a tight operation. Approving full amount but structuring disbursements to ensure feed security given the IMD deficit forecast.',
    officer: 'Priya Deshmukh',
  },

  // Post-decision learning updates
  portfolioImpact: {
    districts: [
      { name: 'Osmanabad', before: 0.883, after: 0.884, cases: 42, newCases: 43 }
    ],
    knowledge: 'Added edge: Dairy cash flows in Dhoki village show high resilience to moderate rainfall deficits when backed by E-Shakti discipline.'
  }
}
