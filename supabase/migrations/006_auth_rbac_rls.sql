-- ==============================================================================
-- MIGRATION 006 — Auth / RBAC + Row Level Security
-- Replaces the PDF's JWT service with Supabase Auth.
--   • Roles: ADMIN, REVENUE_MANAGER  (SYSTEM = service_role key, bypasses RLS)
--   • Celery workers & Edge Functions use the service_role key → bypass RLS.
--   • Dashboard users authenticate via Supabase Auth and carry a role here.
-- ==============================================================================

-- ── user_roles ───────────────────────────────────────────────────────────────
create table if not exists public.user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       varchar(30) not null check (role in ('ADMIN', 'REVENUE_MANAGER')),
  created_at timestamptz default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is 'Maps Supabase Auth users to application roles for RBAC';

-- ── role helper functions (security definer to avoid RLS recursion) ──────────
create or replace function public.has_role(_role text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.has_role('ADMIN'); $$;

-- Staff = any authenticated user with an application role (admin or revenue manager)
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

-- ── enable RLS on every application table ────────────────────────────────────
alter table public.properties            enable row level security;
alter table public.seasonal_context      enable row level security;
alter table public.prompt_registry       enable row level security;
alter table public.historical_revenue    enable row level security;
alter table public.offer_generation_runs enable row level security;
alter table public.seasonal_offers       enable row level security;
alter table public.customers             enable row level security;
alter table public.bookings              enable row level security;
alter table public.customer_features     enable row level security;
alter table public.scoring_runs          enable row level security;
alter table public.customer_scores       enable row level security;
alter table public.campaigns             enable row level security;
alter table public.campaign_audience     enable row level security;
alter table public.email_events          enable row level security;
alter table public.user_roles            enable row level security;

-- ── user_roles policies ──────────────────────────────────────────────────────
create policy "users read own roles"  on public.user_roles
  for select to authenticated using (user_id = auth.uid());
create policy "admin manages roles"   on public.user_roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── helper: staff-read + admin-write policy generator ────────────────────────
-- Applied per table below. SELECT for any staff; write restricted appropriately.

-- Master/config tables: staff read, ADMIN write -------------------------------
create policy "staff read properties"        on public.properties            for select to authenticated using (public.is_staff());
create policy "admin write properties"       on public.properties            for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff read seasonal_context"  on public.seasonal_context      for select to authenticated using (public.is_staff());
create policy "admin write seasonal_context" on public.seasonal_context      for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff read prompts"           on public.prompt_registry       for select to authenticated using (public.is_staff());
create policy "admin write prompts"          on public.prompt_registry       for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff read historical"        on public.historical_revenue    for select to authenticated using (public.is_staff());
create policy "admin write historical"       on public.historical_revenue    for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Offer pipeline: staff read; staff (revenue managers) may update offer status
create policy "staff read runs"              on public.offer_generation_runs for select to authenticated using (public.is_staff());
create policy "staff read offers"            on public.seasonal_offers       for select to authenticated using (public.is_staff());
create policy "staff update offers"          on public.seasonal_offers       for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin write offers"           on public.seasonal_offers       for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Customer data (PII): staff read; ADMIN write (bulk ETL uses service_role)
create policy "staff read customers"         on public.customers             for select to authenticated using (public.is_staff());
create policy "admin write customers"        on public.customers             for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff read bookings"          on public.bookings              for select to authenticated using (public.is_staff());
create policy "admin write bookings"         on public.bookings              for all    to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff read features"          on public.customer_features     for select to authenticated using (public.is_staff());
create policy "staff read scoring_runs"      on public.scoring_runs          for select to authenticated using (public.is_staff());
create policy "staff read scores"            on public.customer_scores       for select to authenticated using (public.is_staff());

-- Campaigns: staff read + write (revenue managers create/manage campaigns)
create policy "staff read campaigns"         on public.campaigns             for select to authenticated using (public.is_staff());
create policy "staff write campaigns"        on public.campaigns             for all    to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "staff read audience"          on public.campaign_audience     for select to authenticated using (public.is_staff());
create policy "staff read email_events"      on public.email_events          for select to authenticated using (public.is_staff());

-- NOTE: All writes to scoring_runs, customer_features, customer_scores,
-- campaign_audience and email_events are performed by background workers /
-- Edge Functions using the service_role key, which bypasses RLS entirely.
