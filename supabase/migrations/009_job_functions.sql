-- ==============================================================================
-- MIGRATION 009 — Scheduled-job functions
-- Reusable SQL the cron jobs call (see supabase/scheduled_jobs.sql):
--   • refresh_customer_features()  — nightly RFM feature recompute from bookings
--   • reconcile_campaign_metrics() — roll campaign_audience state into campaign counters
-- expire_stale_offers() already exists (migration 007).
-- ==============================================================================

-- ── refresh_customer_features() ──────────────────────────────────────────────
-- Recomputes every customer's feature vector from completed bookings. Upsert,
-- so it both inserts new customers and refreshes existing rows.
create or replace function public.refresh_customer_features()
returns integer
language plpgsql
security definer set search_path = public as $$
declare _n integer;
begin
  insert into public.customer_features (
    customer_id, recency_days, frequency_total, frequency_12m,
    monetary_total_lkr, monetary_avg_per_stay_lkr, avg_length_of_stay,
    preferred_property_id, eco_engagement_flag, luxury_reserve_visits,
    premium_hotel_visits, domestic_guest, feature_computed_at
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
    bool_or(c.nationality = 'Sri Lanka'),
    now()
  from public.bookings b
  join public.properties p on p.property_id = b.property_id
  join public.customers c on c.customer_id = b.customer_id
  where b.is_cancelled = false
  group by b.customer_id
  on conflict (customer_id) do update set
    recency_days              = excluded.recency_days,
    frequency_total           = excluded.frequency_total,
    frequency_12m             = excluded.frequency_12m,
    monetary_total_lkr        = excluded.monetary_total_lkr,
    monetary_avg_per_stay_lkr = excluded.monetary_avg_per_stay_lkr,
    avg_length_of_stay        = excluded.avg_length_of_stay,
    preferred_property_id     = excluded.preferred_property_id,
    eco_engagement_flag       = excluded.eco_engagement_flag,
    luxury_reserve_visits     = excluded.luxury_reserve_visits,
    premium_hotel_visits      = excluded.premium_hotel_visits,
    domestic_guest            = excluded.domestic_guest,
    feature_computed_at       = now();

  get diagnostics _n = row_count;
  return _n;
end;
$$;

comment on function public.refresh_customer_features is
  'Nightly: recompute customer_features (RFM + tier visits) from completed bookings. Returns rows affected.';

-- ── reconcile_campaign_metrics() ─────────────────────────────────────────────
-- Rolls per-recipient send state (kept current by the email_events trigger)
-- up into the campaign summary counters.
create or replace function public.reconcile_campaign_metrics()
returns integer
language plpgsql
security definer set search_path = public as $$
declare _n integer;
begin
  with agg as (
    select
      campaign_id,
      count(*) filter (where sent_at is not null)                                as sent,
      count(*) filter (where send_status in ('DELIVERED', 'OPENED', 'CLICKED'))  as delivered,
      count(*) filter (where opened_at is not null)                              as opened,
      count(*) filter (where clicked_at is not null)                             as clicked,
      count(*) filter (where send_status = 'BOUNCED' or bounced_at is not null)  as bounced,
      count(*) filter (where unsubscribed_at is not null)                        as unsub
    from public.campaign_audience
    group by campaign_id
  )
  update public.campaigns c set
    emails_sent         = a.sent,
    emails_delivered    = a.delivered,
    emails_opened       = a.opened,
    emails_clicked      = a.clicked,
    emails_bounced      = a.bounced,
    emails_unsubscribed = a.unsub
  from agg a
  where a.campaign_id = c.campaign_id;

  get diagnostics _n = row_count;
  return _n;
end;
$$;

comment on function public.reconcile_campaign_metrics is
  'Every few hours: roll campaign_audience send state into campaign summary counters. Returns campaigns updated.';
