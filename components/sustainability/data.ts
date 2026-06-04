// ─────────────────────────────────────────────────────────────────────────────
// Sustainability Intelligence Dashboard — Data Layer
// Realistic figures derived from Jetwing Hotels FY2024/25 ESG operations.
// ─────────────────────────────────────────────────────────────────────────────

// ── Brand palette ────────────────────────────────────────────────────────────
export const C = {
  primary:      '#8B9E23',
  primaryDark:  '#6B7A1A',
  primaryLight: '#A5B82D',
  secondary:    '#E91E8C',
  accent:       '#FFC107',
  accentDark:   '#F59E0B',
  blue:         '#3B82F6',
  blueDark:     '#1D4ED8',
  teal:         '#14B8A6',
  purple:       '#8B5CF6',
  red:          '#EF4444',
  amber:        '#92400E',
  green:        '#16A34A',
  muted:        '#94A3B8',
  text:         '#1A1A1A',
  subtext:      '#64748B',
  border:       '#E5E7EB',
  bg:           '#F9FAFB',
  softGreen:    '#F0FBF5',
  softGreenBd:  '#C6DFA8',
} as const;

// ── Properties ───────────────────────────────────────────────────────────────
export const PROPERTIES = [
  'All Properties',
  'Jetwing Yala',
  'Jetwing Lake',
  'Jetwing Colombo Seven',
  'Jetwing Kaduruketha',
  'Jetwing Kandy Gallery',
  'Jetwing Surf & Safari',
  'Jetwing Jungle Lodge',
] as const;

export const DATE_RANGES = [
  'This Month',
  'This Quarter',
  'FY 2024/25',
  'Last 12 Months',
  'Year to Date',
  'Custom Range',
] as const;

// ── Types ────────────────────────────────────────────────────────────────────
export type Trend = 'up' | 'down' | 'flat';
export interface Kpi {
  id: string;
  label: string;
  value: string;
  rawUnit?: string;
  delta: string;            // e.g. "−6.2%"
  deltaDir: Trend;          // direction of the metric
  good: boolean;            // is the movement favourable?
  prev: string;             // previous month comparison label
  progress: number;         // 0–100 toward target
  target: string;           // target label
  spark: number[];          // sparkline series
}

// ── KPI cards (Dashboard Overview) ───────────────────────────────────────────
export const KPIS: Kpi[] = [
  {
    id: 'carbon', label: 'Total Carbon Emissions', value: '9,257', rawUnit: 'tCO₂',
    delta: '−18.2%', deltaDir: 'down', good: true, prev: '11,315 tCO₂ prior year',
    progress: 64, target: '7,000 tCO₂ by 2030',
    spark: [11315, 10980, 10610, 10240, 9980, 9740, 9610, 9480, 9390, 9320, 9290, 9257],
  },
  {
    id: 'carbon-reduction', label: 'Carbon Reduction', value: '18.2', rawUnit: '%',
    delta: '+4.1 pts', deltaDir: 'up', good: true, prev: '14.1% prior year',
    progress: 73, target: '25% by 2030',
    spark: [9, 10, 11, 12.5, 13.4, 14.1, 15.2, 16, 16.8, 17.4, 17.9, 18.2],
  },
  {
    id: 'energy', label: 'Total Energy Consumption', value: '46.1M', rawUnit: 'kWh',
    delta: '−2.2%', deltaDir: 'down', good: true, prev: '47.1M kWh prior year',
    progress: 58, target: '42M kWh by 2027',
    spark: [4.05, 3.98, 3.91, 3.86, 3.80, 3.78, 3.84, 3.90, 3.86, 3.83, 3.81, 3.79],
  },
  {
    id: 'solar', label: 'Solar Energy Generated', value: '3.44M', rawUnit: 'kWh',
    delta: '+11.6%', deltaDir: 'up', good: true, prev: '3.08M kWh prior year',
    progress: 66, target: '5.2M kWh by 2028',
    spark: [240, 252, 268, 281, 290, 305, 312, 298, 286, 295, 308, 318],
  },
  {
    id: 'water', label: 'Water Consumption', value: '106.5M', rawUnit: 'Litres',
    delta: '−8.3%', deltaDir: 'down', good: true, prev: '116.1M L prior year',
    progress: 61, target: '95M L by 2027',
    spark: [9.7, 9.5, 9.3, 9.1, 8.9, 8.8, 8.95, 9.0, 8.85, 8.8, 8.75, 8.7],
  },
  {
    id: 'waste', label: 'Waste Recycled / Diverted', value: '77', rawUnit: '%',
    delta: '+5.0 pts', deltaDir: 'up', good: true, prev: '72% prior year',
    progress: 77, target: '100% by 2030',
    spark: [70, 71, 72, 72, 73, 74, 74, 75, 75, 76, 77, 77],
  },
  {
    id: 'sourcing', label: 'Local Sourcing', value: '78', rawUnit: '%',
    delta: '+6.0 pts', deltaDir: 'up', good: true, prev: '72% prior year',
    progress: 87, target: '90% by 2027',
    spark: [70, 71, 72, 73, 73, 74, 75, 76, 76, 77, 77, 78],
  },
  {
    id: 'community', label: 'Community Programmes', value: '385', rawUnit: 'programmes',
    delta: '+12.9%', deltaDir: 'up', good: true, prev: '341 prior year',
    progress: 77, target: '500 by 2027',
    spark: [22, 26, 28, 30, 31, 33, 34, 35, 32, 36, 38, 40],
  },
  {
    id: 'score', label: 'Sustainability Score', value: '82', rawUnit: '/100',
    delta: '+6 pts', deltaDir: 'up', good: true, prev: '76 prior year',
    progress: 82, target: '90 by 2027',
    spark: [74, 75, 76, 77, 77, 78, 79, 80, 80, 81, 81, 82],
  },
  {
    id: 'esg', label: 'ESG Compliance Score', value: '88', rawUnit: '/100',
    delta: '+3 pts', deltaDir: 'up', good: true, prev: '85 prior year',
    progress: 88, target: '95 by 2027',
    spark: [83, 84, 84, 85, 85, 86, 86, 87, 87, 87, 88, 88],
  },
];

