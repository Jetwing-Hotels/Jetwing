-- ==============================================================================
-- MIGRATION 007 — Functions & Triggers
--   • updated_at auto-stamping
--   • atomic prompt activation (single active version)
--   • offer expiry helper (for pg_cron / scheduler)
--   • SendGrid unsubscribe → flips marketing_opt_in off (GDPR/PDPA)
-- ==============================================================================

-- ── updated_at auto-stamp ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_properties_updated on public.properties;
create trigger trg_properties_updated before update on public.properties
  for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- ── activate a prompt version (deactivates siblings atomically) ──────────────
create or replace function public.activate_prompt(_prompt_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  _property_id uuid;
  _module      varchar(30);
begin
  select property_id, module into _property_id, _module
  from public.prompt_registry where prompt_id = _prompt_id;

  if not found then
    raise exception 'prompt % not found', _prompt_id;
  end if;

  -- deactivate current active sibling(s) first, then activate target
  update public.prompt_registry
     set is_active = false
   where module = _module
     and coalesce(property_id, '00000000-0000-0000-0000-000000000000'::uuid)
         = coalesce(_property_id, '00000000-0000-0000-0000-000000000000'::uuid)
     and is_active;

  update public.prompt_registry set is_active = true where prompt_id = _prompt_id;
end;
$$;

comment on function public.activate_prompt is 'Atomically set a prompt version active and deactivate the previous one';

-- ── expire stale offers (call from pg_cron daily) ────────────────────────────
create or replace function public.expire_stale_offers()
returns integer
language plpgsql security definer set search_path = public as $$
declare _count integer;
begin
  update public.seasonal_offers
     set status = 'EXPIRED'
   where status in ('ACTIVE', 'APPROVED')
     and valid_to is not null
     and valid_to < current_date;
  get diagnostics _count = row_count;
  return _count;
end;
$$;

comment on function public.expire_stale_offers is 'Sets ACTIVE/APPROVED offers past valid_to to EXPIRED; returns rows affected';

-- ── SendGrid unsubscribe → revoke marketing consent ──────────────────────────
create or replace function public.handle_email_event()
returns trigger
language plpgsql security definer set search_path = public as $$
declare _customer_id uuid;
begin
  select customer_id into _customer_id
  from public.campaign_audience where audience_id = new.audience_id;

  if new.event_type = 'unsubscribe' then
    update public.customers
       set marketing_opt_in = false
     where customer_id = _customer_id;

    update public.campaign_audience
       set send_status = 'UNSUBSCRIBED', unsubscribed_at = new.event_timestamp
     where audience_id = new.audience_id;

  elsif new.event_type = 'bounce' then
    update public.campaign_audience
       set send_status = 'BOUNCED', bounced_at = new.event_timestamp
     where audience_id = new.audience_id;

  elsif new.event_type = 'open' then
    update public.campaign_audience
       set opened_at = coalesce(opened_at, new.event_timestamp),
           send_status = case when send_status in ('PENDING','SENT','DELIVERED') then 'OPENED' else send_status end
     where audience_id = new.audience_id;

  elsif new.event_type = 'click' then
    update public.campaign_audience
       set clicked_at = coalesce(clicked_at, new.event_timestamp), send_status = 'CLICKED'
     where audience_id = new.audience_id;

  elsif new.event_type = 'delivered' then
    update public.campaign_audience
       set send_status = case when send_status = 'SENT' then 'DELIVERED' else send_status end
     where audience_id = new.audience_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_email_event on public.email_events;
create trigger trg_email_event after insert on public.email_events
  for each row execute function public.handle_email_event();

comment on function public.handle_email_event is 'Syncs SendGrid events to campaign_audience; unsubscribe revokes marketing_opt_in';
