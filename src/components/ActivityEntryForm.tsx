"use client";

import { useState, useTransition } from "react";
import { saveActivityEntry } from "@/lib/actions";
import { toLocalDateInput, toLocalTimeInput } from "@/lib/activity";
import type { ActivityCategory, ActivityEntry } from "@/lib/database.types";

export function ActivityEntryForm({
  categories,
  entry,
  onDone,
}: {
  categories: ActivityCategory[];
  entry?: ActivityEntry;
  onDone: () => void;
}) {
  const [initial] = useState(() => {
    const startAt = entry ? new Date(entry.started_at) : new Date(Date.now() - 3_600_000);
    const endAt = entry?.ended_at ? new Date(entry.ended_at) : new Date();
    return {
      date: toLocalDateInput(startAt),
      start: toLocalTimeInput(startAt),
      end: toLocalTimeInput(endAt),
      maxDate: toLocalDateInput(new Date()),
    };
  });

  const [categoryId, setCategoryId] = useState(entry?.category_id ?? categories[0]?.id ?? "");
  const [date, setDate] = useState(initial.date);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const crossesMidnight = !!start && !!end && end <= start;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const startedAt = new Date(`${date}T${start}`);
    const endedAt = new Date(`${date}T${end}`);
    // An end time at or before the start means it ran past midnight, e.g. sleep 23:00 to 07:00.
    if (crossesMidnight) endedAt.setDate(endedAt.getDate() + 1);

    startTransition(async () => {
      try {
        await saveActivityEntry({
          id: entry?.id,
          categoryId,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
        });
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 rounded-xl border border-border bg-surface-raised/40 p-3">
      <p className="text-xs font-medium">{entry ? "Edit entry" : "Add a past entry"}</p>

      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 block text-[11px] text-muted">
          Day
          <input
            type="date"
            value={date}
            max={initial.maxDate}
            onChange={(e) => setDate(e.target.value)}
            required
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-[11px] text-muted">
          From
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-[11px] text-muted">
          To
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      {crossesMidnight && <p className="text-[11px] text-muted">Ends the next day.</p>}
      {error && <p className="text-[11px] text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !categoryId}
          className="flex-1 rounded-xl bg-accent-soft/60 py-2 text-xs font-medium text-foreground disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onDone} className="rounded-xl px-3 py-2 text-xs text-muted">
          Cancel
        </button>
      </div>
    </form>
  );
}