// ── Monthly carbon emissions (tCO₂) ──────────────────────────────────────────
export const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export const carbonMonthly = MONTHS.map((m, i) => ({
  month: m,
  scope1: [205, 198, 192, 186, 181, 178, 184, 190, 187, 184, 182, 180][i],
  scope2: [560, 548, 532, 518, 506, 498, 512, 528, 519, 510, 504, 498][i],
}));

// 12-month AI forecast (tCO₂ total per month, with confidence band)
export const carbonForecast = [
  ...carbonMonthly.map(d => ({ month: d.month, actual: d.scope1 + d.scope2, forecast: null as number | null, lo: null as number | null, hi: null as number | null })),
  ...['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((m, i) => {
    const base = [672, 660, 645, 631, 620, 612, 624, 636, 628, 620, 614, 606][i];
    return { month: m, actual: null as number | null, forecast: base, lo: Math.round(base * 0.93), hi: Math.round(base * 1.07) };
  }),
];

export const scopeSplit = [
  { name: 'Scope 1 — Direct', value: 2353, color: C.accent },
  { name: 'Scope 2 — Indirect', value: 6904, color: C.blue },
];

export const carbonReductionProgress = [
  { year: 'FY21/22', value: 12480 },
  { year: 'FY22/23', value: 11920 },
  { year: 'FY23/24', value: 11315 },
  { year: 'FY24/25', value: 9257 },
  { year: '2030 Target', value: 7000 },
];

// ── Energy ───────────────────────────────────────────────────────────────────
export const energyMonthly = MONTHS.map((m, i) => ({
  month: m,
  grid: [3680, 3610, 3540, 3490, 3440, 3420, 3470, 3520, 3490, 3460, 3440, 3420][i],
  solar: [240, 252, 268, 281, 290, 305, 312, 298, 286, 295, 308, 318][i],
}));

export const energyByHotel = [
  { name: 'Jetwing Yala', value: 8420, solar: 1180 },
  { name: 'Jetwing Lake', value: 7180, solar: 980 },
  { name: 'Jetwing Colombo Seven', value: 6240, solar: 410 },
  { name: 'Jetwing Kaduruketha', value: 3120, solar: 640 },
  { name: 'Jetwing Kandy Gallery', value: 2980, solar: 520 },
  { name: 'Jetwing Surf & Safari', value: 2460, solar: 560 },
  { name: 'Jetwing Jungle Lodge', value: 1840, solar: 480 },
];

