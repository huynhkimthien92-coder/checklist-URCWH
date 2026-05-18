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



-- ============================================================
-- FIXED ROBOT CHECKLIST v2.0 MIGRATION
-- ============================================================

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STEP 1: robot_checklists
-- ============================================================
-- ============================================================
-- ROBOT CHECKLIST - Thêm vào Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_checklists (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month                 INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                  INT NOT NULL,
  area                  TEXT NOT NULL DEFAULT 'MROBOT',
  robot_number          TEXT NOT NULL DEFAULT '',
  items                 JSONB NOT NULL DEFAULT '[]',
  -- key: "1"→"31", value: { "r_01": { status, note }, ... }
  day_entries           JSONB NOT NULL DEFAULT '{}',
  operator_signatures   JSONB NOT NULL DEFAULT '{}',
  supervisor_signatures JSONB NOT NULL DEFAULT '{}',
  incidents             JSONB NOT NULL DEFAULT '[]',
  notes                 TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','submitted','reviewed')),
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER robot_checklists_updated_at
  BEFORE UPDATE ON robot_checklists
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_robot_checklists_created_by ON robot_checklists(created_by);
CREATE INDEX IF NOT EXISTS idx_robot_checklists_month_year ON robot_checklists(month, year);
CREATE INDEX IF NOT EXISTS idx_robot_checklists_status     ON robot_checklists(status);

-- 1 robot chỉ có 1 checklist/tháng/năm
ALTER TABLE robot_checklists
  ADD CONSTRAINT unique_robot_checklist_per_month
  UNIQUE (robot_number, month, year);

-- RLS
ALTER TABLE robot_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "robot_checklists_all" ON robot_checklists FOR ALL
  USING (true) WITH CHECK (true);

ALTER TABLE robot_checklists
ADD COLUMN IF NOT EXISTS robot_model VARCHAR(100) DEFAULT NULL;

ALTER TABLE robot_checklists
DROP CONSTRAINT IF EXISTS robot_checklists_status_check;

ALTER TABLE robot_checklists
ADD CONSTRAINT robot_checklists_status_check 
CHECK (status IN ('draft','submitted','reviewed','approved'));

ALTER TABLE robot_checklists
ALTER COLUMN status SET DEFAULT 'draft';

-- ============================================================
-- STEP 2: FIX INCIDENTS JSONB
-- ============================================================

-- Add id + severity + resolved_at
UPDATE robot_checklists
SET incidents = (
  SELECT jsonb_agg(
    elem
    || jsonb_build_object(
      'id', COALESCE(elem->>'id', uuid_generate_v4()::text),
      'severity', COALESCE(elem->>'severity', 'low'),
      'resolved_at', elem->>'resolved_at'
    )
  )
  FROM jsonb_array_elements(incidents) elem
)
WHERE incidents IS NOT NULL
  AND jsonb_typeof(incidents) = 'array';

-- ============================================================
-- STEP 3: ADD image_url vào từng item trong day_entries ✅ FIX CHUẨN
-- ============================================================

UPDATE robot_checklists
SET day_entries = (
  SELECT jsonb_object_agg(day_key,
    (
      SELECT jsonb_object_agg(item_key,
        item_val || jsonb_build_object(
          'image_url',
          CASE 
            WHEN item_val ? 'image_url' THEN item_val->'image_url'
            ELSE NULL
          END
        )
      )
      FROM jsonb_each(day_val) AS i(item_key, item_val)
    )
  )
  FROM jsonb_each(day_entries) AS d(day_key, day_val)
)
WHERE day_entries IS NOT NULL;

-- ============================================================
-- STEP 4: CREATE robot_incidents TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_incidents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id      UUID NOT NULL REFERENCES robot_checklists(id) ON DELETE CASCADE,
  incident          TEXT NOT NULL,
  date              DATE NOT NULL,
  receiver          TEXT NOT NULL,
  severity          TEXT NOT NULL DEFAULT 'low'
                      CHECK (severity IN ('low', 'medium', 'high')),
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_robot_incidents_checklist ON robot_incidents(checklist_id);

-- ============================================================
-- STEP 5: CREATE robot_checklist_entries TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS robot_checklist_entries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id      UUID NOT NULL REFERENCES robot_checklists(id) ON DELETE CASCADE,
  day               INT NOT NULL CHECK (day BETWEEN 1 AND 31),
  item_id           VARCHAR(20) NOT NULL,
  status            VARCHAR(10) DEFAULT ''
                      CHECK (status IN ('pass', 'fail', '')),
  note              TEXT DEFAULT '',
  image_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_robot_entries_checklist ON robot_checklist_entries(checklist_id);

-- ============================================================
-- STEP 6: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_robot_checklists_robot_model 
  ON robot_checklists(robot_model);

CREATE INDEX IF NOT EXISTS idx_robot_checklists_created_at 
  ON robot_checklists(created_at DESC);

-- ============================================================
-- STEP 7: VIEW FIX
-- ============================================================

CREATE OR REPLACE VIEW robot_checklist_stats AS
SELECT 
  rc.id,
  rc.robot_number,
  rc.robot_model,
  rc.month,
  rc.year,
  rc.status,
  COUNT(rce.id) as total_entries,
  COUNT(*) FILTER (WHERE rce.status = 'pass') as pass_count,
  COUNT(*) FILTER (WHERE rce.status = 'fail') as fail_count,
  COUNT(*) FILTER (WHERE rce.status = '') as pending_count,
  ROUND(
    (COUNT(*) FILTER (WHERE rce.status = 'pass')::numeric / 
    NULLIF(COUNT(rce.id), 0)) * 100, 
    2
  ) as pass_rate,
  COUNT(ri.id) as incident_count
FROM robot_checklists rc
LEFT JOIN robot_checklist_entries rce ON rc.id = rce.checklist_id
LEFT JOIN robot_incidents ri ON rc.id = ri.checklist_id
GROUP BY rc.id, rc.robot_number, rc.robot_model, rc.month, rc.year, rc.status;

-- ============================================================
-- COMPLETE ✅
-- ============================================================
-- ✅ dùng UUID chuẩn Supabase
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ✅ tránh duplicate entry
ALTER TABLE robot_checklist_entries
ADD CONSTRAINT unique_entry UNIQUE (checklist_id, day, item_id);

-- ✅ auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_robot_entries_updated_at
BEFORE UPDATE ON robot_checklist_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_robot_incidents_updated_at
BEFORE UPDATE ON robot_incidents
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
