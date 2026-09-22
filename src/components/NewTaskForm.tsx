"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, X, Repeat } from "lucide-react";
import { createTask } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/lib/database.types";

const PRIORITIES: { value: TaskPriority; label: string; dot: string }[] = [
  { value: "high", label: "High", dot: "bg-priority-high" },
  { value: "medium", label: "Medium", dot: "bg-priority-medium" },
  { value: "low", label: "Low", dot: "bg-priority-low" },
];

export function NewTaskForm({ scheduledDate }: { scheduledDate: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [trackTime, setTrackTime] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setWhy("");
    setPriority("medium");
    setTrackTime(false);
    setRepeatDaily(false);
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask({ title, why, priority, trackTime, repeatDaily, scheduledDate });
      reset();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => titleRef.current?.focus());
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
      >
        <Plus size={16} /> Add task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-border bg-surface p-3.5"
    >
      <div className="flex items-center gap-2">
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to get done?"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={reset}
          className="shrink-0 text-muted hover:text-foreground"
          aria-label="Cancel"
        >
          <X size={16} />
        </button>
      </div>

      <input
        value={why}
        onChange={(e) => setWhy(e.target.value)}
        placeholder="Why does this matter? (optional)"
        className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs outline-none focus:border-accent"
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                priority === p.value
                  ? "border-accent bg-accent-soft/40 text-foreground"
                  : "border-border text-muted",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={trackTime}
              onChange={(e) => setTrackTime(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-accent"
            />
            Track time
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={repeatDaily}
              onChange={(e) => setRepeatDaily(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-accent"
            />
            <Repeat size={11} /> Repeat daily
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="w-full rounded-xl bg-linear-to-br from-accent to-accent-strong py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}