export const renewableMix = [
  { name: 'Grid (Non-renewable)', value: 73, color: '#D1D5DB' },
  { name: 'Solar PV', value: 16, color: C.primary },
  { name: 'Biomass', value: 8, color: C.primaryDark },
  { name: 'Solar Thermal & Biogas', value: 3, color: C.primaryLight },
];

export const peakDemand = MONTHS.map((m, i) => ({
  month: m,
  peak: [1180, 1210, 1245, 1290, 1320, 1280, 1240, 1190, 1220, 1260, 1240, 1200][i],
  avg: [820, 840, 865, 890, 910, 880, 855, 825, 845, 870, 855, 830][i],
}));

// ── Water ────────────────────────────────────────────────────────────────────
export const waterByHotel = [
  { name: 'Jetwing Lake', value: 21800, saved: 3200 },
  { name: 'Jetwing Yala', value: 19400, saved: 4100 },
  { name: 'Jetwing Colombo Seven', value: 14200, saved: 1900 },
  { name: 'Jetwing Kandy Gallery', value: 9800, saved: 1400 },
  { name: 'Jetwing Kaduruketha', value: 9600, saved: 2300 },
  { name: 'Jetwing Surf & Safari', value: 7400, saved: 980 },
  { name: 'Jetwing Jungle Lodge', value: 5200, saved: 760 },
];

export const waterSourceSplit = [
  { name: 'Municipal', value: 61, color: C.blueDark },
  { name: 'Groundwater', value: 27, color: C.blue },
  { name: 'Rainwater Harvest', value: 8, color: C.teal },
  { name: 'Recycled', value: 4, color: C.primaryLight },
];

export const waterRecyclingTrend = MONTHS.map((m, i) => ({
  month: m,
  recycled: [18, 19, 20, 21, 22, 23, 24, 24, 25, 26, 27, 28][i],
}));

// Water stress index per hotel (0–100, higher = more stressed)
export const waterStress = [
  { name: 'Jetwing Yala', index: 78, level: 'High' },
  { name: 'Jetwing Kaduruketha', index: 62, level: 'Medium' },
  { name: 'Jetwing Surf & Safari', index: 58, level: 'Medium' },
  { name: 'Jetwing Lake', index: 41, level: 'Low' },
  { name: 'Jetwing Kandy Gallery', index: 38, level: 'Low' },
  { name: 'Jetwing Jungle Lodge', index: 34, level: 'Low' },
  { name: 'Jetwing Colombo Seven', index: 29, level: 'Low' },
];

export const leakAlerts = [
  { hotel: 'Jetwing Yala', zone: 'Guest Wing B — Riser 3', severity: 'High', detected: '2 days ago', loss: '~4,200 L/day' },
  { hotel: 'Jetwing Lake', zone: 'Kitchen Supply Line', severity: 'Medium', detected: '5 days ago', loss: '~1,100 L/day' },
  { hotel: 'Jetwing Colombo Seven', zone: 'Rooftop Tank Overflow', severity: 'Low', detected: '1 week ago', loss: '~380 L/day' },
];

// ── Waste ────────────────────────────────────────────────────────────────────
export const wasteDiversion = [
  { name: 'Diverted', value: 890, color: C.primary },
  { name: 'Landfill', value: 219, color: C.red },
];

export const wasteMethods = [
  { name: 'Fodder / Offsite Reuse', value: 299, color: C.primaryLight },
  { name: 'Biogas Recovery', value: 254, color: C.primary },
  { name: 'Composting', value: 248, color: C.primaryDark },
  { name: 'Landfill', value: 219, color: C.red },
  { name: 'Dry Recycling', value: 86, color: '#C5D96D' },
  { name: 'Hazardous Recycling', value: 4, color: C.accent },
];

export const wasteMonthly = MONTHS.map((m, i) => ({
  month: m,
  generated: [98, 95, 92, 90, 88, 86, 91, 96, 93, 90, 88, 92][i],
  recycled: [68, 67, 66, 65, 65, 64, 69, 73, 71, 69, 68, 71][i],
}));

export const biodigesters = [
  { name: 'Jetwing Yala', capacity: 100, utilisation: 88, biogas: 42 },
  { name: 'Jetwing Lake', capacity: 80, utilisation: 81, biogas: 31 },
  { name: 'Jetwing Kaduruketha', capacity: 60, utilisation: 92, biogas: 28 },
  { name: 'Jetwing Kandy Gallery', capacity: 50, utilisation: 74, biogas: 18 },
];

