-- =============================================================================
-- Pathfinder UPMS — Phase 2 Migration
-- File: supabase/migrations/003_phase2_auth_compliance.sql
--
-- What this migration does:
--   1.  Extends households with emergency contact + calendar_password column
--   2.  Adds guardian_relationships table (multiple guardians per household)
--   3.  Activates admin_alerts — adds the profile-change trigger
--   4.  Adds Supabase Storage bucket policy helpers (Storage bucket itself
--       must be created in the Supabase Dashboard — see README)
--   5.  Adds medical_documents RLS policies (parent + admin access only)
--   6.  Adds new RLS policies for authenticated parent access
--   7.  Creates the handle_new_user() trigger function (auto-create user row
--       from auth.users on signup)
-- =============================================================================

-- =============================================================================
-- 1. EXTEND HOUSEHOLDS
-- Add emergency contact fields and ensure calendar_password exists
-- =============================================================================
alter table households
  add column if not exists emergency_contact_name  text,
  add column if not exists emergency_contact_phone text,
  add column if not exists emergency_contact_rel   text;   -- "Grandmother", "Uncle", etc.

comment on column households.emergency_contact_name  is 'Primary emergency contact (not a guardian)';
comment on column households.emergency_contact_phone is 'Emergency contact phone number';
comment on column households.emergency_contact_rel   is 'Emergency contact relationship to youth';

-- =============================================================================
-- 2. GUARDIAN RELATIONSHIPS
-- Allows a household to have multiple named guardians (Mother, Father, etc.)
-- Each guardian links back to a users row.
-- =============================================================================
create table if not exists guardian_relationships (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  relationship  text not null,                             -- "Mother", "Father", "Guardian"
  is_primary    boolean not null default false,            -- Primary contact for the household
  created_at    timestamptz not null default now(),

  unique (household_id, user_id)
);

comment on table guardian_relationships is
  'Maps guardians (users) to households with their relationship label.';

-- =============================================================================
-- 3. AUTO-CREATE USER ROW ON SUPABASE AUTH SIGNUP
-- When a new auth.users record is created, insert a matching public.users row.
-- This fires immediately after email confirmation.
-- =============================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name',  ''),
    'parent'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach to auth.users (fires after INSERT)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =============================================================================
-- 4. PROFILE-CHANGE ADMIN ALERT TRIGGER
--
-- CRITICAL PRD REQUIREMENT: Any change to household address OR user phone
-- must insert an UNREAD record into admin_alerts.
--
-- Two triggers:
--   a) households — fires when address_line1, city, state, or zip changes
--   b) users      — fires when phone changes
-- =============================================================================

