# Brokers OS: Change Log

A dated record of what changed and why. Newest entries are at the top. Every change gets added here.

---

## 2026-11-22 (Sales & Marketing rebuild)
**Why:** Sales & Marketing didn't match what was originally intended. Partnerships and Activity Log were fake data, the Filter and Add Partner buttons did nothing, two top numbers never changed, and the lead pop-up was small and nearly useless.

**What Sales & Marketing is for:** the team that does the legwork on leads. When a deal in Brokerage gets a To-do ("call the client", "go for inspection"), the person doing it is usually on the Sales & Marketing team, and the task appears in their Sales & Marketing → Team Tasks.

- **Team Management → new "Team" column.** Staff can be marked as **Sales & Marketing** (or Operations, Field, Management, Admin). Sales & Marketing people are listed first in every "Who is doing it?" dropdown.
- **Team Tasks** (was Follow-ups): task type (Call client, Inspection, Send details, Meeting, Other), **My tasks / Whole team**, To do / Done filters, the client's name and phone with **Call** and **WhatsApp** buttons, **Open deal** (jumps straight to the deal in Brokerage), and **Mark done**.
- **Activity Log is now real.** It automatically records tasks created and done (a completed call shows as a call), notes, hand-overs, stage changes, new leads, status changes and conversions.
- **Company Leads** (was Business Leads): clearly labelled as companies (developers, investors, corporates), with a pointer to Brokerage → Social Leads for individual buyers. The working status filter replaces the dead Filter button, and there's a new Handled By column.
- **Lead pop-up rebuilt:** larger; Call, WhatsApp and Email buttons; editable details; Handled By; status; tasks on the lead; notes and full history; Convert to Deal (the new deal keeps the Handled By person and opens straight in Brokerage).
- **Partnerships hidden** until it's built properly (it was fake data).
- **Brokerage To-do:** task type added, and it's linked to Team Tasks by person, not just by typed name.
- **Database:** section 14 of `migrations_pending.sql` adds the `activity_log` table and the `task_type`, `assigned_to` and `completed_at` columns on tasks. The screens still work before it's run (no history, and tasks save without a type).
- **Business Leads vs Brokerage leads:** kept separate (assumed to be B2B), pending the owner's confirmation.
- Note: the project has no TypeScript checker installed, so earlier "typecheck passed" checks weren't real. Changed files were checked with a temporary TypeScript install. The only remaining errors are a known existing mismatch between the database types and the library version.

## 2026-11-22
- **Plainer wording in the deal panel.** "Assigned To" is now **"Handled By"** (the person in charge of the whole client). "Sales Support" is now **"To-do"** (small jobs on the deal), and a new to-do is filled in automatically with the Handled By person; change it only to give the job to someone else. The pipeline table column is renamed to match.
- **"Load demo leads" button in Brokerage → Social Leads** (admins only). It adds 6 demo posts and 16 demo leads through the app using the admin's own login, because running the SQL seed didn't populate the tab. If the database blocks it, the exact error is shown on screen. A "Remove demo leads" button clears them. Demo rows are tagged `demo-`, and the data lives in `src/lib/demoSocialData.ts`.
- **Pipeline: "Assigned To" dropdown.** Each deal now has a dropdown of the company's active team members, so a deal can be handed over to someone else. Every hand-over is written into the deal's notes ("Deal assigned to …"). The pipeline table has a new "Assigned To" column.
- **Sales Support task "Assign to"** is now a dropdown of team members instead of free text.
- **Critical bug found:** the app saves a company ID on clients, deals and intake requests, but the live database had no such column, so **New Request, Add to Pipeline and Log Inquiry were failing silently.** The fix is section 13 of `migrations_pending.sql`, which also adds the column to listings and broker notes and assigns existing rows to the super admin's company.

## 2026-11-21 (demo social leads)
- Added `seed-demo-social-leads.sql`: 6 demo posts and 16 realistic demo leads for the super admin's company. All rows are tagged `demo-`, and the file includes the SQL to remove them.
- **Security gap found:** the `social_leads` and `social_posts` database rules let *any* logged-in user see every company's rows. They must be restricted to the user's own company before real brokers start.

## 2026-11-21 (demo readiness check)
- Checked the live database from outside. All app tables exist (including `whatsapp_connections` and `whatsapp_leads`, so the WhatsApp migration **has** been run).
- **Missing:** the `companies.email` column (saving Company Profile fails) and the `listing-images` storage bucket (listing photo uploads fail). The fix was added as section 12 of `migrations_pending.sql`.
- **Fake data still in the code:** Project Management shows made-up site photos and notes whenever a task has no real evidence.

## 2026-11-21 (lead capture research)
- Researched ways to capture Instagram/Facebook leads without forms or Meta hurdles. See [lead-capture-options.md](lead-capture-options.md).

## 2026-11-21 (business update)
- 765 Realty is no longer a client. The next step is to onboard about 2 brokers as the first real users, have them use Brokers OS end to end, and market it after that.

