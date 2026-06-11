# JetMind — Guest Intelligence & Revenue Platform
## Technical Overview (Presentation Notes)

---

## 1. What it is (the one-liner)
A full-stack **hospitality intelligence platform** for Jetwing Symphony PLC (a Sri Lankan
luxury hotel group). It unifies guest data across properties and layers four kinds of
"intelligence" on top: **ML-based guest scoring**, **LLM-generated marketing offers & emails**,
**real-time analytics dashboards**, and an **ESG / sustainability reporting suite** — all behind
role-based access control.

It's not a CRUD app — the interesting part is the **AI/ML integration** and a clean
**multi-tier architecture**.

---

## 2. Architecture (the mental model)

Four layers, each with one job:

```
+---------------------------------------------------------------------+
|  BROWSER  -  Next.js (React 19) client components                   |
|  Dashboards, filters, charts (Recharts). Talks only to /api.        |
+---------------+-----------------------------------------------------+
                | fetch() (same-origin, auth cookie rides along)
+---------------v-----------------------------------------------------+
|  API LAYER  -  Next.js Route Handlers (/api/v1/...)                  |
|  Auth + RBAC, Zod validation, aggregation, talks to DB & AI.        |
+------+----------------------+---------------------------+-----------+
       | SQL                  | invoke                    | HTTP
+------v----------+  +--------v-----------+  +------------v----------+
| Supabase        |  | Supabase Edge Fns  |  | Hugging Face Space    |
| PostgreSQL +    |  | (Deno) -> Gemini   |  | (Gradio ML model)     |
| RLS + Auth      |  | offer/email gen    |  | guest scoring         |
+-----------------+  +--------------------+  +-----------------------+
       ^
       | (background)
+------+--------------------------------------+
| Python Worker - Celery + Redis             |
| PMS ETL . feature refresh . batch scoring  |
+--------------------------------------------+
```

**The key principle to say out loud:** *the browser never touches the database or the AI
providers directly.* Everything goes through the Next.js API layer, which is the single trust
boundary where auth, validation, and secrets live.

---

## 3. Full system architecture (complete reference)

Section 2 is the mental model; this is the complete wiring of every subsystem — the diagram to
keep open during a deep-dive.

### 3.1 End-to-end component map

