import { createClient } from "@/lib/supabase/server";
import { computeStreakContext } from "@/lib/streak";
import type { Task, Profile } from "@/lib/database.types";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

/** Tasks + freeze dates for the last `daysBack` days through today, used for streak math. */
export async function getStreakContext(daysBack = 400) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return { streak: 0, longest: 0, freezesThisMonth: 0, days: new Map() };

  return computeStreakContext(supabase, user.id, daysBack);
}

export async function getTasksForDate(date: string): Promise<Task[]> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("scheduled_date", date)
    .order("completed", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  return (data ?? []) as Task[];
}

export async function getTasksForRange(startDate: string, endDate: string): Promise<Task[]> {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("scheduled_date", { ascending: true })
    .order("completed", { ascending: true })
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

  return (data ?? []) as Task[];
}

export async function getOpenSessionsForTasks(taskIds: string[]) {
  if (taskIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_sessions")
    .select("*")
    .in("task_id", taskIds)
    .is("ended_at", null);
  return data ?? [];
}

export async function getDistractionsSince(sinceDate: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("distractions")
    .select("*")
    .eq("user_id", user.id)
    .gte("occurred_at", `${sinceDate}T00:00:00`)
    .order("occurred_at", { ascending: false });

  return data ?? [];
}

export async function getReflection(date: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  return data;
}

export async function getReflectionsSince(sinceDate: string) {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", sinceDate)
    .order("date", { ascending: false });

  return data ?? [];
}

export async function getSessionDurationsForTasks(taskIds: string[]) {
  if (taskIds.length === 0) return new Map<string, number>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_sessions")
    .select("task_id, duration_seconds")
    .in("task_id", taskIds)
    .not("duration_seconds", "is", null);

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.task_id, (totals.get(row.task_id) ?? 0) + (row.duration_seconds ?? 0));
  }
  return totals;
}

export async function getSubtaskCountsForTasks(taskIds: string[]) {
  if (taskIds.length === 0) return new Map<string, { total: number; completed: number }>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subtasks")
    .select("task_id, completed")
    .in("task_id", taskIds);

  const counts = new Map<string, { total: number; completed: number }>();
  for (const row of data ?? []) {
    const entry = counts.get(row.task_id) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (row.completed) entry.completed += 1;
    counts.set(row.task_id, entry);
  }
  return counts;
}
