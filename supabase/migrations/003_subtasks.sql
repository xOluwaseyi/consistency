-- Adds subtasks (a checklist inside a task — e.g. individual books inside a
-- "read" task). Run this once in the Supabase SQL Editor — schema.sql
-- already has it baked in for anyone setting up a fresh project.

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

alter table subtasks enable row level security;

create policy "own subtasks" on subtasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on subtasks to authenticated;
