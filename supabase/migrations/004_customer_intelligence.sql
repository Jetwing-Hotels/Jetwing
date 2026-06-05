-- ==============================================================================
-- MIGRATION 004 — Customer Intelligence
-- Tables: customer_features, scoring_runs, customer_scores
-- Note: scoring_runs.campaign_id FK is added in migration 005 (campaigns created there).
-- ==============================================================================

-- ── customer_features ────────────────────────────────────────────────────────
create table if not exists public.customer_features (
  feature_id                uuid primary key default uuid_generate_v4(),
  customer_id               uuid not null unique references public.customers(customer_id) on delete cascade,
  recency_days              integer not null check (recency_days >= 0),
  frequency_total           integer not null check (frequency_total >= 0),
  frequency_12m             integer default 0 check (frequency_12m >= 0),
  monetary_total_lkr        bigint not null check (monetary_total_lkr >= 0),
  monetary_avg_per_stay_lkr bigint default 0 check (monetary_avg_per_stay_lkr >= 0),
  monetary_12m_lkr          bigint default 0 check (monetary_12m_lkr >= 0),
  preferred_property_id     uuid references public.properties(property_id) on delete set null,
  property_diversity_score  decimal(4, 2) default 0 check (property_diversity_score between 0 and 1),
  avg_lead_time_days        integer default 0 check (avg_lead_time_days >= 0),
  avg_length_of_stay        decimal(4, 2) default 0 check (avg_length_of_stay >= 0),
  direct_booking_ratio      decimal(4, 2) default 0 check (direct_booking_ratio between 0 and 1),
  cancellation_ratio        decimal(4, 2) default 0 check (cancellation_ratio between 0 and 1),
  avg_satisfaction_score    decimal(4, 2),
  eco_engagement_flag       boolean default false,
  luxury_reserve_visits     integer default 0 check (luxury_reserve_visits >= 0),
  premium_hotel_visits      integer default 0 check (premium_hotel_visits >= 0),
  domestic_guest            boolean default false,
  high_season_preference    boolean default false,
  feature_computed_at       timestamptz not null default now()
);

-- ── scoring_runs ─────────────────────────────────────────────────────────────
create table if not exists public.scoring_runs (
  scoring_run_id   uuid primary key default uuid_generate_v4(),
  triggered_by     varchar(50) not null check (triggered_by in ('SCHEDULER', 'CAMPAIGN', 'MANUAL')),
  campaign_id      uuid,  -- FK to campaigns added in 005
  model_version    varchar(30) not null,
  customers_scored integer default 0 check (customers_scored >= 0),
  status           varchar(20) not null check (status in ('RUNNING', 'COMPLETED', 'FAILED')),
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  error_log        text
);

-- ── customer_scores ──────────────────────────────────────────────────────────
create table if not exists public.customer_scores (
  score_id         uuid primary key default uuid_generate_v4(),
  customer_id      uuid not null references public.customers(customer_id) on delete cascade,
  scoring_run_id   uuid not null references public.scoring_runs(scoring_run_id) on delete cascade,
  composite_score  decimal(5, 2) not null check (composite_score between 0 and 100),
  recency_score    decimal(5, 2),
  frequency_score  decimal(5, 2),
  monetary_score   decimal(5, 2),
  loyalty_score    decimal(5, 2),
  engagement_score decimal(5, 2),
  score_tier       varchar(20) not null check (score_tier in ('Platinum', 'Gold', 'Silver', 'Standard')),
  model_version    varchar(30) not null,
  scored_at        timestamptz default now(),
  unique (customer_id, scoring_run_id)
);

-- ── indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_features_recency   on public.customer_features(recency_days);
create index if not exists idx_features_preferred on public.customer_features(preferred_property_id);
create index if not exists idx_scoring_runs_status on public.scoring_runs(status, started_at desc);
create index if not exists idx_scores_customer    on public.customer_scores(customer_id);
create index if not exists idx_scores_tier        on public.customer_scores(score_tier, composite_score);
create index if not exists idx_scores_latest      on public.customer_scores(customer_id, scored_at desc);

-- ── latest_customer_scores view (use this for campaign targeting) ────────────
create or replace view public.latest_customer_scores as
select distinct on (customer_id)
  customer_id, score_id, composite_score, score_tier, model_version, scored_at
from public.customer_scores
order by customer_id, scored_at desc;

comment on table public.customer_features is 'Materialised feature vectors (nightly refresh) — inputs to the ML scoring model';
comment on table public.scoring_runs is 'Audit trail for ML batch scoring runs';
comment on table public.customer_scores is 'ML score history; most recent per customer drives campaign targeting';
comment on view  public.latest_customer_scores is 'Most-recent score per customer — always use for audience selection';
