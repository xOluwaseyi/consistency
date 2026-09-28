-- Lets a task repeat on chosen weekdays instead of only "daily".
-- 0 = Sunday ... 6 = Saturday. Existing "repeat daily" tasks become all seven days.
-- Run this once in the Supabase SQL Editor. It only adds a column, so it's safe
-- to run before the new code is deployed.

alter table tasks add column if not exists repeat_days smallint[] not null default '{}';

update tasks set repeat_days = '{0,1,2,3,4,5,6}' where repeat_daily and repeat_days = '{}';
