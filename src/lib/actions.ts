"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayKey, toDateKey } from "@/lib/streak";
import { ACTIVITY_COLORS } from "@/lib/activity";
import { endOfDayInTimezone } from "@/lib/date";
import type { TaskPriority } from "@/lib/database.types";

const MAX_FREEZES_PER_MONTH = 3;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function userToday(supabase: SupabaseServerClient, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).single();
  return todayKey(profile?.timezone ?? "UTC");
}

/** Past days are locked: no editing, completing, timing, or deleting. */
async function assertTaskEditable(supabase: SupabaseServerClient, taskId: string) {
  const { data: task } = await supabase
    .from("tasks")
    .select("scheduled_date, user_id")
    .eq("id", taskId)
    .single();

  if (task && task.scheduled_date < (await userToday(supabase, task.user_id))) {
    throw new Error("This task is from a past day and can no longer be changed.");
  }
}

export async function createTask(input: {
  title: string;
  why?: string;
  priority: TaskPriority;
  repeatDays?: number[];
  scheduledDate: string;
}) {
  const { supabase, user } = await requireUser();

  if (input.scheduledDate < (await userToday(supabase, user.id))) {
    throw new Error("Can't add a task to a day that's already passed.");
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: input.title.trim(),
    why: input.why?.trim() || null,
    priority: input.priority,
    repeat_days: [...new Set(input.repeatDays ?? [])].filter((d) => d >= 0 && d <= 6).sort(),
    scheduled_date: input.scheduledDate,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
}

/**
 * Looks back (up to 30 days) at repeating tasks and copies into `targetDate`
 * every one whose latest copy is set to repeat on that weekday, as fresh,
 * incomplete tasks. Skips any title already scheduled that day, so it's safe
 * to press more than once.
 */
export async function copyRecurringTasks(targetDate: string): Promise<number> {
  const { supabase, user } = await requireUser();

  const target = new Date(`${targetDate}T00:00:00`);
  const weekday = target.getDay();
  const since = new Date(target);
  since.setDate(since.getDate() - 30);
  const sinceKey = toDateKey(since);

  const [{ data: recent }, { data: existing }] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, why, priority, repeat_days, scheduled_date, created_at")
      .eq("user_id", user.id)
      .lt("scheduled_date", targetDate)
      .gte("scheduled_date", sinceKey)
      .order("scheduled_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("tasks").select("title").eq("user_id", user.id).eq("scheduled_date", targetDate),
  ]);

  // The newest copy of each title decides its schedule, so changing the days
  // (by adding the task again with new days) takes over from older copies.
  const latestByTitle = new Map<string, NonNullable<typeof recent>[number]>();
  for (const task of recent ?? []) {
    if (!latestByTitle.has(task.title)) latestByTitle.set(task.title, task);
  }

  const existingTitles = new Set((existing ?? []).map((t) => t.title));

  const toInsert = [...latestByTitle.values()]
    .filter((t) => t.repeat_days.includes(weekday) && !existingTitles.has(t.title))
    .map((t) => ({
      user_id: user.id,
      title: t.title,
      why: t.why,
      priority: t.priority,
      repeat_days: t.repeat_days,
      scheduled_date: targetDate,
    }));

  if (toInsert.length === 0) return 0;

  const { error } = await supabase.from("tasks").insert(toInsert);
  if (error) throw new Error(error.message);

  revalidatePath("/today");
  revalidatePath("/week");
  return toInsert.length;
}

export async function deleteTask(taskId: string) {
  const { supabase } = await requireUser();
  await assertTaskEditable(supabase, taskId);
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
}

async function assertCanComplete(supabase: SupabaseServerClient, taskId: string) {
  const { count: subtaskTotal } = await supabase
    .from("subtasks")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);

  if (subtaskTotal) {
    const { count: subtaskDone } = await supabase
      .from("subtasks")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId)
      .eq("completed", true);

    if (subtaskDone !== subtaskTotal) {
      throw new Error("Finish all subtasks before marking this task done.");
    }
  }
}

/** Ends every running timer on a task at `endedAt` (never before it started), recording the duration. */
async function closeOpenSessions(supabase: SupabaseServerClient, taskId: string, endedAt: Date) {
  const { data: open } = await supabase
    .from("task_sessions")
    .select("id, started_at")
    .eq("task_id", taskId)
    .is("ended_at", null);

  for (const session of open ?? []) {
    const start = new Date(session.started_at).getTime();
    const end = Math.max(endedAt.getTime(), start);
    const { error } = await supabase
      .from("task_sessions")
      .update({ ended_at: new Date(end).toISOString(), duration_seconds: Math.round((end - start) / 1000) })
      .eq("id", session.id);
    if (error) throw new Error(error.message);
  }
}

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const { supabase, user } = await requireUser();

  await assertTaskEditable(supabase, taskId);
  const now = new Date();
  if (completed) {
    await assertCanComplete(supabase, taskId);
    await closeOpenSessions(supabase, taskId, now);
  }

  const { error } = await supabase
    .from("tasks")
    .update({ completed, completed_at: completed ? now.toISOString() : null })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
  revalidatePath("/overview");
}

