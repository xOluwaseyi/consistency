-- Run this in the Supabase SQL editor (Project > SQL Editor > New query) once your project is created.

create extension if not exists "pgcrypto";

-- One row per user, created automatically on signup.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  notify_time_1 time default '08:00',
  notify_time_2 time,
  notify_time_3 time,
  notify_time_4 time default '20:00',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create type task_priority as enum ('low', 'medium', 'high');

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  why text,
  priority task_priority not null default 'medium',
  track_time boolean not null default false,
  repeat_daily boolean not null default false,
  scheduled_date date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_date_idx on tasks (user_id, scheduled_date);

create table if not exists task_sessions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer
);

create index if not exists task_sessions_task_idx on task_sessions (task_id);
create index if not exists task_sessions_user_idx on task_sessions (user_id);

create table if not exists streak_freezes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date_used date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date_used)
);

create table if not exists distractions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  note text
);

create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  note text not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists subtasks_task_idx on subtasks (task_id);

-- Row Level Security: every table is scoped to auth.uid().
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_sessions enable row level security;
alter table streak_freezes enable row level security;
alter table distractions enable row level security;
alter table reflections enable row level security;
alter table push_subscriptions enable row level security;
alter table subtasks enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own tasks" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on task_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own freezes" on streak_freezes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own distractions" on distractions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reflections" on reflections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own push subs" on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own subtasks" on subtasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table-level grants for the Data API (PostgREST). Needed if your project has
-- "Automatically expose new tables" turned off — RLS above still restricts
-- every row to its owner regardless of these grants.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  profiles, tasks, task_sessions, streak_freezes, distractions, reflections, push_subscriptions, subtasks
  to authenticated;

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
