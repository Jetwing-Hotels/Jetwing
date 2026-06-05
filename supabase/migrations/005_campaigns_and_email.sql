-- ==============================================================================
-- MIGRATION 005 — Campaigns & Email
-- Tables: campaigns, campaign_audience, email_events
-- Also wires the deferred scoring_runs.campaign_id FK from migration 004.
-- ==============================================================================

-- ── campaigns ────────────────────────────────────────────────────────────────
create table if not exists public.campaigns (
  campaign_id          uuid primary key default uuid_generate_v4(),
  campaign_name        varchar(200) not null,
  offer_ids            jsonb not null,
  target_month         smallint not null check (target_month between 1 and 12),
  target_year          smallint not null check (target_year >= 2000),
  min_score_threshold  decimal(5, 2) default 60.0 check (min_score_threshold between 0 and 100),
  target_tiers         jsonb default '["Platinum","Gold","Silver"]'::jsonb,
  target_property_ids  jsonb default '[]'::jsonb,
  target_nationalities jsonb default '[]'::jsonb,
  scheduled_send_date  timestamptz,
  status               varchar(20) default 'DRAFT'
                         check (status in ('DRAFT', 'AUDIENCE_READY', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED')),
  total_audience_size  integer default 0 check (total_audience_size >= 0),
  emails_sent          integer default 0 check (emails_sent >= 0),
  emails_delivered     integer default 0 check (emails_delivered >= 0),
  emails_opened        integer default 0 check (emails_opened >= 0),
  emails_clicked       integer default 0 check (emails_clicked >= 0),
  emails_bounced       integer default 0 check (emails_bounced >= 0),
  emails_unsubscribed  integer default 0 check (emails_unsubscribed >= 0),
  created_by           varchar(80) not null,
  created_at           timestamptz default now(),
  sent_at              timestamptz
);

-- Wire the deferred FK from scoring_runs (migration 004).
alter table public.scoring_runs
  drop constraint if exists fk_scoring_runs_campaign,
  add  constraint fk_scoring_runs_campaign
       foreign key (campaign_id) references public.campaigns(campaign_id) on delete set null;

-- ── campaign_audience ────────────────────────────────────────────────────────
create table if not exists public.campaign_audience (
  audience_id            uuid primary key default uuid_generate_v4(),
  campaign_id            uuid not null references public.campaigns(campaign_id) on delete cascade,
  customer_id            uuid not null references public.customers(customer_id) on delete cascade,
  composite_score_snapshot decimal(5, 2) not null,
  score_tier_snapshot    varchar(20) not null,
  email_subject          varchar(250),
  email_html_body        text,
  email_plain_body       text,
  sendgrid_message_id    varchar(100),
  send_status            varchar(20) default 'PENDING'
                           check (send_status in ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED')),
  sent_at                timestamptz,
  opened_at              timestamptz,
  clicked_at             timestamptz,
  bounced_at             timestamptz,
  unsubscribed_at        timestamptz,
  generation_tokens_used integer default 0 check (generation_tokens_used >= 0),
  created_at             timestamptz default now(),
  unique (campaign_id, customer_id)
);

-- ── email_events (raw SendGrid webhook log) ──────────────────────────────────
create table if not exists public.email_events (
  event_id            uuid primary key default uuid_generate_v4(),
  audience_id         uuid not null references public.campaign_audience(audience_id) on delete cascade,
  sendgrid_message_id varchar(100) not null,
  event_type          varchar(30) not null check (event_type in ('delivered', 'open', 'click', 'bounce', 'spam_report', 'unsubscribe')),
  event_timestamp     timestamptz not null,
  url_clicked         text,
  user_agent          text,
  ip_address          varchar(45),
  raw_payload         jsonb,
  received_at         timestamptz default now()
);

-- ── indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_campaigns_status        on public.campaigns(status, target_year, target_month);
create index if not exists idx_campaigns_scheduled     on public.campaigns(scheduled_send_date) where status = 'AUDIENCE_READY';
create index if not exists idx_audience_campaign       on public.campaign_audience(campaign_id, send_status);
create index if not exists idx_audience_customer       on public.campaign_audience(customer_id);
create index if not exists idx_audience_sendgrid       on public.campaign_audience(sendgrid_message_id);
create index if not exists idx_email_events_audience   on public.email_events(audience_id);
create index if not exists idx_email_events_message    on public.email_events(sendgrid_message_id, event_type);

comment on table public.campaigns is 'Email campaign linked to approved offers, targeting a month';
comment on table public.campaign_audience is 'Per-customer campaign membership + generated email content + delivery state';
comment on table public.email_events is 'Raw SendGrid webhook events for granular analytics';
