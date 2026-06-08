-- ============================================================================
-- 011_add_draft_status
-- Adds 'DRAFT' status to seasonal_offers and transitions 'APPROVED' offers
-- to 'DRAFT' to match the updated workflow.
-- ============================================================================

-- 1. Update check constraint on seasonal_offers.status to include DRAFT
alter table public.seasonal_offers drop constraint if exists seasonal_offers_status_check;
alter table public.seasonal_offers add constraint seasonal_offers_status_check
  check (status in ('PENDING_REVIEW', 'APPROVED', 'DRAFT', 'REJECTED', 'ACTIVE', 'EXPIRED'));

-- 2. Backfill: Move existing APPROVED offers to DRAFT
update public.seasonal_offers set status = 'DRAFT' where status = 'APPROVED';

-- 3. Update expire_stale_offers function to include DRAFT status
create or replace function public.expire_stale_offers()
returns integer
language plpgsql security definer set search_path = public as $$
declare _count integer;
begin
  update public.seasonal_offers
     set status = 'EXPIRED'
   where status in ('ACTIVE', 'APPROVED', 'DRAFT')
     and valid_to is not null
     and valid_to < current_date;
  get diagnostics _count = row_count;
  return _count;
end;
$$;

comment on function public.expire_stale_offers() is 'Sets ACTIVE/APPROVED/DRAFT offers past valid_to to EXPIRED; returns rows affected';
