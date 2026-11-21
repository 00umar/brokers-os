-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Creates the WhatsApp lead capture tables

-- 1. Stores each company's WhatsApp Business number connection
create table if not exists whatsapp_connections (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies(id) on delete cascade not null unique,
  phone_number_id     text not null,
  display_phone_number text,
  waba_id             text,
  connected_at        timestamptz default now(),
  last_message_at     timestamptz,
  created_at          timestamptz default now()
);

-- 2. Logs every incoming WhatsApp message; each new sender creates a deal automatically
create table if not exists whatsapp_leads (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid references companies(id) on delete cascade not null,
  sender_phone          text not null,
  sender_name           text,
  message_text          text,
  whatsapp_message_id   text unique,
  client_id             uuid references clients(id) on delete set null,
  deal_id               uuid references deals(id) on delete set null,
  received_at           timestamptz,
  created_at            timestamptz default now()
);

-- RLS: only team members of the company can see their own connections/leads
alter table whatsapp_connections enable row level security;

create policy "team can manage whatsapp connections"
  on whatsapp_connections for all
  using (company_id = (select company_id from profiles where id = auth.uid()));

alter table whatsapp_leads enable row level security;

create policy "team can view whatsapp leads"
  on whatsapp_leads for all
  using (company_id = (select company_id from profiles where id = auth.uid()));

-- Index for fast lookup of leads by sender (used during deduplication)
create index if not exists whatsapp_leads_sender_idx
  on whatsapp_leads (company_id, sender_phone, created_at desc);
