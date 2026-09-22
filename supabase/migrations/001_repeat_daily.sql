-- Adds the "repeat daily" flag used by the Today page's rollover button.
-- Run this once in the Supabase SQL Editor — schema.sql already has it
-- baked in for anyone setting up a fresh project from scratch.

alter table tasks add column if not exists repeat_daily boolean not null default false;
