"use client";

import { useState, useTransition } from "react";
import { updateNotificationSettings } from "@/lib/actions";
import type { Profile } from "@/lib/database.types";

// Must match the schedules in vercel.json exactly — these are the actual
// fixed UTC times the cron fires at (plus up to a 1-hour flex window on
// Vercel's Hobby plan). Not user-editable: a slot is either on or off.
const SLOT_UTC_HOURS = [8, 12, 16, 20] as const;
const SLOT_FIXED_TIME: Record<number, string> = { 8: "08:00", 12: "12:00", 16: "16:00", 20: "20:00" };

function localLabelForUtcHour(utcHour: number): string {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function NotificationSettingsForm({ profile }: { profile: Profile }) {
  const [slotsOn, setSlotsOn] = useState<[boolean, boolean, boolean, boolean]>([
    !!profile.notify_time_1,
    !!profile.notify_time_2,
    !!profile.notify_time_3,
    !!profile.notify_time_4,
  ]);
  const [enabled, setEnabled] = useState(profile.notifications_enabled);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleSlot(index: number) {
    setSlotsOn((prev) => {
      const next = [...prev] as [boolean, boolean, boolean, boolean];
      next[index] = !next[index];
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateNotificationSettings({
        notifyTimes: SLOT_UTC_HOURS.map((h, i) => (slotsOn[i] ? SLOT_FIXED_TIME[h] : null)) as [
          string | null,
          string | null,
          string | null,
          string | null,
        ],
        notificationsEnabled: enabled,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Daily reminders</p>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-surface-raised transition peer-checked:bg-accent" />
          <div className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
        </label>
      </div>

      <p className="text-[11px] text-muted">
        Times are shown in your local time zone. You&rsquo;ll only be notified if you still have
        tasks left to complete, and reminders may arrive up to an hour later than shown.
      </p>

      <div className="space-y-2">
        {SLOT_UTC_HOURS.map((utcHour, i) => (
          <label
            key={utcHour}
            className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-3 py-2"
          >
            <span className="text-sm">{localLabelForUtcHour(utcHour)}</span>
            <span className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={slotsOn[i]}
                onChange={() => toggleSlot(i)}
                className="peer sr-only"
              />
              <span className="h-5 w-9 rounded-full bg-border transition peer-checked:bg-accent" />
              <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="w-full rounded-xl bg-accent-soft/50 py-2 text-xs font-medium text-foreground disabled:opacity-50"
      >
        {saved ? "Saved" : pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
