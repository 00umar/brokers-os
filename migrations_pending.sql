-- ============================================================
-- Brokers OS — Pending Migrations
-- Run ALL of these in Supabase → SQL Editor → New query
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS checks)
-- ============================================================


-- ============================================================
-- 1. PROFILES — Add missing columns
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'suspended'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allowed_modules text[] DEFAULT NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_id uuid DEFAULT NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;


-- ============================================================
-- 2. TASKS — Add due_date, priority, deliverables
-- ============================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deliverables text;


-- ============================================================
-- 3. PHASES — Add start_date, end_date
-- ============================================================

ALTER TABLE phases
  ADD COLUMN IF NOT EXISTS start_date date;

ALTER TABLE phases
  ADD COLUMN IF NOT EXISTS end_date date;


-- ============================================================
-- 4. WEEKLY REPORTS — Add worker_response
-- ============================================================

ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS worker_response text;


-- ============================================================
-- 5. LEADS — Add contact_name, lead_type
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS contact_name text;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_type text;


-- ============================================================
-- 6. BROKER NOTES — Add stage_at_time
-- ============================================================

ALTER TABLE broker_notes
  ADD COLUMN IF NOT EXISTS stage_at_time text;


-- ============================================================
-- 7. TASK NOTES — Create table (if not already created)
-- ============================================================

CREATE TABLE IF NOT EXISTS task_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES profiles(id),
  worker_name text NOT NULL,
  note_type text DEFAULT 'text'
    CHECK (note_type IN ('text', 'whatsapp_log', 'system')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth full access" ON task_notes;
CREATE POLICY "Auth full access" ON task_notes
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 8. OFFER LETTERS — Create table (if not already created)
-- ============================================================

CREATE TABLE IF NOT EXISTS offer_letters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id uuid REFERENCES deals(id) ON DELETE CASCADE,
  letter_type text NOT NULL
    CHECK (letter_type IN ('commission_agreement', 'settlement_instruction')),
  party_type text NOT NULL
    CHECK (party_type IN ('buyer', 'seller')),
  status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'signed')),
  signed_name text,
  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE offer_letters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth full access" ON offer_letters;
CREATE POLICY "Auth full access" ON offer_letters
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 9. COMPANIES — Create table for multi-tenant Super Admin
-- ============================================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  plan text DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'pro', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  -- Company settings (filled in by each company admin)
  whatsapp_number text,
  bank_name text,
  bank_account_number text,
  bank_sort_code text,
  facebook_page_id text,
  created_at timestamptz DEFAULT now()
);

-- If companies table already existed, add the new settings columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_sort_code text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS facebook_page_id text;

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
DROP POLICY IF EXISTS "Super admin full access" ON companies;
CREATE POLICY "Super admin full access" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Any authenticated user can create their own company (self-registration)
DROP POLICY IF EXISTS "Authenticated users can create company" ON companies;
CREATE POLICY "Authenticated users can create company" ON companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can read and update their own company (the one linked to their profile)
DROP POLICY IF EXISTS "Users can access own company" ON companies;
CREATE POLICY "Users can access own company" ON companies
  FOR ALL USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );


-- ============================================================
-- 10. Mark yourself as Super Admin
-- Replace the email below with YOUR login email before running
-- ============================================================

UPDATE profiles
  SET is_super_admin = true
WHERE email = 'abubakarumar040@gmail.com';


-- ============================================================
-- 11. SOCIAL_CONNECTIONS — OAuth tokens per company (Facebook + Instagram)
-- ============================================================

CREATE TABLE IF NOT EXISTS social_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  page_id text,
  page_name text,
  page_access_token text,
  instagram_account_id text,
  instagram_username text,
  user_access_token text,
  token_expires_at timestamptz,
  connected_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth full access" ON social_connections;
CREATE POLICY "Auth full access" ON social_connections
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 12. SOCIAL_POSTS — Synced posts pulled from Facebook / Instagram
-- ============================================================

CREATE TABLE IF NOT EXISTS social_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  external_id text NOT NULL,
  caption text,
  media_url text,
  media_type text,
  permalink text,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  posted_at timestamptz,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(platform, external_id)
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth full access" ON social_posts;
CREATE POLICY "Auth full access" ON social_posts
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- 13. SOCIAL_LEADS — Leads auto-captured from comments & lead forms
-- ============================================================

CREATE TABLE IF NOT EXISTS social_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram')),
  commenter_name text,
  commenter_id text,
  comment_text text,
  post_caption text,
  post_permalink text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'ignored')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth full access" ON social_leads;
CREATE POLICY "Auth full access" ON social_leads
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- Done.
-- After running: deploy the app so the new columns are live.
-- ============================================================


-- ============================================================
-- 12. DEMO FIXES (added 2026-11-21) — found missing on the live database
-- ============================================================

-- Company contact email (used on offer letters / Company Profile)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email text;

-- Storage bucket for listing photos (uploads fail without it)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Staff can upload listing images" ON storage.objects;
CREATE POLICY "Staff can upload listing images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Staff can update listing images" ON storage.objects;
CREATE POLICY "Staff can update listing images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
CREATE POLICY "Anyone can view listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');
