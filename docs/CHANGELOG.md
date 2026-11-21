# Brokers OS: Change Log

A dated record of what changed and why. Newest entries are at the top. Every change gets added here.

---

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
| not yet | `whatsapp_migration.sql` | |
