// Geography — 8 districts across Maharashtra's Marathwada & western belt, each with blocks
// and villages. Climate zones drive risk exposure elsewhere in the model.

export const STATE = 'Maharashtra'

export const CLIMATE_ZONES = {
  'cz-marathwada-dry': { id: 'cz-marathwada-dry', label: 'Marathwada Assured-Rainfall Dry', baseRisk: 0.62 },
  'cz-marathwada-scarce': { id: 'cz-marathwada-scarce', label: 'Marathwada Scarcity Belt', baseRisk: 0.78 },
  'cz-western-transition': { id: 'cz-western-transition', label: 'Western Maharashtra Transition', baseRisk: 0.38 },
  'cz-vidarbha-cotton': { id: 'cz-vidarbha-cotton', label: 'Vidarbha Cotton Plateau', baseRisk: 0.55 },
}

export const DISTRICTS = [
  {
    id: 'dst-osmanabad', name: 'Osmanabad', code: 'OSM', climate_zone_id: 'cz-marathwada-scarce',
    blocks: ['Osmanabad', 'Tuljapur', 'Kalamb', 'Bhoom', 'Paranda', 'Washi'],
    recovery_rate: 0.883, outstanding_cr: 214.6, entities: 0,
  },
  {
    id: 'dst-latur', name: 'Latur', code: 'LAT', climate_zone_id: 'cz-marathwada-dry',
    blocks: ['Latur', 'Ausa', 'Nilanga', 'Udgir', 'Ahmadpur', 'Renapur'],
    recovery_rate: 0.921, outstanding_cr: 342.1, entities: 0,
  },
  {
    id: 'dst-beed', name: 'Beed', code: 'BED', climate_zone_id: 'cz-marathwada-scarce',
    blocks: ['Beed', 'Georai', 'Majalgaon', 'Ambajogai', 'Parli', 'Kaij'],
    recovery_rate: 0.847, outstanding_cr: 188.9, entities: 0,
  },
  {
    id: 'dst-nanded', name: 'Nanded', code: 'NAN', climate_zone_id: 'cz-marathwada-dry',
    blocks: ['Nanded', 'Ardhapur', 'Mudkhed', 'Hadgaon', 'Kinwat', 'Loha'],
    recovery_rate: 0.905, outstanding_cr: 276.4, entities: 0,
  },
  {
    id: 'dst-solapur', name: 'Solapur', code: 'SOL', climate_zone_id: 'cz-western-transition',
    blocks: ['Solapur North', 'Barshi', 'Pandharpur', 'Madha', 'Karmala', 'Sangola'],
    recovery_rate: 0.938, outstanding_cr: 401.7, entities: 0,
  },
  {
    id: 'dst-jalna', name: 'Jalna', code: 'JAL', climate_zone_id: 'cz-marathwada-dry',
    blocks: ['Jalna', 'Bhokardan', 'Jafferabad', 'Partur', 'Ghansawangi', 'Ambad'],
    recovery_rate: 0.892, outstanding_cr: 159.3, entities: 0,
  },
  {
    id: 'dst-yavatmal', name: 'Yavatmal', code: 'YVT', climate_zone_id: 'cz-vidarbha-cotton',
    blocks: ['Yavatmal', 'Pusad', 'Umarkhed', 'Wani', 'Ghatanji', 'Digras'],
    recovery_rate: 0.861, outstanding_cr: 233.8, entities: 0,
  },
  {
    id: 'dst-ahmednagar', name: 'Ahmednagar', code: 'ANR', climate_zone_id: 'cz-western-transition',
    blocks: ['Ahmednagar', 'Shrirampur', 'Rahuri', 'Sangamner', 'Kopargaon', 'Newasa'],
    recovery_rate: 0.944, outstanding_cr: 388.2, entities: 0,
  },
]

export const VILLAGES = [
  'Yedshi', 'Dhoki', 'Naldurg', 'Wagholi', 'Kasgi', 'Sarola', 'Lohara', 'Terkheda',
  'Anala', 'Shindphal', 'Ganjur', 'Padoli', 'Warud', 'Sawargaon', 'Kingaon',
  'Chincholi', 'Devgaon', 'Hipparga', 'Murud', 'Rui', 'Takli', 'Wadgaon',
  'Belkund', 'Nimgaon', 'Pimpalgaon', 'Sonkhed', 'Malegaon', 'Ranjani',
]

export const CROPS = ['Soybean', 'Tur (Pigeon Pea)', 'Cotton', 'Sugarcane', 'Jowar', 'Bengal Gram', 'Onion', 'Wheat', 'Green Gram']
export const OCCUPATIONS = ['Farming', 'Dairy', 'Farm labour', 'Tailoring', 'Goat rearing', 'Vegetable vending', 'Kirana shop', 'Papad/pickle making', 'Poultry']

export function districtById(id) { return DISTRICTS.find((d) => d.id === id) }
export function zoneById(id) { return CLIMATE_ZONES[id] }
