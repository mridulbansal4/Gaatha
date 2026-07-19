// NABARD / GoI scheme master. Eligibility rules are evaluated in the service layer.

export const SCHEMES = [
  {
    id: 'sch-shg-blp',
    name: 'SHG-Bank Linkage Programme',
    short: 'SHG-BLP',
    authority: 'NABARD',
    benefit_type: 'Credit linkage + interest subvention',
    uplift: '3% interest subvention on prompt repayment; up to 7% in category-I districts',
    summary:
      'Flagship SHG financing channel. Credit-linked savings groups access bank loans at concessional rates; prompt repayment earns interest subvention.',
    eligibility_rules: [
      { key: 'entity_type', label: 'Entity is an SHG', test: 'type == SHG' },
      { key: 'vintage', label: 'Group active ≥ 6 months', test: 'vintage_months >= 6' },
      { key: 'grading', label: 'Passed group grading (savings + meeting regularity)', test: 'meeting_regularity >= 0.8' },
      { key: 'account', label: 'Active SB account with linkage bank', test: 'bank_linkage == true' },
    ],
    docs_required: ['Group resolution', 'Savings passbook (6 months)', 'Meeting register', 'KYC of office bearers'],
  },
  {
    id: 'sch-eshakti',
    name: 'E-Shakti Digitisation of SHGs',
    short: 'E-Shakti',
    authority: 'NABARD',
    benefit_type: 'Digital bookkeeping + credit-score visibility',
    uplift: 'Digitised group records improve appraisal confidence; faster linkage decisions',
    summary:
      'Digitises SHG books of account so that banks can view group financials in real time, improving creditworthiness assessment and reducing appraisal time.',
    eligibility_rules: [
      { key: 'entity_type', label: 'Entity is an SHG', test: 'type == SHG' },
      { key: 'digital', label: 'Group agrees to digital bookkeeping onboarding', test: 'manual' },
    ],
    docs_required: ['Group resolution', 'Member roster', 'Bank account details'],
  },
  {
    id: 'sch-jlg',
    name: 'Joint Liability Group Financing',
    short: 'JLG',
    authority: 'NABARD',
    benefit_type: 'Collateral-free group credit',
    uplift: 'Refinance support to banks; collateral-free credit up to ₹1.6L per member',
    summary:
      'Financing to informal groups of 4–10 members with joint liability, typically tenant farmers and share-croppers without land title.',
    eligibility_rules: [
      { key: 'entity_type', label: 'Entity is a JLG', test: 'type == JLG' },
      { key: 'size', label: 'Group of 4–10 members', test: 'member_count in 4..10' },
      { key: 'activity', label: 'Members in same/allied activity', test: 'manual' },
    ],
    docs_required: ['Inter-se agreement', 'Member KYC', 'Activity/land-tenancy proof'],
  },
  {
    id: 'sch-fpo-guarantee',
    name: 'FPO Credit Guarantee',
    short: 'FPO-CGS',
    authority: 'NABARD / SFAC',
    benefit_type: 'Credit guarantee cover',
    uplift: 'Guarantee cover up to ₹2 Cr; lowers effective risk weight on working-capital lines',
    summary:
      'Credit guarantee for loans to Farmer Producer Organisations, reducing lender risk on working-capital and infrastructure finance.',
    eligibility_rules: [
      { key: 'entity_type', label: 'Entity is an FPO', test: 'type == FPO' },
      { key: 'vintage', label: 'FPO registered ≥ 12 months', test: 'vintage_months >= 12' },
      { key: 'members', label: 'Minimum 100 shareholder-members', test: 'member_count >= 100' },
    ],
    docs_required: ['Certificate of incorporation', 'Audited financials', 'Business plan', 'Board resolution'],
  },
  {
    id: 'sch-subvention',
    name: 'Interest Subvention Scheme (Agri Credit)',
    short: 'ISS',
    authority: 'Government of India',
    benefit_type: 'Interest subvention',
    uplift: '2% subvention + 3% prompt-repayment incentive → effective rate as low as 4%',
    summary:
      'Interest subvention on short-term crop and allied-activity credit for prompt-paying borrowers, delivered through the lending institution.',
    eligibility_rules: [
      { key: 'purpose', label: 'Loan for crop / allied agri activity', test: 'purpose in agri' },
      { key: 'amount', label: 'Principal within ₹3L eligible ceiling', test: 'amount <= 300000' },
      { key: 'repayment', label: 'Prompt repayment track record', test: 'repayment_discipline >= 0.85' },
    ],
    docs_required: ['Crop/activity declaration', 'Land or tenancy record', 'Repayment history'],
  },
  {
    id: 'sch-pacs-computerisation',
    name: 'PACS Computerisation Programme',
    short: 'PACS-C',
    authority: 'NABARD / Ministry of Cooperation',
    benefit_type: 'Digital infrastructure grant',
    uplift: 'Funds core banking + ERP rollout; makes PACS ledgers appraisal-ready',
    summary:
      'Computerises Primary Agricultural Credit Societies onto a common ERP, making cooperative ledgers digitally auditable and linkable.',
    eligibility_rules: [
      { key: 'entity_type', label: 'Entity is a PACS', test: 'type == PACS' },
      { key: 'audit', label: 'Society audit grade A or B', test: 'manual' },
    ],
    docs_required: ['Society registration', 'Latest audit report', 'Member ledger sample'],
  },
  {
    id: 'sch-climate-agri',
    name: 'Climate-Resilient Agriculture Fund',
    short: 'CRAF',
    authority: 'NABARD',
    benefit_type: 'Concessional term finance',
    uplift: 'Concessional finance for micro-irrigation, water harvesting, drought-tolerant seed',
    summary:
      'Term finance for climate-adaptation assets — drip irrigation, farm ponds, protected cultivation — in vulnerable agro-climatic zones.',
    eligibility_rules: [
      { key: 'zone', label: 'Entity in a vulnerable climate zone', test: 'climate_baseRisk >= 0.55' },
      { key: 'purpose', label: 'Loan funds a climate-adaptation asset', test: 'manual' },
    ],
    docs_required: ['Technical estimate', 'Land record', 'Water-source certificate'],
  },
]

export function schemeById(id) { return SCHEMES.find((s) => s.id === id) }
