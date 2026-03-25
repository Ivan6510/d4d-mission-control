/**
 * Supabase-backed data store for D4D Mission Control.
 * Mirrors the same function signatures as store.ts but async, hitting Supabase.
 */

import { supabase } from "./supabase";
import type {
  Deal,
  Lead,
  RehabItem,
  Draw,
  ActivityLog,
  Task,
  DealNote,
  User,
} from "./types";

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function getDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data as Deal[];
}

export async function getDeal(id: string): Promise<Deal | null> {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Deal;
}

export async function createDeal(data: Partial<Deal>): Promise<Deal> {
  const { data: row, error } = await supabase
    .from("deals")
    .insert({
      address: data.address ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      zip: data.zip ?? null,
      stage: data.stage ?? "lead",
      stage_changed_at: data.stage_changed_at ?? new Date().toISOString(),
      purchase_price: data.purchase_price ?? null,
      arv: data.arv ?? null,
      rehab_budget: data.rehab_budget ?? null,
      rehab_actual: data.rehab_actual ?? null,
      holding_costs: data.holding_costs ?? null,
      closing_costs: data.closing_costs ?? null,
      sale_price: data.sale_price ?? null,
      expected_profit: data.expected_profit ?? null,
      actual_profit: data.actual_profit ?? null,
      offer_date: data.offer_date ?? null,
      contract_date: data.contract_date ?? null,
      closing_date: data.closing_date ?? null,
      rehab_start_date: data.rehab_start_date ?? null,
      rehab_end_date: data.rehab_end_date ?? null,
      list_date: data.list_date ?? null,
      sold_date: data.sold_date ?? null,
      beds: data.beds ?? null,
      baths: data.baths ?? null,
      sqft: data.sqft ?? null,
      year_built: data.year_built ?? null,
      property_type: data.property_type ?? "single_family",
      lead_source: data.lead_source ?? null,
      notes: data.notes ?? null,
      assigned_to: data.assigned_to ?? null,
      created_by: data.created_by ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row as Deal;
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | null> {
  const { data: row, error } = await supabase
    .from("deals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return row as Deal;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Lead[];
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const { data: row, error } = await supabase
    .from("leads")
    .insert({
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? "",
      zip: data.zip ?? null,
      contact_name: data.contact_name ?? null,
      contact_phone: data.contact_phone ?? null,
      contact_email: data.contact_email ?? null,
      source: data.source ?? "other",
      score: data.score ?? "warm",
      status: data.status ?? "new",
      asking_price: data.asking_price ?? null,
      notes: data.notes ?? null,
      deal_id: data.deal_id ?? null,
      converted_at: data.converted_at ?? null,
      assigned_to: data.assigned_to ?? null,
      created_by: data.created_by ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const { data: row, error } = await supabase
    .from("leads")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return row as Lead;
}

// ---------------------------------------------------------------------------
// Rehab Items
// ---------------------------------------------------------------------------

export async function getRehabItems(dealId: string): Promise<RehabItem[]> {
  const { data, error } = await supabase
    .from("rehab_items")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as RehabItem[];
}

export async function createRehabItem(data: Partial<RehabItem>): Promise<RehabItem> {
  const { data: row, error } = await supabase
    .from("rehab_items")
    .insert({
      deal_id: data.deal_id ?? "",
      category: data.category ?? "General",
      description: data.description ?? null,
      estimated_cost: data.estimated_cost ?? 0,
      actual_cost: data.actual_cost ?? 0,
      contractor: data.contractor ?? null,
      status: data.status ?? "pending",
      notes: data.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row as RehabItem;
}

export async function updateRehabItem(id: string, updates: Partial<RehabItem>): Promise<RehabItem | null> {
  const { data: row, error } = await supabase
    .from("rehab_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return row as RehabItem;
}

// ---------------------------------------------------------------------------
// Draws
// ---------------------------------------------------------------------------

export async function getDraws(dealId: string): Promise<Draw[]> {
  const { data, error } = await supabase
    .from("draws")
    .select("*")
    .eq("deal_id", dealId)
    .order("draw_number", { ascending: true });
  if (error) throw error;
  return data as Draw[];
}

export async function createDraw(data: Partial<Draw>): Promise<Draw> {
  const { data: row, error } = await supabase
    .from("draws")
    .insert({
      deal_id: data.deal_id ?? "",
      draw_number: data.draw_number ?? 1,
      amount: data.amount ?? 0,
      status: data.status ?? "pending",
      description: data.description ?? null,
      proof_notes: data.proof_notes ?? null,
      requested_at: data.requested_at ?? null,
      approved_at: data.approved_at ?? null,
      paid_at: data.paid_at ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row as Draw;
}

export async function updateDraw(id: string, updates: Partial<Draw>): Promise<Draw | null> {
  const { data: row, error } = await supabase
    .from("draws")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return row as Draw;
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export async function getActivities(offset = 0, limit = 30): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data as ActivityLog[];
}

export async function getActivityCount(): Promise<number> {
  const { count, error } = await supabase
    .from("activity_log")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

export async function createActivity(data: Partial<ActivityLog>): Promise<ActivityLog> {
  const { data: row, error } = await supabase
    .from("activity_log")
    .insert({
      user_id: data.user_id ?? null,
      user_name: data.user_name ?? "System",
      action: data.action ?? "",
      entity_type: data.entity_type ?? "system",
      entity_id: data.entity_id ?? null,
      details: data.details ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row as ActivityLog;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data as Task[];
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  const { data: row, error } = await supabase
    .from("tasks")
    .insert({
      deal_id: data.deal_id ?? null,
      title: data.title ?? "",
      description: data.description ?? null,
      assigned_to: data.assigned_to ?? null,
      assigned_to_name: data.assigned_to_name ?? null,
      status: data.status ?? "pending",
      due_date: data.due_date ?? null,
      created_by: data.created_by ?? null,
      completed_at: data.completed_at ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return row as Task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const { data: row, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return row as Task;
}

// ---------------------------------------------------------------------------
// Deal Notes
// ---------------------------------------------------------------------------

export async function getNotes(dealId: string): Promise<DealNote[]> {
  const { data, error } = await supabase
    .from("deal_notes")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as DealNote[];
}

export async function createNote(data: Partial<DealNote>): Promise<DealNote> {
  const { data: row, error } = await supabase
    .from("deal_notes")
    .insert({
      deal_id: data.deal_id ?? "",
      user_id: data.user_id ?? null,
      user_name: data.user_name ?? "Unknown",
      content: data.content ?? "",
    })
    .select()
    .single();
  if (error) throw error;
  return row as DealNote;
}

// ---------------------------------------------------------------------------
// Users (for auth)
// ---------------------------------------------------------------------------

export async function getUserByNameAndCode(name: string, code: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("name", name)
    .eq("invite_code", code)
    .eq("is_active", true)
    .single();
  if (error) return null;
  return data as User;
}

export async function getUserByName(name: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("name", name)
    .eq("is_active", true)
    .single();
  if (error) return null;
  return data as User;
}

// ---------------------------------------------------------------------------
// Seed — only if deals table is empty
// ---------------------------------------------------------------------------

export async function seedIfNeeded(): Promise<void> {
  // Check if deals table has any rows
  const { count, error } = await supabase
    .from("deals")
    .select("id", { count: "exact", head: true });

  if (error || (count !== null && count > 0)) return;

  // Seed deals
  const seedDeals = [
    {
      address: "626 Sumpneytown Pike", city: "Lansdale", state: "PA", zip: null,
      stage: "in_rehab", stage_changed_at: "2026-03-01T12:00:00Z",
      purchase_price: 572000, arv: 1150000, rehab_budget: 250000,
      expected_profit: 149670, contract_date: "2026-02-01T12:00:00Z",
      closing_date: "2026-03-01T12:00:00Z", rehab_start_date: "2026-03-05T12:00:00Z",
      property_type: "single_family", lead_source: "other",
      notes: "Major rehab. 50% JV split. HML Loan. Comps: 1428 Cambridge Dr $1.375M, 1219 Turnbury Ln $1.35M/$1.435M",
      assigned_to: "1", created_by: "1",
      created_at: "2026-02-01T12:00:00Z", updated_at: "2026-03-25T12:00:00Z",
    },
    {
      address: "227 Silver Leaf Rdg", city: "Harrisburg", state: "PA", zip: null,
      stage: "under_contract", stage_changed_at: "2026-03-01T12:00:00Z",
      purchase_price: 140000, arv: 254999, rehab_budget: 42000,
      sale_price: 263000, expected_profit: 50625, actual_profit: 38097,
      contract_date: "2026-03-01T12:00:00Z", closing_date: "2026-03-26T12:00:00Z",
      property_type: "single_family", lead_source: "other",
      notes: "CLOSING 3/26. HUD actual profit: $38,097. Ivan cut: $9,524. Sale at $263K (above $254,999 list).",
      assigned_to: "1", created_by: "1",
      created_at: "2026-03-01T12:00:00Z", updated_at: "2026-03-25T12:00:00Z",
    },
    {
      address: "367 Dartmouth Ct", city: "Bensalem", state: "PA", zip: null,
      stage: "listed", stage_changed_at: "2026-03-10T12:00:00Z",
      purchase_price: 232500, arv: 355000, rehab_budget: 90342,
      expected_profit: -4538, contract_date: "2026-03-10T12:00:00Z",
      list_date: "2026-03-20T12:00:00Z", property_type: "single_family",
      lead_source: "other",
      notes: "Listed at $379,999. Purchase $232,500. Rehab $90,342. Currently showing negative — needs to sell above $360K to profit. ACTION: Jack needs conveyancing forms done.",
      assigned_to: "3", created_by: "1",
      created_at: "2026-03-10T12:00:00Z", updated_at: "2026-03-25T12:00:00Z",
    },
    {
      address: "301 E Elm Ave", city: "Hanover", state: "PA", zip: null,
      stage: "listed", stage_changed_at: "2026-03-01T12:00:00Z",
      list_date: "2026-03-01T12:00:00Z", property_type: "single_family",
      lead_source: "other", notes: "Active listing. Email from Jenny about listing pitch.",
      assigned_to: "1", created_by: "1",
      created_at: "2026-02-15T12:00:00Z", updated_at: "2026-03-25T12:00:00Z",
    },
    {
      address: "717 W Oak St", city: "Palmyra", state: "PA", zip: null,
      stage: "under_contract", stage_changed_at: "2026-03-15T12:00:00Z",
      purchase_price: 100000, contract_date: "2026-03-15T12:00:00Z",
      property_type: "single_family", lead_source: "other",
      notes: "Purchase at $100K. No updates in last 24h.",
      assigned_to: "1", created_by: "1",
      created_at: "2026-03-10T12:00:00Z", updated_at: "2026-03-24T12:00:00Z",
    },
    {
      address: "Felton, York County", city: "Felton", state: "PA", zip: null,
      stage: "lead", stage_changed_at: "2026-03-24T21:00:00Z",
      purchase_price: 219000, arv: 363000, rehab_budget: 30000,
      expected_profit: 66800, beds: 3, baths: 2, sqft: 1560,
      property_type: "single_family", lead_source: "investor_lift",
      notes: "IL #305086. Ask $219K, ARV $363K (verified — comps: 4378 Brush Ln $366.5K, 7112 Church Rd $360K). Light rehab. 1.5 acres. BEST DEAL from 3/24 scan. $66.8K net.",
      assigned_to: "2", created_by: "2",
      created_at: "2026-03-24T21:00:00Z", updated_at: "2026-03-24T21:00:00Z",
    },
    {
      address: "3952 Pulaski Ave", city: "Philadelphia", state: "PA", zip: "19140",
      stage: "lead", stage_changed_at: "2026-03-24T21:00:00Z",
      purchase_price: 40000, arv: 160000, rehab_budget: 50000,
      expected_profit: 49200, beds: 3, baths: 1, sqft: 1248,
      property_type: "single_family", lead_source: "investor_lift",
      notes: "IL #308557. Ask $40K, ARV $160K (UNVERIFIED — no comps confirmed). Full rehab. $49.2K net IF ARV holds. Verify before flagging Jack.",
      assigned_to: "2", created_by: "2",
      created_at: "2026-03-24T21:00:00Z", updated_at: "2026-03-24T21:00:00Z",
    },
    {
      address: "108 E 1st Ave", city: "Parkesburg", state: "PA", zip: "19365",
      stage: "sold", stage_changed_at: "2026-02-15T12:00:00Z",
      purchase_price: 245000, arv: 411000, rehab_budget: 65000,
      sale_price: 411000, expected_profit: 51643, actual_profit: 44221,
      closing_date: "2026-02-15T12:00:00Z", sold_date: "2026-02-15T12:00:00Z",
      property_type: "single_family", lead_source: "other",
      notes: "CLOSED. HUD actual profit: $44,221. Purchase $245K, Rehab $65K, Sold $411K.",
      assigned_to: "1", created_by: "1",
      created_at: "2026-01-01T12:00:00Z", updated_at: "2026-02-15T12:00:00Z",
    },
    {
      address: "100 Deerfield Ct", city: "", state: "PA", zip: null,
      stage: "sold", stage_changed_at: "2026-03-01T12:00:00Z",
      purchase_price: 425000, arv: 600000, rehab_budget: 54790,
      sale_price: 600000, expected_profit: 67053, actual_profit: 59635,
      closing_date: "2026-03-01T12:00:00Z", sold_date: "2026-03-01T12:00:00Z",
      property_type: "single_family", lead_source: "other",
      notes: "CLOSED. HUD actual profit: $59,635. Ivan cut: $5,964 + $9,000. DFD remaining: $44,671.",
      assigned_to: "1", created_by: "1",
      created_at: "2026-01-15T12:00:00Z", updated_at: "2026-03-01T12:00:00Z",
    },
  ];

  const { data: insertedDeals, error: dealErr } = await supabase
    .from("deals")
    .insert(seedDeals)
    .select();
  if (dealErr || !insertedDeals) return;

  // Seed leads
  const seedLeads = [
    {
      address: "2313 Bryansville Rd", city: "Delta", state: "PA",
      contact_name: "Justin Moul", source: "referral", score: "warm", status: "new",
      notes: "Price reduced, cleaned out. 1464sqft Colonial, .66 ac, 4bd/1.5ba, 2-car garage. Flagged by Justin in D4D inbox.",
      assigned_to: "2", created_by: "2",
      created_at: "2026-03-25T08:00:00Z", updated_at: "2026-03-25T08:00:00Z",
    },
    {
      address: "Birdsboro, Berks County", city: "Birdsboro", state: "PA", zip: "19508",
      source: "investor_lift", score: "warm", status: "new", asking_price: 125000,
      notes: "IL #308546. ARV $265K (verified comp: 1021 Allen Rd $270K Jan 2026). Major rehab $85K. 3/1 880sqft. $20.5K net — barely passes.",
      assigned_to: "2", created_by: "2",
      created_at: "2026-03-24T21:00:00Z", updated_at: "2026-03-24T21:00:00Z",
    },
    {
      address: "3051 Druck Valley Rd", city: "York", state: "PA",
      source: "other", score: "warm", status: "contacted",
      notes: "Showing confirmed for 3/25 at 8 AM. Coldwell Banker listing.",
      assigned_to: "1", created_by: "1",
      created_at: "2026-03-24T18:00:00Z", updated_at: "2026-03-25T08:00:00Z",
    },
    {
      address: "7139 Old Harrisburg Rd", city: "York Springs", state: "PA",
      source: "other", score: "warm", status: "contacted", asking_price: 299000,
      notes: "Listed as COMING SOON at $299K. Showing confirmed Friday 3/27 at 3:00-3:30 PM. Keller Williams.",
      assigned_to: "1", created_by: "1",
      created_at: "2026-03-24T18:00:00Z", updated_at: "2026-03-25T08:00:00Z",
    },
  ];

  await supabase.from("leads").insert(seedLeads);

  // Seed activities
  const seedActivities = [
    { user_id: "2", user_name: "Leo", action: "scanned Investor Lift", entity_type: "lead", entity_id: insertedDeals[5]?.id, details: "Found Felton deal — $66.8K net profit potential", created_at: "2026-03-24T21:00:00Z" },
    { user_id: "2", user_name: "Leo", action: "sent 1,359 RTK requests", entity_type: "system", details: "All 9 counties — York, Adams, Berks, Bucks, Chester, Dauphin, Delaware, Lehigh, Montgomery", created_at: "2026-03-24T15:00:00Z" },
    { user_id: "1", user_name: "Ivan", action: "showing scheduled", entity_type: "lead", details: "3051 Druck Valley Rd, York — 3/25 at 8 AM", created_at: "2026-03-24T18:00:00Z" },
    { user_id: "1", user_name: "Ivan", action: "showing scheduled", entity_type: "lead", details: "7139 Old Harrisburg Rd, York Springs — 3/27 at 3 PM", created_at: "2026-03-24T18:30:00Z" },
    { user_id: "1", user_name: "Ivan", action: "deal closed", entity_type: "deal", entity_id: insertedDeals[7]?.id, details: "108 E 1st Ave, Parkesburg — HUD profit $44,221", created_at: "2026-02-15T12:00:00Z" },
    { user_id: "1", user_name: "Ivan", action: "deal closed", entity_type: "deal", entity_id: insertedDeals[8]?.id, details: "100 Deerfield Ct — HUD profit $59,635", created_at: "2026-03-01T12:00:00Z" },
  ];

  await supabase.from("activity_log").insert(seedActivities);

  // Seed tasks
  const seedTasks = [
    { deal_id: insertedDeals[2]?.id, title: "Get Jack to fill out conveyancing forms", description: "367 Dartmouth Ct — Hallie (title co) can't order certs until forms are done. Multiple emails.", assigned_to: "3", assigned_to_name: "Jack", status: "pending", due_date: "2026-03-25T17:00:00Z", created_by: "1", created_at: "2026-03-25T08:00:00Z" },
    { deal_id: insertedDeals[1]?.id, title: "Confirm closing docs for tomorrow", description: "227 Silver Leaf Rdg — closing 3/26. Title, docs, settlement all need to be ready.", assigned_to: "1", assigned_to_name: "Ivan", status: "pending", due_date: "2026-03-25T17:00:00Z", created_by: "1", created_at: "2026-03-25T08:00:00Z" },
    { deal_id: insertedDeals[5]?.id, title: "Verify Felton deal comps and contact wholesaler", description: "IL #305086 — $66.8K net. Best deal from 3/24 scan. Need to move fast.", assigned_to: "2", assigned_to_name: "Bryce", status: "pending", due_date: "2026-03-26T17:00:00Z", created_by: "2", created_at: "2026-03-25T08:00:00Z" },
    { title: "Review Felton showing Friday 3/27", description: "7139 Old Harrisburg Rd — showing at 3:00 PM, $299K Coming Soon", assigned_to: "1", assigned_to_name: "Ivan", status: "pending", due_date: "2026-03-27T14:00:00Z", created_by: "1", created_at: "2026-03-25T08:00:00Z" },
  ];

  await supabase.from("tasks").insert(seedTasks);
}
