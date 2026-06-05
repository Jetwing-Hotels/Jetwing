-- ==============================================================================
-- MIGRATION 001 — Master Data
-- Tables: properties, seasonal_context
-- Foundational tables with no external dependencies.
-- ==============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── properties ────────────────────────────────────────────────────────────────
create table if not exists public.properties (
  property_id         uuid primary key default uuid_generate_v4(),
  property_code       varchar(20) unique not null,
  property_name       varchar(120) not null,
  brand_tier          varchar(30) not null check (brand_tier in ('Luxury_Reserve', 'Premium_Hotel')),
  location_city       varchar(80) not null,
  location_region     varchar(80) not null,
  room_count          smallint not null check (room_count > 0),
  property_type       varchar(50) not null,
  sustainability_tier varchar(30) default 'Standard' check (sustainability_tier in ('Standard', 'Green', 'Platinum')),
  latitude            decimal(9, 6) not null,
  longitude           decimal(9, 6) not null,
  active              boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── seasonal_context ─────────────────────────────────────────────────────────
create table if not exists public.seasonal_context (
  context_id          uuid primary key default uuid_generate_v4(),
  month               smallint not null unique check (month between 1 and 12),
  season_label        varchar(50) not null,
  applicable_regions  jsonb not null default '[]'::jsonb,
  monsoon_active      boolean default false,
  monsoon_type        varchar(20) check (monsoon_type in ('Southwest', 'Northeast')),
  national_holidays   jsonb default '[]'::jsonb,
  major_festivals     jsonb default '[]'::jsonb,
  wildlife_events     jsonb default '[]'::jsonb,
  surfing_conditions  varchar(30),
  school_holiday_lk   boolean default false,
  eu_uk_peak_outbound boolean default false,
  notes               text
);

-- ── indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_properties_active     on public.properties(active);
create index if not exists idx_properties_brand_tier on public.properties(brand_tier);
create index if not exists idx_seasonal_context_month on public.seasonal_context(month);

comment on table public.properties is 'Master table for the seven Jetwing Symphony properties';
comment on table public.seasonal_context is 'Sri Lanka seasonal context injected into offer-generation prompts (one row per month)';
comment on column public.properties.sustainability_tier is 'Jetwing eco label: Standard | Green | Platinum';
