-- D4D Mission Control - Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
create table users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null check (role in ('owner', 'acquisitions', 'dispositions', 'contractor')),
  email text unique,
  invite_code text unique,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seed team
insert into users (name, role, email, invite_code) values
  ('Ivan', 'dispositions', 'ivan@d4d.com', 'ivan2024'),
  ('Bryce', 'acquisitions', 'bryce@d4d.com', 'bryce2024'),
  ('Jack', 'owner', 'jack@d4d.com', 'jack2024');

-- ============================================
-- DEALS
-- ============================================
create type deal_stage as enum (
  'lead', 'prospect', 'under_contract', 'in_rehab', 'listed', 'sold', 'dead'
);

create table deals (
  id uuid primary key default uuid_generate_v4(),
  address text not null,
  city text default 'Philadelphia',
  state text default 'PA',
  zip text,
  stage deal_stage default 'lead',
  stage_changed_at timestamptz default now(),

  -- Financials
  purchase_price numeric(12,2),
  arv numeric(12,2),
  rehab_budget numeric(12,2),
  rehab_actual numeric(12,2) default 0,
  holding_costs numeric(12,2),
  closing_costs numeric(12,2),
  sale_price numeric(12,2),
  expected_profit numeric(12,2),
  actual_profit numeric(12,2),

  -- Dates
  offer_date date,
  contract_date date,
  closing_date date,
  rehab_start_date date,
  rehab_end_date date,
  list_date date,
  sold_date date,

  -- Details
  beds integer,
  baths numeric(3,1),
  sqft integer,
  year_built integer,
  property_type text default 'single_family',
  lead_source text,
  notes text,

  -- Assignments
  assigned_to uuid references users(id),
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();

-- Auto-update stage_changed_at when stage changes
create or replace function update_stage_changed_at()
returns trigger as $$
begin
  if old.stage is distinct from new.stage then
    new.stage_changed_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger deals_stage_changed
  before update on deals
  for each row execute function update_stage_changed_at();

-- ============================================
-- LEADS
-- ============================================
create type lead_score as enum ('hot', 'warm', 'cold');
create type lead_status as enum ('new', 'contacted', 'follow_up', 'converted', 'dead');

create table leads (
  id uuid primary key default uuid_generate_v4(),
  address text,
  city text,
  state text default 'PA',
  zip text,

  -- Contact
  contact_name text,
  contact_phone text,
  contact_email text,

  -- Lead info
  source text not null check (source in ('facebook', 'investor_lift', 'rtk', 'cold_call', 'ppc', 'referral', 'driving', 'other')),
  score lead_score default 'cold',
  status lead_status default 'new',
  asking_price numeric(12,2),
  notes text,

  -- Conversion
  deal_id uuid references deals(id),
  converted_at timestamptz,

  assigned_to uuid references users(id),
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- ============================================
-- REHAB ITEMS (budget line items per deal)
-- ============================================
create table rehab_items (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references deals(id) on delete cascade,
  category text not null,
  description text,
  estimated_cost numeric(10,2) not null default 0,
  actual_cost numeric(10,2) default 0,
  contractor text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger rehab_items_updated_at
  before update on rehab_items
  for each row execute function update_updated_at();

-- ============================================
-- DRAWS (1/3 increment draw schedule)
-- ============================================
create type draw_status as enum ('pending', 'requested', 'approved', 'paid');

create table draws (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references deals(id) on delete cascade,
  draw_number integer not null check (draw_number between 1 and 3),
  amount numeric(10,2) not null,
  status draw_status default 'pending',
  description text,
  proof_notes text,
  requested_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- ACTIVITY LOG
-- ============================================
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  user_name text not null,
  action text not null,
  entity_type text not null check (entity_type in ('deal', 'lead', 'rehab', 'draw', 'note', 'system')),
  entity_id uuid,
  details text,
  created_at timestamptz default now()
);

-- ============================================
-- TASKS
-- ============================================
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid references deals(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references users(id),
  assigned_to_name text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  due_date date,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ============================================
-- DEAL NOTES
-- ============================================
create table deal_notes (
  id uuid primary key default uuid_generate_v4(),
  deal_id uuid not null references deals(id) on delete cascade,
  user_id uuid references users(id),
  user_name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_deals_stage on deals(stage);
create index idx_deals_assigned on deals(assigned_to);
create index idx_leads_status on leads(status);
create index idx_leads_source on leads(source);
create index idx_leads_score on leads(score);
create index idx_rehab_items_deal on rehab_items(deal_id);
create index idx_draws_deal on draws(deal_id);
create index idx_activity_log_entity on activity_log(entity_type, entity_id);
create index idx_activity_log_created on activity_log(created_at desc);
create index idx_tasks_deal on tasks(deal_id);
create index idx_tasks_assigned on tasks(assigned_to);
create index idx_deal_notes_deal on deal_notes(deal_id);

-- ============================================
-- ROW LEVEL SECURITY (basic - all authenticated users can access)
-- ============================================
alter table users enable row level security;
alter table deals enable row level security;
alter table leads enable row level security;
alter table rehab_items enable row level security;
alter table draws enable row level security;
alter table activity_log enable row level security;
alter table tasks enable row level security;
alter table deal_notes enable row level security;

-- Allow all operations for authenticated users (simple auth model)
create policy "Allow all for anon" on users for all using (true) with check (true);
create policy "Allow all for anon" on deals for all using (true) with check (true);
create policy "Allow all for anon" on leads for all using (true) with check (true);
create policy "Allow all for anon" on rehab_items for all using (true) with check (true);
create policy "Allow all for anon" on draws for all using (true) with check (true);
create policy "Allow all for anon" on activity_log for all using (true) with check (true);
create policy "Allow all for anon" on tasks for all using (true) with check (true);
create policy "Allow all for anon" on deal_notes for all using (true) with check (true);