```
                                  ┌──────────────────────────────────────────────┐
                                  │                 USER (browser)                │
                                  └───────────────────────┬──────────────────────┘
                                                          │ HTTPS (Supabase auth cookie)
┌─────────────────────────────────────────────────────────▼─────────────────────────────────────────┐
│ NEXT.JS APP (App Router · React 19 · TS · Tailwind 4)                                               │
│                                                                                                     │
│  middleware.ts ── verifies Supabase session on every request → redirects to /login if anonymous     │
│                                                                                                     │
│  CLIENT COMPONENTS ("use client")                 TYPED BROWSER CLIENTS (fetch wrappers)            │
│   • /login (split-screen brand page)               • lib/api/client.ts        → /api/v1/*           │
│   • /(dashboard) Executive Dashboard               • lib/guestScoring.ts       → /api/guests/score  │
│   • Guest Intelligence:                            • lib/sustainability/api.ts → /api/sustainability │
│       AnalyticsView · FilteringModule ·                                                             │
│       OfferIntelligence                            Sidebar (responsive drawer) · TopNav             │
│   • /sustainability (6 ESG views)                                                                   │
└───────────────┬──────────────────────────────┬───────────────────────────────┬────────────────────┘
                │ fetch() same-origin           │                               │
┌───────────────▼──────────────────────────────▼───────────────────────────────▼────────────────────┐
│ API LAYER — Next.js Route Handlers (the single trust boundary)                                      │
│  Wrapper: route() → requireStaff()/requireRevenueManager()/requireAdmin() → Zod parseBody() → ok()  │
│                                                                                                     │
│  /api/v1 (RBAC, RLS-scoped or admin client)        /api/guests/score (HF proxy, Gradio queue+SSE)   │
│   • admin/bootstrap · admin/roles                  /api/sustainability/* (admin client → views)     │
│   • customers (+ /score /features /scores)          • properties · environment · waste-summary      │
│   • offers  GET·POST(manual create)                 • community-programs · dashboard · kpis          │
│       [offerId] GET·PATCH(edit)                     • esg-pillars · hotel-performance                │
│       /approve /reject /activate /generate          • insights (→ Gemini) · news (→ NewsAPI)         │
│       /send-to-guests  /runs                                                                         │
│   • campaigns  GET·POST                            SERVER-ONLY LIBS                                  │
│       [id] /build-audience /generate-emails         • lib/supabase/server.ts  (RLS client)          │
│             /send /audience                         • lib/supabase/admin.ts   (service-role)         │
│   • dashboard/executive · guests/analytics          • lib/email/mailer.ts     (Nodemailer/SMTP)     │
│   • scoring/runs                                    • lib/sms/sms.ts          (Twilio REST)         │
└──────┬───────────────────────┬───────────────────────┬──────────────┬──────────────┬───────────────┘
       │ SQL (RLS / service)   │ functions.invoke()     │ HTTPS        │ SMTP         │ HTTPS
┌──────▼───────────────┐ ┌─────▼──────────────────┐ ┌───▼─────────┐ ┌──▼────────┐ ┌───▼──────────────┐
│ SUPABASE POSTGRES    │ │ SUPABASE EDGE FUNCTIONS │ │ HUGGINGFACE │ │  GMAIL    │ │ TWILIO · NEWSAPI │
│ • tables + views     │ │ (Deno runtime)          │ │  GRADIO     │ │  SMTP     │ │ (SMS · ESG news) │
│ • Row-Level Security │ │  • generate-offers      │ │  SPACE      │ └───────────┘ └──────────────────┘
│ • Auth (sessions)    │ │  • generate-email       │ │ customer-   │
│ • SQL functions/trig │ │  • generate-sustain…    │ │ ranker ML   │      ┌──────────────────────────┐
└──────▲───────────────┘ │  shared _shared/gemini  │ │ /predict    │      │ GOOGLE GEMINI            │
       │ writes          │  → model fallback chain ─┼─┼─────────────┘─────▶│ gemini-2.5-flash →       │
       │                 └─────────────────────────┘ └─────────────┘      │ 2.0-flash → flash-latest │
┌──────┴───────────────────────────────────┐                              └──────────────────────────┘
│ PYTHON WORKER (Celery + Redis)            │
│ nightly PMS ETL · feature refresh ·       │
│ batch scoring → customer_scores           │
└───────────────────────────────────────────┘
```

### 3.2 Component inventory

| Subsystem | Entry point(s) | Talks to |
|---|---|---|
| **Auth / session** | `middleware.ts`, `lib/supabase/server.ts`, `lib/api/auth.ts` | Supabase Auth, `user_roles` |
| **Guest list & filtering** | `FilteringModule.tsx` → `/api/v1/customers` | Postgres (RLS) |
| **ML scoring** | `lib/guestScoring.ts` → `/api/guests/score` | HuggingFace Gradio Space |
| **Offer engine** | `OfferIntelligence.tsx` → `/api/v1/offers*` | Postgres + `generate-offers` (Gemini) |
| **Send to guests** | `/api/v1/offers/:id/send-to-guests` | `mailer.ts` (Gmail SMTP) + `sms.ts` (Twilio) |
| **Campaigns** | `/api/v1/campaigns*` | Postgres + `generate-email` (Gemini) + SMTP |
| **Dashboards** | `/api/v1/dashboard/executive`, `/api/v1/guests/analytics` | Postgres (server-side aggregation) |
| **Sustainability** | `/sustainability` → `/api/sustainability/*` | Postgres views + `generate-sustainability-insights` (Gemini) + NewsAPI |
| **Background jobs** | Python `worker/` | PMS, Postgres, HF model |

### 3.3 Major data flows (one line each)

