import { getTasksForRange, getSessionDurationsForTasks, getOpenSessionsForTasks } from "@/lib/data";
import { getWeekDays, formatWeekRange, toDateKey } from "@/lib/date";
import { todayKey } from "@/lib/streak";
import { WeekNav } from "@/components/WeekNav";
import { TaskCard } from "@/components/TaskCard";
import { NewTaskForm } from "@/components/NewTaskForm";
import { ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const offset = Number.isFinite(Number(week)) ? Number(week) : 0;
  const days = getWeekDays(offset);
  const today = todayKey();

  const startKey = toDateKey(days[0]);
  const endKey = toDateKey(days[6]);
  const tasks = await getTasksForRange(startKey, endKey);
  const taskIds = tasks.map((t) => t.id);
  const [openSessions, durations] = await Promise.all([
    getOpenSessionsForTasks(taskIds),
    getSessionDurationsForTasks(taskIds),
  ]);
  const openByTask = new Map(openSessions.map((s) => [s.task_id, s]));

  const tasksByDate = new Map<string, typeof tasks>();
  for (const task of tasks) {
    const list = tasksByDate.get(task.scheduled_date) ?? [];
    list.push(task);
    tasksByDate.set(task.scheduled_date, list);
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Plan ahead</p>
        <h1 className="text-xl font-semibold">This week</h1>
      </div>

      <WeekNav offset={offset} rangeLabel={formatWeekRange(days)} />

      <div className="space-y-3">
        {days.map((date) => {
          const key = toDateKey(date);
          const dayTasks = tasksByDate.get(key) ?? [];
          const isToday = key === today;
          const completed = dayTasks.filter((t) => t.completed).length;

          return (
            <details
              key={key}
              open={isToday}
              className="group rounded-2xl border border-border bg-surface"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isToday ? "text-accent" : ""}`}>
                    {date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-accent-soft/50 px-2 py-0.5 text-[10px] font-medium text-accent">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  {dayTasks.length > 0 && (
                    <span>
                      {completed}/{dayTasks.length}
                    </span>
                  )}
                  <ChevronDown size={15} className="transition group-open:rotate-180" />
                </div>
              </summary>

              <div className="space-y-2.5 border-t border-border px-3.5 py-3.5">
                {dayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    openSession={
                      openByTask.get(task.id)
                        ? {
                            id: openByTask.get(task.id)!.id,
                            started_at: openByTask.get(task.id)!.started_at,
                          }
                        : null
                    }
                    totalSeconds={durations.get(task.id) ?? 0}
                  />
                ))}
                <NewTaskForm scheduledDate={key} />
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
