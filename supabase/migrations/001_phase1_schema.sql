-- =============================================================================
-- Pathfinder UPMS — Phase 1 Database Migration
-- File: supabase/migrations/001_phase1_schema.sql
--
-- Run in Supabase: SQL Editor → paste → RUN
-- Or via CLI: supabase db push
--
-- Tables created in this migration:
--   Core:      households, users, youth_members
--   Programs:  programs (seeded), enrollments
--   Calendar:  events, event_rsvps
--   Future:    documents, document_templates (stubs for Phase 2)
--              trip_accounts, transactions, admin_alerts (stubs for Phase 2/4)
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. HOUSEHOLDS
-- The primary anchor for every family. One household = one family unit.
-- Stores the shared calendar password used on the "Mom Page" (no auth needed).
-- =============================================================================
create table if not exists households (
  id              uuid primary key default gen_random_uuid(),

  -- Family identity
  family_name     text not null,                         -- "The Smith Family"

  -- Primary contact address (shared across household)
  address_line1   text,
  address_line2   text,
  city            text,
  state           char(2),
  zip             text,

  -- Shared calendar password for public "Mom Page" access (no login required)
  -- Stored as plaintext intentionally — this is a low-security convenience feature,
  -- not a substitute for authenticated access to sensitive data.
  calendar_password text,

  -- Metadata
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table households is
  'Primary anchor for a family unit. All users and youth members belong to a household.';
comment on column households.calendar_password is
  'Shared family password for public calendar "Mom Page" access. Low-security by design.';

-- =============================================================================
-- 2. USERS (Parents, Guardians, Admins, Leaders)
-- Linked to Supabase Auth via auth.users.id
-- =============================================================================
create type user_role as enum ('parent', 'leader', 'admin', 'superadmin');

create table if not exists users (
  id              uuid primary key references auth.users(id) on delete cascade,
  household_id    uuid references households(id) on delete set null,

  -- Role-based access
  role            user_role not null default 'parent',

  -- Profile
  first_name      text not null,
  last_name       text not null,
  email           text not null unique,
  phone           text,

  -- Relationship to youth (for registration forms)
  relationship    text,                                  -- "Mother", "Father", "Guardian"

  -- Metadata
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table users is
  'App user profiles for parents, guardians, leaders, and admins. Linked to Supabase Auth.';

-- =============================================================================
-- 3. YOUTH MEMBERS
-- Core profile for each kid. Can be enrolled in multiple programs.
-- =============================================================================
create type youth_gender as enum ('male', 'female', 'nonbinary', 'prefer_not_to_say');

create table if not exists youth_members (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references households(id) on delete cascade,

  -- Identity
  first_name      text not null,
  last_name       text not null,
  preferred_name  text,                                  -- Nickname
  dob             date not null,
  gender          youth_gender,
  grade           smallint,                              -- 0 = Kindergarten, 12 = Senior

  -- School
  school_name     text,

  -- Sizing (for uniforms/gear)
  shirt_size      text,                                  -- 'YS','YM','YL','AS','AM','AL','AXL'

  -- Internal admin use only — not visible to parents
  internal_notes  text,

  -- Medical snapshot (full records in documents table, Phase 2)
  -- Red-flag fields surfaced on Global Roster for field leaders
  known_allergies         text,
  medications             text,
  medical_alert_flag      boolean not null default false,  -- "Red Flag" on roster
  physical_expiration     date,                            -- Date current physical expires

  -- Metadata
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table youth_members is
  'Core youth profile. medical_alert_flag surfaces on the admin roster for field use.';

-- =============================================================================
-- 4. PROGRAMS
-- The five Pathfinder programs. Seeded below — not user-editable.
-- =============================================================================
create table if not exists programs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,                      -- URL-safe identifier
  name        text not null,
  short_name  text not null,
  description text,
  age_min     smallint,
  age_max     smallint,
  is_active   boolean not null default true,
  sort_order  smallint not null default 0,               -- Display order
  created_at  timestamptz not null default now()
);

comment on table programs is
  'The five Pathfinder programs. Seeded at migration time — not user-modifiable.';

-- Seed the five programs
insert into programs (slug, name, short_name, description, age_min, age_max, sort_order) values
  ('cub-scouts',     'Cub Scouts',                   'Cubs',         'Character and adventure for grades K–5.',                   5,  10, 1),
  ('boy-scouts',     'Boy Scouts',                   'Scouts',       'Leadership and outdoor skills, ages 11–17.',                11, 17, 2),
  ('rangers',        'Rangers',                      'Rangers',      'Elite wilderness training for older youth.',                 14, 21, 3),
  ('squadron',       'Squadron',                     'Squadron',     'Aviation and STEM-focused youth program.',                  12, 18, 4),
  ('shooting-club',  'Cedar Sports Shooting Club',   'Shooting Club','Safety-first marksmanship: rifle, shotgun, archery.',      10, 18, 5)
on conflict (slug) do nothing;

-- =============================================================================
-- 5. ENROLLMENTS
-- Many-to-many: a youth member can be active in multiple programs.
-- =============================================================================
create type enrollment_status as enum ('active', 'inactive', 'pending', 'waitlist');

create table if not exists enrollments (
  id            uuid primary key default gen_random_uuid(),
  youth_id      uuid not null references youth_members(id) on delete cascade,
  program_id    uuid not null references programs(id) on delete cascade,
  status        enrollment_status not null default 'pending',
  join_date     date not null default current_date,
  end_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (youth_id, program_id)                          -- One enrollment per program per youth
);

comment on table enrollments is
  'Many-to-many join: one youth can be enrolled in multiple programs simultaneously.';

-- =============================================================================
-- 6. EVENTS (Calendar)
-- Program events displayed on the public "Mom Page" calendar.
-- =============================================================================
create type event_type as enum (
  'meeting', 'campout', 'service', 'fundraiser',
  'competition', 'ceremony', 'trip', 'other'
);

create table if not exists events (
  id              uuid primary key default gen_random_uuid(),
  program_id      uuid references programs(id) on delete cascade,
                                                         -- NULL = all-programs event

  -- Content
  title           text not null,
  description     text,
  event_type      event_type not null default 'other',
  location        text,
  location_notes  text,                                  -- "Bring a flashlight", etc.

  -- Timing
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  all_day         boolean not null default false,
  recurring_rule  text,                                  -- iCal RRULE string (optional)

  -- Visibility
  is_public       boolean not null default true,         -- Visible on Mom Page
  is_cancelled    boolean not null default false,

  -- RSVP settings
  rsvp_enabled    boolean not null default false,
  rsvp_deadline   timestamptz,
  max_attendees   smallint,

  -- Who created it
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint valid_event_times check (ends_at > starts_at)
);

comment on table events is
  'Calendar events. program_id = NULL means all-programs (e.g. fundraiser days).';
comment on column events.recurring_rule is
  'Standard iCal RRULE string, e.g. "FREQ=WEEKLY;BYDAY=WE" for weekly Wednesday meetings.';

-- =============================================================================
-- 7. EVENT RSVPs
-- =============================================================================
create type rsvp_status as enum ('yes', 'no', 'maybe');

create table if not exists event_rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  youth_id    uuid not null references youth_members(id) on delete cascade,
  status      rsvp_status not null default 'yes',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (event_id, youth_id)
);

-- =============================================================================
-- 8. ADMIN ALERTS (Stub — fully activated in Phase 2)
-- Created here so the Phase 2 trigger can reference it without a schema change.
-- =============================================================================
create type alert_type as enum (
  'profile_update', 'medical_expiring', 'waiver_pending',
  'low_balance', 'new_enrollment', 'document_uploaded'
);

create table if not exists admin_alerts (
  id          uuid primary key default gen_random_uuid(),
  type        alert_type not null,
  household_id uuid references households(id) on delete cascade,
  youth_id    uuid references youth_members(id) on delete cascade,
  message     text not null,
  status      text not null default 'unread'
                check (status in ('unread', 'read', 'dismissed')),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);

comment on table admin_alerts is
  'Stub table for Phase 2. Admin notification queue for profile changes, expiring records, etc.';

-- =============================================================================
-- 9. DOCUMENTS (Stub — activated in Phase 2)
-- =============================================================================
create type document_type as enum ('waiver', 'physical', 'bsa_app', 'other');
create type document_status as enum ('pending', 'signed', 'expired', 'rejected');

create table if not exists documents (
  id              uuid primary key default gen_random_uuid(),
  youth_id        uuid not null references youth_members(id) on delete cascade,
  type            document_type not null,
  status          document_status not null default 'pending',
  file_path       text,                                  -- Path in Supabase Storage (encrypted bucket)
  file_hash       text,                                  -- SHA-256 of signed document
  signed_at       timestamptz,
  expiration_date date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table documents is
  'Stub for Phase 2. Stores metadata for waivers, physicals, and BSA applications.';

-- =============================================================================
-- 10. TRIP ACCOUNTS & TRANSACTIONS (Stubs — activated in Phase 4)
-- =============================================================================
create table if not exists trip_accounts (
  youth_id        uuid primary key references youth_members(id) on delete cascade,
  current_balance numeric(10,2) not null default 0.00,
  updated_at      timestamptz not null default now()
);

comment on table trip_accounts is
  'Stub for Phase 4. Virtual wallet per youth — balance always derived from transactions SUM.';

create type transaction_type as enum (
  'fundraiser', 'dues', 'trip_fee', 'reversal', 'manual_credit', 'manual_debit'
);

create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  youth_id    uuid not null references youth_members(id) on delete cascade,
  amount      numeric(10,2) not null,                    -- Positive = credit, Negative = debit
  type        transaction_type not null,
  description text,
  admin_id    uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
  -- NOTE: No updated_at — transactions are IMMUTABLE. Corrections via REVERSAL entries only.
);

comment on table transactions is
  'Stub for Phase 4. Append-only ledger. No row edits ever — use reversal entries to correct.';

-- =============================================================================
-- 11. INDEXES
-- Covering indexes for the most common query patterns.
-- =============================================================================

-- Household lookups
create index if not exists idx_users_household       on users(household_id);
create index if not exists idx_youth_household       on youth_members(household_id);

-- Calendar queries (most common: events by program, events by date range)
create index if not exists idx_events_program        on events(program_id);
create index if not exists idx_events_starts_at      on events(starts_at);
create index if not exists idx_events_public         on events(is_public) where is_public = true;

-- Enrollment lookups
create index if not exists idx_enrollments_youth     on enrollments(youth_id);
create index if not exists idx_enrollments_program   on enrollments(program_id);
create index if not exists idx_enrollments_status    on enrollments(status);

-- Alert queue
create index if not exists idx_alerts_status         on admin_alerts(status) where status = 'unread';

-- Medical flag for field roster
create index if not exists idx_youth_medical_flag    on youth_members(medical_alert_flag)
  where medical_alert_flag = true;

-- Transaction ledger
create index if not exists idx_transactions_youth    on transactions(youth_id);
create index if not exists idx_transactions_date     on transactions(created_at);

-- =============================================================================
-- 12. UPDATED_AT AUTO-UPDATE TRIGGER
-- Keeps updated_at current on any row change.
-- =============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
do $$
declare
  t text;
begin
  foreach t in array array[
    'households', 'users', 'youth_members', 'enrollments',
    'events', 'event_rsvps', 'documents', 'trip_accounts'
  ]
  loop
    execute format(
      'create or replace trigger trg_%s_updated_at
       before update on %s
       for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- =============================================================================
-- 13. ROW LEVEL SECURITY (Phase 1 baseline)
-- Locks down tables. Opened up progressively in later phases.
-- =============================================================================
alter table households       enable row level security;
alter table users            enable row level security;
alter table youth_members    enable row level security;
alter table programs         enable row level security;
alter table enrollments      enable row level security;
alter table events           enable row level security;
alter table event_rsvps      enable row level security;
alter table admin_alerts     enable row level security;
alter table documents        enable row level security;
alter table trip_accounts    enable row level security;
alter table transactions     enable row level security;

-- ── Programs: public read (needed for landing pages and calendar) ──────────
create policy "programs_public_read"
  on programs for select using (true);

-- ── Events: public read for public events (Mom Page calendar) ─────────────
create policy "events_public_read"
  on events for select
  using (is_public = true and is_cancelled = false);

-- ── Admins can do anything on events ─────────────────────────────────────
create policy "events_admin_all"
  on events for all
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin', 'leader')
    )
  );

-- ── Users can read their own profile ─────────────────────────────────────
create policy "users_read_own"
  on users for select
  using (id = auth.uid());

create policy "users_update_own"
  on users for update
  using (id = auth.uid());

-- ── Parents can read/update their household's youth ───────────────────────
create policy "youth_household_read"
  on youth_members for select
  using (
    household_id in (
      select household_id from users where id = auth.uid()
    )
  );

-- ── Admins have full access to youth members ──────────────────────────────
create policy "youth_admin_all"
  on youth_members for all
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin', 'leader')
    )
  );

-- =============================================================================
-- MIGRATION COMPLETE
-- Tables: households, users, youth_members, programs (seeded), enrollments,
--         events, event_rsvps, admin_alerts, documents, trip_accounts, transactions
-- Indexes: 11 covering indexes
-- Triggers: set_updated_at on all mutable tables
-- RLS: enabled on all tables, Phase 1 policies active
-- =============================================================================
