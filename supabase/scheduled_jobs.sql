-- ============================================================================
-- SCHEDULED JOBS (pg_cron + pg_net)
-- Run this AFTER migrations 001–009. Mirrors the plan's Celery Beat schedule,
-- but for the SQL-side jobs we use Supabase's built-in pg_cron (no separate
-- worker needed). The HTTP-triggered job (monthly offer generation) uses pg_net
-- to call the Edge Function.
--
-- ── BEFORE RUNNING ──────────────────────────────────────────────────────────
-- 1. Enable extensions: Supabase Dashboard → Database → Extensions → enable
--    `pg_cron` and `pg_net` (or run the CREATE EXTENSION lines below if allowed).
-- 2. Set the database timezone so cron times match LKT (the plan uses LKT):
--      alter database postgres set timezone = 'Asia/Colombo';
--    (or convert the cron expressions to UTC yourself — they're plain UTC here).
-- 3. For the monthly-generation job, replace <PROJECT-REF> and <SERVICE-ROLE-KEY>.
--    Prefer storing the key in Supabase Vault rather than inline (see note below).
-- ============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper: unschedule by name if it already exists (so this script is re-runnable).
-- (pg_cron errors if you schedule a duplicate jobname.)

-- ── 1. expire_stale_offers — daily 06:00 ─────────────────────────────────────
select cron.unschedule('expire-stale-offers')
where exists (select 1 from cron.job where jobname = 'expire-stale-offers');
select cron.schedule('expire-stale-offers', '0 6 * * *', $$ select public.expire_stale_offers(); $$);

-- ── 2. refresh_customer_features — nightly 02:00 ─────────────────────────────
select cron.unschedule('refresh-customer-features')
where exists (select 1 from cron.job where jobname = 'refresh-customer-features');
select cron.schedule('refresh-customer-features', '0 2 * * *', $$ select public.refresh_customer_features(); $$);

-- ── 3. reconcile_campaign_metrics — every 4 hours ────────────────────────────
select cron.unschedule('reconcile-campaign-metrics')
where exists (select 1 from cron.job where jobname = 'reconcile-campaign-metrics');
select cron.schedule('reconcile-campaign-metrics', '0 */4 * * *', $$ select public.reconcile_campaign_metrics(); $$);

-- ── 4. generate_monthly_offers — 20th of each month, 08:00 ───────────────────
-- Calls the generate-offers Edge Function for NEXT month across all properties.
-- Replace the placeholders, then uncomment.
--
-- Recommended: store the key in Vault and read it, instead of inlining:
--   select vault.create_secret('<SERVICE-ROLE-KEY>', 'service_role_key');
--   ... headers := jsonb_build_object(
--         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key') ) ...
--
-- select cron.unschedule('generate-monthly-offers')
-- where exists (select 1 from cron.job where jobname = 'generate-monthly-offers');
-- select cron.schedule('generate-monthly-offers', '0 8 20 * *', $$
--   select net.http_post(
--     url     := 'https://<PROJECT-REF>.functions.supabase.co/generate-offers',
--     headers := jsonb_build_object(
--                  'Content-Type', 'application/json',
--                  'Authorization', 'Bearer <SERVICE-ROLE-KEY>'
--                ),
--     body    := jsonb_build_object(
--                  'month', extract(month from (now() + interval '1 month'))::int,
--                  'year',  extract(year  from (now() + interval '1 month'))::int
--                )
--   );
-- $$);

-- ── Inspect / manage ─────────────────────────────────────────────────────────
-- select jobid, jobname, schedule, active from cron.job order by jobname;
-- select * from cron.job_run_details order by start_time desc limit 20;   -- run history
-- select cron.unschedule('<jobname>');                                     -- remove a job

-- ── Still on Celery (per the plan) ───────────────────────────────────────────
-- nightly_pms_etl       — pulls bookings from the PMS API (external system).
-- batch scoring         — HuggingFace customer scoring (heavy ML).
-- send_campaign_emails  — dispatch is driven from the app / Edge Function
--                         (POST /api/v1/campaigns/:id/send); schedule a wake via
--                         pg_net the same way as job #4 if you want it automated.
