-- ============================================================================
-- DEMO DATA — realistic figures so the dashboards + offer engine have something
-- to show. Safe to run AFTER seed.sql. Idempotent (re-running won't duplicate).
--
--   • historical_revenue : 7 properties × 2020–2024 × 12 months (seasonal model)
--   • customers          : 30 opted-in demo guests
--   • bookings           : 1–5 stays each, across properties
--   • customer_features  : aggregated from bookings (RFM + tiers)
--   • scoring_runs/scores: one demo scoring run with heuristic composite scores
--
-- Run in the Supabase SQL Editor, or:  psql "$DATABASE_URL" -f supabase/demo_data.sql
-- ============================================================================

-- ── 1. historical_revenue ────────────────────────────────────────────────────
-- Seasonal model: year recovery factor × month seasonality × tier ADR base.
insert into public.historical_revenue (
  property_id, year, month,
  total_revenue_lkr, room_revenue_lkr, fb_revenue_lkr, ancillary_revenue_lkr,
  total_room_nights_sold, occupancy_pct, adr_lkr, revpar_lkr,
  domestic_guest_pct, international_guest_pct, top_source_markets,
  avg_length_of_stay, repeat_guest_pct, cancellation_rate_pct
)
select
  p.property_id, y.year, m.month,
  (r.room_rev + round(r.room_rev * 0.35) + round(r.room_rev * 0.18))::bigint,
  r.room_rev,
  round(r.room_rev * 0.35)::bigint,
  round(r.room_rev * 0.18)::bigint,
  n.nights,
  g.occ,
  g.adr,
  round(g.adr * g.occ / 100, 2)::numeric(12, 2),
  (100 - f.intl)::numeric(5, 2),
  f.intl::numeric(5, 2),
  '["United Kingdom","Germany","India","Australia","France"]'::jsonb,
  (2.5 + (m.month % 3) * 0.4)::numeric(4, 2),
  (18 + (p.room_count % 12))::numeric(5, 2),
  (6 + (m.month % 5))::numeric(5, 2)
from public.properties p
cross join generate_series(2020, 2024) as y(year)
cross join generate_series(1, 12)     as m(month)
cross join lateral (
  select
    case y.year when 2020 then 0.60 when 2021 then 0.72 when 2022 then 0.88 when 2023 then 1.00 else 1.10 end as yf,
    case when m.month in (12, 1, 2, 3) then 0.86 when m.month = 4 then 0.80 when m.month in (7, 8) then 0.70 else 0.55 end as sf,
    case when p.brand_tier = 'Luxury_Reserve' then 72000 else 42000 end as adr_base,
    case when p.brand_tier = 'Luxury_Reserve' then 70 else 52 end as intl
) f
cross join lateral (
  select
    least(95, greatest(30, round(f.sf * 100 * f.yf)))::numeric(5, 2) as occ,
    round(f.adr_base * f.sf * f.yf)::numeric(12, 2) as adr
) g
cross join lateral (select round(p.room_count * 30 * g.occ / 100)::int as nights) n
cross join lateral (select (g.adr * n.nights)::bigint as room_rev) r
on conflict (property_id, year, month) do nothing;

-- ── 2. customers (30 opted-in demo guests) ──────────────────────────────────
insert into public.customers (
  email, first_name, last_name, nationality, country_of_residence,
  preferred_language, tier_label, acquisition_channel,
  marketing_opt_in, consent_date, eco_interest_flag
)
select
  'demo' || lpad(i::text, 2, '0') || '@example.com',
  (array['Nimal','Saman','Amara','Dilani','Ruwan','Tharindu','Ishara','Kavindu','Sanduni','Hashini',
         'James','Emma','Liam','Olivia','Lukas','Anna','Pierre','Marie','Arjun','Priya'])[1 + (i % 20)],
  (array['Perera','Fernando','Silva','Jayawardena','Bandara','Wickrama','Gunaratne',
         'Smith','Müller','Dubois','Sharma','Patel'])[1 + (i % 12)],
  (array['Sri Lanka','Sri Lanka','United Kingdom','Germany','India','Australia','France'])[1 + (i % 7)],
  (array['Sri Lanka','Sri Lanka','United Kingdom','Germany','India','Australia','France'])[1 + (i % 7)],
  case when i % 7 in (3) then 'de' when i % 7 in (6) then 'fr' else 'en' end,
  (array['Standard','Silver','Gold','Platinum'])[1 + (i % 4)],
  (array['Direct','OTA','Travel_Agent','Corporate','Jetwing_Travels'])[1 + (i % 5)],
  true,
  now() - (i || ' days')::interval,
  (i % 3 = 0)
from generate_series(1, 30) as i
on conflict (email) do nothing;

-- ── 3. bookings (1–5 per demo customer; skip customers that already have any) ─
with cust as (
  select customer_id, row_number() over (order by email) as crn
  from public.customers where email like 'demo%'
),
props as (
  select property_id, brand_tier, row_number() over (order by property_code) as prn
  from public.properties
)
insert into public.bookings (
  customer_id, property_id, booking_channel, booking_date, check_in_date, check_out_date,
  length_of_stay, room_type, adults, children,
  total_room_revenue_lkr, total_fb_spend_lkr, total_ancillary_spend_lkr, total_revenue_lkr,
  is_repeat_visit, satisfaction_score
)
select
  c.customer_id,
  pr.property_id,
  (array['Direct_Web','OTA','Travel_Agent','Direct_Phone','Corporate'])[(1 + ((c.crn + g) % 5))::int],
  ci.check_in - (5 + g * 3),
  ci.check_in,
  ci.check_in + los.los,
  los.los,
  (array['Deluxe Room','Suite','Chena Villa','Garden Room','Ocean Suite'])[(1 + ((c.crn + g) % 5))::int],
  1 + (g % 3),
  (g % 2),
  rev.room_rev,
  round(rev.room_rev * 0.30)::bigint,
  round(rev.room_rev * 0.15)::bigint,
  (rev.room_rev + round(rev.room_rev * 0.30) + round(rev.room_rev * 0.15))::bigint,
  (g > 1),
  (7 + ((c.crn + g) % 4))
from cust c
cross join generate_series(1, 5) as g
join props pr on pr.prn = 1 + ((c.crn + g) % 7)
cross join lateral (select (2 + ((c.crn + g) % 4))::int as los) los
cross join lateral (select (date '2023-05-01' + ((c.crn * 11 + g * 37) % 560)::int) as check_in) ci
cross join lateral (
  select ((case when pr.brand_tier = 'Luxury_Reserve' then 60000 else 38000 end) * los.los)::bigint as room_rev
) rev
where g <= 1 + (c.crn % 5)
  and not exists (select 1 from public.bookings b where b.customer_id = c.customer_id);

-- ── 4. customer_features (aggregated from bookings) ──────────────────────────
insert into public.customer_features (
  customer_id, recency_days, frequency_total, frequency_12m,
  monetary_total_lkr, monetary_avg_per_stay_lkr, avg_length_of_stay,
  preferred_property_id, eco_engagement_flag, luxury_reserve_visits, premium_hotel_visits,
  domestic_guest
)
select
  b.customer_id,
  greatest(0, current_date - max(b.check_out_date)),
  count(*),
  count(*) filter (where b.check_in_date > current_date - interval '12 months'),
  sum(b.total_revenue_lkr),
  avg(b.total_revenue_lkr)::bigint,
  avg(b.length_of_stay)::numeric(4, 2),
  mode() within group (order by b.property_id),
  bool_or(p.property_type in ('Agro_Eco', 'Surf_Beach')),
  count(*) filter (where p.brand_tier = 'Luxury_Reserve'),
  count(*) filter (where p.brand_tier = 'Premium_Hotel'),
  bool_or(c.nationality = 'Sri Lanka')
from public.bookings b
join public.properties p on p.property_id = b.property_id
join public.customers c on c.customer_id = b.customer_id
where b.is_cancelled = false
group by b.customer_id
on conflict (customer_id) do nothing;

-- ── 5. one demo scoring run + heuristic composite scores ─────────────────────
-- Composite ≈ recency + frequency + monetary, mapped to Platinum/Gold/Silver/Standard.
-- Only runs if no scores exist yet (idempotent).
with run as (
  insert into public.scoring_runs (triggered_by, model_version, status, customers_scored, completed_at)
  select 'MANUAL', 'demo-v1', 'COMPLETED', (select count(*) from public.customer_features), now()
  where not exists (select 1 from public.customer_scores)
  returning scoring_run_id
)
insert into public.customer_scores (
  customer_id, scoring_run_id, composite_score,
  recency_score, frequency_score, monetary_score, score_tier, model_version
)
select
  f.customer_id,
  run.scoring_run_id,
  c.composite,
  c.rec, c.freq, c.mon,
  case when c.composite >= 80 then 'Platinum'
       when c.composite >= 60 then 'Gold'
       when c.composite >= 40 then 'Silver'
       else 'Standard' end,
  'demo-v1'
from public.customer_features f
cross join run
cross join lateral (
  select
    (case when f.recency_days < 90 then 30 when f.recency_days < 270 then 18 else 6 end)::numeric(5, 2) as rec,
    least(30, f.frequency_total * 8)::numeric(5, 2) as freq,
    least(40, (f.monetary_total_lkr / 1000000.0) * 8)::numeric(5, 2) as mon
) s
cross join lateral (
  select least(100, greatest(0, s.rec + s.freq + s.mon))::numeric(5, 2) as composite,
         s.rec, s.freq, s.mon
) c;

-- ── Verify ───────────────────────────────────────────────────────────────────
--select 'historical_revenue' t, count(*) from public.historical_revenue
--union all select 'customers', count(*) from public.customers
--union all select 'bookings', count(*) from public.bookings
--union all select 'customer_features', count(*) from public.customer_features
--union all select 'customer_scores', count(*) from public.customer_scores;
