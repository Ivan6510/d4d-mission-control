export type DealStage =
  | "lead"
  | "prospect"
  | "under_contract"
  | "in_rehab"
  | "listed"
  | "sold"
  | "dead";

export type LeadScore = "hot" | "warm" | "cold";
export type LeadStatus = "new" | "contacted" | "follow_up" | "converted" | "dead";
export type DrawStatus = "pending" | "requested" | "approved" | "paid";

export interface User {
  id: string;
  name: string;
  role: "owner" | "acquisitions" | "dispositions" | "contractor";
  email: string | null;
  invite_code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Deal {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  stage: DealStage;
  stage_changed_at: string;
  purchase_price: number | null;
  arv: number | null;
  rehab_budget: number | null;
  rehab_actual: number | null;
  holding_costs: number | null;
  closing_costs: number | null;
  sale_price: number | null;
  expected_profit: number | null;
  actual_profit: number | null;
  offer_date: string | null;
  contract_date: string | null;
  closing_date: string | null;
  rehab_start_date: string | null;
  rehab_end_date: string | null;
  list_date: string | null;
  sold_date: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  year_built: number | null;
  property_type: string;
  lead_source: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  source: string;
  score: LeadScore;
  status: LeadStatus;
  asking_price: number | null;
  notes: string | null;
  deal_id: string | null;
  converted_at: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RehabItem {
  id: string;
  deal_id: string;
  category: string;
  description: string | null;
  estimated_cost: number;
  actual_cost: number;
  contractor: string | null;
  status: "pending" | "in_progress" | "completed";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Draw {
  id: string;
  deal_id: string;
  draw_number: number;
  amount: number;
  status: DrawStatus;
  description: string | null;
  proof_notes: string | null;
  requested_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  entity_type: "deal" | "lead" | "rehab" | "draw" | "note" | "system";
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  deal_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: "pending" | "in_progress" | "completed";
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface DealNote {
  id: string;
  deal_id: string;
  user_id: string | null;
  user_name: string;
  content: string;
  created_at: string;
}

// Supabase Database type (simplified)
export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      deals: { Row: Deal; Insert: Partial<Deal>; Update: Partial<Deal> };
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead> };
      rehab_items: { Row: RehabItem; Insert: Partial<RehabItem>; Update: Partial<RehabItem> };
      draws: { Row: Draw; Insert: Partial<Draw>; Update: Partial<Draw> };
      activity_log: { Row: ActivityLog; Insert: Partial<ActivityLog>; Update: Partial<ActivityLog> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      deal_notes: { Row: DealNote; Insert: Partial<DealNote>; Update: Partial<DealNote> };
    };
  };
}

// Stage display helpers
export const DEAL_STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "bg-gray-500" },
  { key: "prospect", label: "Prospect", color: "bg-blue-500" },
  { key: "under_contract", label: "Under Contract", color: "bg-purple-500" },
  { key: "in_rehab", label: "In Rehab", color: "bg-yellow-500" },
  { key: "listed", label: "Listed", color: "bg-brand-500" },
  { key: "sold", label: "Sold", color: "bg-green-500" },
  { key: "dead", label: "Dead", color: "bg-red-500" },
];

export const LEAD_SOURCES = [
  { key: "facebook", label: "Facebook Groups" },
  { key: "investor_lift", label: "Investor Lift" },
  { key: "rtk", label: "RTK" },
  { key: "cold_call", label: "Cold Calls" },
  { key: "ppc", label: "PPC" },
  { key: "referral", label: "Referral" },
  { key: "driving", label: "Driving for Dollars" },
  { key: "other", label: "Other" },
];

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function daysInStage(stageChangedAt: string): number {
  const changed = new Date(stageChangedAt);
  const now = new Date();
  return Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24));
}

export function getStageLabel(stage: DealStage): string {
  return DEAL_STAGES.find((s) => s.key === stage)?.label ?? stage;
}
