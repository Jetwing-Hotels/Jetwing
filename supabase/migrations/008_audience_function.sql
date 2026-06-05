-- ==============================================================================
-- MIGRATION 008 — Campaign audience builder
-- build_campaign_audience(campaign): selects opted-in customers matching the
-- campaign's score threshold / tiers / property affinity / nationality filters,
-- snapshots their score into campaign_audience, and marks the campaign ready.
--
-- The marketing_opt_in = TRUE gate is the GDPR/PDPA hard rule from the plan.
-- ==============================================================================

create or replace function public.build_campaign_audience(_campaign_id uuid)
returns integer
language plpgsql
security definer set search_path = public as $$
declare
  _c     public.campaigns%rowtype;
  _added integer;
begin
  select * into _c from public.campaigns where campaign_id = _campaign_id;
  if not found then
    raise exception 'campaign % not found', _campaign_id;
  end if;

  insert into public.campaign_audience (campaign_id, customer_id, composite_score_snapshot, score_tier_snapshot)
  select _campaign_id, s.customer_id, s.composite_score, s.score_tier
  from public.latest_customer_scores s
  join public.customers c on c.customer_id = s.customer_id
  left join public.customer_features f on f.customer_id = s.customer_id
  where c.marketing_opt_in = true
    and c.deleted_at is null
    and s.composite_score >= _c.min_score_threshold
    -- tier filter (empty array = all tiers)
    and (coalesce(jsonb_array_length(_c.target_tiers), 0) = 0 or _c.target_tiers ? s.score_tier)
    -- property-affinity filter (empty = all properties)
    and (coalesce(jsonb_array_length(_c.target_property_ids), 0) = 0
         or (f.preferred_property_id is not null and _c.target_property_ids ? f.preferred_property_id::text))
    -- nationality filter (empty = all)
    and (coalesce(jsonb_array_length(_c.target_nationalities), 0) = 0
         or (c.nationality is not null and _c.target_nationalities ? c.nationality))
  on conflict (campaign_id, customer_id) do nothing;

  get diagnostics _added = row_count;

  update public.campaigns
     set total_audience_size = (select count(*) from public.campaign_audience where campaign_id = _campaign_id),
         status = case when status = 'DRAFT' then 'AUDIENCE_READY' else status end
   where campaign_id = _campaign_id;

  return _added;
end;
$$;

comment on function public.build_campaign_audience is
  'Selects opted-in, score-qualified customers into campaign_audience and marks the campaign AUDIENCE_READY. Returns rows added.';
