-- ============================================================
-- 765 CRM – Mock Workforce Seed Data
-- Paste into Supabase SQL Editor and click Run.
-- Workers can log in with:  email below / password: Worker@2025
-- ============================================================

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
