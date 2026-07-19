// Policy / knowledge base Sattva cites. Every copilot answer chains back to a source here.

export const KNOWLEDGE = [
  {
    id: 'kb-blp-subvention',
    title: 'SHG-BLP interest subvention - eligibility',
    authority: 'NABARD Circular, SHG-BLP',
    body:
      'SHGs credit-linked under SHG-BLP are eligible for a 3% interest subvention on prompt repayment, over and above the 2% subvention to the lending bank. Category-I districts (as notified) receive additional subvention up to a 7% effective concession. Prompt repayment is the binding condition; a single overdue instalment in the cycle forfeits the incentive for that period.',
    tags: ['subvention', 'shg', 'blp', 'interest'],
  },
  {
    id: 'kb-jlg-norms',
    title: 'JLG financing norms',
    authority: 'NABARD JLG Guidelines',
    body:
      'Joint Liability Groups comprise 4-10 members engaged in the same or allied activity, bound by an inter-se joint-liability agreement. Collateral-free credit is available up to ₹1.6L per member. Banks are refinanced by NABARD. Tenant farmers, oral lessees and share-croppers without land title are the primary target segment.',
    tags: ['jlg', 'collateral', 'tenant', 'norms'],
  },
  {
    id: 'kb-fpo-guarantee',
    title: 'FPO credit guarantee cover',
    authority: 'NABARD / SFAC Credit Guarantee',
    body:
      'Loans to eligible FPOs attract credit-guarantee cover up to ₹2 Cr, lowering the effective risk weight on working-capital and infrastructure lending. Eligibility requires registration for ≥12 months and a minimum shareholder-member base (typically 100+). Guarantee cover does not replace appraisal - the FPO business plan and audited financials remain mandatory.',
    tags: ['fpo', 'guarantee', 'working capital'],
  },
  {
    id: 'kb-climate-craf',
    title: 'Climate-Resilient Agriculture Fund',
    authority: 'NABARD CRAF',
    body:
      'CRAF provides concessional term finance for climate-adaptation assets - drip/micro-irrigation, farm ponds, protected cultivation, drought-tolerant seed - prioritised in vulnerable agro-climatic zones (base climate risk ≥ 0.55). Where a repayment window overlaps a forecast rainfall deficit, attaching a CRAF-funded mitigation asset materially lowers assessed climate exposure.',
    tags: ['climate', 'craf', 'drought', 'irrigation'],
  },
  {
    id: 'kb-eshakti',
    title: 'E-Shakti digitisation & appraisal confidence',
    authority: 'NABARD E-Shakti',
    body:
      'E-Shakti digitises SHG books of account, exposing meeting regularity, savings compounding and internal-loan recovery to the lending bank in real time. Digitised groups raise appraisal confidence and cut linkage decision time. Absence of E-Shakti data is itself a confidence-lowering signal in the ArthSetu score.',
    tags: ['eshakti', 'digital', 'confidence', 'shg'],
  },
  {
    id: 'kb-overindebtedness',
    title: 'Member over-indebtedness assessment',
    authority: 'RBI / NABARD prudential norms',
    body:
      'Group appraisal must scan members for concurrent external credit - multiple SHG memberships, MFI loans, gold loans and KCC exposure. Concentration of external credit among office bearers is a stronger negative signal than the same exposure among ordinary members. Two or more heavily-indebted members typically move a group from Low to Watch band.',
    tags: ['indebtedness', 'mfi', 'bureau', 'risk'],
  },
]

// Suggested prompt chips that seed the copilot demo
export const SUGGESTED_PROMPTS = [
  'Is this group eligible for interest subvention, and what is missing?',
  'Why did the climate factor pull the score down?',
  'What conditions should I attach if I approve a lower amount?',
  'Which schemes apply to this FPO?',
  'Summarise the repayment history in plain language.',
]

export function searchKnowledge(query) {
  const q = query.toLowerCase()
  return KNOWLEDGE.map((k) => {
    const score = k.tags.reduce((s, t) => s + (q.includes(t) ? 2 : 0), 0) + (q.includes(k.title.toLowerCase().split(' ')[0]) ? 1 : 0)
    return { k, score }
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.k)
}
