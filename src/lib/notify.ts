import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push-server";
import { computeStreakContext } from "@/lib/streak";

export interface NotifyResult {
  sent: number;
  failed: { reason: string }[];
}

/** Sends to every push subscription for a user, pruning ones the push service rejects as gone. */
export async function notifyUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<NotifyResult> {
  const supabase = createAdminClient();
  const { data: subs, error: queryError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (queryError) {
    console.error("Failed to look up push subscriptions (check SUPABASE_SERVICE_ROLE_KEY)", queryError);
    return {
      sent: 0,
      failed: [{ reason: `Couldn't look up subscriptions: ${queryError.message}` }],
    };
  }

  if (!subs || subs.length === 0) {
    return { sent: 0, failed: [{ reason: "No push subscription saved for this account." }] };
  }

  const results = await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendPushNotification(sub, payload);
        return { ok: true as const };
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        const body = (err as { body?: string })?.body;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          return { ok: false as const, reason: "Subscription expired and was removed. Try enabling notifications again." };
        }
        console.error("Push send failed", { statusCode, body });
        return {
          ok: false as const,
          reason: `Push service rejected the notification${statusCode ? ` (${statusCode})` : ""}${body ? `: ${body}` : ""}.`,
        };
      }
    }),
  );

  return {
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r): r is { ok: false; reason: string } => !r.ok),
  };
}

export function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

/** "HH:MM" right now, in the given timezone. */
function nowHHMMInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

const NOTIFY_TIME_COLUMNS = ["notify_time_1", "notify_time_2", "notify_time_3", "notify_time_4"] as const;

/**
 * Called every few minutes (by a GitHub Actions cron hitting /api/cron/poll).
 * For every user with reminders on, checks each of their 4 slots: if the
 * slot's target time has passed for "today" in their timezone, and we
 * haven't already sent for that slot today, and they still have unfinished
 * tasks, send the reminder and record it so it only fires once per day.
 */
export async function pollAndSendReminders(): Promise<{
  sent: number;
  checked: number;
  failed: { userId: string; slot: number; reason: string }[];
}> {
  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, timezone, notify_time_1, notify_time_2, notify_time_3, notify_time_4")
    .eq("notifications_enabled", true);

  let sent = 0;
  let checked = 0;
  const failed: { userId: string; slot: number; reason: string }[] = [];

  for (const profile of profiles ?? []) {
    const today = todayInTimezone(profile.timezone);
    const nowHHMM = nowHHMMInTimezone(profile.timezone);

    for (let i = 0; i < 4; i++) {
      const slot = i + 1;
      const targetTime = profile[NOTIFY_TIME_COLUMNS[i]];
      if (!targetTime) continue;

      // Target time is stored as "HH:MM:SS"; compare on "HH:MM".
      const targetHHMM = targetTime.slice(0, 5);
      if (targetHHMM > nowHHMM) continue; // hasn't reached this slot's time yet today

      checked += 1;

      const { data: alreadySent } = await supabase
        .from("sent_reminders")
        .select("id")
        .eq("user_id", profile.id)
        .eq("slot", slot)
        .eq("date", today)
        .maybeSingle();
      if (alreadySent) continue;

      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, completed")
        .eq("user_id", profile.id)
        .eq("scheduled_date", today);

      if (!tasks || tasks.length === 0) continue; // nothing planned, try again next poll
      const remaining = tasks.filter((t) => !t.completed).length;
      if (remaining === 0) continue; // already done, try again next poll (in case more get added)

      const { streak } = await computeStreakContext(supabase, profile.id);
      const body =
        remaining === 1
          ? `1 task left today.${streak > 0 ? ` Keep the ${streak}-day streak alive.` : ""}`
          : `${remaining} tasks left today.${streak > 0 ? ` Keep the ${streak}-day streak alive.` : ""}`;

      const result = await notifyUser(profile.id, {
        title: "Still time today",
        body,
        url: "/today",
      });

      if (result.sent === 0) {
        // Delivery actually failed (e.g. no subscription, push service
        // rejected it) — don't mark it sent, so it's retried next poll
        // instead of silently never firing again today.
        failed.push({
          userId: profile.id,
          slot,
          reason: result.failed[0]?.reason ?? "Unknown failure",
        });
        continue;
      }

      // Record success so this slot doesn't fire again today. Ignore a
      // conflict (another poll run already claimed it) rather than error.
      await supabase.from("sent_reminders").insert({ user_id: profile.id, slot, date: today });
      sent += 1;
    }
  }

  return { sent, checked, failed };
}