export async function startTimerSession(taskId: string) {
  const { supabase, user } = await requireUser();

  await assertTaskEditable(supabase, taskId);

  const { data, error } = await supabase
    .from("task_sessions")
    .insert({ task_id: taskId, user_id: user.id, started_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  return data.id as string;
}

/**
 * A timer left running past its task's completion or past the end of the task's day
 * is recorded as ending at whichever came first, not at the moment it's finally stopped.
 */
export async function stopTimerSession(sessionId: string) {
  const { supabase, user } = await requireUser();

  const { data: session, error: fetchError } = await supabase
    .from("task_sessions")
    .select("started_at, task_id")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) throw new Error(fetchError?.message ?? "Session not found");

  const [{ data: task }, { data: profile }] = await Promise.all([
    supabase.from("tasks").select("scheduled_date, completed_at").eq("id", session.task_id).single(),
    supabase.from("profiles").select("timezone").eq("id", user.id).single(),
  ]);

  const startedAt = new Date(session.started_at).getTime();
  const candidates = [Date.now()];
  if (task) {
    candidates.push(endOfDayInTimezone(task.scheduled_date, profile?.timezone ?? "UTC").getTime());
    const completedAt = task.completed_at ? new Date(task.completed_at).getTime() : null;
    if (completedAt && completedAt > startedAt) candidates.push(completedAt);
  }

  const endedAt = new Date(Math.max(startedAt, Math.min(...candidates)));
  const durationSeconds = Math.round((endedAt.getTime() - startedAt) / 1000);

  const { error } = await supabase
    .from("task_sessions")
    .update({ ended_at: endedAt.toISOString(), duration_seconds: durationSeconds })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/overview");
}

export async function getTaskDetail(taskId: string) {
  const { supabase } = await requireUser();

  const [{ data: subtasks }, { data: sessions }] = await Promise.all([
    supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("task_sessions")
      .select("*")
      .eq("task_id", taskId)
      .order("started_at", { ascending: false }),
  ]);

  return { subtasks: subtasks ?? [], sessions: sessions ?? [] };
}

export async function createSubtask(taskId: string, title: string) {
  const { supabase, user } = await requireUser();

  await assertTaskEditable(supabase, taskId);

  const { count } = await supabase
    .from("subtasks")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId);

  const { error } = await supabase.from("subtasks").insert({
    task_id: taskId,
    user_id: user.id,
    title: title.trim(),
    position: count ?? 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
}

/**
 * Toggling a subtask complete auto-completes the parent task once every
 * subtask is done (respecting the same track-time gate as a manual
 * complete). Un-checking a subtask never un-completes the parent — you can
 * still do that yourself from the task if you want to.
 */
export async function toggleSubtask(subtaskId: string, completed: boolean) {
  const { supabase } = await requireUser();

  const { data: existing } = await supabase
    .from("subtasks")
    .select("task_id")
    .eq("id", subtaskId)
    .single();
  if (!existing) throw new Error("Subtask not found");
  await assertTaskEditable(supabase, existing.task_id);

  const { data: subtask, error } = await supabase
    .from("subtasks")
    .update({ completed })
    .eq("id", subtaskId)
    .select("task_id")
    .single();

  if (error) throw new Error(error.message);

  if (completed) {
    const { count: total } = await supabase
      .from("subtasks")
      .select("id", { count: "exact", head: true })
      .eq("task_id", subtask.task_id);
    const { count: done } = await supabase
      .from("subtasks")
      .select("id", { count: "exact", head: true })
      .eq("task_id", subtask.task_id)
      .eq("completed", true);

    if (total && total === done) {
      try {
        await assertCanComplete(supabase, subtask.task_id);
        const now = new Date();
        await closeOpenSessions(supabase, subtask.task_id, now);
        await supabase
          .from("tasks")
          .update({ completed: true, completed_at: now.toISOString() })
          .eq("id", subtask.task_id);
      } catch {
        // track-time requirement not met yet — leave the task unchecked
      }
    }
  }

  revalidatePath("/today");
  revalidatePath("/week");
  revalidatePath("/overview");
}

export async function deleteSubtask(subtaskId: string) {
  const { supabase } = await requireUser();
  const { data: existing } = await supabase
    .from("subtasks")
    .select("task_id")
    .eq("id", subtaskId)
    .single();
  if (existing) await assertTaskEditable(supabase, existing.task_id);
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
}

export async function applyStreakFreeze(date: string) {
  const { supabase, user } = await requireUser();

  const monthStart = `${date.slice(0, 7)}-01`;
  const { count } = await supabase
    .from("streak_freezes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("date_used", monthStart);

  if ((count ?? 0) >= MAX_FREEZES_PER_MONTH) {
    throw new Error(`You've used all ${MAX_FREEZES_PER_MONTH} streak freezes for this month.`);
  }

  const { error } = await supabase
    .from("streak_freezes")
    .insert({ user_id: user.id, date_used: date });

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/overview");
}

export async function addDistraction(note?: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("distractions")
    .insert({ user_id: user.id, note: note?.trim() || null });
  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/overview");
}

export async function saveReflection(date: string, note: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("reflections")
    .upsert({ user_id: user.id, date, note: note.trim() }, { onConflict: "user_id,date" });
  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/overview");
}

export async function updateNotificationSettings(input: {
  notifyTimes: [string | null, string | null, string | null, string | null];
  notificationsEnabled: boolean;
  timezone: string;
}) {
  const { supabase, user } = await requireUser();
  const [t1, t2, t3, t4] = input.notifyTimes.map((t) => t || null);
  const { error } = await supabase
    .from("profiles")
    .update({
      notify_time_1: t1,
      notify_time_2: t2,
      notify_time_3: t3,
      notify_time_4: t4,
      notifications_enabled: input.notificationsEnabled,
      timezone: input.timezone,
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

function revalidateActivity() {
  revalidatePath("/today");
  revalidatePath("/overview");
}

async function assertOwnCategory(supabase: SupabaseServerClient, userId: string, categoryId: string) {
  const { data } = await supabase
    .from("activity_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new Error("That category doesn't exist anymore.");
}

/** Starting an activity stops whatever was running, so there's only ever one. */
export async function startActivity(categoryId: string) {
  const { supabase, user } = await requireUser();
  await assertOwnCategory(supabase, user.id, categoryId);
  const now = new Date().toISOString();

  const { error: stopError } = await supabase
    .from("activity_entries")
    .update({ ended_at: now })
    .eq("user_id", user.id)
    .is("ended_at", null);
  if (stopError) throw new Error(stopError.message);

  const { error } = await supabase
    .from("activity_entries")
    .insert({ user_id: user.id, category_id: categoryId, started_at: now });
  if (error) throw new Error(error.message);

  revalidateActivity();
}

export async function stopActivity() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("activity_entries")
    .update({ ended_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("ended_at", null);
  if (error) throw new Error(error.message);
  revalidateActivity();
}

function validateEntryTimes(startedAt: string, endedAt: string) {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) throw new Error("Those times don't look right.");
  if (end <= start) throw new Error("The end time has to be after the start time.");
  if (end > Date.now() + 60_000) throw new Error("You can't log time that hasn't happened yet.");
}

export async function saveActivityEntry(input: {
  id?: string;
  categoryId: string;
  startedAt: string;
  endedAt: string;
}) {
  const { supabase, user } = await requireUser();
  validateEntryTimes(input.startedAt, input.endedAt);
  await assertOwnCategory(supabase, user.id, input.categoryId);

  const values = {
    category_id: input.categoryId,
    started_at: input.startedAt,
    ended_at: input.endedAt,
  };

  const { error } = input.id
    ? await supabase.from("activity_entries").update(values).eq("id", input.id).eq("user_id", user.id)
    : await supabase.from("activity_entries").insert({ ...values, user_id: user.id });
  if (error) throw new Error(error.message);

  revalidateActivity();
}

export async function deleteActivityEntry(entryId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("activity_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateActivity();
}

export async function createActivityCategory(name: string, color: string) {
  const { supabase, user } = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Give the category a name.");
  if (!(ACTIVITY_COLORS as readonly string[]).includes(color)) throw new Error("Pick one of the colours.");

  const { error } = await supabase
    .from("activity_categories")
    .insert({ user_id: user.id, name: trimmed, color });
  if (error) {
    throw new Error(error.code === "23505" ? "You already have a category with that name." : error.message);
  }
  revalidateActivity();
}

export async function deleteActivityCategory(categoryId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("activity_categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateActivity();
}

export async function syncTimezone(timezone: string) {
  const { supabase, user } = await requireUser();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new Error("Unknown timezone.");
  }
  const { error } = await supabase.from("profiles").update({ timezone }).eq("id", user.id);
  if (error) throw new Error(error.message);
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}
