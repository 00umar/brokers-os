# Brokers OS

An operations system for real estate brokerages and property/construction teams. Brokers OS is **not** a property marketplace. It is the internal tool a brokerage uses to run deals, projects, field staff and client requests in one place.

It was originally built with 765 Realty (Lagos), which is no longer a client (as of 2026-11-21). The platform is multi-tenant: each company that signs up has its own separate data.

- **Live app:** https://brokers-os-app.vercel.app (old address https://765-crm.vercel.app is kept working during the switch)
- **Code:** https://github.com/00umar/brokers-os (renamed from `765-crm`; GitHub forwards the old link)
- **Change history:** [docs/CHANGELOG.md](docs/CHANGELOG.md). Every change gets logged there.

---

## 1. What the product does

### Public pages (no login)
| Page | URL | Purpose |
|---|---|---|
| Landing | `/` | Marketing page for Brokers OS |
| Listings | `/listings` | Public property listings |
| Intake form | `/intake` | Prospective clients submit a request (buy, sell, rent, etc.) |
| Client project report | `/project/:id/client` | Read-only progress report shared with a project client |
| Staff login / signup | `/login`, `/signup` | Staff accounts; new companies sign up here |
| Accept invite | `/accept-invite` | Staff invited by an admin finish setting up their account |
| Client portal | `/client/login`, `/client/dashboard` | Clients track their own requests |

### Staff app (login required, under `/app`)
| Module | URL | What it covers |
|---|---|---|
| Dashboard | `/app` | Overview |
| Brokerage Operations | `/app/brokerage` | Intake queue, 7-stage deal pipeline, client accounts, listings, social leads, analytics, offer letters |
| Sales & Marketing | `/app/sales` | Leads, follow-ups, partnerships, activity tracking |
| Project Management | `/app/projects` | Project wizard, phases, tasks, "Journey" view, evidence, client report |
| Workforce KPI | `/app/workforce` | Staff performance, weekly reports, approve/reject, worker responses |
| Field Operations | `/app/field` | Mobile view for field workers: tasks, photo/voice evidence, weekly report, report blocked tasks via WhatsApp |
| Team Management | `/app/settings` | Invite staff, change roles, set which modules managers can access |
| Company Settings | `/app/company-settings` | Company name and contact email, bank details, WhatsApp, Facebook/Instagram and WhatsApp lead-capture connections |

### Roles
- **admin**: full access
- **manager**: access to the modules an admin allows (configurable)
- **office_staff**: office modules
- **field_worker**: Field Operations only
- **client**: client portal only

New staff accounts start as **pending** until an admin approves them. The app logs users out automatically after 30 minutes of inactivity.

---

## 2. Technology

| Part | Tool |
|---|---|
| Front end | React + TypeScript + Vite |
| Styling | Tailwind CSS, shadcn/Radix UI components |
| Routing | React Router |
| Database, login, file storage | Supabase |
| Server functions | Supabase Edge Functions (Deno), in `supabase/functions/` |
| Hosting | Vercel (redeploys automatically when `main` is pushed to GitHub) |

---

## 3. Running it locally

