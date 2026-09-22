"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { updateNotificationSettings } from "@/lib/actions";
import type { Profile } from "@/lib/database.types";

type Slot = string | null;

function toSlotValue(time: string | null): Slot {
  return time ? time.slice(0, 5) : null;
}

export function NotificationSettingsForm({ profile }: { profile: Profile }) {
  const [times, setTimes] = useState<[Slot, Slot, Slot, Slot]>([
    toSlotValue(profile.notify_time_1),
    toSlotValue(profile.notify_time_2),
    toSlotValue(profile.notify_time_3),
    toSlotValue(profile.notify_time_4),
  ]);
  const [enabled, setEnabled] = useState(profile.notifications_enabled);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function setSlot(index: number, value: string) {
    setTimes((prev) => {
      const next = [...prev] as [Slot, Slot, Slot, Slot];
      next[index] = value || null;
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      await updateNotificationSettings({
        notifyTimes: times,
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
        Up to 4 reminder times a day. Leave a slot empty to turn it off — each one only pings
        if you&rsquo;ve still got unfinished tasks.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {times.map((time, i) => (
          <div key={i}>
            <label className="mb-1 block text-[11px] text-muted">Reminder {i + 1}</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={time ?? ""}
                onChange={(e) => setSlot(i, e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {time && (
                <button
                  type="button"
                  onClick={() => setSlot(i, "")}
                  className="shrink-0 text-muted hover:text-danger"
                  aria-label={`Clear reminder ${i + 1}`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="w-full rounded-xl bg-accent-soft/50 py-2 text-xs font-medium text-foreground disabled:opacity-50"
      >
        {saved ? "Saved" : pending ? "Saving…" : "Save times"}
      </button>
    </div>
  );
}
