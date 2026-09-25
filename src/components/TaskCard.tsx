"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Info, Trash2, Lock, Repeat, ListChecks } from "lucide-react";
import { toggleTaskComplete, deleteTask, stopTimerSession } from "@/lib/actions";
import { TimerControl } from "@/components/TimerControl";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn, formatClock } from "@/lib/utils";
import { todayKey } from "@/lib/streak";
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
  subtaskCounts,
}: {
  task: Task;
  openSession: { id: string; started_at: string } | null;
  totalSeconds: number;
  subtaskCounts?: { total: number; completed: number };
}) {
  const [pending, startTransition] = useTransition();
  const [showWhy, setShowWhy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [completed, setCompleted] = useOptimistic(task.completed);

  const locked = task.scheduled_date < todayKey();
  const canComplete = !subtaskCounts || subtaskCounts.total === 0 || subtaskCounts.completed === subtaskCounts.total;

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (locked) return;
    setError(null);
    const next = !completed;
    startTransition(async () => {
      setCompleted(next);
      try {
        // Stop the timer as part of completing, so it doesn't keep running.
        if (next && openSession) {
          await stopTimerSession(openSession.id);
        }
        await toggleTaskComplete(task.id, next);
      } catch (e) {
        setCompleted(!next);
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={cn(
          "cursor-pointer rounded-2xl border border-border bg-surface p-3.5 transition",
          completed && "opacity-60",
        )}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleToggle}
            disabled={pending || locked || (!canComplete && !completed)}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90",
              completed
                ? "border-success bg-success text-background"
                : canComplete
                  ? "border-muted"
                  : "border-border text-muted",
            )}
            aria-label={completed ? "Mark incomplete" : "Mark complete"}
          >
            {completed ? (
              <Check size={14} strokeWidth={3} />
            ) : locked || !canComplete ? (
              <Lock size={11} />
            ) : null}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={cn("truncate text-sm font-medium", completed && "line-through")}>
                {task.title}
              </p>
              {task.repeat_daily && (
                <Repeat size={12} className="shrink-0 text-muted" aria-label="Repeats daily" />
              )}
              {task.why && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWhy((v) => !v);
                  }}
                  className="shrink-0 text-muted hover:text-foreground"
                  aria-label="Why this matters"
                >
                  <Info size={14} />
                </button>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  PRIORITY_STYLES[task.priority],
                )}
              >
                {task.priority}
              </span>
              {subtaskCounts && subtaskCounts.total > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted">
                  <ListChecks size={11} />
                  {subtaskCounts.completed}/{subtaskCounts.total}
                </span>
              )}
              {locked ? (
                <span className="font-mono text-xs text-muted tabular-nums">
                  {formatClock(totalSeconds)}
                </span>
              ) : (
                <div onClick={(e) => e.stopPropagation()}>
                  <TimerControl taskId={task.id} openSession={openSession} totalSeconds={totalSeconds} />
                </div>
              )}
            </div>

            {showWhy && task.why && (
              <p className="mt-2 rounded-xl bg-surface-raised px-3 py-2 text-xs text-muted">
                {task.why}
              </p>
            )}
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          </div>

          {!locked && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
              disabled={pending}
              className="shrink-0 text-muted hover:text-danger"
              aria-label="Delete task"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {detailOpen && (
        <TaskDetailModal task={task} locked={locked} onClose={() => setDetailOpen(false)} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete this task?"
          description={`"${task.title}" and its timer history will be gone for good.`}
          pending={pending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => startTransition(async () => {
            await deleteTask(task.id);
            setConfirmDelete(false);
          })}
        />
      )}
    </>
  );
}
