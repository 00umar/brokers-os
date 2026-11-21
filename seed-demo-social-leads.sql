-- ============================================================
-- Brokers OS — DEMO Social Leads & Posts
-- Run in Supabase → SQL Editor → New query.
-- Adds 6 demo posts and 16 demo leads to the super admin's company.
-- Every demo row is tagged with an id starting with 'demo-', so it is easy to remove.
--
-- TO REMOVE ALL DEMO DATA LATER, run:
--   DELETE FROM social_leads WHERE commenter_id LIKE 'demo-%';
--   DELETE FROM social_posts WHERE external_id LIKE 'demo-%';
-- ============================================================

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT company_id INTO cid FROM profiles
  WHERE is_super_admin = true AND company_id IS NOT NULL
  LIMIT 1;

  IF cid IS NULL THEN
    RAISE EXCEPTION 'No company found for the super admin account. Create the company in Company Settings first.';
  END IF;

  -- Remove previous demo rows so this script can be re-run safely
  DELETE FROM social_leads WHERE commenter_id LIKE 'demo-%';
  DELETE FROM social_posts WHERE external_id LIKE 'demo-%';

  -- ── Posts ────────────────────────────────────────────────
  INSERT INTO social_posts (company_id, platform, external_id, caption, media_url, media_type, permalink, like_count, comment_count, posted_at) VALUES
  (cid, 'instagram', 'demo-post-1', '🏠 4-Bedroom Fully Detached Duplex for Sale — Lekki Phase 1. BQ, fitted kitchen, 24hr power. 💰 ₦250M. DM for inspection 📲', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80', 'IMAGE', NULL, 184, 37, now() - interval '5 days'),
  (cid, 'instagram', 'demo-post-2', '✨ Newly built 3-Bedroom Terrace — Ikate, Lekki. Swimming pool, gym, serviced estate. Comment PRICE for details 👇', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80', 'IMAGE', NULL, 256, 52, now() - interval '4 days'),
  (cid, 'facebook',  'demo-post-3', '2-Bedroom Apartment for Rent — Yaba. Close to UNILAG. ₦4.5M per annum. Serious enquiries only.', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80', 'IMAGE', NULL, 73, 21, now() - interval '3 days'),
  (cid, 'instagram', 'demo-post-4', '🔑 5-Bedroom Mansion with Cinema & Pool — Banana Island. Price on request. Inspection strictly by appointment.', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80', 'IMAGE', NULL, 412, 64, now() - interval '2 days'),
  (cid, 'facebook',  'demo-post-5', 'Land for Sale — Ibeju-Lekki, 600sqm, C of O. Flexible payment plan available. Close to Dangote Refinery.', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', 'IMAGE', NULL, 129, 45, now() - interval '1 day'),
  (cid, 'instagram', 'demo-post-6', '🏡 3-Bedroom Semi-Detached Duplex — Ajah. ₦85M. Payment plan: 30% initial deposit. Comment INTERESTED 👇', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80', 'IMAGE', NULL, 98, 28, now() - interval '6 hours');

  -- ── Leads (interested comments) ──────────────────────────
  INSERT INTO social_leads (company_id, platform, commenter_name, commenter_id, comment_text, post_caption, status, created_at) VALUES
  (cid, 'instagram', 'Chioma Okafor',      'demo-lead-01', 'Price please? Is it still available? 🙏',                          '4-Bedroom Fully Detached Duplex — Lekki Phase 1', 'new',       now() - interval '20 minutes'),
  (cid, 'instagram', 'Tunde Bakare',       'demo-lead-02', 'PRICE',                                                            '3-Bedroom Terrace — Ikate, Lekki',               'new',       now() - interval '1 hour'),
  (cid, 'instagram', 'Amaka Eze',          'demo-lead-03', 'Interested. Can I do an inspection this Saturday?',               '3-Bedroom Semi-Detached Duplex — Ajah',          'new',       now() - interval '3 hours'),
  (cid, 'facebook',  'Ibrahim Musa',       'demo-lead-04', 'Is the land dry? Send me the payment plan details',                 'Land for Sale — Ibeju-Lekki, 600sqm',            'new',       now() - interval '5 hours'),
  (cid, 'instagram', 'Funmi Adeyemi',      'demo-lead-05', 'DM sent ✅ please check',                                          '5-Bedroom Mansion — Banana Island',              'new',       now() - interval '8 hours'),
  (cid, 'instagram', 'Emeka Nwosu',        'demo-lead-06', 'How much is the service charge per year?',                          '3-Bedroom Terrace — Ikate, Lekki',               'contacted', now() - interval '14 hours'),
  (cid, 'facebook',  'Blessing Johnson',   'demo-lead-07', 'I need a 2 bed in Yaba for my sister, is this negotiable?',          '2-Bedroom Apartment for Rent — Yaba',            'contacted', now() - interval '1 day'),
  (cid, 'instagram', 'Segun Oladipo',      'demo-lead-08', 'Price pls. I''m in the UK, can I do a virtual inspection?',          '4-Bedroom Fully Detached Duplex — Lekki Phase 1', 'qualified', now() - interval '1 day 4 hours'),
  (cid, 'instagram', 'Aisha Bello',        'demo-lead-09', 'INTERESTED',                                                       '3-Bedroom Semi-Detached Duplex — Ajah',          'new',       now() - interval '1 day 9 hours'),
  (cid, 'facebook',  'Kelechi Obi',        'demo-lead-10', 'What documents does the land have? C of O or Gazette?',             'Land for Sale — Ibeju-Lekki, 600sqm',            'qualified', now() - interval '2 days'),
  (cid, 'instagram', 'Ngozi Uche',         'demo-lead-11', 'Can I pay in installments?',                                        '3-Bedroom Terrace — Ikate, Lekki',               'new',       now() - interval '2 days 6 hours'),
  (cid, 'instagram', 'David Adebayo',      'demo-lead-12', 'Location exactly? Inside an estate?',                               '4-Bedroom Fully Detached Duplex — Lekki Phase 1', 'contacted', now() - interval '3 days'),
  (cid, 'facebook',  'Halima Sani',        'demo-lead-13', 'Still available for rent? When can I move in?',                     '2-Bedroom Apartment for Rent — Yaba',            'new',       now() - interval '3 days 5 hours'),
  (cid, 'instagram', 'Oluwaseun Ajayi',    'demo-lead-14', 'Nice one 🔥',                                                       '5-Bedroom Mansion — Banana Island',              'ignored',   now() - interval '3 days 8 hours'),
  (cid, 'instagram', 'Precious Ekanem',    'demo-lead-15', 'Send price to my DM please',                                         '5-Bedroom Mansion — Banana Island',              'new',       now() - interval '4 days'),
  (cid, 'facebook',  'Yusuf Abdullahi',    'demo-lead-16', 'Is the price fixed? I have ₦70M cash ready',                          '3-Bedroom Semi-Detached Duplex — Ajah',          'qualified', now() - interval '4 days 6 hours');

  RAISE NOTICE 'Demo data added: 6 posts, 16 leads.';
END $$;
