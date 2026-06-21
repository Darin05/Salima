-- Run this in your Supabase SQL editor

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references organizations,
  name text not null,
  email text not null,
  employee_number text,
  team_id uuid,
  role text not null default 'employee' check (role in ('admin','employee')),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table profiles add constraint fk_team foreign key (team_id) references teams(id) on delete set null;

create table shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations on delete cascade,
  name text not null,
  start_time time not null,
  end_time time not null,
  color text default '#6366f1'
);

create table work_patterns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations on delete cascade,
  name text not null,
  working_days int not null default 5,
  off_type text not null default 'fixed' check (off_type in ('fixed','rotating_weekly','rotating_monthly')),
  off_days jsonb default '[]'
);

create table break_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations on delete cascade,
  name text not null,
  break_time time not null,
  max_concurrent int default 3
);

create table rosters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations on delete cascade,
  week_start date not null,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz default now()
);

create table roster_entries (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid references rosters on delete cascade,
  employee_id uuid references profiles on delete cascade,
  shift_id uuid references shifts,
  date date not null,
  break_ids jsonb default '[]'
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations on delete cascade,
  employee_id uuid references profiles on delete cascade,
  start_date date not null,
  end_date date not null,
  type text not null default 'annual',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  notes text,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table teams enable row level security;
alter table shifts enable row level security;
alter table work_patterns enable row level security;
alter table break_rules enable row level security;
alter table rosters enable row level security;
alter table roster_entries enable row level security;
alter table leave_requests enable row level security;

-- Profiles: users see their own org
create policy "org members" on profiles for all using (
  org_id = (select org_id from profiles where id = auth.uid())
);
create policy "org teams" on teams for all using (
  org_id = (select org_id from profiles where id = auth.uid())
);
create policy "org shifts" on shifts for all using (
  org_id = (select org_id from profiles where id = auth.uid())
);
create policy "org patterns" on work_patterns for all using (
  org_id = (select org_id from profiles where id = auth.uid())
);
create policy "org breaks" on break_rules for all using (
  org_id = (select org_id from profiles where id = auth.uid())
);
create policy "org rosters" on rosters for all using (
  org_id = (select org_id from profiles where id = auth.uid())
);
create policy "org roster_entries" on roster_entries for all using (
  roster_id in (select id from rosters where org_id = (select org_id from profiles where id = auth.uid()))
);
-- Employees only see approved leave + their own
create policy "leave access" on leave_requests for all using (
  org_id = (select org_id from profiles where id = auth.uid())
);
