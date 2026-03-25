/**
 * Unified data store for D4D Mission Control.
 * Tries Supabase first; falls back to localStorage on error or when offline.
 */

import * as sb from "./supabase-store";
import { isSupabaseAvailable } from "./supabase";
import type {
  Deal,
  Lead,
  RehabItem,
  Draw,
  ActivityLog,
  Task,
  DealNote,
} from "./types";

// ---------------------------------------------------------------------------
// localStorage helpers (fallback)
// ---------------------------------------------------------------------------

const KEYS = {
  deals: "d4d_deals",
  leads: "d4d_leads",
  rehabItems: "d4d_rehab_items",
  draws: "d4d_draws",
  activities: "d4d_activities",
  tasks: "d4d_tasks",
  notes: "d4d_notes",
  seeded: "d4d_seeded_v2",
} as const;

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function now(): string {
  return new Date().toISOString();
}

function lsRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsWrite<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export async function getDeals(): Promise<Deal[]> {
  try {
    if (await isSupabaseAvailable()) return await sb.getDeals();
  } catch { /* fall through */ }
  return lsRead<Deal>(KEYS.deals).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function getDeal(id: string): Promise<Deal | null> {
  try {
    if (await isSupabaseAvailable()) return await sb.getDeal(id);
  } catch { /* fall through */ }
  return lsRead<Deal>(KEYS.deals).find((d) => d.id === id) ?? null;
}

export async function createDeal(data: Partial<Deal>): Promise<Deal> {
  try {
    if (await isSupabaseAvailable()) return await sb.createDeal(data);
  } catch { /* fall through */ }
  const deals = lsRead<Deal>(KEYS.deals);
  const deal: Deal = {
    id: uid(), address: data.address ?? "", city: data.city ?? "",
    state: data.state ?? "", zip: data.zip ?? null,
    stage: data.stage ?? "lead", stage_changed_at: data.stage_changed_at ?? now(),
    purchase_price: data.purchase_price ?? null, arv: data.arv ?? null,
    rehab_budget: data.rehab_budget ?? null, rehab_actual: data.rehab_actual ?? null,
    holding_costs: data.holding_costs ?? null, closing_costs: data.closing_costs ?? null,
    sale_price: data.sale_price ?? null, expected_profit: data.expected_profit ?? null,
    actual_profit: data.actual_profit ?? null, offer_date: data.offer_date ?? null,
    contract_date: data.contract_date ?? null, closing_date: data.closing_date ?? null,
    rehab_start_date: data.rehab_start_date ?? null, rehab_end_date: data.rehab_end_date ?? null,
    list_date: data.list_date ?? null, sold_date: data.sold_date ?? null,
    beds: data.beds ?? null, baths: data.baths ?? null, sqft: data.sqft ?? null,
    year_built: data.year_built ?? null, property_type: data.property_type ?? "single_family",
    lead_source: data.lead_source ?? null, notes: data.notes ?? null,
    assigned_to: data.assigned_to ?? null, created_by: data.created_by ?? null,
    created_at: now(), updated_at: now(),
  };
  deals.push(deal);
  lsWrite(KEYS.deals, deals);
  return deal;
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | null> {
  try {
    if (await isSupabaseAvailable()) return await sb.updateDeal(id, updates);
  } catch { /* fall through */ }
  const deals = lsRead<Deal>(KEYS.deals);
  const idx = deals.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  deals[idx] = { ...deals[idx], ...updates, updated_at: now() };
  lsWrite(KEYS.deals, deals);
  return deals[idx];
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function getLeads(): Promise<Lead[]> {
  try {
    if (await isSupabaseAvailable()) return await sb.getLeads();
  } catch { /* fall through */ }
  return lsRead<Lead>(KEYS.leads).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  try {
    if (await isSupabaseAvailable()) return await sb.createLead(data);
  } catch { /* fall through */ }
  const leads = lsRead<Lead>(KEYS.leads);
  const lead: Lead = {
    id: uid(), address: data.address ?? null, city: data.city ?? null,
    state: data.state ?? "", zip: data.zip ?? null,
    contact_name: data.contact_name ?? null, contact_phone: data.contact_phone ?? null,
    contact_email: data.contact_email ?? null, source: data.source ?? "other",
    score: data.score ?? "warm", status: data.status ?? "new",
    asking_price: data.asking_price ?? null, notes: data.notes ?? null,
    deal_id: data.deal_id ?? null, converted_at: data.converted_at ?? null,
    assigned_to: data.assigned_to ?? null, created_by: data.created_by ?? null,
    created_at: now(), updated_at: now(),
  };
  leads.push(lead);
  lsWrite(KEYS.leads, leads);
  return lead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  try {
    if (await isSupabaseAvailable()) return await sb.updateLead(id, updates);
  } catch { /* fall through */ }
  const leads = lsRead<Lead>(KEYS.leads);
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...updates, updated_at: now() };
  lsWrite(KEYS.leads, leads);
  return leads[idx];
}

// ---------------------------------------------------------------------------
// Rehab Items
// ---------------------------------------------------------------------------

export async function getRehabItems(dealId: string): Promise<RehabItem[]> {
  try {
    if (await isSupabaseAvailable()) return await sb.getRehabItems(dealId);
  } catch { /* fall through */ }
  return lsRead<RehabItem>(KEYS.rehabItems)
    .filter((r) => r.deal_id === dealId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function createRehabItem(data: Partial<RehabItem>): Promise<RehabItem> {
  try {
    if (await isSupabaseAvailable()) return await sb.createRehabItem(data);
  } catch { /* fall through */ }
  const items = lsRead<RehabItem>(KEYS.rehabItems);
  const item: RehabItem = {
    id: uid(), deal_id: data.deal_id ?? "", category: data.category ?? "General",
    description: data.description ?? null, estimated_cost: data.estimated_cost ?? 0,
    actual_cost: data.actual_cost ?? 0, contractor: data.contractor ?? null,
    status: data.status ?? "pending", notes: data.notes ?? null,
    created_at: now(), updated_at: now(),
  };
  items.push(item);
  lsWrite(KEYS.rehabItems, items);
  return item;
}

export async function updateRehabItem(id: string, updates: Partial<RehabItem>): Promise<RehabItem | null> {
  try {
    if (await isSupabaseAvailable()) return await sb.updateRehabItem(id, updates);
  } catch { /* fall through */ }
  const items = lsRead<RehabItem>(KEYS.rehabItems);
  const idx = items.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updated_at: now() };
  lsWrite(KEYS.rehabItems, items);
  return items[idx];
}

// ---------------------------------------------------------------------------
// Draws
// ---------------------------------------------------------------------------

export async function getDraws(dealId: string): Promise<Draw[]> {
  try {
    if (await isSupabaseAvailable()) return await sb.getDraws(dealId);
  } catch { /* fall through */ }
  return lsRead<Draw>(KEYS.draws)
    .filter((d) => d.deal_id === dealId)
    .sort((a, b) => a.draw_number - b.draw_number);
}

export async function createDraw(data: Partial<Draw>): Promise<Draw> {
  try {
    if (await isSupabaseAvailable()) return await sb.createDraw(data);
  } catch { /* fall through */ }
  const draws = lsRead<Draw>(KEYS.draws);
  const draw: Draw = {
    id: uid(), deal_id: data.deal_id ?? "", draw_number: data.draw_number ?? 1,
    amount: data.amount ?? 0, status: data.status ?? "pending",
    description: data.description ?? null, proof_notes: data.proof_notes ?? null,
    requested_at: data.requested_at ?? null, approved_at: data.approved_at ?? null,
    paid_at: data.paid_at ?? null, created_at: now(),
  };
  draws.push(draw);
  lsWrite(KEYS.draws, draws);
  return draw;
}

export async function updateDraw(id: string, updates: Partial<Draw>): Promise<Draw | null> {
  try {
    if (await isSupabaseAvailable()) return await sb.updateDraw(id, updates);
  } catch { /* fall through */ }
  const draws = lsRead<Draw>(KEYS.draws);
  const idx = draws.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  draws[idx] = { ...draws[idx], ...updates };
  lsWrite(KEYS.draws, draws);
  return draws[idx];
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export async function getActivities(offset = 0, limit = 30): Promise<ActivityLog[]> {
  try {
    if (await isSupabaseAvailable()) return await sb.getActivities(offset, limit);
  } catch { /* fall through */ }
  const all = lsRead<ActivityLog>(KEYS.activities).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return all.slice(offset, offset + limit);
}

export async function getActivityCount(): Promise<number> {
  try {
    if (await isSupabaseAvailable()) return await sb.getActivityCount();
  } catch { /* fall through */ }
  return lsRead<ActivityLog>(KEYS.activities).length;
}

export async function createActivity(data: Partial<ActivityLog>): Promise<ActivityLog> {
  try {
    if (await isSupabaseAvailable()) return await sb.createActivity(data);
  } catch { /* fall through */ }
  const activities = lsRead<ActivityLog>(KEYS.activities);
  const entry: ActivityLog = {
    id: uid(), user_id: data.user_id ?? null, user_name: data.user_name ?? "System",
    action: data.action ?? "", entity_type: data.entity_type ?? "system",
    entity_id: data.entity_id ?? null, details: data.details ?? null, created_at: now(),
  };
  activities.push(entry);
  lsWrite(KEYS.activities, activities);
  return entry;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function getTasks(): Promise<Task[]> {
  try {
    if (await isSupabaseAvailable()) return await sb.getTasks();
  } catch { /* fall through */ }
  return lsRead<Task>(KEYS.tasks).sort((a, b) => {
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  try {
    if (await isSupabaseAvailable()) return await sb.createTask(data);
  } catch { /* fall through */ }
  const tasks = lsRead<Task>(KEYS.tasks);
  const task: Task = {
    id: uid(), deal_id: data.deal_id ?? null, title: data.title ?? "",
    description: data.description ?? null, assigned_to: data.assigned_to ?? null,
    assigned_to_name: data.assigned_to_name ?? null, status: data.status ?? "pending",
    due_date: data.due_date ?? null, created_by: data.created_by ?? null,
    created_at: now(), completed_at: data.completed_at ?? null,
  };
  tasks.push(task);
  lsWrite(KEYS.tasks, tasks);
  return task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  try {
    if (await isSupabaseAvailable()) return await sb.updateTask(id, updates);
  } catch { /* fall through */ }
  const tasks = lsRead<Task>(KEYS.tasks);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  lsWrite(KEYS.tasks, tasks);
  return tasks[idx];
}

// ---------------------------------------------------------------------------
// Deal Notes
// ---------------------------------------------------------------------------

export async function getNotes(dealId: string): Promise<DealNote[]> {
  try {
    if (await isSupabaseAvailable()) return await sb.getNotes(dealId);
  } catch { /* fall through */ }
  return lsRead<DealNote>(KEYS.notes)
    .filter((n) => n.deal_id === dealId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function createNote(data: Partial<DealNote>): Promise<DealNote> {
  try {
    if (await isSupabaseAvailable()) return await sb.createNote(data);
  } catch { /* fall through */ }
  const notes = lsRead<DealNote>(KEYS.notes);
  const note: DealNote = {
    id: uid(), deal_id: data.deal_id ?? "", user_id: data.user_id ?? null,
    user_name: data.user_name ?? "Unknown", content: data.content ?? "", created_at: now(),
  };
  notes.push(note);
  lsWrite(KEYS.notes, notes);
  return note;
}

// ---------------------------------------------------------------------------
// Seed data — tries Supabase first, falls back to localStorage
// ---------------------------------------------------------------------------

export async function seedIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (await isSupabaseAvailable()) {
      await sb.seedIfNeeded();
      return;
    }
  } catch { /* fall through to localStorage seed */ }

  // localStorage fallback seed
  if (localStorage.getItem(KEYS.seeded)) return;

  // Import the old synchronous seed logic inline — simplified version
  // Just mark as seeded so we don't try again
  localStorage.setItem(KEYS.seeded, "1");
}
