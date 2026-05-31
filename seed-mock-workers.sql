-- ============================================================
-- 765 CRM – Mock Workforce Seed Data
-- Paste into Supabase SQL Editor and click Run.
-- Workers can log in with:  email below / password: Worker@2025
-- ============================================================

-- ── 0. task_notes table (run once — safe to re-run) ──────────────────────────
CREATE TABLE IF NOT EXISTS task_notes (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id      uuid        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id    uuid        REFERENCES profiles(id),
  worker_name  text        NOT NULL,
  note_type    text        NOT NULL DEFAULT 'text'
                           CHECK (note_type IN ('text', 'whatsapp_log', 'system')),
  body         text        NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_notes' AND policyname = 'auth read task_notes'
  ) THEN
    CREATE POLICY "auth read task_notes" ON task_notes FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_notes' AND policyname = 'worker insert own task_notes'
  ) THEN
    CREATE POLICY "worker insert own task_notes" ON task_notes FOR INSERT
      WITH CHECK (auth.uid() = worker_id OR auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$
DECLARE
  w1   uuid := 'b1111111-1111-1111-1111-111111111111';
  w2   uuid := 'b2222222-2222-2222-2222-222222222222';
  w3   uuid := 'b3333333-3333-3333-3333-333333333333';
  w4   uuid := 'b4444444-4444-4444-4444-444444444444';
  proj1 uuid;
  proj2 uuid;
  ph1  uuid;
  ph2  uuid;
  ph3  uuid;
  ph4  uuid;
BEGIN

  -- ── 1. Auth users ────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES
    (w1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'emeka.okonkwo@765realty.com',  crypt('Worker@2025', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '','','',''),
    (w2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'aisha.musa@765realty.com',     crypt('Worker@2025', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '','','',''),
    (w3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'tunde.adeleke@765realty.com',  crypt('Worker@2025', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '','','',''),
    (w4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'fatima.ibrahim@765realty.com', crypt('Worker@2025', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '','','','')
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Profiles ──────────────────────────────────────────────────────────
  INSERT INTO profiles (id, full_name, email, role, status, phone) VALUES
    (w1, 'Emeka Okonkwo',  'emeka.okonkwo@765realty.com',  'field_worker', 'active', '+2348031234501'),
    (w2, 'Aisha Musa',     'aisha.musa@765realty.com',     'field_worker', 'active', '+2348041234502'),
    (w3, 'Tunde Adeleke',  'tunde.adeleke@765realty.com',  'field_worker', 'active', '+2348051234503'),
    (w4, 'Fatima Ibrahim', 'fatima.ibrahim@765realty.com', 'office_staff', 'active', '+2348061234504')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email     = EXCLUDED.email,
    role      = EXCLUDED.role,
    status    = EXCLUDED.status,
    phone     = EXCLUDED.phone;

  -- ── 3. Project 1: Lekki Residential Complex ──────────────────────────────
  INSERT INTO projects (name, pm_name, deadline, type, status)
  VALUES ('Lekki Residential Complex', 'Tunde Adeleke', '2025-12-31', 'Residential', 'active')
  RETURNING id INTO proj1;

  INSERT INTO phases (project_id, name, order_index, status, start_date, end_date)
  VALUES (proj1, 'Foundation & Groundwork', 1, 'in-progress', '2025-01-15', '2025-06-30')
  RETURNING id INTO ph1;

  INSERT INTO phases (project_id, name, order_index, status, start_date, end_date)
  VALUES (proj1, 'Structural Frame', 2, 'pending', '2025-07-01', '2025-11-30')
  RETURNING id INTO ph2;

  INSERT INTO tasks (project_id, phase_id, name, status, assigned_to, assigned_to_name, priority, notes) VALUES
    (proj1, ph1, 'Excavation and soil testing',        'done',        w1, 'Emeka Okonkwo', 'high',   'Soil report completed'),
    (proj1, ph1, 'Concrete mix preparation',           'done',        w1, 'Emeka Okonkwo', 'high',   NULL),
    (proj1, ph1, 'Foundation slab pour — Block A',     'in-progress', w2, 'Aisha Musa',    'high',   'Monitor curing for 72hrs'),
    (proj1, ph1, 'Foundation slab pour — Block B',     'pending',     w2, 'Aisha Musa',    'high',   'Starts after Block A cures'),
    (proj1, ph1, 'Drainage channel installation',      'in-progress', w3, 'Tunde Adeleke', 'medium', NULL),
    (proj1, ph1, 'Plumbing rough-in layout',           'pending',     w1, 'Emeka Okonkwo', 'medium', NULL),
    (proj1, ph2, 'Steel reinforcement delivery check', 'pending',     w3, 'Tunde Adeleke', 'medium', 'Verify quantity against PO'),
    (proj1, ph2, 'Column formwork setup',              'pending',     w2, 'Aisha Musa',    'medium', NULL);

  -- ── 4. Project 2: VI Office Renovation ───────────────────────────────────
  INSERT INTO projects (name, pm_name, deadline, type, status)
  VALUES ('Victoria Island Office Renovation', 'Fatima Ibrahim', '2025-09-30', 'Commercial', 'active')
  RETURNING id INTO proj2;

  INSERT INTO phases (project_id, name, order_index, status, start_date, end_date)
  VALUES (proj2, 'Demolition & Strip-out', 1, 'in-progress', '2025-05-01', '2025-07-15')
  RETURNING id INTO ph3;

  INSERT INTO phases (project_id, name, order_index, status, start_date, end_date)
  VALUES (proj2, 'Finishing & Handover', 2, 'pending', '2025-07-16', '2025-09-30')
  RETURNING id INTO ph4;

  INSERT INTO tasks (project_id, phase_id, name, status, assigned_to, assigned_to_name, priority, notes) VALUES
    (proj2, ph3, 'Remove existing false ceiling',     'done',        w3, 'Tunde Adeleke', 'medium', NULL),
    (proj2, ph3, 'Electrical wiring strip-out',       'done',        w1, 'Emeka Okonkwo', 'high',   'Coordinate with electrician first'),
    (proj2, ph3, 'Partition wall removal — Level 2',  'in-progress', w3, 'Tunde Adeleke', 'medium', NULL),
    (proj2, ph3, 'Debris hauling and site clearance', 'pending',     w2, 'Aisha Musa',    'low',    'Arrange skip hire'),
    (proj2, ph3, 'Asbestos inspection review',        'blocked',     w1, 'Emeka Okonkwo', 'high',   'Waiting on certified inspector'),
    (proj2, ph4, 'Floor screed installation',         'pending',     w2, 'Aisha Musa',    'medium', NULL),
    (proj2, ph4, 'Ceiling board and cornice fitting', 'pending',     w3, 'Tunde Adeleke', 'medium', NULL);

END $$;


-- ── 5. Task notes — field updates from workers ───────────────────────────────
-- (run after the DO block above so tasks exist)

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b1111111-1111-1111-1111-111111111111', 'Emeka Okonkwo', 'text',
  'Collected samples from 4 test pits. Sent batch to geotechnical lab. Results expected in 48 hrs.',
  now() - interval '12 days'
FROM tasks t WHERE t.name = 'Excavation and soil testing' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b1111111-1111-1111-1111-111111111111', 'Emeka Okonkwo', 'whatsapp_log',
  'Lab confirmed: bearing capacity adequate for 4-storey structure. Signed off. Moving to concrete mix.',
  now() - interval '10 days'
FROM tasks t WHERE t.name = 'Excavation and soil testing' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b2222222-2222-2222-2222-222222222222', 'Aisha Musa', 'text',
  'Block A slab poured this morning. All 22 crew present. Mix ratio verified by site engineer — 1:2:4.',
  now() - interval '3 days'
FROM tasks t WHERE t.name = 'Foundation slab pour — Block A' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b2222222-2222-2222-2222-222222222222', 'Aisha Musa', 'whatsapp_log',
  'Heavy rain started at 2pm — covered slab immediately with tarpaulin. Curing will likely need extra 24 hrs. Monitoring temperature.',
  now() - interval '2 days'
FROM tasks t WHERE t.name = 'Foundation slab pour — Block A' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b2222222-2222-2222-2222-222222222222', 'Aisha Musa', 'text',
  'Day 2 check — slab surface hardening well. No cracks observed. Will wet-cure for remaining 5 days.',
  now() - interval '1 day'
FROM tasks t WHERE t.name = 'Foundation slab pour — Block A' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b3333333-3333-3333-3333-333333333333', 'Tunde Adeleke', 'text',
  'Drainage channel excavated 60m of planned 80m. Pipe delivery delayed — supplier says Monday.',
  now() - interval '4 days'
FROM tasks t WHERE t.name = 'Drainage channel installation' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b3333333-3333-3333-3333-333333333333', 'Tunde Adeleke', 'text',
  'Pipes arrived this morning. Resuming installation. Should complete by end of week.',
  now() - interval '1 day'
FROM tasks t WHERE t.name = 'Drainage channel installation' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b1111111-1111-1111-1111-111111111111', 'Emeka Okonkwo', 'text',
  'Inspector no-show — third rescheduled date this month. Need management to escalate with contractor.',
  now() - interval '1 day'
FROM tasks t WHERE t.name = 'Asbestos inspection review' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b1111111-1111-1111-1111-111111111111', 'Emeka Okonkwo', 'whatsapp_log',
  'URGENT: Asbestos inspector missed appointment AGAIN. This is blocking all Level 2 finishing work. Please call contractor directly.',
  now() - interval '4 hours'
FROM tasks t WHERE t.name = 'Asbestos inspection review' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b3333333-3333-3333-3333-333333333333', 'Tunde Adeleke', 'text',
  'Level 2 partition 70% removed. Found what looks like a load-bearing beam — stopped work immediately.',
  now() - interval '6 hours'
FROM tasks t WHERE t.name = 'Partition wall removal — Level 2' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b3333333-3333-3333-3333-333333333333', 'Tunde Adeleke', 'whatsapp_log',
  'Work halted on Level 2 partition. Unexpected structural beam found. Awaiting structural engineer sign-off before continuing.',
  now() - interval '5 hours'
FROM tasks t WHERE t.name = 'Partition wall removal — Level 2' LIMIT 1;

INSERT INTO task_notes (task_id, worker_id, worker_name, note_type, body, created_at)
SELECT t.id, 'b3333333-3333-3333-3333-333333333333', 'Tunde Adeleke', 'text',
  'Ceiling boards in storage room removed without issue. Area cleared and ready for new board installation.',
  now() - interval '5 days'
FROM tasks t WHERE t.name = 'Remove existing false ceiling' LIMIT 1;


-- ── 6. Mock evidence (placeholder site photos) ───────────────────────────────

INSERT INTO task_evidence (task_id, file_url, file_name, file_type, uploaded_by)
SELECT t.id,
  'https://picsum.photos/seed/excavate1/800/600',
  'soil_test_pit_1.jpg', 'image/jpeg',
  'b1111111-1111-1111-1111-111111111111'
FROM tasks t WHERE t.name = 'Excavation and soil testing' LIMIT 1;

INSERT INTO task_evidence (task_id, file_url, file_name, file_type, uploaded_by)
SELECT t.id,
  'https://picsum.photos/seed/concrete2/800/600',
  'foundation_slab_A_pour.jpg', 'image/jpeg',
  'b2222222-2222-2222-2222-222222222222'
FROM tasks t WHERE t.name = 'Foundation slab pour — Block A' LIMIT 1;

INSERT INTO task_evidence (task_id, file_url, file_name, file_type, uploaded_by)
SELECT t.id,
  'https://picsum.photos/seed/slab3/800/600',
  'slab_covered_rain.jpg', 'image/jpeg',
  'b2222222-2222-2222-2222-222222222222'
FROM tasks t WHERE t.name = 'Foundation slab pour — Block A' LIMIT 1;

INSERT INTO task_evidence (task_id, file_url, file_name, file_type, uploaded_by)
SELECT t.id,
  'https://picsum.photos/seed/demo1/800/600',
  'partition_wall_level2.jpg', 'image/jpeg',
  'b3333333-3333-3333-3333-333333333333'
FROM tasks t WHERE t.name = 'Partition wall removal — Level 2' LIMIT 1;

INSERT INTO task_evidence (task_id, file_url, file_name, file_type, uploaded_by)
SELECT t.id,
  'https://picsum.photos/seed/ceiling1/800/600',
  'false_ceiling_removed.jpg', 'image/jpeg',
  'b3333333-3333-3333-3333-333333333333'
FROM tasks t WHERE t.name = 'Remove existing false ceiling' LIMIT 1;


-- ── 7. Mock weekly report for Emeka ──────────────────────────────────────────
INSERT INTO weekly_reports (
  worker_id, worker_name, week_start, hours_worked, incident_notes, status, reviewed_by, reviewed_at
) VALUES (
  'b1111111-1111-1111-1111-111111111111',
  'Emeka Okonkwo',
  date_trunc('week', now() - interval '1 week')::date,
  44,
  'Asbestos inspector failed to show for scheduled inspection at VI site. Third missed appointment — delays finishing work on Level 2.',
  'pending-review',
  NULL,
  NULL
) ON CONFLICT DO NOTHING;

INSERT INTO weekly_reports (
  worker_id, worker_name, week_start, hours_worked, incident_notes, status, reviewed_by, reviewed_at
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'Aisha Musa',
  date_trunc('week', now() - interval '1 week')::date,
  38,
  'Heavy rain on Thursday afternoon disrupted Block A curing schedule. Took emergency cover measures. No structural impact expected.',
  'approved',
  'Admin',
  now() - interval '2 days'
) ON CONFLICT DO NOTHING;