// ── Biodiversity ─────────────────────────────────────────────────────────────
export const speciesRecorded = [
  { name: 'Birds', value: 174 },
  { name: 'Butterflies', value: 58 },
  { name: 'Reptiles', value: 41 },
  { name: 'Mammals', value: 30 },
  { name: 'Amphibians', value: 21 },
  { name: 'Fish', value: 20 },
];

export const habitatCoverage = [
  { name: 'Protected Wetland', value: 42, color: C.teal },
  { name: 'Restored Forest', value: 28, color: C.primaryDark },
  { name: 'Organic Paddy', value: 18, color: C.primary },
  { name: 'Buffer / Other', value: 12, color: C.primaryLight },
];

export const conservationProjects = [
  { name: 'Vil Uyana Wetland Sanctuary', status: 'On Track', progress: 88, lead: 'Jetwing Vil Uyana' },
  { name: 'Kanneliya Rainforest Restoration', status: 'On Track', progress: 72, lead: 'Group / BSL' },
  { name: 'Loris Conservation Site', status: 'On Track', progress: 65, lead: 'Jetwing Kaduruketha' },
  { name: 'Yala Leopard Habitat Monitoring', status: 'At Risk', progress: 44, lead: 'Jetwing Yala' },
  { name: 'Mangrove Replanting — Lagoon', status: 'On Track', progress: 79, lead: 'Jetwing Lagoon' },
];

export const speciesGrowth = [
  { name: 'Mammals', y2005: 12, y2025: 30 },
  { name: 'Butterflies', y2005: 24, y2025: 58 },
  { name: 'Birds', y2005: 29, y2025: 174 },
  { name: 'Fish', y2005: 4, y2025: 20 },
  { name: 'Reptiles', y2005: 1, y2025: 41 },
  { name: 'Amphibians', y2005: 2, y2025: 21 },
];

// ── Community ────────────────────────────────────────────────────────────────
export const communityByHotel = [
  { name: 'Jetwing Yala', value: 72 },
  { name: 'Jetwing Lake', value: 58 },
  { name: 'Jetwing Kaduruketha', value: 54 },
  { name: 'Jetwing Kandy Gallery', value: 41 },
  { name: 'Jetwing Surf & Safari', value: 38 },
  { name: 'Jetwing Colombo Seven', value: 31 },
  { name: 'Jetwing Jungle Lodge', value: 24 },
];

export const employmentSplit = [
  { name: 'Within District', value: 62, color: C.teal },
  { name: 'Within Province', value: 26, color: C.accent },
  { name: 'Outside Province', value: 12, color: C.muted },
];

export const communityInvestment = MONTHS.map((m, i) => ({
  month: m,
  amount: [1.8, 2.1, 2.4, 2.2, 2.6, 2.9, 3.1, 2.8, 3.2, 3.4, 3.6, 3.9][i], // LKR millions
}));

export const communityPrograms = [
  { title: 'JYDP — Youth Development', participants: 203, desc: '18+ years running. 1,500+ youth trained in hotel operations, English and cultural awareness.' },
  { title: 'Second Careers', participants: 27, desc: 'Women 45+ from economically challenged backgrounds. PATA Award winner.' },
  { title: 'Thrive — SME Empowerment', participants: 140, desc: '100% Sri Lankan procurement and district-level supplier preference.' },
  { title: 'Culinary Giants', participants: 5, desc: 'Northern Province youth in a 2-year culinary training programme.' },
];

// ── Local Sourcing ───────────────────────────────────────────────────────────
export const supplierRegions = [
  { region: 'Southern Province', suppliers: 84, pct: 24, lat: 6.05, lng: 80.65 },
  { region: 'Central Province', suppliers: 71, pct: 20, lat: 7.29, lng: 80.63 },
  { region: 'Western Province', suppliers: 96, pct: 27, lat: 6.93, lng: 79.86 },
  { region: 'Uva Province', suppliers: 38, pct: 11, lat: 6.88, lng: 81.06 },
  { region: 'Northern Province', suppliers: 29, pct: 8, lat: 9.66, lng: 80.02 },
  { region: 'Eastern Province', suppliers: 35, pct: 10, lat: 7.72, lng: 81.70 },
];

export const sourcingTrend = MONTHS.map((m, i) => ({
  month: m,
  local: [70, 71, 72, 73, 73, 74, 75, 76, 76, 77, 77, 78][i],
  imported: [30, 29, 28, 27, 27, 26, 25, 24, 24, 23, 23, 22][i],
}));