-- 4a. Household address change trigger
create or replace function trg_household_address_alert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_family_name text;
begin
  -- Only fire if a meaningful address field actually changed
  if (
    old.address_line1 is distinct from new.address_line1 or
    old.city          is distinct from new.city          or
    old.state         is distinct from new.state         or
    old.zip           is distinct from new.zip
  ) then
    v_family_name := coalesce(new.family_name, 'Unknown Family');

    insert into admin_alerts (type, household_id, message, status)
    values (
      'profile_update',
      new.id,
      format(
        'Address updated for household "%s": %s %s, %s %s',
        v_family_name,
        coalesce(new.address_line1, ''),
        coalesce(new.city,  ''),
        coalesce(new.state, ''),
        coalesce(new.zip,   '')
      ),
      'unread'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_households_address_alert on households;
create trigger trg_households_address_alert
  after update on households
  for each row execute function trg_household_address_alert();

-- 4b. User phone change trigger
create or replace function trg_user_phone_alert()
returns trigger
language plpgsql
security definer
as $$
declare
  v_household_id uuid;
begin
  if old.phone is distinct from new.phone then
    -- Look up which household this user belongs to
    v_household_id := new.household_id;

    insert into admin_alerts (type, household_id, youth_id, message, status)
    values (
      'profile_update',
      v_household_id,
      null,
      format(
        'Phone number updated for %s %s (was: %s → now: %s)',
        new.first_name,
        new.last_name,
        coalesce(old.phone, 'none'),
        coalesce(new.phone, 'none')
      ),
      'unread'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_phone_alert on users;
create trigger trg_users_phone_alert
  after update on users
  for each row execute function trg_user_phone_alert();

-- =============================================================================
-- 5. MEDICAL PHYSICAL EXPIRY ALERT TRIGGER
-- When youth_members.physical_expiration is set or updated to a past/near date,
-- insert a medical_expiring alert.
-- =============================================================================
create or replace function trg_physical_expiry_alert()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Fire when expiration date is newly set or changed
  if old.physical_expiration is distinct from new.physical_expiration
     and new.physical_expiration is not null
  then
    insert into admin_alerts (type, household_id, youth_id, message, status)
    values (
      'medical_expiring',
      new.household_id,
      new.id,
      format(
        'Physical for %s %s expires on %s.',
        new.first_name,
        new.last_name,
        to_char(new.physical_expiration, 'Month DD, YYYY')
      ),
      'unread'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_youth_physical_alert on youth_members;
create trigger trg_youth_physical_alert
  after update on youth_members
  for each row execute function trg_physical_expiry_alert();

-- =============================================================================
-- 6. ONBOARDING STATE
-- Track where a user is in the post-signup onboarding flow so we can redirect
-- them correctly if they abandon and return.
-- =============================================================================
create type onboarding_step as enum (
  'household_info',    -- Step 1: Family address + calendar password
  'add_members',       -- Step 2: Add youth members + program selection
  'complete'           -- Onboarding done
);

alter table users
  add column if not exists onboarding_step onboarding_step not null default 'household_info',
  add column if not exists onboarding_completed_at timestamptz;

comment on column users.onboarding_step is
  'Tracks progress through the post-signup onboarding wizard.';

-- =============================================================================
-- 7. DOCUMENTS TABLE — ADD MISSING FIELDS FOR PHASE 2
-- =============================================================================
alter table documents
  add column if not exists template_id   uuid references document_templates(id) on delete set null,
  add column if not exists pushed_by     uuid references users(id) on delete set null,  -- Admin who pushed it
  add column if not exists signed_by     uuid references users(id) on delete set null,  -- Parent who signed
  add column if not exists signature_data text,                                          -- Base64 of signature image
  add column if not exists title         text,
  add column if not exists notes         text;

-- =============================================================================
-- 8. DOCUMENT TEMPLATES TABLE — ACTIVATE
-- Admins upload blank waivers here, then "push" them to groups
-- =============================================================================
create table if not exists document_templates (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid references programs(id) on delete set null, -- NULL = all programs
  name             text not null,
  description      text,
  file_path        text,              -- Path in Supabase Storage (admin-templates bucket)
  is_required_globally boolean not null default false,
  is_active        boolean not null default true,
  created_by       uuid references users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_document_templates_updated_at
  before update on document_templates
  for each row execute function set_updated_at();

-- =============================================================================
-- 9. RLS — PHASE 2 AUTHENTICATED ACCESS POLICIES
-- =============================================================================

-- ── households: parents can read/update their own household ──────────────
create policy "households_read_own"
  on households for select
  using (
    id in (select household_id from users where id = auth.uid())
  );

create policy "households_update_own"
  on households for update
  using (
    id in (select household_id from users where id = auth.uid())
  );

create policy "households_insert_own"
  on households for insert
  with check (true);  -- Any authenticated user can create a household (capped in app logic)

-- ── households: admins have full access ──────────────────────────────────
create policy "households_admin_all"
  on households for all
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin', 'leader')
    )
  );

-- ── youth_members: parents can insert youth for their household ───────────
create policy "youth_insert_own_household"
  on youth_members for insert
  with check (
    household_id in (
      select household_id from users where id = auth.uid()
    )
  );

create policy "youth_update_own_household"
  on youth_members for update
  using (
    household_id in (
      select household_id from users where id = auth.uid()
    )
  );

-- ── enrollments: parents can read/insert for their youth ─────────────────
create policy "enrollments_read_own"
  on enrollments for select
  using (
    youth_id in (
      select ym.id from youth_members ym
      join users u on u.household_id = ym.household_id
      where u.id = auth.uid()
    )
  );

create policy "enrollments_insert_own"
  on enrollments for insert
  with check (
    youth_id in (
      select ym.id from youth_members ym
      join users u on u.household_id = ym.household_id
      where u.id = auth.uid()
    )
  );

-- ── documents: parents can read/insert their household's docs ────────────
create policy "documents_read_own"
  on documents for select
  using (
    youth_id in (
      select ym.id from youth_members ym
      join users u on u.household_id = ym.household_id
      where u.id = auth.uid()
    )
  );

create policy "documents_insert_own"
  on documents for insert
  with check (
    youth_id in (
      select ym.id from youth_members ym
      join users u on u.household_id = ym.household_id
      where u.id = auth.uid()
    )
  );

-- ── documents: admins have full access ───────────────────────────────────
create policy "documents_admin_all"
  on documents for all
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin', 'leader')
    )
  );

-- ── admin_alerts: only admins/leaders can read ───────────────────────────
create policy "admin_alerts_admin_read"
  on admin_alerts for select
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin', 'leader')
    )
  );

create policy "admin_alerts_admin_update"
  on admin_alerts for update
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin', 'leader')
    )
  );

-- ── document_templates: public read (to show available waivers) ──────────
create policy "doc_templates_public_read"
  on document_templates for select
  using (is_active = true);

create policy "doc_templates_admin_all"
  on document_templates for all
  using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin')
    )
  );

-- =============================================================================
-- 10. STORAGE BUCKET RLS NOTES
-- =============================================================================
-- The "medicals" bucket must be created in the Supabase Dashboard (Storage tab).
-- Settings: Private bucket, NO public access.
--
-- After creating the bucket, run these policies in the SQL editor:
--
-- POLICY 1: Parents can upload to their own youth's folder
--   Folder structure: medicals/{youth_id}/{filename}
--
-- create policy "medicals_parent_upload"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'medicals'
--     and auth.uid() in (
--       select u.id from users u
--       join youth_members ym on ym.household_id = u.household_id
--       where ym.id::text = (string_to_array(name, '/'))[1]
--     )
--   );
--
-- POLICY 2: Parents can read their own youth's files
--   create policy "medicals_parent_read"
--     on storage.objects for select
--     using (
--       bucket_id = 'medicals'
--       and auth.uid() in (
--         select u.id from users u
--         join youth_members ym on ym.household_id = u.household_id
--         where ym.id::text = (string_to_array(name, '/'))[1]
--       )
--     );
--
-- POLICY 3: Admins and leaders can read ALL medical files
--   create policy "medicals_admin_read"
--     on storage.objects for select
--     using (
--       bucket_id = 'medicals'
--       and exists (
--         select 1 from users
--         where id = auth.uid()
--         and role in ('admin', 'superadmin', 'leader')
--       )
--     );
--
-- POLICY 4: No one can delete medical files via the API (soft-expire only)
--   create policy "medicals_no_delete"
--     on storage.objects for delete
--     using (false);
--
-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
