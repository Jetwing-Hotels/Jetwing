-- ==============================================================================
-- MIGRATION 003 — Offers & Customers
-- Tables: seasonal_offers, customers, bookings
-- ==============================================================================

-- ── seasonal_offers ──────────────────────────────────────────────────────────
create table if not exists public.seasonal_offers (
  offer_id                       uuid primary key default uuid_generate_v4(),
  generation_run_id              uuid not null references public.offer_generation_runs(run_id) on delete cascade,
  property_id                    uuid not null references public.properties(property_id) on delete cascade,
  offer_title                    varchar(200) not null,
  offer_description              text not null,
  offer_type                     varchar(50) not null check (offer_type in ('Accommodation', 'Package', 'Experience', 'F&B', 'Wellness')),
  target_month                   smallint not null check (target_month between 1 and 12),
  target_year                    smallint not null check (target_year >= 2000),
  discount_type                  varchar(30) check (discount_type in ('Percentage', 'Complimentary', 'Value_Add', 'Rate_Plan')),
  discount_value                 decimal(6, 2),
  predicted_occupancy_uplift_pct decimal(5, 2),
  predicted_revenue_uplift_pct   decimal(5, 2),
  predicted_incremental_lkr      bigint,
  llm_rationale                  text,
  target_guest_segment           varchar(100),
  sustainability_angle           text,
  status                         varchar(20) not null default 'PENDING_REVIEW'
                                   check (status in ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED')),
  rejection_reason               text,
  approved_by                    varchar(80),
  approved_at                    timestamptz,
  valid_from                     date,
  valid_to                       date,
  created_at                     timestamptz default now(),
  constraint chk_offer_validity check (valid_from is null or valid_to is null or valid_from <= valid_to)
);

-- ── customers ────────────────────────────────────────────────────────────────
create table if not exists public.customers (
  customer_id          uuid primary key default uuid_generate_v4(),
  pms_guest_id         varchar(50) unique,
  email                varchar(254) unique not null,
  first_name           varchar(80) not null,
  last_name            varchar(80) not null,
  nationality          varchar(60),
  country_of_residence varchar(60),
  phone                varchar(30),
  date_of_birth        date,
  gender               varchar(20),
  preferred_language   varchar(20) default 'en',
  tier_label           varchar(30) default 'Standard' check (tier_label in ('Standard', 'Silver', 'Gold', 'Platinum')),
  acquisition_channel  varchar(50) check (acquisition_channel in ('Direct', 'OTA', 'Travel_Agent', 'Corporate', 'Jetwing_Travels')),
  marketing_opt_in     boolean default false,
  consent_date         timestamptz,
  eco_interest_flag    boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),
  deleted_at           timestamptz,
  constraint chk_opt_in_consent check (marketing_opt_in = false or consent_date is not null)
);

-- ── bookings ─────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  booking_id                uuid primary key default uuid_generate_v4(),
  customer_id               uuid not null references public.customers(customer_id) on delete cascade,
  property_id               uuid not null references public.properties(property_id) on delete cascade,
  pms_reservation_id        varchar(50) unique,
  booking_channel           varchar(50) not null check (booking_channel in ('Direct_Web', 'Direct_Phone', 'OTA', 'Travel_Agent', 'Corporate', 'Walk_In')),
  booking_date              date not null,
  check_in_date             date not null,
  check_out_date            date not null,
  length_of_stay            smallint not null check (length_of_stay > 0),
  room_type                 varchar(60) not null,
  adults                    smallint not null check (adults > 0),
  children                  smallint default 0 check (children >= 0),
  rate_plan                 varchar(80),
  total_room_revenue_lkr    bigint not null check (total_room_revenue_lkr >= 0),
  total_fb_spend_lkr        bigint default 0 check (total_fb_spend_lkr >= 0),
  total_ancillary_spend_lkr bigint default 0 check (total_ancillary_spend_lkr >= 0),
  total_revenue_lkr         bigint not null check (total_revenue_lkr >= 0),
  is_cancelled              boolean default false,
  cancellation_date         date,
  cancellation_reason       varchar(80),
  is_repeat_visit           boolean default false,
  satisfaction_score        smallint check (satisfaction_score is null or satisfaction_score between 1 and 10),
  nps_score                 smallint check (nps_score is null or nps_score between -100 and 100),
  special_requests          text,
  created_at                timestamptz default now(),
  constraint chk_cancellation check (
    (is_cancelled = false and cancellation_date is null) or
    (is_cancelled = true  and cancellation_date is not null)
  ),
  constraint chk_booking_dates check (booking_date <= check_in_date and check_in_date < check_out_date)
);

-- ── indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_offers_property_status on public.seasonal_offers(property_id, status);
create index if not exists idx_offers_target          on public.seasonal_offers(target_year, target_month);
create index if not exists idx_offers_run             on public.seasonal_offers(generation_run_id);
create index if not exists idx_customers_opt_in       on public.customers(marketing_opt_in) where deleted_at is null;
create index if not exists idx_bookings_customer      on public.bookings(customer_id);
create index if not exists idx_bookings_property      on public.bookings(property_id);
create index if not exists idx_bookings_check_in      on public.bookings(check_in_date);

comment on table public.seasonal_offers is 'LLM-generated offers requiring revenue-team approval before activation';
comment on table public.customers is 'Guest master (GDPR/PDPA). marketing_opt_in is the hard gate for campaigns';
comment on table public.bookings is 'Transaction-level booking data — primary source for ML feature engineering';
comment on column public.customers.marketing_opt_in is 'MUST be TRUE to be included in any campaign audience';
