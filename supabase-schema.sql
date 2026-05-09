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
  ('Admin', 'admin@company.com', '$2b$10$somehashedpassword', 'admin')
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

-- ── THÊM ADMIN USER ──────────────────────────────────────────
-- Chạy lệnh này trong Supabase SQL Editor để tạo admin đầu tiên.
-- Mật khẩu được hash bằng bcrypt với password: Admin@2025
-- Thay bằng hash thực bằng cách chạy: node -e "const b=require('bcryptjs');console.log(b.hashSync('YourPassword',10))"
-- Hoặc dùng API endpoint POST /api/users từ tài khoản admin đầu tiên.

-- Tạm thời seed 1 admin (đổi password sau khi deploy):
-- INSERT INTO users (name, email, password_hash, role) VALUES
--   ('Admin', 'admin@company.com', '$2b$10$...hash_here...', 'admin');
