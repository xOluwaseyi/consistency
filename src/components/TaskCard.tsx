"use client";

import { useState, useTransition } from "react";
import { Check, Info, Trash2, Lock, Repeat } from "lucide-react";
import { toggleTaskComplete, deleteTask } from "@/lib/actions";
import { TimerControl } from "@/components/TimerControl";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/database.types";

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  high: "bg-priority-high/15 text-priority-high border-priority-high/30",
  medium: "bg-priority-medium/15 text-priority-medium border-priority-medium/30",
  low: "bg-priority-low/15 text-priority-low border-priority-low/30",
};

export function TaskCard({
  task,
  openSession,
  totalSeconds,
}: {
  task: Task;
  openSession: { id: string; started_at: string } | null;
  totalSeconds: number;
}) {
  const [pending, startTransition] = useTransition();
  const [showWhy, setShowWhy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeLogged = totalSeconds > 0 || openSession !== null;
  const canComplete = !task.track_time || timeLogged || task.completed;

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      try {
        await toggleTaskComplete(task.id, !task.completed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-3.5 transition",
        task.completed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending || (!canComplete && !task.completed)}
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90",
            task.completed
              ? "border-success bg-success text-background"
              : canComplete
                ? "border-muted"
                : "border-border text-muted",
          )}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? (
            <Check size={14} strokeWidth={3} />
          ) : !canComplete ? (
            <Lock size={11} />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn("truncate text-sm font-medium", task.completed && "line-through")}>
              {task.title}
            </p>
            {task.repeat_daily && (
              <Repeat size={12} className="shrink-0 text-muted" aria-label="Repeats daily" />
            )}
            {task.why && (
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                className="shrink-0 text-muted hover:text-foreground"
                aria-label="Why this matters"
              >
                <Info size={14} />
              </button>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                PRIORITY_STYLES[task.priority],
              )}
            >
              {task.priority}
            </span>
            {task.track_time && (
              <TimerControl taskId={task.id} openSession={openSession} totalSeconds={totalSeconds} />
            )}
          </div>

          {showWhy && task.why && (
            <p className="mt-2 rounded-xl bg-surface-raised px-3 py-2 text-xs text-muted">
              {task.why}
            </p>
          )}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>

        <button
          type="button"
          onClick={() => startTransition(() => deleteTask(task.id))}
          disabled={pending}
          className="shrink-0 text-muted hover:text-danger"
          aria-label="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
