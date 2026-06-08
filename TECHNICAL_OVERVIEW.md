# JetMind — Guest Intelligence & Revenue Platform
## Technical Overview (Presentation Notes)

---

## 1. What it is (the one-liner)
A full-stack **hospitality intelligence platform** for Jetwing Symphony PLC (a Sri Lankan
luxury hotel group). It unifies guest data across properties and layers three kinds of
"intelligence" on top: **ML-based guest scoring**, **LLM-generated marketing offers & emails**,
and **real-time analytics dashboards** — all behind role-based access control.

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

## 3. Tech stack & why each piece

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
| **Background jobs** | Python, Celery, Redis | Nightly ETL + batch scoring outside the request cycle. |
| **PDF export** | jsPDF + html2canvas | "Export Report" on the sustainability dashboard. |

---

## 4. How a request actually works (end-to-end)

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

## 5. Security model — RBAC + Row-Level Security

This is a strong portfolio talking point because it's "defense in depth":

- **Roles:** `ADMIN` and `REVENUE_MANAGER`, stored in `user_roles`.
- **Application layer:** every sensitive route calls `requireStaff()` / `requireAdmin()`.
- **Database layer:** PostgreSQL **Row-Level Security policies** (e.g.
  `staff read customers USING (is_staff())`) mean that even if the app layer were bypassed, the
  database itself refuses to return rows to a non-staff user.
- PII (names, emails, phones) is never exposed to unauthenticated callers.

---

## 6. The three "intelligence" pillars (the core of the project)

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
  2-3 grounded seasonal offers. A **validate + one-retry** loop guarantees clean JSON.
- Offers go into a **review workflow** (PENDING_REVIEW -> APPROVED -> ACTIVE), then can become
  **campaigns** with AI-personalized emails.
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

## 7. Background processing (Python worker)
Not everything fits in a web request. A separate **Python service** uses **Celery + Redis** to run:
- **Nightly PMS ETL** — pull bookings from the Property Management System into the DB.
- **Feature refresh** — recompute the 18-feature `customer_features` via a DB function.
- **Batch scoring** — score every customer through the HF model and write `customer_scores` +
  an audit row in `scoring_runs`.

This shows understanding of **synchronous vs asynchronous** workloads — heavy/scheduled work
belongs in a queue, not the request path.

---

## 8. Data model (the domains)
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

## 9. Engineering decisions worth highlighting (great for Q&A)
- **Single trust boundary:** browser -> API -> {DB, AI}. Secrets (service-role key, Gemini key)
  live only on the server / as Supabase secrets, never in the client bundle.
- **Provider-agnostic AI layer:** migrated the LLM from Claude to Gemini by changing one shared
  module; the prompt logic didn't move.
- **Safe-by-default email sending:** campaign sends run as a **dry run** (marked sent, no real
  email) unless a SendGrid key is configured *and* the caller confirms — prevents accidentally
  emailing real addresses from a demo.
- **Resilience:** the scoring proxy isolates a bad/slow record instead of failing the whole
  batch; the LLM has a JSON-repair retry; aggregations handle incomplete data.
- **Type safety end to end:** Zod validates API inputs; generated TypeScript types mirror the DB
  schema; shared response types are imported by both the API and the UI.

---

## 10. Suggested demo flow (so the story lands)
1. **Log in** -> land on the **Executive Dashboard** (real KPIs from the DB).
2. **Guest Intelligence -> Filtering** -> show real guests, multi-select filters, **date range**,
   and the **ML Score column**.
3. **Select guests -> Send Offer** -> connect the filter to the marketing pipeline.
4. **Offer Recommendations -> Generate** -> live **Gemini** generation of seasonal offers from a
   business goal.
5. **Guest Analytics** -> flip the **date range** and watch every chart re-aggregate.
6. **Sustainability** -> ESG dashboards + **PDF export**.

---

## Honest framing for Q&A
If asked "is this production-ready?": it's a **portfolio-grade build on real architecture** —
real DB with RLS, real ML inference, real LLM generation — running on **demo/seed data**, with
email sending in safe dry-run mode and the model on a free-tier HF Space. The architecture is
production-shaped; the data and external integrations are demo-configured.

---

## Quick stack reference (for slides)
- **Frontend:** Next.js 16.2.6, React 19, TypeScript 5, Tailwind CSS 4, Recharts, lucide-react
- **Backend/API:** Next.js Route Handlers, Zod, Supabase JS client
- **Database/Auth:** Supabase (PostgreSQL, Row-Level Security, Auth, Edge Functions)
- **AI/ML:** Google Gemini (Edge Functions, Deno) + Hugging Face Gradio Space (Python ML)
- **Background:** Python, Celery, Redis, gradio_client
- **Other:** jsPDF + html2canvas (PDF export), server-only (server/client boundary)