## 2026-11-21 (database outage)
- **Nobody could log in.** The cause was the Supabase project (`imgyzcbqoaolrvowdngp`) being paused for inactivity on the free plan, which made its address stop existing. The owner restored it from the Supabase dashboard. Login and data access were confirmed working again the same day.
- To prevent it: keep the app in regular use, or move to the Supabase Pro plan, which never pauses.
- "Not connected to GitHub" in Supabase is the optional GitHub integration. It isn't used and isn't a problem.

## 2026-11-21 (hosting rename)
- **GitHub repo renamed** from `00umar/765-crm` to `00umar/brokers-os`. GitHub forwards the old URL, and the local git remote has been updated.
- **New web address: https://brokers-os-app.vercel.app**, added to the Vercel project `765-crm` and confirmed live. `brokers-os.vercel.app` and `brokersos.vercel.app` were already owned by other Vercel accounts. The old `765-crm.vercel.app` still works. Supabase and Meta still need updating (see the README open items). No code changes were needed, because the app never hard-codes its own address.

## 2026-11-21 (later)
- **Removed the hard-coded "765 Realty" from the app.** Each company's own details now come from Company Settings:
  - Offer letters and settlement instructions: company name, "For <company>" signature block, account name, contact email for proof of payment, and a reference prefix based on the company name (e.g. `765-AB12CD34`).
  - Listing social captions: company hashtag based on the name; `#LagosRealEstate` replaced with `#RealEstate`.
  - Client portal: company name, logo letter, and the "Need to speak to someone?" WhatsApp button, which now uses the company's WhatsApp number instead of a placeholder.
  - Workforce KPI WhatsApp messages: "this is the <company> management team".
  - Public pages (client login, intake form, listings) use Brokers OS branding, because they aren't tied to one company yet.
- **New "Company Profile" section in Company Settings** to edit the company name and contact email. Before this, the name could only be set once, when the company was created.
- WhatsApp webhook default verify token renamed to `brokersos-webhook-v1`. It isn't registered with Meta yet, so this was safe to change.
- `migrations_pending.sql` now also adds `companies.email` if it is missing. The app still loads without it.
- Also committed: the WhatsApp lead capture work (not live yet), copying social captions for listings, and the listings overview.

## 2026-11-21
- **Renamed the product to "Brokers OS" everywhere.** The UI used to say "BrokerOS" (login, sidebar, landing page, invites, client report, browser tab). The SQL files said "765 CRM". The package name was a leftover from the Figma export. All of these now read "Brokers OS".
  - Left unchanged on purpose: "765 Realty", which is the client company's name and not the product; the webhook verify tokens, because changing them would break live Meta connections; and the Vercel URL and GitHub repo name.
- **Documentation set up.** Rewrote `README.md` as the full project reference and started this log.
- WhatsApp lead capture work committed separately (in progress, not live).

## 2026-07-14
- Facebook/Instagram connection: brought back the OAuth **Connect** button, which uses a Meta Business-type app, and kept the manual Page Access Token form as an alternative.

## 2026-07-12
- Meta OAuth fixes: passed `redirect_uri` through state to fix a mismatch error. Removed the `instagram_manage_insights` permission (it needs Meta App Review) and the deprecated `instagram_basic` permission.

## 2026-07-09
- Added the Company Settings page for each company's own configuration.
- Added the Facebook & Instagram connection with real-time lead capture through `meta-webhook`.
- Fixed 5 critical bugs found in a full audit. Fixed company access rules (RLS) and how a new company is linked to its creator's profile.

## 2026-07-06 – 07-07
- Rebranded to BrokerOS and added company signup, so several companies can use the platform with separate data. Every new record now stores which company it belongs to.
- Redesigned Project Management: a Journey view, deliverables split, client report, a task detail pop-up showing field worker evidence and notes, and mock field data.

## 2026-06-14
- Added auto-logout after 30 minutes of inactivity.

## 2026-05-31
- Full mobile layout pass. Added the Team Management module, role-based navigation and configurable manager access.
- Moved Social Leads into Brokerage. Added offer letters to the pipeline.
- Workforce KPI: employee detail pop-up, separate reports per role, worker responses.
- Field Operations: task notes, voice recording, evidence bug fix, logout button.
- Fixed the 404 error when refreshing a page on Vercel.

## 2026-05-18 – 05-23
- Public listings page, client portal, intake form.
- Brokerage Operations: intake queue, deal editing, listings management, analytics.
- Linked Sales & Marketing to Brokerage. Project wizard with phase templates. Workforce KPI connected to real data.
- Staff signup, forgot password, pending-approval gate.

## 2026-05-14
- Initial commit.

---

## Database migrations run on the live Supabase project
Record each file here when it is run on the live database, with the date.

| Date | File / change | Run by |
|---|---|---|
| _unknown_ | `supabase_schema.sql` | |
| _unknown_ | `migrations_pending.sql` | |
| before 2026-11-21 (confirmed by checking) | `whatsapp_migration.sql` | |
