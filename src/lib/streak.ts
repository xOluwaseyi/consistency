import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Task } from "@/lib/database.types";

export interface DaySummary {
  date: string; // yyyy-mm-dd
  total: number;
  completed: number;
  frozen: boolean;
}

/** Groups tasks by scheduled_date and folds in which dates used a streak freeze. */
export function summarizeDays(tasks: Task[], freezeDates: Set<string>): Map<string, DaySummary> {
  const days = new Map<string, DaySummary>();

  for (const task of tasks) {
    const day = days.get(task.scheduled_date) ?? {
      date: task.scheduled_date,
      total: 0,
      completed: 0,
      frozen: freezeDates.has(task.scheduled_date),
    };
    day.total += 1;
    if (task.completed) day.completed += 1;
    days.set(task.scheduled_date, day);
  }

  for (const date of freezeDates) {
    const day = days.get(date);
    if (day) day.frozen = true;
  }

  return days;
}

function isDayWin(day: DaySummary | undefined): boolean {
  if (!day) return false; // no tasks scheduled — neither a win nor a break
  return day.total > 0 && day.completed === day.total ? true : day.frozen;
}

function hasAnyTasks(day: DaySummary | undefined): boolean {
  return !!day && day.total > 0;
}

/**
 * Current streak = consecutive days, walking back from today, that are either
 * fully completed or covered by a freeze. Days with nothing scheduled are
 * skipped (they neither extend nor break the streak).
 */
export function currentStreak(days: Map<string, DaySummary>, today: string): number {
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00`);

  // If today has tasks but isn't finished yet, don't count it against the
  // streak — just don't include it. Start looking from today backwards.
  for (let i = 0; i < 3650; i++) {
    const key = toDateKey(cursor);
    const day = days.get(key);

    if (!hasAnyTasks(day)) {
      // Empty day: skip without breaking the streak either way.
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (isDayWin(day)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    // Today in progress (has tasks, not all done yet, not frozen) — don't
    // break the streak on its account, just stop counting before it.
    if (key === today) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

/** Longest streak ever, scanning the whole history of days present. */
export function longestStreak(days: Map<string, DaySummary>): number {
  const sortedDates = [...days.keys()].sort();
  if (sortedDates.length === 0) return 0;

  let longest = 0;
  let running = 0;
  let prevDate: Date | null = null;

  for (const dateKey of sortedDates) {
    const day = days.get(dateKey);
    if (!hasAnyTasks(day)) continue;

    const date = new Date(`${dateKey}T00:00:00`);
    const isConsecutive =
      prevDate !== null &&
      (date.getTime() - prevDate.getTime()) / 86_400_000 === 1;

    if (isDayWin(day)) {
      running = isConsecutive ? running + 1 : 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }

    prevDate = date;
  }

  return longest;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Shared by the session-bound server client (app pages) and the admin client (cron). */
export async function computeStreakContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  daysBack = 400,
) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceKey = toDateKey(since);

  const [{ data: tasks }, { data: freezes }] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", userId).gte("scheduled_date", sinceKey),
    supabase
      .from("streak_freezes")
      .select("date_used")
      .eq("user_id", userId)
      .gte("date_used", sinceKey),
  ]);

  const freezeDates = new Set((freezes ?? []).map((f) => f.date_used));
  const days = summarizeDays((tasks ?? []) as Task[], freezeDates);
  const today = todayKey();
  const monthStart = `${today.slice(0, 7)}-01`;
  const freezesThisMonth = [...freezeDates].filter((d) => d >= monthStart).length;

  return {
    streak: currentStreak(days, today),
    longest: longestStreak(days),
    freezesThisMonth,
    days,
  };
}
