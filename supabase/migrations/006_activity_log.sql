-- Adds the activity log (what you're doing with your day, beyond tasks) and
-- seeds a starter set of categories for every user. Run this once in the
-- Supabase SQL Editor. schema.sql already has it baked in for fresh projects.

create table if not exists activity_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists activity_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references activity_categories (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists activity_entries_user_started_idx on activity_entries (user_id, started_at);

alter table activity_categories enable row level security;
alter table activity_entries enable row level security;

create policy "own activity categories" on activity_categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own activity entries" on activity_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on activity_categories, activity_entries to authenticated;
grant select, insert, update, delete on activity_categories, activity_entries to service_role;

-- Starter categories for existing users.
insert into activity_categories (user_id, name, color)
select p.id, d.name, d.color
from profiles p
cross join (values
  ('Work', '#3987e5'),
  ('Sleep', '#199e70'),
  ('Exercise', '#008300'),
  ('Commute', '#c98500'),
  ('Social media', '#d55181'),
  ('Rest', '#d95926')
) as d (name, color)
on conflict (user_id, name) do nothing;

-- ...and for everyone who signs up from now on.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.activity_categories (user_id, name, color) values
    (new.id, 'Work', '#3987e5'),
    (new.id, 'Sleep', '#199e70'),
    (new.id, 'Exercise', '#008300'),
    (new.id, 'Commute', '#c98500'),
    (new.id, 'Social media', '#d55181'),
    (new.id, 'Rest', '#d95926');
  return new;
end;
$$;