1. **Auth:** browser → `middleware` verifies cookie → route handler `requireStaff()` reads `user_roles` → 401/403 or proceed.
2. **Scoring:** `buildGuestVector()` (18 raw features) → `/api/guests/score` → Gradio queue (POST→event_id→SSE) → `{score, segment}` → tier badge.
3. **Offer generation:** `/api/v1/offers/generate` → `generate-offers` edge fn → pull property+seasonal+5yr history → Gemini JSON (validate+retry+model-fallback) → insert `seasonal_offers` (PENDING_REVIEW).
4. **Offer lifecycle:** PENDING_REVIEW → APPROVED → ACTIVE → EXPIRED; plus manual `POST /offers` (create) and `PATCH /offers/:id` (edit), all staff-gated.
5. **Send to guests:** select guests → `/send-to-guests` → per guest: has email → SMTP; no email but phone → Twilio SMS (link to jetwinghotels.com) → tracked `campaign` + `campaign_audience`.
6. **Campaign pipeline:** create campaign → build-audience (score-ranked) → generate-emails (Gemini, PII-minimal) → send (SMTP) → counters on `campaigns`.
7. **Dashboards:** route handler reads `historical_revenue` / `customers` + `bookings` → aggregates in code (full-period-only) → JSON → Recharts.
8. **Sustainability insights:** dashboard metrics + NewsAPI articles → `generate-sustainability-insights` (Gemini) → ESG recommendations, with deterministic fallback.
9. **Background:** Celery (nightly) → PMS ETL → recompute `customer_features` → batch-score → write `customer_scores` + `scoring_runs`.

### 3.4 External integrations

| Service | Used for | Secret(s) | Failure handling |
|---|---|---|---|
| **Google Gemini** (Edge Fns) | Offers, emails, ESG insights | `GEMINI_API_KEY` (Supabase secret) | backoff + model fallback chain; JSON-repair retry |
| **HuggingFace Gradio Space** | Guest scoring | `HF_API_TOKEN` (only if private) | per-row `null` isolation, 60s timeout |
| **Gmail SMTP** (Nodemailer) | Offer/campaign email | `SMTP_USER` / `SMTP_PASS` | safe dry-run unless configured + confirm |
| **Twilio** | SMS to no-email (OTA) guests | `TWILIO_*` | safe dry-run; E.164 normalisation |
| **NewsAPI** | Sustainability news feed | `NEWS_API_KEY` | reachability filter; insights work without it |

### 3.5 Repository / module map

```
app/
  (dashboard)/          page.tsx (Executive) · guests/ · sustainability/ · layout.tsx (shell)
  login/                branded split-screen sign-in (+ auto admin-bootstrap)
  api/v1/               customers · offers · campaigns · dashboard · guests · scoring · admin
  api/guests/score/     HuggingFace scoring proxy (Gradio queue + SSE)
  api/sustainability/   properties · environment · waste-summary · community-programs ·
                        dashboard · kpis · esg-pillars · hotel-performance · insights · news
components/
  Sidebar.tsx · TopNav.tsx
  guests/               AnalyticsView · FilteringModule · OfferIntelligence
  sustainability/       views/ (Overview · Environment · SocialGov) · data · exportReport
lib/
  api/ (client, auth, http) · supabase/ (server, admin, client) · email/mailer · sms/sms
  guestScoring.ts · guests/ · dashboard/ · sustainability/
supabase/
  functions/            generate-offers · generate-email · generate-sustainability-insights ·
                        _shared/ (gemini · offers · emails · insights · supabaseAdmin · deno-globals)
  migrations/           001–010 versioned SQL
worker/                 Python Celery + Redis (ETL · feature refresh · batch scoring)
```

---

## 4. Tech stack & why each piece

| Layer | Tech | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 5 | One codebase for frontend **and** backend (API routes). File-based routing. Server/client component split. |
| **Styling** | Tailwind CSS 4 | Utility-first, fast iteration, consistent design tokens. |
| **Charts** | Recharts | Declarative React charts (line/bar/pie). |
| **Database** | Supabase (PostgreSQL) | Managed Postgres + Auth + Row-Level Security + Edge Functions in one. |
| **Auth** | Supabase Auth (cookie sessions) + middleware | Server-verified sessions; RBAC via a `user_roles` table. |
| **Validation** | Zod | Runtime schema validation on API inputs (type-safe boundaries). |
| **LLM** | Google Gemini (`gemini-2.5-flash`) via Edge Functions | Generates offers & personalized emails (originally Claude — ported). |
| **ML model** | Hugging Face Gradio Space | Customer-ranking model (0-100 score) served as an API. |
| **Email** | Nodemailer + Gmail SMTP | Sends offer/campaign emails from the API routes (Node runtime). Safe dry-run unless SMTP is configured. |
| **SMS** | Twilio (REST) | Reaches no-email (OTA) guests; safe dry-run unless configured. |
| **Background jobs** | Python, Celery, Redis | Nightly ETL + batch scoring outside the request cycle. |
| **PDF export** | jsPDF + html2canvas | "Export Report" on the sustainability dashboard. |