1. Install [Node.js](https://nodejs.org) (LTS version).
2. In the project folder run `npm install`.
3. Create a file named `.env.local` in the project folder containing:
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key from Supabase → Project Settings → API>
   ```
4. Run `npm run dev` and open the address it prints (usually http://localhost:5173).

To build for production, run `npm run build`. Vercel does this automatically.

The same two `VITE_` values must be set in **Vercel → Project → Settings → Environment Variables**.

---

## 4. Database (Supabase)

| File | What it is | When to run it |
|---|---|---|
| [supabase_schema.sql](supabase_schema.sql) | The base tables | Once, on a fresh Supabase project |
| [migrations_pending.sql](migrations_pending.sql) | Columns and tables added after the base schema | After the schema. It is safe to run more than once. |
| [whatsapp_migration.sql](whatsapp_migration.sql) | WhatsApp lead-capture tables | Before using WhatsApp lead capture |
| [seed-mock-workers.sql](seed-mock-workers.sql) | Fake field-worker data for demos | Optional, for testing only |
| [seed-demo-social-leads.sql](seed-demo-social-leads.sql) | Demo Instagram/Facebook posts and leads (tagged `demo-`, removal SQL inside) | Optional, for demos only |

> **Free plan warning:** Supabase pauses free projects after about a week without use. When that happens nobody can log in. Restore the project from the Supabase dashboard, or upgrade to Pro so it never pauses.

Run each file in **Supabase → SQL Editor → New query**: paste the file's contents, then click Run.

> Keep a note in [docs/CHANGELOG.md](docs/CHANGELOG.md) of which SQL files have been run on the live database.

---

## 5. Server functions (Supabase Edge Functions)

| Function | Purpose |
|---|---|
| `invite-user` | Sends staff invitation emails |
| `meta-oauth-callback` | Finishes the "Connect Facebook/Instagram" login flow |
| `meta-sync-posts` | Pulls posts from the connected Facebook Page / Instagram |
| `meta-webhook` | Receives real-time leads/comments from Meta |
| `whatsapp-webhook` | Receives WhatsApp messages and turns each new sender into a deal |

To deploy one, run `supabase functions deploy <name>`. This needs the Supabase CLI and a login.

Secrets to set in **Supabase → Edge Functions → Secrets**:

| Name | Used by |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | all functions (Supabase usually provides these automatically) |
| `SITE_URL` | invite links, OAuth redirect (`https://brokers-os-app.vercel.app`) |
| `META_APP_ID`, `META_APP_SECRET` | Facebook/Instagram connection |
| `META_WEBHOOK_VERIFY_TOKEN` | `meta-webhook` (default `crm765_webhook_verify`) |
| `WHATSAPP_VERIFY_TOKEN` | `whatsapp-webhook` (default `brokersos-webhook-v1`) |

The Meta (Facebook/Instagram) verify token still contains the old "765" naming on purpose. It must match exactly what is entered in the Meta developer dashboard, so renaming it would break the webhook that is already connected.

---

## 6. Integrations: current status

**Facebook & Instagram (Social Leads)**
- Company Settings offers two ways to connect: the **Connect** button (Meta login) or pasting a **Page Access Token** manually.
- Testing uses a Facebook Page owned by a contact. No 765 Realty Facebook Page exists yet.
- Capturing leads automatically from ads requires a **Lead Generation** campaign and, for some permissions, Meta App Review.

**WhatsApp lead capture** (in progress)
- Tables: `whatsapp_connections`, `whatsapp_leads`
- Admin enters the Meta Phone Number ID in Company Settings, then registers the webhook URL and verify token in the Meta dashboard.

---

## 7. Known open items

- [ ] **WhatsApp lead capture:** run `whatsapp_migration.sql`, deploy `whatsapp-webhook`, configure it in Meta, test.
- [ ] **Fill in Company Settings:** company name, contact email, WhatsApp manager number and bank details. Offer letters, payment instructions, the client portal, field worker WhatsApp buttons and staff messages all read from here. Anything not filled in shows "Not set" or a neutral placeholder.
- [ ] **Public pages are shared by all companies.** `/listings` and `/intake` show every company's listings, and intake requests don't record which company they are for, so these pages carry Brokers OS branding. The proper fix is a public link per company (e.g. `/c/765-realty/listings`).
- [ ] **Social leads/posts are visible to every company.** Restrict the database rules to the user's own company before real brokers start.
- [ ] **Confirm which migrations have run** on the live database.
- [ ] **Later (when on Supabase Pro): connect Supabase to GitHub.** Not needed now, because database changes are run by hand from the `.sql` files. When there are real clients, move the SQL into `supabase/migrations/` and connect it, so database changes deploy automatically with the code.
- [ ] **Finish the move to `brokers-os-app.vercel.app`:**
  1. ~~Vercel: add `brokers-os-app.vercel.app`~~ Done 2026-11-21. (`brokers-os.vercel.app` and `brokersos.vercel.app` were already taken by other people.) `765-crm.vercel.app` still works.
  2. Supabase → Authentication → URL Configuration → set Site URL to `https://brokers-os-app.vercel.app`, and add `https://brokers-os-app.vercel.app/**` to Redirect URLs.
  3. Supabase → Edge Functions → Secrets → set `SITE_URL` to `https://brokers-os-app.vercel.app`.
  4. Meta developer app → Facebook Login → Valid OAuth Redirect URIs → add the new address.
  5. Test login, staff invite and the Facebook connection on the new address. Then remove the old one if you want.

---

## 8. Folder map

```
src/
  app/App.tsx              routes (which URL shows which screen)
  app/components/          one file per screen/module
  app/components/ui/       shared buttons, dialogs, inputs
  hooks/                   shared data loaders (company settings, social feed)
  lib/supabase.ts          database connection
  lib/database.types.ts    database table definitions for TypeScript
supabase/functions/        server functions
docs/CHANGELOG.md          dated log of every change
*.sql                      database setup and migration scripts
```

The UI was originally exported from Figma ("SaaS CRM Dashboard Design"). Credits for third-party assets are in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).
