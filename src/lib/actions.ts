"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export async function createTask(input: {
  title: string;
  why?: string;
  priority: TaskPriority;
  trackTime: boolean;
  repeatDaily?: boolean;
  scheduledDate: string;
}) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: input.title.trim(),
    why: input.why?.trim() || null,
    priority: input.priority,
    track_time: input.trackTime,
    repeat_daily: input.repeatDaily ?? false,
    scheduled_date: input.scheduledDate,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
}

/**
 * Looks back (up to 30 days) for the most recent day that had tasks flagged
 * "repeat daily", and copies those into `targetDate` as fresh, incomplete
 * tasks — skipping any title already scheduled that day so it's safe to
 * press more than once.
 */
export async function copyRecurringTasks(targetDate: string): Promise<number> {
  const { supabase, user } = await requireUser();

  const since = new Date(`${targetDate}T00:00:00`);
  since.setDate(since.getDate() - 30);
  const sinceKey = since.toISOString().slice(0, 10);

  const [{ data: candidates }, { data: existing }] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, why, priority, track_time, scheduled_date")
      .eq("user_id", user.id)
      .eq("repeat_daily", true)
      .lt("scheduled_date", targetDate)
      .gte("scheduled_date", sinceKey)
      .order("scheduled_date", { ascending: false }),
    supabase.from("tasks").select("title").eq("user_id", user.id).eq("scheduled_date", targetDate),
  ]);

  if (!candidates || candidates.length === 0) return 0;

  const existingTitles = new Set((existing ?? []).map((t) => t.title));
  const mostRecentDate = candidates[0].scheduled_date;

  const toInsert = candidates
    .filter((t) => t.scheduled_date === mostRecentDate && !existingTitles.has(t.title))
    .map((t) => ({
      user_id: user.id,
      title: t.title,
      why: t.why,
      priority: t.priority,
      track_time: t.track_time,
      repeat_daily: true,
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
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function assertCanComplete(supabase: SupabaseServerClient, taskId: string) {
  const { data: task } = await supabase
    .from("tasks")
    .select("track_time")
    .eq("id", taskId)
    .single();

  if (task?.track_time) {
    const { count } = await supabase
      .from("task_sessions")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId)
      .not("ended_at", "is", null);

    if (!count) {
      throw new Error(
        "This task needs at least one logged timer session before it can be marked done.",
      );
    }
  }

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

export async function toggleTaskComplete(taskId: string, completed: boolean) {
  const { supabase, user } = await requireUser();

  if (completed) {
    await assertCanComplete(supabase, taskId);
  }

  const { error } = await supabase
    .from("tasks")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  revalidatePath("/week");
  revalidatePath("/overview");
}

export async function startTimerSession(taskId: string) {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("task_sessions")
    .insert({ task_id: taskId, user_id: user.id, started_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/today");
  return data.id as string;
}

export async function stopTimerSession(sessionId: string) {
  const { supabase } = await requireUser();

  const { data: session, error: fetchError } = await supabase
    .from("task_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) throw new Error(fetchError?.message ?? "Session not found");

  const endedAt = new Date();
  const durationSeconds = Math.round(
    (endedAt.getTime() - new Date(session.started_at).getTime()) / 1000,
  );

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
        await supabase
          .from("tasks")
          .update({ completed: true, completed_at: new Date().toISOString() })
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

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/login");
}
