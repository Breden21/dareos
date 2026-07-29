export type StatusTone = "success" | "warn" | "danger" | "accent" | "neutral";

export type Role = "ceo" | "collector" | "ward_officer" | "driver" | "records_clerk";

export interface Account {
  email: string;
  password: string;
  role: Role;
  name: string;
  roleLabel: string;
  collectionPointId?: string;
  ward?: string;
  vehicleId?: string;
}

export interface Kpi {
  label: string;
  value: string;
  sub: string;
  delta: number | null;
  up?: boolean;
}

export interface CollectionPoint {
  id: string;
  name: string;
  ward: string;
  type: string;
  collector: string;
  todayTotal: number;
  lastReceipt: string;
  banked: boolean;
}

export interface Receipt {
  id: string;
  payer: string;
  point: string;
  amount: number;
  collector: string;
  time: string;
}

export interface Ratepayer {
  id: string;
  name: string;
  ward: string;
  type: string;
  balance: number;
  status: "Current" | "Arrears";
  lastPayment: string;
}

export interface Stand {
  id: string;
  ward: string;
  buyer: string;
  price: number;
  paid: number;
  status: "Paid up" | "Instalments" | "Unpaid";
  dateAllocated: string;
}

export interface Vehicle {
  id: string;
  type: string;
  ward: string;
  driver: string;
  fuel: number;
  odometer: number;
  status: "On route" | "Idle" | "Refuel needed" | "Maintenance" | "Assigned";
  task: string | null;
  lastPing: string;
  assignment: "pool" | "assigned";
  assignedTo?: string;
}

export interface WardAsset {
  id: string;
  type: string;
  ward: string;
  name: string;
  condition: "Working" | "Needs repair" | "Poor";
}

export interface ServiceRequest {
  id: string;
  ward: string;
  category: string;
  raisedBy: string;
  channel: string;
  desc: string;
  status: "Open" | "In progress" | "Resolved";
  date: string;
}

export interface StaffDept {
  dept: string;
  establishment: number;
  filled: number;
}

export interface CouncilMinute {
  id: string;
  date: string;
  committee: string;
  resolutions: string[];
  ministryEscalation: boolean;
}

export interface DigitizationCategory {
  name: string;
  digitized: number;
  total: number;
  ward: string;
}

export interface DigitizedRecord {
  id: string;
  title: string;
  category: string;
  capturedBy: string;
  ward: string;
  time: string;
}

export type RevenueSub = "overview" | "collection" | "ratepayers" | "stands" | "reconcile";

export type CeoTab = "dashboard" | "revenue" | "records" | "ward" | "more";
export type CollectorTab = "today" | "history" | "profile";
export type WardOfficerTab = "ward_home" | "profile";
export type DriverTab = "vehicle_home" | "profile";
export type RecordsClerkTab = "records_home" | "profile";
export type TabKey = CeoTab | CollectorTab | WardOfficerTab | DriverTab | RecordsClerkTab;
