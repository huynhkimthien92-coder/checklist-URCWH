-- =============================================================
-- FORKLIFT CHECKLIST - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── USERS ────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text unique not null,
  password_hash text not null,
  role          text not null check (role in ('admin', 'operator', 'supervisor')),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Seed admin user (password: Admin@123)
insert into users (name, email, password_hash, role) values
  ('Admin', 'admin@company.com', '$2a$12$eWL4pGRxAh9QNGrM4y1uJuNJRV5ICAcHcq7.d0VjEA2bMUt.xyz7C', 'admin')
on conflict do nothing;

-- ── CHECKLISTS ───────────────────────────────────────────────
create table if not exists checklists (
  id                     uuid primary key default uuid_generate_v4(),
  week_number            int not null,
  year                   int not null,
  forklift_model         text not null default '',
  forklift_serial        text not null default '',
  forklift_number        text not null default '',
  shift                  text not null default '1',
  items                  jsonb not null default '[]',
  operator_signatures    jsonb not null default '{}',
  supervisor_signatures  jsonb not null default '{}',
  notes                  text not null default '',
  status                 text not null default 'draft'
                           check (status in ('draft','submitted','reviewed','approved')),
  created_by             uuid references users(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger checklists_updated_at
  before update on checklists
  for each row execute procedure update_updated_at();

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_checklists_created_by on checklists(created_by);
create index if not exists idx_checklists_week_year  on checklists(week_number, year);
create index if not exists idx_checklists_status     on checklists(status);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
alter table users       enable row level security;
alter table checklists  enable row level security;

-- Users: admins see all, others see themselves
create policy "users_admin_all" on users for all
  using (true) with check (true); -- handled by service role in API

-- Checklists: admins and supervisors see all, operators see their own
create policy "checklists_all" on checklists for all
  using (true) with check (true); -- handled by app logic with service role

-- ── STORAGE BUCKET ───────────────────────────────────────────
-- Run in Supabase dashboard: Storage > New bucket
-- Bucket name: checklist-images
-- Public: false (use signed URLs)
-- File size limit: 5 MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

create policy "Allow read images"
on storage.objects
for select
using (bucket_id = 'checklist-images');

-- ✅ STEP 1: Thêm UNIQUE constraint
-- Đảm bảo 1 xe chỉ có 1 checklist/tuần/tài xế

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_checklist_per_forklift_week'
  ) THEN

    ALTER TABLE checklists
    ADD CONSTRAINT unique_checklist_per_forklift_week UNIQUE(
    forklift_number,
    week_number,
    year
    );
  END IF;
END$$;

-- ✅ STEP 2: Thêm index để tối ưu query
-- Khi kiểm tra duplicate, query sẽ nhanh hơn
CREATE INDEX IF NOT EXISTS idx_checklists_forklift_week_year
  ON checklists(forklift_number, week_number, year);

-- ✅ STEP 3: (Optional) Thêm trường tracking cho supervisor review
-- Nếu muốn track xem supervisor đã review ngày nào
ALTER TABLE checklists
ADD COLUMN IF NOT EXISTS supervisor_reviewed_days JSONB DEFAULT '[]'::jsonb;
-- Cách dùng: supervisor_reviewed_days = '["mon", "tue", "wed"]'

-- ✅ STEP 4: (Optional) Thêm trường last_supervisor_edit
-- Để biết supervisor sửa/duyệt lần cuối khi nào
ALTER TABLE checklists
ADD COLUMN IF NOT EXISTS supervisor_reviewed_at TIMESTAMPTZ;


-- JSON check
ALTER TABLE checklists
ADD CONSTRAINT check_reviewed_days_format
CHECK (jsonb_typeof(supervisor_reviewed_days) = 'array');

-- GIN index
CREATE INDEX IF NOT EXISTS idx_checklists_reviewed_days
ON checklists USING GIN (supervisor_reviewed_days);
