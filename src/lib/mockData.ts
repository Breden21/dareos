import type {
  Kpi, CollectionPoint, Receipt, Ratepayer, Stand, Vehicle,
  WardAsset, ServiceRequest, StaffDept, CouncilMinute,
  DigitizationCategory, DigitizedRecord,
} from "./types";

export const kpis: Kpi[] = [
  { label: "Revenue collected", value: "$18,420", sub: "this month", delta: 8.2, up: true },
  { label: "Outstanding arrears", value: "$34,110", sub: "412 accounts", delta: 3.1, up: false },
  { label: "Uncollected/unbanked", value: "$1,240", sub: "flagged this week", delta: null },
  { label: "Active fleet", value: "5/7", sub: "vehicles operational", delta: null },
];

export const collectionPoints: CollectionPoint[] = [
  { id: "CP-01", name: "Chikwaka Business Centre Market", ward: "Ward 12", type: "Market fees", collector: "E. Mavhuto", todayTotal: 145, lastReceipt: "8 min ago", banked: false },
  { id: "CP-02", name: "Dazi Bus Terminus", ward: "Ward 3", type: "Terminus fees", collector: "K. Nhamo", todayTotal: 62, lastReceipt: "24 min ago", banked: false },
  { id: "CP-03", name: "Nyamutamba Growth Point Parking", ward: "Ward 7", type: "Parking fees", collector: "R. Bepe", todayTotal: 38, lastReceipt: "1 hr ago", banked: true },
];

export const recentReceipts: Receipt[] = [
  { id: "RCT-8821", payer: "Anonymous — stall 14", point: "Chikwaka Market", amount: 3, collector: "E. Mavhuto", time: "8 min ago" },
  { id: "RCT-8820", payer: "Bus: Mutare-Nyanga route", point: "Dazi Terminus", amount: 5, collector: "K. Nhamo", time: "24 min ago" },
  { id: "RCT-8815", payer: "Anonymous — stall 6", point: "Chikwaka Market", amount: 3, collector: "E. Mavhuto", time: "yesterday" },
  { id: "RCT-8802", payer: "Anonymous — stall 14", point: "Chikwaka Market", amount: 3, collector: "E. Mavhuto", time: "yesterday" },
];

export const revenueOverview = {
  collectedThisMonth: 18420,
  targetThisMonth: 26000,
  levyTypes: [
    { name: "Development levy", collected: 9200, delta: 4.2 },
    { name: "Market fees", collected: 5100, delta: -1.8 },
    { name: "Business licences", collected: 4120, delta: 9.1 },
  ],
  byWard: [
    { ward: "Ward 12", collected: 7320 },
    { ward: "Ward 7", collected: 6210 },
    { ward: "Ward 3", collected: 4890 },
  ],
  trend: [
    { date: "1 Jun", collected: 1200, target: 1400 },
    { date: "8 Jun", collected: 4100, target: 4900 },
    { date: "15 Jun", collected: 8200, target: 9800 },
    { date: "22 Jun", collected: 13400, target: 16300 },
    { date: "30 Jun", collected: 18420, target: 26000 },
  ],
};

export const ratepayers: Ratepayer[] = [
  { id: "RP-3301", name: "Chikwaka Business Centre — Shop 4", ward: "Ward 12", type: "Business licence", balance: 240, status: "Arrears", lastPayment: "2026-04-11" },
  { id: "RP-3302", name: "T. Chikafu (residential stand 88)", ward: "Ward 3", type: "Development levy", balance: 0, status: "Current", lastPayment: "2026-06-30" },
  { id: "RP-3303", name: "Dazi Grinding Mill", ward: "Ward 3", type: "Business licence", balance: 85, status: "Arrears", lastPayment: "2026-05-02" },
  { id: "RP-3304", name: "Nyamutamba Growth Point Market", ward: "Ward 7", type: "Market fees", balance: 0, status: "Current", lastPayment: "2026-07-01" },
];

