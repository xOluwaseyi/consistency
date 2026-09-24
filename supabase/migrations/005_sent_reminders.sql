-- Tracks which reminder slots have already fired today, so the polling
-- endpoint (called every few minutes) doesn't send the same reminder twice.
-- Run this once in the Supabase SQL Editor.

create table if not exists sent_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slot smallint not null,
  date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, slot, date)
);

create index if not exists sent_reminders_lookup_idx on sent_reminders (user_id, slot, date);

alter table sent_reminders enable row level security;

create policy "own sent reminders" on sent_reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Only the service role (the polling endpoint) actually reads/writes this table.
grant usage on schema public to service_role;
grant select, insert, update, delete on sent_reminders to service_role;
