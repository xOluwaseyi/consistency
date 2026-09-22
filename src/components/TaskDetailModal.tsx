"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, Pause, Check, Plus, Trash2, Lock } from "lucide-react";
import {
  getTaskDetail,
  toggleTaskComplete,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  startTimerSession,
  stopTimerSession,
} from "@/lib/actions";
import { cn, formatClock, formatDuration } from "@/lib/utils";
import type { Task, Subtask, TaskSession } from "@/lib/database.types";

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  high: "bg-priority-high/15 text-priority-high border-priority-high/30",
  medium: "bg-priority-medium/15 text-priority-medium border-priority-medium/30",
  low: "bg-priority-low/15 text-priority-low border-priority-low/30",
};

export function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [sessions, setSessions] = useState<TaskSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(task.completed);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [liveTick, setLiveTick] = useState(0);
  const pendingStartRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    getTaskDetail(task.id).then(({ subtasks, sessions }) => {
      setSubtasks(subtasks);
      setSessions(sessions);
      setLoading(false);
    });
  }, [task.id]);

  const openSession = sessions.find((s) => !s.ended_at) ?? null;
  const totalSeconds =
    sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) + (openSession ? liveTick : 0);

  useEffect(() => {
    if (!openSession) return;
    const startedAt = new Date(openSession.started_at).getTime();
    const tick = () => setLiveTick(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [openSession]);

  const subtasksOk = subtasks.length === 0 || subtasks.every((s) => s.completed);
  const timeOk = !task.track_time || sessions.some((s) => s.ended_at) || !!openSession;
  const canComplete = timeOk && subtasksOk;

  async function handleResume() {
    const tempId = `temp-${Date.now()}`;
    setSessions((prev) => [
      {
        id: tempId,
        task_id: task.id,
        user_id: "",
        started_at: new Date().toISOString(),
        ended_at: null,
        duration_seconds: null,
      },
      ...prev,
    ]);
    const promise = startTimerSession(task.id);
    pendingStartRef.current = promise;
    const realId = await promise;
    pendingStartRef.current = null;
    setSessions((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: realId } : s)));
  }

  async function handlePause() {
    const open = sessions.find((s) => !s.ended_at);
    if (!open) return;
    const endedAt = new Date();
    const duration = Math.max(
      0,
      Math.round((endedAt.getTime() - new Date(open.started_at).getTime()) / 1000),
    );
    setSessions((prev) =>
      prev.map((s) =>
        s.id === open.id ? { ...s, ended_at: endedAt.toISOString(), duration_seconds: duration } : s,
      ),
    );
    const realId = pendingStartRef.current ? await pendingStartRef.current : open.id;
    if (!realId.startsWith("temp-")) await stopTimerSession(realId);
  }

  async function handleToggleComplete() {
    const next = !completed;
    setCompleteError(null);

    if (next) {
      if (!subtasksOk) {
        setCompleteError("Finish all subtasks before marking this done.");
        return;
      }
      // A running timer doesn't count as logged time yet — stop it first so
      // the session actually has a duration before we try to complete.
      if (openSession) {
        await handlePause();
      } else if (task.track_time && !sessions.some((s) => s.ended_at)) {
        setCompleteError("Log at least one timer session before marking this done.");
        return;
      }
    }

    setCompleted(next);
    try {
      await toggleTaskComplete(task.id, next);
    } catch (e) {
      setCompleted(!next);
      setCompleteError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    const title = newSubtask.trim();
    if (!title) return;
    setNewSubtask("");
    const tempId = `temp-${Date.now()}`;
    setSubtasks((prev) => [
      ...prev,
      { id: tempId, task_id: task.id, user_id: "", title, completed: false, position: prev.length, created_at: new Date().toISOString() },
    ]);
    await createSubtask(task.id, title);
    getTaskDetail(task.id).then(({ subtasks }) => setSubtasks(subtasks));
  }

  async function handleToggleSubtask(subtask: Subtask) {
    if (subtask.id.startsWith("temp-")) return;
    const next = !subtask.completed;
    const updated = subtasks.map((s) => (s.id === subtask.id ? { ...s, completed: next } : s));
    setSubtasks(updated);
    await toggleSubtask(subtask.id, next);
    if (next && updated.every((s) => s.completed) && timeOk) {
      setCompleted(true);
    }
  }

  async function handleDeleteSubtask(subtaskId: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    if (!subtaskId.startsWith("temp-")) await deleteSubtask(subtaskId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close task details"
      />

      <div className="relative z-10 max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface p-4 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 flex items-start gap-3">
          <button
            type="button"
            onClick={handleToggleComplete}
            disabled={!canComplete && !completed}
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
            ) : !canComplete ? (
              <Lock size={11} />
            ) : null}
          </button>

          <div className="min-w-0 flex-1">
            <h2 className={cn("text-lg font-semibold", completed && "text-muted line-through")}>
              {task.title}
            </h2>
            <span
              className={cn(
                "mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                PRIORITY_STYLES[task.priority],
              )}
            >
              {task.priority}
            </span>
            {completeError && <p className="mt-1.5 text-xs text-danger">{completeError}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {task.why && (
          <p className="mb-4 rounded-xl bg-surface-raised px-3 py-2.5 text-sm text-muted">
            {task.why}
          </p>
        )}

        {task.track_time && (
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-surface-raised px-4 py-3">
            <div>
              <p className="text-xs text-muted">Time spent</p>
              {loading ? (
                <div className="mt-1 h-6 w-24 animate-pulse rounded bg-border" />
              ) : (
                <p className="font-mono text-xl tabular-nums">{formatClock(totalSeconds)}</p>
              )}
            </div>
            <button
              type="button"
              onClick={openSession ? handlePause : handleResume}
              disabled={loading}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40",
                openSession ? "bg-danger/15 text-danger" : "bg-success/15 text-success",
              )}
              aria-label={openSession ? "Pause timer" : "Start timer"}
            >
              {openSession ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>
        )}

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted">
              Subtasks {subtasks.length > 0 && `(${subtasks.filter((s) => s.completed).length}/${subtasks.length})`}
            </p>
          </div>
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-9 animate-pulse rounded-xl bg-surface-raised" />
              <div className="h-9 animate-pulse rounded-xl bg-surface-raised" />
            </div>
          ) : (
            <div className="space-y-1.5">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(subtask)}
                    disabled={subtask.id.startsWith("temp-")}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
                      subtask.completed ? "border-success bg-success text-background" : "border-muted",
                    )}
                    aria-label={subtask.completed ? "Mark subtask incomplete" : "Mark subtask complete"}
                  >
                    {subtask.completed && <Check size={11} strokeWidth={3} />}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      subtask.completed && "text-muted line-through",
                    )}
                  >
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="shrink-0 text-muted hover:text-danger"
                    aria-label="Delete subtask"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddSubtask} className="mt-1.5 flex items-center gap-1.5">
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add a subtask…"
              className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={!newSubtask.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft/50 text-foreground disabled:opacity-50"
              aria-label="Add subtask"
            >
              <Plus size={16} />
            </button>
          </form>
        </div>

        {sessions.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted">Time log</p>
            <div className="space-y-1">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between text-xs text-muted">
                  <span>
                    {new Date(session.started_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" → "}
                    {session.ended_at
                      ? new Date(session.ended_at).toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "running"}
                  </span>
                  <span className="font-mono tabular-nums">
                    {session.duration_seconds != null ? formatDuration(session.duration_seconds) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!completed && !canComplete && (
          <p className="text-center text-xs text-muted">
            <Lock size={11} className="mr-1 inline" />
            {!timeOk
              ? "Log at least one timer session, then tap the checkbox above to complete."
              : "Finish all subtasks, then tap the checkbox above to complete."}
          </p>
        )}
      </div>
    </div>
  );
}