---

## 5. How a request actually works (end-to-end)

Trace one page load — this is great to narrate during a demo:

1. **User opens a dashboard.** Next.js middleware checks the Supabase session cookie;
   unauthenticated users get redirected to `/login`.
2. The page is a **client component** (`"use client"`). On mount, a `useEffect` calls a typed
   client helper, e.g. `guestApi.guestAnalytics({ from, to })`, which does
   `fetch('/api/v1/guests/analytics?...')`.
3. That hits a **Route Handler** on the Next.js server. It calls `requireStaff()` -> reads the
   user + their roles from the session, throws **401/403** if they aren't ADMIN/REVENUE_MANAGER.
4. The handler queries Supabase with an **RLS-scoped client** (the user's identity), pulls raw
   rows, and **aggregates in code** (group by month, sum revenue, etc.).
5. Returns JSON `{ data: {...} }`. The browser stores it in state -> React re-renders the charts.

Two Supabase client types matter here (a good talking point):
- **RLS client** (`createClient`) — carries the signed-in user; the database enforces what they can see.
- **Admin client** (`createAdminClient`, service-role key) — bypasses RLS, used only server-side
  for trusted work (ETL, AI pipelines). The `server-only` package makes it a build error to ever
  import it into client code.

---

## 6. Security model — RBAC + Row-Level Security

This is a strong portfolio talking point because it's "defense in depth":

- **Roles:** `ADMIN` and `REVENUE_MANAGER`, stored in `user_roles`.
- **Application layer:** every sensitive route calls `requireStaff()` / `requireAdmin()`.
- **Database layer:** PostgreSQL **Row-Level Security policies** (e.g.
  `staff read customers USING (is_staff())`) mean that even if the app layer were bypassed, the
  database itself refuses to return rows to a non-staff user.
- PII (names, emails, phones) is never exposed to unauthenticated callers.

---

## 7. The three "intelligence" pillars (the core of the project)

### A) Guest Scoring — Machine Learning
- A model (`HiruniAyesha/jetwing-customer-ranker`) is deployed on **Hugging Face Spaces** as a
  **Gradio app**, exposing a `/predict` API.
- It takes **18 behavioral features** per guest (recency, frequency, monetary value, length of
  stay, loyalty signals, eco-engagement, etc.) and returns a **0-100 score** + segment
  ("Top 10% Customer").
- The Next.js route `/api/guests/score` calls it via Gradio's queue API (POST -> event id -> SSE
  stream), with bounded concurrency, and surfaces a **Score column** with tier badges
  (Platinum/Gold/Silver) in the guest table.
- *How the model works conceptually:* the raw features go through log-transform + quantile
  normalization inside the model, which then outputs a percentile rank — so "87" means "this
  guest ranks in the 87th percentile by predicted value."

### B) Offer & Email Generation — LLM (Generative AI)
- Two **Supabase Edge Functions** (Deno runtime) — `generate-offers` and `generate-email` —
  call **Google Gemini**.
