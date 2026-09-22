import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push-server";
import { computeStreakContext } from "@/lib/streak";

/** Sends to every push subscription for a user, pruning ones the push service rejects as gone. */
export async function notifyUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  const supabase = createAdminClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendPushNotification(sub, payload);
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}

export function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

const NOTIFY_TIME_COLUMNS = ["notify_time_1", "notify_time_2", "notify_time_3", "notify_time_4"] as const;

/**
 * Sends the reminder for one of the 4 daily slots to every user who has that
 * slot set. Skips a user if the slot is empty, they have no tasks today, or
 * everything's already done (nothing to nag about).
 */
export async function sendSlotReminders(slot: 1 | 2 | 3 | 4): Promise<number> {
  const supabase = createAdminClient();
  const column = NOTIFY_TIME_COLUMNS[slot - 1];

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`id, timezone, ${column}`)
    .eq("notifications_enabled", true)
    .not(column, "is", null);

  let sent = 0;

  for (const profile of (profiles ?? []) as Array<{ id: string; timezone: string }>) {
    const date = todayInTimezone(profile.timezone);
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, completed")
      .eq("user_id", profile.id)
      .eq("scheduled_date", date);

    if (!tasks || tasks.length === 0) continue;

    const remaining = tasks.filter((t) => !t.completed).length;
    if (remaining === 0) continue;

    const { streak } = await computeStreakContext(supabase, profile.id);
    const body =
      remaining === 1
        ? `1 task left today${streak > 0 ? ` — keep the ${streak}-day streak alive` : ""}.`
        : `${remaining} tasks left today${streak > 0 ? ` — keep the ${streak}-day streak alive` : ""}.`;

    await notifyUser(profile.id, { title: "Still time today", body, url: "/today" });
    sent += 1;
  }

  return sent;
}