export const stands: Stand[] = [
  { id: "ST-0441", ward: "Ward 3", buyer: "T. Chikafu", price: 1200, paid: 1200, status: "Paid up", dateAllocated: "2024-02-11" },
  { id: "ST-0442", ward: "Ward 7", buyer: "F. Chidziva", price: 1500, paid: 600, status: "Instalments", dateAllocated: "2025-06-19" },
  { id: "ST-0443", ward: "Ward 12", buyer: "Cllr. P. Museva", price: 1500, paid: 0, status: "Unpaid", dateAllocated: "2025-01-08" },
];

export const fleet: Vehicle[] = [
  { id: "MUT-GR-01", type: "Grader", ward: "Ward 3", driver: "S. Manyika", fuel: 62, odometer: 48210, status: "On route", task: "Mutasa–Dazi feeder road", lastPing: "6 min ago", assignment: "pool" },
  { id: "MUT-TR-04", type: "Water bowser", ward: "Ward 7", driver: "F. Chidziva", fuel: 28, odometer: 91344, status: "Refuel needed", task: "Nyamutamba supply run", lastPing: "2 min ago", assignment: "pool" },
  { id: "MUT-TR-07", type: "Refuse truck", ward: "Ward 12", driver: "T. Museva", fuel: 45, odometer: 55870, status: "Maintenance", task: "Workshop — brake inspection", lastPing: "3 hrs ago", assignment: "pool" },
  { id: "MUT-SD-01", type: "Sedan — Council pool car", ward: "District", driver: "", fuel: 55, odometer: 34012, status: "Assigned", task: null, lastPing: "18 min ago", assignment: "assigned", assignedTo: "B. Nyatoro, CEO (Acting)" },
];

export const assets: WardAsset[] = [
  { id: "AST-0142", type: "Borehole", ward: "Ward 7", name: "Chitepo Primary Borehole", condition: "Working" },
  { id: "AST-0143", type: "Borehole", ward: "Ward 7", name: "Nyamutamba Village Borehole", condition: "Needs repair" },
  { id: "AST-0098", type: "Road", ward: "Ward 3", name: "Mutasa–Dazi feeder road", condition: "Poor" },
];

export const requests: ServiceRequest[] = [
  { id: "SR-1091", ward: "Ward 7", category: "Water", raisedBy: "V. Mangwiro (VIDCO Sec.)", channel: "USSD", desc: "Nyamutamba borehole pump making grinding noise, low yield since last week.", status: "Open", date: "2026-07-01" },
  { id: "SR-1088", ward: "Ward 3", category: "Roads", raisedBy: "T. Chikafu", channel: "WhatsApp", desc: "Mutasa–Dazi road washed out at the culvert near the dip tank.", status: "In progress", date: "2026-06-24" },
];

export const staff: StaffDept[] = [
  { dept: "Roads & Works", establishment: 14, filled: 11 },
  { dept: "Revenue & Finance", establishment: 6, filled: 5 },
];

export const minutes: CouncilMinute[] = [
  { id: "MIN-2026-014", date: "2026-06-30", committee: "Finance Committee",
    resolutions: ["Approved quarterly payment schedule for April–June 2026.", "Noted Nyamutamba borehole repair as urgent capital item."], ministryEscalation: false },
];

export const digitizationCategories: DigitizationCategory[] = [
  { name: "Land & stand records", digitized: 340, total: 890, ward: "All wards" },
  { name: "Ratepayer files", digitized: 610, total: 820, ward: "All wards" },
  { name: "Licence archive", digitized: 155, total: 410, ward: "All wards" },
  { name: "Minutes archive", digitized: 88, total: 96, ward: "District" },
];

export const digitizedRecords: DigitizedRecord[] = [
  { id: "DOC-2291", title: "Stand ST-0443 — allocation letter", category: "Land & stand records", capturedBy: "R. Bepe", ward: "Ward 12", time: "14 min ago" },
  { id: "DOC-2290", title: "Chikafu — development levy card", category: "Ratepayer files", capturedBy: "K. Nhamo", ward: "Ward 3", time: "1 hr ago" },
  { id: "DOC-2289", title: "Dazi Grinding Mill — licence renewal 2024", category: "Licence archive", capturedBy: "E. Mavhuto", ward: "Ward 3", time: "3 hrs ago" },
];
