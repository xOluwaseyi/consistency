-- Grants the service_role (used server-side by the notification cron and
-- test-push endpoint, bypassing RLS) explicit table access. With
-- "Automatically expose new tables" turned off, service_role never
-- automatically got this — it isn't exempted from that setting despite
-- being an admin-style key. Run this once in the Supabase SQL Editor.

grant usage on schema public to service_role;
grant select, insert, update, delete on
  profiles, tasks, task_sessions, streak_freezes, distractions, reflections, push_subscriptions, subtasks
  to service_role;
