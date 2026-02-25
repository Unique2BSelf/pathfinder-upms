-- =============================================================================
-- Document Templates Table (Phase 2)
-- =============================================================================
create table if not exists document_templates (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid references programs(id) on delete set null,
  name             text not null,
  description      text,
  file_path        text,
  is_required_globally boolean not null default false,
  is_active        boolean not null default true,
  created_by       uuid references users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_document_templates_updated_at
  before update on document_templates
  for each row execute function set_updated_at();

-- Add columns to documents table
alter table documents
  add column if not exists template_id   uuid references document_templates(id) on delete set null,
  add column if not exists pushed_by     uuid references users(id) on delete set null,
  add column if not exists signed_by     uuid references users(id) on delete set null,
  add column if not exists signature_data text,
  add column if not exists title         text,
  add column if not exists notes         text;

-- RLS for document_templates
alter table document_templates enable row level security;

create policy "document_templates_public_read"
  on document_templates for select using (true);

create policy "document_templates_admin_all"
  on document_templates for all using (
    exists (
      select 1 from users
      where id = auth.uid()
      and role in ('admin', 'superadmin')
    )
  );