- For offers: the function pulls the property profile + **Sri Lanka seasonal context** +
  **5 years of historical revenue** for the target month, builds a structured prompt with a
  **strategic directive** (the user's business goal), and asks Gemini to return a JSON array of
  2-3 grounded seasonal offers. A **validate + one-retry** loop guarantees clean JSON, and a
  **model-fallback chain** (2.5-flash → 2.0-flash → flash-latest) rides through overload spikes.
- Offers go into a **review workflow** (PENDING_REVIEW -> APPROVED -> ACTIVE -> EXPIRED), surfaced
  in the Offer Intelligence UI as tabs (**AI Recommendations**, **Approved Offers**, **Completed**
  for expired/invalid, plus campaign states). Staff can also **create offers manually** (`POST`)
  and **edit** any offer (`PATCH`) in-app. Approved/active offers can be **sent to guests in one
  click** — or turned into a **campaign** with AI-personalized emails.
- **Two send paths, one pipeline:** (1) hand-pick guests in **Filtering & Intelligence** and
  *Send Offer*, or (2) *Send to guests* on an **Approved Offer**. Both reuse
  `POST /api/v1/offers/:id/send-to-guests`, which spins up a tracked campaign, writes a
  **personalized message per guest** (branded email with a **link to jetwinghotels.com**, or an
  **SMS** for guests with no email), and dispatches via Gmail SMTP / Twilio. It reports
  `email_sent / sms_sent / failed / skipped` and surfaces the real provider error on failure.
- *Talking point:* the LLM client sits behind a shared interface, so swapping providers
  (we migrated **Claude -> Gemini**) only touched one file — the prompt-building and validation
  logic is provider-agnostic.

### C) Analytics & Dashboards — Data aggregation
- **Executive Dashboard:** group-wide KPIs (Revenue, RevPAR, Occupancy, Repeat-Guest Rate) +
  trend chart + property leaderboard, aggregated from a `historical_revenue` table
  (421 rows, 2020-2025).
- **Guest Analytics:** KPIs + growth/booking-source/revenue-by-hotel/nationality charts from
  `customers` + `bookings`, with a **date-range filter** that re-aggregates the whole view
  server-side.
- A nice engineering detail to mention: the dashboard intelligently **ignores
  partially-reported months** so an incomplete current month doesn't show a fake -98% revenue
  cliff — it compares only fully-reported periods.

---

## 8. Sustainability Dashboard — ESG reporting & AI insights

A full **ESG (Environmental, Social, Governance) reporting module** for the hotel group, served
at `/sustainability`. It's a distinct domain from Guest Intelligence but rides the *same*
architecture (browser client -> Next.js API -> Supabase), which is itself a good talking point:
the trust boundary and data-access patterns are reused, not reinvented.

**Six views**, switched from the sidebar without a full page reload — the sidebar dispatches a
`sustainabilityViewChange` browser event that the page listens for and swaps the rendered view:
- **Dashboard Overview** — headline ESG KPIs + AI-generated insights.
- **Climate Action** — carbon emissions & intensity, with cross-hotel comparison.
- **Energy Management** — consumption, renewable share, peak load.
- **Water Management** — usage & efficiency.
- **Waste Management** — generation, landfill diversion, recycling.
- **Community Impact** — social programmes & community spend.
*(Biodiversity, ESG Reports, Risk and Goals views exist in code but are currently disabled.)*

**Two global filters drive every view** (a sticky top bar):
- **Property** selector — All Properties or a single hotel.
- **Date-range** picker (From / To). Changing either re-fetches and **re-aggregates server-side**,
  so every chart and KPI reflects the chosen property + period.

**Data flow:** typed helpers in `lib/sustainability/api.ts` call REST routes under
`/api/sustainability/*` (`properties`, `environment`, `waste-summary`, `community-programs`,
`dashboard`, `kpis`, `esg-pillars`, `hotel-performance`, `insights`, `news`). These run on the
server with the **admin (service-role) client** and read **pre-aggregated monthly Postgres views**
(e.g. `sustainability_environment_dashboard_monthly`) filtered by property and period.

**The AI + live-data twist (strong talking point):**
- **`/api/sustainability/news`** pulls recent **Sri Lanka sustainability news** from an external
  **NewsAPI** feed, with URL validation + reachability checks so dead links are dropped.
- **`/api/sustainability/insights`** sends the current dashboard **metrics + those news articles**
  to a **Supabase Edge Function (`generate-sustainability-insights`, Gemini)**, which returns
  tailored ESG recommendations. If the LLM is unavailable or returns nothing, a **deterministic
  rule-based fallback** generates insights from the same metrics — so the panel **never breaks**.
  (Same resilience philosophy as the offer generator: AI-first, graceful-degradation second.)

**Export:** every view has an **"Export Report" -> PDF** button (client-side `html2canvas` +
`jsPDF`) that captures the current property/date selection into a titled, paginated A4 layout —
useful for board/ESG reporting.

---

## 9. Background processing (Python worker)
Not everything fits in a web request. A separate **Python service** uses **Celery + Redis** to run:
- **Nightly PMS ETL** — pull bookings from the Property Management System into the DB.
- **Feature refresh** — recompute the 18-feature `customer_features` via a DB function.
- **Batch scoring** — score every customer through the HF model and write `customer_scores` +
  an audit row in `scoring_runs`.

This shows understanding of **synchronous vs asynchronous** workloads — heavy/scheduled work
belongs in a queue, not the request path.

---

## 10. Data model (the domains)
~15 tables across four domains:
- **Core:** `properties`, `customers`, `bookings`
- **Intelligence:** `customer_features`, `customer_scores`, `scoring_runs`
- **Marketing:** `seasonal_offers`, `campaigns`, `campaign_audience`, `email_events`,
  `offer_generation_runs`
- **Context & Sustainability:** `historical_revenue`, `seasonal_context`, `prompt_registry`,
  plus sustainability views (environment, biodiversity, social, governance, ESG, risk).

Schema is managed as **versioned SQL migrations** — migration `010` extends `bookings`
(booking source, room category, services) and the loyalty tier.

---

## 11. Engineering decisions worth highlighting (great for Q&A)
- **Single trust boundary:** browser -> API -> {DB, AI}. Secrets (service-role key, Gemini key)
  live only on the server / as Supabase secrets, never in the client bundle.
- **Provider-agnostic AI layer:** migrated the LLM from Claude to Gemini by changing one shared
  module; the prompt logic didn't move. The Gemini client adds **backoff + a model-fallback chain**
  so transient overloads don't fail generation.
- **Safe-by-default messaging:** email **and** SMS sends run as a **dry run** (marked sent, no real
  message) unless the provider is configured (`SMTP_*` / `TWILIO_*`) *and* the caller confirms —
  prevents accidentally contacting real guests from a demo. `EMAIL_OVERRIDE_TO` / `SMS_OVERRIDE_TO`
  funnel everything to one inbox/phone for testing. Nodemailer is Node-only, so send routes pin
  `runtime = 'nodejs'` and it's excluded from the bundler via `serverExternalPackages`.
- **Resilience:** the scoring proxy isolates a bad/slow record instead of failing the whole
  batch; the LLM has a JSON-repair retry + model fallback; aggregations handle incomplete data;
  the sustainability insights panel falls back to deterministic rule-based recommendations if
  Gemini is unavailable.
- **Type safety end to end:** Zod validates API inputs; generated TypeScript types mirror the DB
  schema; shared response types are imported by both the API and the UI.

---

## 12. Suggested demo flow (so the story lands)
1. **Log in** -> land on the **Executive Dashboard** (real KPIs from the DB).
2. **Guest Intelligence -> Filtering** -> show real guests, multi-select filters, **date range**,
   and the **ML Score column**.
3. **Select guests -> Send Offer** -> connect the filter to the marketing pipeline.
4. **Offer Recommendations -> Generate** -> live **Gemini** generation of seasonal offers from a
   business goal -> **Approve** -> the offer appears under the **Approved Offers** tab.
5. **Approved Offers -> Send** -> one-click email/SMS of the offer to guests (branded email with a
   link to jetwinghotels.com; SMS for OTA guests), with live `sent / failed / skipped` feedback.
6. **Guest Analytics** -> flip the **date range** and watch every chart re-aggregate.
7. **Sustainability** -> ESG dashboards + AI insights + **PDF export**.
8. **Resize to a phone** -> the sidebar collapses into a slide-in drawer (hamburger toggle),
   showing the UI is fully responsive.

---

## Honest framing for Q&A
If asked "is this production-ready?": it's a **portfolio-grade build on real architecture** —
real DB with RLS, real ML inference, real LLM generation, and **real email/SMS delivery (Gmail
SMTP + Twilio)** — running on **demo/seed data**. Messaging defaults to a safe dry-run and only
sends for real once provider credentials are configured and the caller confirms; the ML model is
on a free-tier HF Space. The architecture is production-shaped; the data and external integrations
are demo-configured.

---

## Quick stack reference (for slides)
- **Frontend:** Next.js 16.2.6, React 19, TypeScript 5, Tailwind CSS 4, Recharts, lucide-react
- **Backend/API:** Next.js Route Handlers, Zod, Supabase JS client
- **Database/Auth:** Supabase (PostgreSQL, Row-Level Security, Auth, Edge Functions)
- **AI/ML:** Google Gemini (Edge Functions, Deno) + Hugging Face Gradio Space (Python ML)
- **Sustainability:** Gemini insights (Edge Function) + NewsAPI live feed, monthly ESG Postgres views
- **Messaging:** Nodemailer + Gmail SMTP (email) · Twilio (SMS) — both safe dry-run by default
- **Background:** Python, Celery, Redis, gradio_client
- **Other:** jsPDF + html2canvas (PDF export), server-only (server/client boundary)