export const supplierRatings = [
  { name: 'Organic Produce Co-op', rating: 4.8, category: 'Fresh Produce', spend: 'LKR 42M' },
  { name: 'Coastal Seafood Collective', rating: 4.6, category: 'Seafood', spend: 'LKR 38M' },
  { name: 'Highland Tea & Spice', rating: 4.7, category: 'Beverages', spend: 'LKR 21M' },
  { name: 'Village Craft Artisans', rating: 4.4, category: 'Amenities', spend: 'LKR 14M' },
  { name: 'Lanka Dairy Network', rating: 4.2, category: 'Dairy', spend: 'LKR 26M' },
];

// ── Hotel performance comparison ─────────────────────────────────────────────
export interface HotelPerf {
  name: string;
  score: number;        // sustainability score /100
  energy: number;       // efficiency /100
  water: number;        // efficiency /100
  carbon: number;       // footprint tCO₂ (lower better)
  community: number;    // impact /100
  esg: string;          // rating
}

export const hotelPerformance: HotelPerf[] = [
  { name: 'Jetwing Yala', score: 88, energy: 84, water: 71, carbon: 954, community: 90, esg: 'AA' },
  { name: 'Jetwing Lake', score: 86, energy: 89, water: 82, carbon: 585, community: 74, esg: 'AA' },
  { name: 'Jetwing Kaduruketha', score: 84, energy: 78, water: 76, carbon: 412, community: 86, esg: 'A' },
  { name: 'Jetwing Kandy Gallery', score: 81, energy: 80, water: 79, carbon: 388, community: 68, esg: 'A' },
  { name: 'Jetwing Colombo Seven', score: 79, energy: 76, water: 88, carbon: 1081, community: 64, esg: 'A' },
  { name: 'Jetwing Surf & Safari', score: 74, energy: 72, water: 64, carbon: 296, community: 71, esg: 'BBB' },
  { name: 'Jetwing Jungle Lodge', score: 71, energy: 70, water: 68, carbon: 184, community: 58, esg: 'BBB' },
];

// ── AI insights ──────────────────────────────────────────────────────────────
export interface Insight {
  type: 'recommendation' | 'carbon' | 'resource' | 'risk' | 'saving';
  title: string;
  body: string;
  impact: string;
}

export const aiInsights: Insight[] = [
  {
    type: 'carbon', title: 'Accelerate solar at Colombo Seven',
    body: 'Colombo Seven derives only 2% of electricity from renewables despite high grid intensity. A 180 kW rooftop array would cut Scope 2 emissions by an estimated 11%.',
    impact: '−118 tCO₂/yr',
  },
  {
    type: 'saving', title: 'Shift laundry to off-peak window',
    body: 'Peak demand at Yala and Lake clusters around 18:00–21:00. Rescheduling laundry loads to 23:00–05:00 reduces peak-tariff exposure across both properties.',
    impact: '~LKR 4.6M/yr',
  },
  {
    type: 'resource', title: 'Expand greywater reuse at Yala',
    body: 'Water stress index at Yala is High (78). Extending greywater recycling to landscape irrigation could recover an additional 18% of withdrawal.',
    impact: '−3,400 m³/yr',
  },
  {
    type: 'risk', title: 'Drought risk rising in Uva region',
    body: 'Seasonal forecasts indicate below-average rainfall for the next two quarters affecting Kaduruketha. Pre-emptive rainwater storage expansion is advised.',
    impact: 'Medium probability',
  },
  {
    type: 'recommendation', title: 'Increase district-level sourcing',
    body: 'Local sourcing sits at 78% group-wide. Onboarding 12 additional Uva and Eastern Province suppliers would push toward the 90% 2027 target.',
    impact: '+7 pts sourcing',
  },
  {
    type: 'saving', title: 'Biodigester utilisation gap at Kandy Gallery',
    body: 'Kandy Gallery biodigester runs at 74% capacity. Diverting organic waste from landfill there would lift biogas recovery and cut LPG purchases.',
    impact: '~LKR 1.9M/yr',
  },
];

// ── Risk management ──────────────────────────────────────────────────────────
export interface Risk {
  id: string;
  category: 'Climate' | 'Water' | 'Biodiversity' | 'Energy' | 'Regulatory';
  title: string;
  probability: number;   // 1–5
  severity: number;      // 1–5
  trend: Trend;
  mitigation: number;    // 0–100 mitigation progress
  owner: string;
}

