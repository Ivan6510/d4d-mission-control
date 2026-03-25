/**
 * localStorage-backed data store for D4D Mission Control.
 * Drop-in replacement for Supabase until the database is connected.
 */

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
// Keys
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

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function now(): string {
  return new Date().toISOString();
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

export function getDeals(): Deal[] {
  return read<Deal>(KEYS.deals).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function getDeal(id: string): Deal | null {
  return read<Deal>(KEYS.deals).find((d) => d.id === id) ?? null;
}

export function createDeal(data: Partial<Deal>): Deal {
  const deals = read<Deal>(KEYS.deals);
  const deal: Deal = {
    id: uid(),
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    zip: data.zip ?? null,
    stage: data.stage ?? "lead",
    stage_changed_at: data.stage_changed_at ?? now(),
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
    created_at: now(),
    updated_at: now(),
  };
  deals.push(deal);
  write(KEYS.deals, deals);
  return deal;
}

export function updateDeal(id: string, updates: Partial<Deal>): Deal | null {
  const deals = read<Deal>(KEYS.deals);
  const idx = deals.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  deals[idx] = { ...deals[idx], ...updates, updated_at: now() };
  write(KEYS.deals, deals);
  return deals[idx];
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export function getLeads(): Lead[] {
  return read<Lead>(KEYS.leads).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function createLead(data: Partial<Lead>): Lead {
  const leads = read<Lead>(KEYS.leads);
  const lead: Lead = {
    id: uid(),
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
    created_at: now(),
    updated_at: now(),
  };
  leads.push(lead);
  write(KEYS.leads, leads);
  return lead;
}

export function updateLead(id: string, updates: Partial<Lead>): Lead | null {
  const leads = read<Lead>(KEYS.leads);
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...updates, updated_at: now() };
  write(KEYS.leads, leads);
  return leads[idx];
}

// ---------------------------------------------------------------------------
// Rehab Items
// ---------------------------------------------------------------------------

export function getRehabItems(dealId: string): RehabItem[] {
  return read<RehabItem>(KEYS.rehabItems)
    .filter((r) => r.deal_id === dealId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function createRehabItem(data: Partial<RehabItem>): RehabItem {
  const items = read<RehabItem>(KEYS.rehabItems);
  const item: RehabItem = {
    id: uid(),
    deal_id: data.deal_id ?? "",
    category: data.category ?? "General",
    description: data.description ?? null,
    estimated_cost: data.estimated_cost ?? 0,
    actual_cost: data.actual_cost ?? 0,
    contractor: data.contractor ?? null,
    status: data.status ?? "pending",
    notes: data.notes ?? null,
    created_at: now(),
    updated_at: now(),
  };
  items.push(item);
  write(KEYS.rehabItems, items);
  return item;
}

export function updateRehabItem(id: string, updates: Partial<RehabItem>): RehabItem | null {
  const items = read<RehabItem>(KEYS.rehabItems);
  const idx = items.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updated_at: now() };
  write(KEYS.rehabItems, items);
  return items[idx];
}

// ---------------------------------------------------------------------------
// Draws
// ---------------------------------------------------------------------------

export function getDraws(dealId: string): Draw[] {
  return read<Draw>(KEYS.draws)
    .filter((d) => d.deal_id === dealId)
    .sort((a, b) => a.draw_number - b.draw_number);
}

export function createDraw(data: Partial<Draw>): Draw {
  const draws = read<Draw>(KEYS.draws);
  const draw: Draw = {
    id: uid(),
    deal_id: data.deal_id ?? "",
    draw_number: data.draw_number ?? 1,
    amount: data.amount ?? 0,
    status: data.status ?? "pending",
    description: data.description ?? null,
    proof_notes: data.proof_notes ?? null,
    requested_at: data.requested_at ?? null,
    approved_at: data.approved_at ?? null,
    paid_at: data.paid_at ?? null,
    created_at: now(),
  };
  draws.push(draw);
  write(KEYS.draws, draws);
  return draw;
}

export function updateDraw(id: string, updates: Partial<Draw>): Draw | null {
  const draws = read<Draw>(KEYS.draws);
  const idx = draws.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  draws[idx] = { ...draws[idx], ...updates };
  write(KEYS.draws, draws);
  return draws[idx];
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export function getActivities(offset = 0, limit = 30): ActivityLog[] {
  const all = read<ActivityLog>(KEYS.activities).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return all.slice(offset, offset + limit);
}

export function getActivityCount(): number {
  return read<ActivityLog>(KEYS.activities).length;
}

export function createActivity(data: Partial<ActivityLog>): ActivityLog {
  const activities = read<ActivityLog>(KEYS.activities);
  const entry: ActivityLog = {
    id: uid(),
    user_id: data.user_id ?? null,
    user_name: data.user_name ?? "System",
    action: data.action ?? "",
    entity_type: data.entity_type ?? "system",
    entity_id: data.entity_id ?? null,
    details: data.details ?? null,
    created_at: now(),
  };
  activities.push(entry);
  write(KEYS.activities, activities);
  return entry;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function getTasks(): Task[] {
  return read<Task>(KEYS.tasks).sort((a, b) => {
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function createTask(data: Partial<Task>): Task {
  const tasks = read<Task>(KEYS.tasks);
  const task: Task = {
    id: uid(),
    deal_id: data.deal_id ?? null,
    title: data.title ?? "",
    description: data.description ?? null,
    assigned_to: data.assigned_to ?? null,
    assigned_to_name: data.assigned_to_name ?? null,
    status: data.status ?? "pending",
    due_date: data.due_date ?? null,
    created_by: data.created_by ?? null,
    created_at: now(),
    completed_at: data.completed_at ?? null,
  };
  tasks.push(task);
  write(KEYS.tasks, tasks);
  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = read<Task>(KEYS.tasks);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  write(KEYS.tasks, tasks);
  return tasks[idx];
}

// ---------------------------------------------------------------------------
// Deal Notes
// ---------------------------------------------------------------------------

export function getNotes(dealId: string): DealNote[] {
  return read<DealNote>(KEYS.notes)
    .filter((n) => n.deal_id === dealId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function createNote(data: Partial<DealNote>): DealNote {
  const notes = read<DealNote>(KEYS.notes);
  const note: DealNote = {
    id: uid(),
    deal_id: data.deal_id ?? "",
    user_id: data.user_id ?? null,
    user_name: data.user_name ?? "Unknown",
    content: data.content ?? "",
    created_at: now(),
  };
  notes.push(note);
  write(KEYS.notes, notes);
  return note;
}

// ---------------------------------------------------------------------------
// Seed data — runs once on first load
// ---------------------------------------------------------------------------

export function seedIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;


  // Seed deals
  const seedDeals: Deal[] = [
    // 0: 626 Sumpneytown Pike — active rehab
    {
      id: uid(),
      address: "626 Sumpneytown Pike",
      city: "Lansdale",
      state: "PA",
      zip: null,
      stage: "in_rehab",
      stage_changed_at: "2026-03-01T12:00:00Z",
      purchase_price: 572000,
      arv: 1150000,
      rehab_budget: 250000,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: null,
      expected_profit: 149670,
      actual_profit: null,
      offer_date: null,
      contract_date: "2026-02-01T12:00:00Z",
      closing_date: "2026-03-01T12:00:00Z",
      rehab_start_date: "2026-03-05T12:00:00Z",
      rehab_end_date: null,
      list_date: null,
      sold_date: null,
      beds: null,
      baths: null,
      sqft: null,
      year_built: null,
      property_type: "single_family",
      lead_source: "other",
      notes: "Major rehab. 50% JV split. HML Loan. Comps: 1428 Cambridge Dr $1.375M, 1219 Turnbury Ln $1.35M/$1.435M",
      assigned_to: "1",
      created_by: "1",
      created_at: "2026-02-01T12:00:00Z",
      updated_at: "2026-03-25T12:00:00Z",
    },
    // 1: 227 Silver Leaf Rdg — closing tomorrow
    {
      id: uid(),
      address: "227 Silver Leaf Rdg",
      city: "Harrisburg",
      state: "PA",
      zip: null,
      stage: "under_contract",
      stage_changed_at: "2026-03-01T12:00:00Z",
      purchase_price: 140000,
      arv: 254999,
      rehab_budget: 42000,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: 263000,
      expected_profit: 50625,
      actual_profit: 38097,
      offer_date: null,
      contract_date: "2026-03-01T12:00:00Z",
      closing_date: "2026-03-26T12:00:00Z",
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: null,
      sold_date: null,
      beds: null,
      baths: null,
      sqft: null,
      year_built: null,
      property_type: "single_family",
      lead_source: "other",
      notes: "CLOSING 3/26. HUD actual profit: $38,097. Ivan cut: $9,524. Sale at $263K (above $254,999 list).",
      assigned_to: "1",
      created_by: "1",
      created_at: "2026-03-01T12:00:00Z",
      updated_at: "2026-03-25T12:00:00Z",
    },
    // 2: 367 Dartmouth Ct — listed, negative currently
    {
      id: uid(),
      address: "367 Dartmouth Ct",
      city: "Bensalem",
      state: "PA",
      zip: null,
      stage: "listed",
      stage_changed_at: "2026-03-10T12:00:00Z",
      purchase_price: 232500,
      arv: 355000,
      rehab_budget: 90342,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: null,
      expected_profit: -4538,
      actual_profit: null,
      offer_date: null,
      contract_date: "2026-03-10T12:00:00Z",
      closing_date: null,
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: "2026-03-20T12:00:00Z",
      sold_date: null,
      beds: null,
      baths: null,
      sqft: null,
      year_built: null,
      property_type: "single_family",
      lead_source: "other",
      notes: "Listed at $379,999. Purchase $232,500. Rehab $90,342. Currently showing negative — needs to sell above $360K to profit. ACTION: Jack needs conveyancing forms done.",
      assigned_to: "3",
      created_by: "1",
      created_at: "2026-03-10T12:00:00Z",
      updated_at: "2026-03-25T12:00:00Z",
    },
    // 3: 301 E Elm Ave — listed
    {
      id: uid(),
      address: "301 E Elm Ave",
      city: "Hanover",
      state: "PA",
      zip: null,
      stage: "listed",
      stage_changed_at: "2026-03-01T12:00:00Z",
      purchase_price: null,
      arv: null,
      rehab_budget: null,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: null,
      expected_profit: null,
      actual_profit: null,
      offer_date: null,
      contract_date: null,
      closing_date: null,
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: "2026-03-01T12:00:00Z",
      sold_date: null,
      beds: null,
      baths: null,
      sqft: null,
      year_built: null,
      property_type: "single_family",
      lead_source: "other",
      notes: "Active listing. Email from Jenny about listing pitch.",
      assigned_to: "1",
      created_by: "1",
      created_at: "2026-02-15T12:00:00Z",
      updated_at: "2026-03-25T12:00:00Z",
    },
    // 5: 717 W Oak St — under contract
    {
      id: uid(),
      address: "717 W Oak St",
      city: "Palmyra",
      state: "PA",
      zip: null,
      stage: "under_contract",
      stage_changed_at: "2026-03-15T12:00:00Z",
      purchase_price: 100000,
      arv: null,
      rehab_budget: null,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: null,
      expected_profit: null,
      actual_profit: null,
      offer_date: null,
      contract_date: "2026-03-15T12:00:00Z",
      closing_date: null,
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: null,
      sold_date: null,
      beds: null,
      baths: null,
      sqft: null,
      year_built: null,
      property_type: "single_family",
      lead_source: "other",
      notes: "Purchase at $100K. No updates in last 24h.",
      assigned_to: "1",
      created_by: "1",
      created_at: "2026-03-10T12:00:00Z",
      updated_at: "2026-03-24T12:00:00Z",
    },
    // 6: Felton, York County — lead
    {
      id: uid(),
      address: "Felton, York County",
      city: "Felton",
      state: "PA",
      zip: null,
      stage: "lead",
      stage_changed_at: "2026-03-24T21:00:00Z",
      purchase_price: 219000,
      arv: 363000,
      rehab_budget: 30000,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: null,
      expected_profit: 66800,
      actual_profit: null,
      offer_date: null,
      contract_date: null,
      closing_date: null,
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: null,
      sold_date: null,
      beds: 3,
      baths: 2,
      sqft: 1560,
      year_built: null,
      property_type: "single_family",
      lead_source: "investor_lift",
      notes: "IL #305086. Ask $219K, ARV $363K (verified — comps: 4378 Brush Ln $366.5K, 7112 Church Rd $360K). Light rehab. 1.5 acres. BEST DEAL from 3/24 scan. $66.8K net.",
      assigned_to: "2",
      created_by: "2",
      created_at: "2026-03-24T21:00:00Z",
      updated_at: "2026-03-24T21:00:00Z",
    },
    // 7: 3952 Pulaski Ave — lead
    {
      id: uid(),
      address: "3952 Pulaski Ave",
      city: "Philadelphia",
      state: "PA",
      zip: "19140",
      stage: "lead",
      stage_changed_at: "2026-03-24T21:00:00Z",
      purchase_price: 40000,
      arv: 160000,
      rehab_budget: 50000,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: null,
      expected_profit: 49200,
      actual_profit: null,
      offer_date: null,
      contract_date: null,
      closing_date: null,
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: null,
      sold_date: null,
      beds: 3,
      baths: 1,
      sqft: 1248,
      year_built: null,
      property_type: "single_family",
      lead_source: "investor_lift",
      notes: "IL #308557. Ask $40K, ARV $160K (UNVERIFIED — no comps confirmed). Full rehab. $49.2K net IF ARV holds. Verify before flagging Jack.",
      assigned_to: "2",
      created_by: "2",
      created_at: "2026-03-24T21:00:00Z",
      updated_at: "2026-03-24T21:00:00Z",
    },
    // 8: 108 E 1st Ave — sold
    {
      id: uid(),
      address: "108 E 1st Ave",
      city: "Parkesburg",
      state: "PA",
      zip: "19365",
      stage: "sold",
      stage_changed_at: "2026-02-15T12:00:00Z",
      purchase_price: 245000,
      arv: 411000,
      rehab_budget: 65000,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: 411000,
      expected_profit: 51643,
      actual_profit: 44221,
      offer_date: null,
      contract_date: null,
      closing_date: "2026-02-15T12:00:00Z",
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: null,
      sold_date: "2026-02-15T12:00:00Z",
      beds: null,
      baths: null,
      sqft: null,
      year_built: null,
      property_type: "single_family",
      lead_source: "other",
      notes: "CLOSED. HUD actual profit: $44,221. Purchase $245K, Rehab $65K, Sold $411K.",
      assigned_to: "1",
      created_by: "1",
      created_at: "2026-01-01T12:00:00Z",
      updated_at: "2026-02-15T12:00:00Z",
    },
    // 9: 100 Deerfield Ct — sold
    {
      id: uid(),
      address: "100 Deerfield Ct",
      city: "",
      state: "PA",
      zip: null,
      stage: "sold",
      stage_changed_at: "2026-03-01T12:00:00Z",
      purchase_price: 425000,
      arv: 600000,
      rehab_budget: 54790,
      rehab_actual: null,
      holding_costs: null,
      closing_costs: null,
      sale_price: 600000,
      expected_profit: 67053,
      actual_profit: 59635,
      offer_date: null,
      contract_date: null,
      closing_date: "2026-03-01T12:00:00Z",
      rehab_start_date: null,
      rehab_end_date: null,
      list_date: null,
      sold_date: "2026-03-01T12:00:00Z",
      beds: null,
      baths: null,
      sqft: null,
      year_built: null,
      property_type: "single_family",
      lead_source: "other",
      notes: "CLOSED. HUD actual profit: $59,635. Ivan cut: $5,964 + $9,000. DFD remaining: $44,671.",
      assigned_to: "1",
      created_by: "1",
      created_at: "2026-01-15T12:00:00Z",
      updated_at: "2026-03-01T12:00:00Z",
    },
  ];
  write(KEYS.deals, seedDeals);

  // Seed leads — real leads from RTK, IL, and FB scans
  const seedLeads: Lead[] = [
    {
      id: uid(), address: "2313 Bryansville Rd", city: "Delta", state: "PA", zip: null,
      contact_name: "Justin Moul", contact_phone: null, contact_email: null,
      source: "referral", score: "warm", status: "new", asking_price: null,
      notes: "Price reduced, cleaned out. 1464sqft Colonial, .66 ac, 4bd/1.5ba, 2-car garage. Flagged by Justin in D4D inbox.", deal_id: null, converted_at: null,
      assigned_to: "2", created_by: "2", created_at: "2026-03-25T08:00:00Z", updated_at: "2026-03-25T08:00:00Z",
    },
    {
      id: uid(), address: "Birdsboro, Berks County", city: "Birdsboro", state: "PA", zip: "19508",
      contact_name: null, contact_phone: null, contact_email: null,
      source: "investor_lift", score: "warm", status: "new", asking_price: 125000,
      notes: "IL #308546. ARV $265K (verified comp: 1021 Allen Rd $270K Jan 2026). Major rehab $85K. 3/1 880sqft. $20.5K net — barely passes.", deal_id: null, converted_at: null,
      assigned_to: "2", created_by: "2", created_at: "2026-03-24T21:00:00Z", updated_at: "2026-03-24T21:00:00Z",
    },
    {
      id: uid(), address: "3051 Druck Valley Rd", city: "York", state: "PA", zip: null,
      contact_name: null, contact_phone: null, contact_email: null,
      source: "other", score: "warm", status: "contacted", asking_price: null,
      notes: "Showing confirmed for 3/25 at 8 AM. Coldwell Banker listing.", deal_id: null, converted_at: null,
      assigned_to: "1", created_by: "1", created_at: "2026-03-24T18:00:00Z", updated_at: "2026-03-25T08:00:00Z",
    },
    {
      id: uid(), address: "7139 Old Harrisburg Rd", city: "York Springs", state: "PA", zip: null,
      contact_name: null, contact_phone: null, contact_email: null,
      source: "other", score: "warm", status: "contacted", asking_price: 299000,
      notes: "Listed as COMING SOON at $299K. Showing confirmed Friday 3/27 at 3:00-3:30 PM. Keller Williams.", deal_id: null, converted_at: null,
      assigned_to: "1", created_by: "1", created_at: "2026-03-24T18:00:00Z", updated_at: "2026-03-25T08:00:00Z",
    },
  ];
  write(KEYS.leads, seedLeads);

  // No rehab items yet — will populate when deals enter rehab stage
  const seedRehabItems: RehabItem[] = [];
  write(KEYS.rehabItems, seedRehabItems);

  // No draws yet
  const seedDraws: Draw[] = [];
  write(KEYS.draws, seedDraws);

  // Seed activities with real recent events
  const seedActivities: ActivityLog[] = [

    { id: uid(), user_id: "2", user_name: "Leo", action: "scanned Investor Lift", entity_type: "lead", entity_id: seedDeals[5].id, details: "Found Felton deal — $66.8K net profit potential", created_at: "2026-03-24T21:00:00Z" },
    { id: uid(), user_id: "2", user_name: "Leo", action: "sent 1,359 RTK requests", entity_type: "system", entity_id: null, details: "All 9 counties — York, Adams, Berks, Bucks, Chester, Dauphin, Delaware, Lehigh, Montgomery", created_at: "2026-03-24T15:00:00Z" },
    { id: uid(), user_id: "1", user_name: "Ivan", action: "showing scheduled", entity_type: "lead", entity_id: null, details: "3051 Druck Valley Rd, York — 3/25 at 8 AM", created_at: "2026-03-24T18:00:00Z" },
    { id: uid(), user_id: "1", user_name: "Ivan", action: "showing scheduled", entity_type: "lead", entity_id: null, details: "7139 Old Harrisburg Rd, York Springs — 3/27 at 3 PM", created_at: "2026-03-24T18:30:00Z" },
    { id: uid(), user_id: "1", user_name: "Ivan", action: "deal closed", entity_type: "deal", entity_id: seedDeals[7].id, details: "108 E 1st Ave, Parkesburg — HUD profit $44,221", created_at: "2026-02-15T12:00:00Z" },
    { id: uid(), user_id: "1", user_name: "Ivan", action: "deal closed", entity_type: "deal", entity_id: seedDeals[8].id, details: "100 Deerfield Ct — HUD profit $59,635", created_at: "2026-03-01T12:00:00Z" },
  ];
  write(KEYS.activities, seedActivities);

  // Seed tasks with real action items
  const seedTasks: Task[] = [
    { id: uid(), deal_id: seedDeals[2].id, title: "Get Jack to fill out conveyancing forms", description: "367 Dartmouth Ct — Hallie (title co) can't order certs until forms are done. Multiple emails.", assigned_to: "3", assigned_to_name: "Jack", status: "pending", due_date: "2026-03-25T17:00:00Z", created_by: "1", created_at: "2026-03-25T08:00:00Z", completed_at: null },
    { id: uid(), deal_id: seedDeals[1].id, title: "Confirm closing docs for tomorrow", description: "227 Silver Leaf Rdg — closing 3/26. Title, docs, settlement all need to be ready.", assigned_to: "1", assigned_to_name: "Ivan", status: "pending", due_date: "2026-03-25T17:00:00Z", created_by: "1", created_at: "2026-03-25T08:00:00Z", completed_at: null },
    { id: uid(), deal_id: seedDeals[5].id, title: "Verify Felton deal comps and contact wholesaler", description: "IL #305086 — $66.8K net. Best deal from 3/24 scan. Need to move fast.", assigned_to: "2", assigned_to_name: "Bryce", status: "pending", due_date: "2026-03-26T17:00:00Z", created_by: "2", created_at: "2026-03-25T08:00:00Z", completed_at: null },
    { id: uid(), deal_id: null, title: "Review Felton showing Friday 3/27", description: "7139 Old Harrisburg Rd — showing at 3:00 PM, $299K Coming Soon", assigned_to: "1", assigned_to_name: "Ivan", status: "pending", due_date: "2026-03-27T14:00:00Z", created_by: "1", created_at: "2026-03-25T08:00:00Z", completed_at: null },
  ];
  write(KEYS.tasks, seedTasks);

  localStorage.setItem(KEYS.seeded, "1");
}
