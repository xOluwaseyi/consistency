import { getTasksForDate, getStreakContext, getOpenSessionsForTasks, getSessionDurationsForTasks } from "@/lib/data";
import { todayKey } from "@/lib/streak";
import { StreakBanner } from "@/components/StreakBanner";
import { TaskCard } from "@/components/TaskCard";
import { NewTaskForm } from "@/components/NewTaskForm";
import { DistractionButton } from "@/components/DistractionButton";
import { FreezeButton } from "@/components/FreezeButton";
import { RolloverButton } from "@/components/RolloverButton";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = todayKey();
  const [tasks, streakCtx] = await Promise.all([getTasksForDate(today), getStreakContext()]);
  const taskIds = tasks.map((t) => t.id);
  const [openSessions, durations] = await Promise.all([
    getOpenSessionsForTasks(taskIds),
    getSessionDurationsForTasks(taskIds),
  ]);

  const openByTask = new Map(openSessions.map((s) => [s.task_id, s]));
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const allDone = total > 0 && completed === total;
  const todayDay = streakCtx.days.get(today);
  const alreadyFrozen = todayDay?.frozen ?? false;

  const formattedDate = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{formattedDate}</p>
        <h1 className="text-xl font-semibold">Today</h1>
      </div>

      <StreakBanner streak={streakCtx.streak} pendingToday={total > 0 && !allDone} />

      {total > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-2.5">
          <span className="text-xs text-muted">
            {completed} of {total} done
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-linear-to-r from-accent to-success transition-all"
              style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {total > 0 && !allDone && !alreadyFrozen && (
        <FreezeButton date={today} freezesRemaining={3 - streakCtx.freezesThisMonth} />
      )}

      <div className="space-y-2.5">
        {tasks.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-6 text-center text-sm text-muted">
            Nothing planned for today yet.
          </p>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            openSession={openByTask.get(task.id) ? { id: openByTask.get(task.id)!.id, started_at: openByTask.get(task.id)!.started_at } : null}
            totalSeconds={durations.get(task.id) ?? 0}
          />
        ))}
      </div>

      <RolloverButton date={today} />
      <NewTaskForm scheduledDate={today} />
      <DistractionButton />
    </div>
  );
}