export const risks: Risk[] = [
  { id: 'R1', category: 'Climate', title: 'Extreme weather damage to coastal properties', probability: 4, severity: 5, trend: 'up', mitigation: 58, owner: 'Group Risk' },
  { id: 'R2', category: 'Water', title: 'Drought / water scarcity at Yala & Kaduruketha', probability: 4, severity: 4, trend: 'up', mitigation: 64, owner: 'Operations' },
  { id: 'R3', category: 'Energy', title: 'Grid electricity price volatility', probability: 5, severity: 3, trend: 'up', mitigation: 71, owner: 'Finance' },
  { id: 'R4', category: 'Regulatory', title: 'Tightening ESG disclosure requirements', probability: 4, severity: 3, trend: 'up', mitigation: 82, owner: 'Compliance' },
  { id: 'R5', category: 'Biodiversity', title: 'Habitat degradation near protected zones', probability: 3, severity: 4, trend: 'flat', mitigation: 60, owner: 'Sustainability' },
  { id: 'R6', category: 'Climate', title: 'Carbon tax / border adjustment exposure', probability: 3, severity: 3, trend: 'up', mitigation: 49, owner: 'Finance' },
  { id: 'R7', category: 'Water', title: 'Wastewater discharge non-compliance', probability: 2, severity: 4, trend: 'down', mitigation: 88, owner: 'Engineering' },
  { id: 'R8', category: 'Energy', title: 'Solar generation shortfall vs target', probability: 3, severity: 2, trend: 'down', mitigation: 76, owner: 'Engineering' },
];

// ── Sustainability goals ─────────────────────────────────────────────────────
export interface Goal {
  label: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  color: string;
  status: 'On Track' | 'At Risk' | 'Behind';
}

export const goals: Goal[] = [
  { label: 'Carbon Reduction', current: 18, target: 25, unit: '%', deadline: '2030', color: C.primary, status: 'On Track' },
  { label: 'Renewable Energy Share', current: 27, target: 40, unit: '%', deadline: '2028', color: C.accent, status: 'On Track' },
  { label: 'Waste Diversion', current: 77, target: 100, unit: '%', deadline: '2030', color: C.teal, status: 'On Track' },
  { label: 'Water Intensity Reduction', current: 12, target: 20, unit: '%', deadline: '2027', color: C.blue, status: 'At Risk' },
  { label: 'Local Sourcing', current: 78, target: 90, unit: '%', deadline: '2027', color: C.primaryDark, status: 'On Track' },
  { label: 'Women in Senior Management', current: 10, target: 25, unit: '%', deadline: '2030', color: C.purple, status: 'Behind' },
];

// ── ESG / Reports ────────────────────────────────────────────────────────────
export interface ReportRow {
  name: string;
  type: string;
  period: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  updated: string;
}

export const reports: ReportRow[] = [
  { name: 'Annual ESG Report FY2024/25', type: 'ESG', period: 'FY 2024/25', status: 'Published', updated: '2026-05-12' },
  { name: 'GRI Sustainability Statement', type: 'Sustainability', period: 'FY 2024/25', status: 'Published', updated: '2026-05-10' },
  { name: 'Carbon Footprint Disclosure', type: 'Carbon', period: 'Q4 FY24/25', status: 'Published', updated: '2026-04-28' },
  { name: 'Water Stewardship Report', type: 'Water', period: 'Q4 FY24/25', status: 'Draft', updated: '2026-06-01' },
  { name: 'Energy & Renewables Review', type: 'Energy', period: 'Q4 FY24/25', status: 'Draft', updated: '2026-06-02' },
  { name: 'Q1 FY25/26 ESG Update', type: 'ESG', period: 'Q1 FY25/26', status: 'Scheduled', updated: '2026-07-15' },
];

export const esgPillars = [
  { name: 'Environmental', score: 84, color: C.primary },
  { name: 'Social', score: 90, color: C.blue },
  { name: 'Governance', score: 88, color: C.accent },
];

export const complianceFrameworks = [
  { name: 'GRI Standards', status: 'Aligned', coverage: 92 },
  { name: 'ISO 14001', status: 'Certified', coverage: 83 },
  { name: 'Travelife', status: 'Certified', coverage: 56 },
  { name: 'UN SDGs', status: 'Mapped', coverage: 78 },
  { name: 'TCFD', status: 'In Progress', coverage: 64 },
];
