-- Replaces the fixed morning/evening reminder columns with four freely
-- editable slots (any of which can be left empty to disable that reminder).
-- Run this once in the Supabase SQL Editor — schema.sql already has the new
-- columns baked in for anyone setting up a fresh project from scratch.

alter table profiles add column if not exists notify_time_1 time default '08:00';
alter table profiles add column if not exists notify_time_2 time;
alter table profiles add column if not exists notify_time_3 time;
alter table profiles add column if not exists notify_time_4 time default '20:00';

alter table profiles drop column if exists morning_notify_time;
alter table profiles drop column if exists evening_notify_time;
