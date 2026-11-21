-- ============================================================
-- Brokers OS - Supabase Database Schema
-- Run this in Supabase → SQL Editor → New query
-- ============================================================

-- Profiles (extends auth.users, created automatically on sign-up)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null default 'office_staff'
    check (role in ('admin', 'manager', 'office_staff', 'field_worker', 'client')),
  email text unique not null,
  phone text,
  department text,
  created_at timestamptz default now()
);

-- Clients (external: buyers, sellers, investors)
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  company text,
  type text check (type in ('buyer', 'seller', 'investor')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Deals (brokerage pipeline)
create table if not exists deals (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  stage text not null default 'new'
    check (stage in ('new', 'contacted', 'qualified', 'sourcing', 'inspection', 'negotiation', 'closed')),
  property_type text,
  budget_min numeric,
  budget_max numeric,
  location text,
  assigned_broker uuid references profiles(id),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Broker notes on deals
create table if not exists broker_notes (
  id uuid default gen_random_uuid() primary key,
  deal_id uuid references deals(id) on delete cascade,
  content text not null,
  author_id uuid references profiles(id),
  author_name text,
  created_at timestamptz default now()
);

-- Client intake / request forms
create table if not exists intake_requests (
  id uuid default gen_random_uuid() primary key,
  client_type text not null check (client_type in ('buyer', 'seller', 'investor')),
  property_type text,
  requirements text,
  budget text,
  location text,
  contact_name text not null,
  contact_email text,
  contact_phone text,
  company text,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  status text default 'new' check (status in ('new', 'assigned', 'in-progress', 'completed')),
  assigned_to uuid references profiles(id),
  created_at timestamptz default now()
);

-- Projects
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  project_manager uuid references profiles(id),
  pm_name text,
  deadline date,
  budget numeric,
  type text,
  status text default 'active' check (status in ('active', 'on-hold', 'completed')),
  created_at timestamptz default now()
);

-- Phases (belong to projects)
create table if not exists phases (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  order_index integer not null,
  status text default 'pending' check (status in ('pending', 'in-progress', 'completed')),
  created_at timestamptz default now()
);

-- Tasks (belong to phases)
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  phase_id uuid references phases(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  status text default 'pending' check (status in ('pending', 'in-progress', 'done', 'blocked')),
  assigned_to uuid references profiles(id),
  assigned_to_name text,
  assigned_by uuid references profiles(id),
  assigned_at timestamptz,
  blocked_by uuid references tasks(id),
  notes text,
  created_at timestamptz default now()
);

-- Task evidence (file uploads from field workers)
create table if not exists task_evidence (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_type text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Weekly KPI reports
create table if not exists weekly_reports (
  id uuid default gen_random_uuid() primary key,
  worker_id uuid references profiles(id),
  worker_name text,
  week_start date not null,
  hours_worked numeric,
  incident_notes text,
  status text default 'pending-review'
    check (status in ('pending-review', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Report task checklist items
create table if not exists report_task_items (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references weekly_reports(id) on delete cascade,
  task_name text not null,
  done boolean default false,
  evidence_urls text[],
  created_at timestamptz default now()
);

-- Property listings (shown on public home page and listings page)
create table if not exists listings (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric,
  price_label text,
  location text not null,
  property_type text,
  bedrooms integer,
  bathrooms integer,
  size_sqm numeric,
  image_url text,
  is_featured boolean default false,
  status text default 'active' check (status in ('active', 'sold', 'pending')),
  created_at timestamptz default now()
);

-- Leads (sales & marketing)
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  company text,
  email text,
  phone text,
  source text,
  status text default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  assigned_to uuid references profiles(id),
  notes text,
  follow_up_date date,
  created_at timestamptz default now()
);

-- Sales tasks (created from deals or leads, appear in Sales & Marketing follow-ups)
create table if not exists sales_tasks (
  id uuid default gen_random_uuid() primary key,
  deal_id uuid references deals(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  subject text not null,
  action text not null,
  assigned_to_name text,
  due_date date,
  status text default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table listings enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table deals enable row level security;
alter table broker_notes enable row level security;
alter table intake_requests enable row level security;
alter table projects enable row level security;
alter table phases enable row level security;
alter table tasks enable row level security;
alter table task_evidence enable row level security;
alter table weekly_reports enable row level security;
alter table report_task_items enable row level security;
alter table leads enable row level security;

-- Profiles
create policy "Users can view all profiles" on profiles
  for select using (auth.role() = 'authenticated');
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- All other tables: authenticated users have full access (tighten per role later)
create policy "Auth full access" on clients for all using (auth.role() = 'authenticated');
create policy "Auth full access" on deals for all using (auth.role() = 'authenticated');
create policy "Auth full access" on broker_notes for all using (auth.role() = 'authenticated');
create policy "Auth full access" on projects for all using (auth.role() = 'authenticated');
create policy "Auth full access" on phases for all using (auth.role() = 'authenticated');
create policy "Auth full access" on tasks for all using (auth.role() = 'authenticated');
create policy "Auth full access" on task_evidence for all using (auth.role() = 'authenticated');
create policy "Auth full access" on weekly_reports for all using (auth.role() = 'authenticated');
create policy "Auth full access" on report_task_items for all using (auth.role() = 'authenticated');
create policy "Auth full access" on leads for all using (auth.role() = 'authenticated');
alter table sales_tasks enable row level security;
create policy "Auth full access" on sales_tasks for all using (auth.role() = 'authenticated');

-- Listings: anyone can read, only authenticated users can write
create policy "Public can view listings" on listings
  for select using (true);
create policy "Auth full access" on listings
  for all using (auth.role() = 'authenticated');

-- Intake requests: authenticated users can manage, anyone can submit
create policy "Auth full access" on intake_requests for all using (auth.role() = 'authenticated');
create policy "Public can submit intake" on intake_requests
  for insert with check (true);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'office_staff')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Storage bucket for field worker uploads
-- Run separately if needed:
-- insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false);
-- ============================================================
