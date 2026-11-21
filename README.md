# Brokers OS

An operations system for real estate brokerages and property/construction teams. Brokers OS is **not** a property marketplace. It is the internal tool a brokerage uses to run deals, projects, field staff and client requests in one place.

The first company using it is **765 Realty** (Lagos). The platform is multi-tenant: each company that signs up has its own separate data.

- **Live app:** https://765-crm.vercel.app
- **Code:** https://github.com/00umar/765-crm
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
| Company Settings | `/app/company-settings` | Company name, bank details, WhatsApp, Facebook/Instagram and WhatsApp lead-capture connections |

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
| `SITE_URL` | invite links, OAuth redirect (e.g. `https://765-crm.vercel.app`) |
| `META_APP_ID`, `META_APP_SECRET` | Facebook/Instagram connection |
| `META_WEBHOOK_VERIFY_TOKEN` | `meta-webhook` (default `crm765_webhook_verify`) |
| `WHATSAPP_VERIFY_TOKEN` | `whatsapp-webhook` (default `765crm-webhook-v1`) |

The default verify tokens still contain the old "765" naming on purpose. They must match exactly what is entered in the Meta developer dashboard, so renaming them would break a webhook that is already connected.

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
- [ ] **Field Operations manager number:** `MANAGER_WHATSAPP` in `FieldOperations.tsx` is a placeholder (`2348000000000`).
- [ ] **"765 Realty" is hard-coded** in client-facing screens and documents: offer letters, payment instructions, client portal, intake form, listings header, WhatsApp message text. Because the app is multi-tenant, every other company would see 765 Realty's name. These should read the company name and bank details from Company Settings.
- [ ] **Confirm which migrations have run** on the live database.
- [ ] **Hosting names:** the Vercel URL (`765-crm`) and GitHub repo (`765-crm`) still use the old name. Renaming either changes its links, so leave them until a custom domain is set up.

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
