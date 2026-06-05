-- ==============================================================================
-- MIGRATION 002 — Offer Engine Base
-- Tables: prompt_registry, historical_revenue, offer_generation_runs
-- ==============================================================================

-- ── prompt_registry ──────────────────────────────────────────────────────────
create table if not exists public.prompt_registry (
  prompt_id         uuid primary key default uuid_generate_v4(),
  property_id       uuid references public.properties(property_id) on delete cascade,  -- NULL = global
  module            varchar(30) not null check (module in ('offer_generation', 'email_personalisation')),
  version           smallint not null,
  is_active         boolean default false,
  prompt_template   text not null,
  system_context    text not null,
  sri_lanka_context jsonb default '{}'::jsonb,
  property_profile  jsonb not null,
  max_tokens        smallint default 1200 check (max_tokens > 0),
  temperature       decimal(3, 2) default 0.7 check (temperature >= 0 and temperature <= 2),
  created_by        varchar(80) not null,
  created_at        timestamptz default now(),
  notes             text,
  unique (property_id, module, version)
);

-- Only one active version per property+module (enforced by partial unique index).
-- COALESCE handles the global (NULL property_id) prompt case.
create unique index if not exists idx_prompt_single_active
  on public.prompt_registry (coalesce(property_id, '00000000-0000-0000-0000-000000000000'::uuid), module)
  where is_active;

-- ── historical_revenue ───────────────────────────────────────────────────────
create table if not exists public.historical_revenue (
  record_id              uuid primary key default uuid_generate_v4(),
  property_id            uuid not null references public.properties(property_id) on delete cascade,
  year                   smallint not null check (year >= 2000),
  month                  smallint not null check (month between 1 and 12),
  total_revenue_lkr      bigint not null,
  room_revenue_lkr       bigint not null,
  fb_revenue_lkr         bigint not null,
  ancillary_revenue_lkr  bigint not null,
  total_room_nights_sold integer not null check (total_room_nights_sold >= 0),
  occupancy_pct          decimal(5, 2) not null check (occupancy_pct between 0 and 100),
  adr_lkr                decimal(12, 2) not null check (adr_lkr >= 0),
  revpar_lkr             decimal(12, 2) not null check (revpar_lkr >= 0),
  domestic_guest_pct     decimal(5, 2) default 0 check (domestic_guest_pct between 0 and 100),
  international_guest_pct decimal(5, 2) default 0 check (international_guest_pct between 0 and 100),
  top_source_markets     jsonb default '[]'::jsonb,
  avg_length_of_stay     decimal(4, 2) default 0 check (avg_length_of_stay >= 0),
  repeat_guest_pct       decimal(5, 2) default 0 check (repeat_guest_pct between 0 and 100),
  cancellation_rate_pct  decimal(5, 2) default 0 check (cancellation_rate_pct between 0 and 100),
  created_at             timestamptz default now(),
  unique (property_id, year, month)
);

-- ── offer_generation_runs ────────────────────────────────────────────────────
create table if not exists public.offer_generation_runs (
  run_id                 uuid primary key default uuid_generate_v4(),
  target_month           smallint not null check (target_month between 1 and 12),
  target_year            smallint not null check (target_year >= 2000),
  triggered_by           varchar(50) not null check (triggered_by in ('SCHEDULER', 'MANUAL', 'API')),
  triggered_by_user      varchar(80),
  status                 varchar(20) not null default 'RUNNING' check (status in ('RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL')),
  properties_processed   jsonb default '[]'::jsonb,
  properties_failed      jsonb default '[]'::jsonb,
  total_offers_generated smallint default 0 check (total_offers_generated >= 0),
  total_tokens_used      integer default 0 check (total_tokens_used >= 0),
  estimated_api_cost_usd decimal(8, 4) default 0 check (estimated_api_cost_usd >= 0),
  started_at             timestamptz not null default now(),
  completed_at           timestamptz,
  error_log              text
);

-- ── indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_prompt_registry_lookup     on public.prompt_registry(property_id, module, is_active);
create index if not exists idx_historical_revenue_lookup  on public.historical_revenue(property_id, year, month);
create index if not exists idx_historical_revenue_month   on public.historical_revenue(month, property_id);
create index if not exists idx_offer_runs_status          on public.offer_generation_runs(status, started_at desc);

comment on table public.prompt_registry is 'Versioned LLM prompts; single active version per property+module';
comment on table public.historical_revenue is 'Monthly metrics per property — primary source injected into offer prompts';
comment on table public.offer_generation_runs is 'Audit log for the monthly offer-generation pipeline';
